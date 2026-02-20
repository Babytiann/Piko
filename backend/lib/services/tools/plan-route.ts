/**
 * 路线规划工具 — 构建高德地图 / Google Maps 导航 Deep Link。
 *
 * AI 提供地点名称与经纬度坐标，本工具负责：
 * 1. 根据 mapProvider 决定使用高德还是 Google Maps
 * 2. 高德: 处理 via（途经点）限制，仅驾车模式支持 1 个途经点
 * 3. Google Maps: 使用 waypoints 参数，支持多个途经点
 * 4. 4+ 站自动拆分为多段链接（高德），Google Maps 直接用 waypoints
 */

import { SchemaType } from '@google/generative-ai';
import { toolRegistry, type ToolDefinition } from '../ai-tools';

// ---------------------------------------------------------------------------
// 类型
// ---------------------------------------------------------------------------

interface Stop {
  name: string;
  longitude: number;
  latitude: number;
}

type MapProvider = 'amap' | 'google';

interface PlanRouteParams {
  stops: Stop[];
  mode?: 'car' | 'bus' | 'walk' | 'ride';
  mapProvider?: MapProvider;
}

interface NavigationLink {
  url: string;
  label: string;
  /** 标识链接属于哪个地图平台，前端渲染不同卡片 */
  provider: MapProvider;
}

interface PlanRouteResult {
  links: NavigationLink[];
  markdown: string;
}

// ---------------------------------------------------------------------------
// 高德地图 URI 拼接
// ---------------------------------------------------------------------------

const AMAP_NAV_BASE = 'https://uri.amap.com/navigation';

function formatAmapPoint(stop: Stop): string {
  return `${stop.longitude},${stop.latitude},${encodeURIComponent(stop.name)}`;
}

function buildAmapNavUrl(
  from: Stop,
  to: Stop,
  via: Stop | null,
  mode: string,
): string {
  const params = new URLSearchParams();
  params.set('from', formatAmapPoint(from));
  params.set('to', formatAmapPoint(to));
  if (via) params.set('via', formatAmapPoint(via));
  params.set('mode', mode);
  params.set('callnative', '1');
  params.set('src', 'piko');
  return `${AMAP_NAV_BASE}?${params.toString()}`;
}

// ---------------------------------------------------------------------------
// Google Maps URL 拼接
// ---------------------------------------------------------------------------

const GOOGLE_MAPS_DIR_BASE = 'https://www.google.com/maps/dir/';

/** 高德 mode → Google Maps travelmode */
const GOOGLE_TRAVEL_MODE: Record<string, string> = {
  car: 'driving',
  bus: 'transit',
  walk: 'walking',
  ride: 'bicycling',
};

function formatGooglePoint(stop: Stop): string {
  return `${stop.latitude},${stop.longitude}`;
}

function buildGoogleMapsUrl(stops: Stop[], mode: string): string {
  if (stops.length < 2) return '';

  const origin = formatGooglePoint(stops[0]);
  const destination = formatGooglePoint(stops[stops.length - 1]);
  const travelmode = GOOGLE_TRAVEL_MODE[mode] ?? 'driving';

  const params = new URLSearchParams();
  params.set('api', '1');
  params.set('origin', origin);
  params.set('destination', destination);
  params.set('travelmode', travelmode);

  // 中间站点作为 waypoints（用 | 分隔）
  if (stops.length > 2) {
    const waypoints = stops
      .slice(1, -1)
      .map((s) => formatGooglePoint(s))
      .join('|');
    params.set('waypoints', waypoints);
  }

  return `${GOOGLE_MAPS_DIR_BASE}?${params.toString()}`;
}

// ---------------------------------------------------------------------------
// 通用
// ---------------------------------------------------------------------------

function buildLabel(stops: Stop[]): string {
  return stops.map((s) => s.name).join(' → ');
}

// ---------------------------------------------------------------------------
// 高德链接生成（保持原逻辑）
// ---------------------------------------------------------------------------

function generateAmapLinks(stops: Stop[], mode: string): NavigationLink[] {
  if (stops.length < 2) return [];

  if (mode === 'car' && stops.length === 3) {
    return [
      {
        url: buildAmapNavUrl(stops[0], stops[2], stops[1], mode),
        label: buildLabel(stops),
        provider: 'amap',
      },
    ];
  }

  if (mode === 'car' && stops.length > 3) {
    const links: NavigationLink[] = [];
    let i = 0;
    while (i < stops.length - 1) {
      const remaining = stops.length - i;
      if (remaining >= 3) {
        const segment = stops.slice(i, i + 3);
        links.push({
          url: buildAmapNavUrl(segment[0], segment[2], segment[1], mode),
          label: buildLabel(segment),
          provider: 'amap',
        });
        i += 2;
      } else {
        links.push({
          url: buildAmapNavUrl(stops[i], stops[i + 1], null, mode),
          label: buildLabel(stops.slice(i, i + 2)),
          provider: 'amap',
        });
        i += 1;
      }
    }
    return links;
  }

  if (stops.length === 2) {
    return [
      {
        url: buildAmapNavUrl(stops[0], stops[1], null, mode),
        label: buildLabel(stops),
        provider: 'amap',
      },
    ];
  }

  const links: NavigationLink[] = [];
  for (let i = 0; i < stops.length - 1; i++) {
    links.push({
      url: buildAmapNavUrl(stops[i], stops[i + 1], null, mode),
      label: buildLabel([stops[i], stops[i + 1]]),
      provider: 'amap',
    });
  }
  return links;
}

// ---------------------------------------------------------------------------
// Google Maps 链接生成
// ---------------------------------------------------------------------------

function generateGoogleLinks(stops: Stop[], mode: string): NavigationLink[] {
  if (stops.length < 2) return [];

  // Google Maps 支持 waypoints，不需要像高德那样拆分
  // 移动端最多 3 个 waypoints，所以 5+ 站时拆分
  if (stops.length <= 5) {
    return [
      {
        url: buildGoogleMapsUrl(stops, mode),
        label: buildLabel(stops),
        provider: 'google',
      },
    ];
  }

  // 5+ 站拆分：每段最多 5 站（origin + 3 waypoints + destination）
  const links: NavigationLink[] = [];
  let i = 0;
  while (i < stops.length - 1) {
    const end = Math.min(i + 5, stops.length);
    const segment = stops.slice(i, end);
    links.push({
      url: buildGoogleMapsUrl(segment, mode),
      label: buildLabel(segment),
      provider: 'google',
    });
    i = end - 1; // overlap: last stop = next first stop
  }
  return links;
}

// ---------------------------------------------------------------------------
// 执行入口
// ---------------------------------------------------------------------------

async function execute(params: PlanRouteParams): Promise<PlanRouteResult> {
  const { stops, mode = 'car', mapProvider = 'amap' } = params;

  if (!stops || stops.length < 2) {
    throw new Error('至少需要 2 个站点才能规划路线');
  }

  const links =
    mapProvider === 'google'
      ? generateGoogleLinks(stops, mode)
      : generateAmapLinks(stops, mode);

  // markdown 链接前缀区分平台，前端据此渲染不同卡片
  const emoji = mapProvider === 'google' ? '📍' : '🧭';
  const markdown = links
    .map((l) => `[${emoji} ${l.label}](${l.url})`)
    .join('\n');

  return { links, markdown };
}

// ---------------------------------------------------------------------------
// 工具定义 & 注册
// ---------------------------------------------------------------------------

const planRouteTool: ToolDefinition<PlanRouteParams, PlanRouteResult> = {
  name: 'plan_route',
  description: [
    '为用户规划出行路线，生成地图导航链接。',
    '用户点击链接即可直接打开地图开始导航。',
    '',
    '使用场景：',
    '- 用户问"从 A 到 B 怎么走"',
    '- 用户要求规划多地游览路线',
    '- 用户提到出行、导航、路线相关需求',
    '',
    '注意：',
    '- 你需要根据自己的知识提供每个地点准确的经纬度坐标',
    '- stops 数组按行程顺序排列，至少 2 个站点',
    '- mapProvider 决定生成哪个地图的链接：',
    '  - 如果 get_user_location 返回的位置在中国境内（经度 73~135，纬度 3~53），使用 "amap"（高德地图）',
    '  - 如果在中国境外（如日本、美国、香港等），使用 "google"（Google Maps）',
    '  - 如果没有获取到用户位置，默认使用 "amap"',
    '- 工具会返回包含导航链接的 markdown 文本，你必须将其原样附加在回复末尾',
  ].join('\n'),
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      stops: {
        type: SchemaType.ARRAY,
        description: '按行程顺序排列的站点列表，至少 2 个',
        items: {
          type: SchemaType.OBJECT,
          properties: {
            name: {
              type: SchemaType.STRING,
              description: '地点名称（如"东方明珠"、"Tokyo Tower"）',
            },
            longitude: {
              type: SchemaType.NUMBER,
              description: '经度（如 121.4997）',
            },
            latitude: {
              type: SchemaType.NUMBER,
              description: '纬度（如 31.2397）',
            },
          },
          required: ['name', 'longitude', 'latitude'],
        },
      },
      mode: {
        type: SchemaType.STRING,
        description:
          '出行方式: car（驾车，默认）、bus（公交）、walk（步行）、ride（骑行）',
      },
      mapProvider: {
        type: SchemaType.STRING,
        description:
          '地图平台: amap（高德地图，中国境内默认）、google（Google Maps，中国境外使用）',
      },
    },
    required: ['stops'],
  },
  execute: async (params) => execute(params),
};

toolRegistry.register(planRouteTool);

export { planRouteTool };
