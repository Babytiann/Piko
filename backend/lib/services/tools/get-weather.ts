/**
 * 天气查询工具定义 — 薄包装层。
 *
 * 只负责：向 AI 描述工具 schema + 调用 weather 服务。
 * 实际的 API 调用逻辑在 weather/ 服务模块中。
 */

import { SchemaType } from '@google/generative-ai';
import { toolRegistry, type ToolDefinition } from '../ai-tools';
import {
  fetchCurrentWeather,
  fetchForecast,
  fetchAirPollution,
  type WeatherQueryType,
  type WeatherResult,
} from '../weather';

// ---------------------------------------------------------------------------
// 工具参数
// ---------------------------------------------------------------------------

interface GetWeatherParams {
  city: string;
  type?: WeatherQueryType;
  days?: number;
}

// ---------------------------------------------------------------------------
// 执行入口
// ---------------------------------------------------------------------------

const API_KEY = process.env.OPENWEATHER_API_KEY ?? '';

async function execute(params: GetWeatherParams): Promise<WeatherResult> {
  if (!API_KEY) {
    throw new Error('OPENWEATHER_API_KEY 未配置');
  }

  const queryType = params.type ?? 'current';

  switch (queryType) {
    case 'current':
      return fetchCurrentWeather(params.city);
    case 'forecast':
      return fetchForecast(params.city, params.days ?? 7);
    case 'air_pollution':
      return fetchAirPollution(params.city);
    default:
      throw new Error(`不支持的查询类型: ${queryType}`);
  }
}

// ---------------------------------------------------------------------------
// 工具定义 & 注册
// ---------------------------------------------------------------------------

const getWeatherTool: ToolDefinition<GetWeatherParams, WeatherResult> = {
  name: 'get_weather',
  description: [
    '查询指定城市的天气信息。支持三种查询类型：',
    '1. current — 实时天气（温度、湿度、风速、能见度）',
    '2. forecast — 未来 1~16 天的每日天气预报（最高/最低温、降雨概率、风速）',
    '3. air_pollution — 空气质量（AQI 指数、PM2.5、PM10、CO、NO2、O3、SO2）',
    '',
    '使用场景：',
    '- 用户问"今天天气" → type=current',
    '- 用户问"明天/后天/下周天气" → type=forecast, days=对应天数',
    '- 用户问"未来X天天气" → type=forecast, days=X',
    '- 用户问"空气质量/PM2.5/雾霾" → type=air_pollution',
  ].join('\n'),
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      city: {
        type: SchemaType.STRING,
        description:
          '城市名称（使用英文，如 Beijing、Shanghai、Hangzhou、Tokyo、London）',
      },
      type: {
        type: SchemaType.STRING,
        description:
          '查询类型: current（实时天气，默认）、forecast（1~16天预报）、air_pollution（空气质量）',
      },
      days: {
        type: SchemaType.NUMBER,
        description:
          '预报天数（1~16），仅 type=forecast 时生效。今天=1，明天=2，后天=3，一周=7，默认=7',
      },
    },
    required: ['city'],
  },
  execute: async (params) => execute(params),
};

toolRegistry.register(getWeatherTool);

export { getWeatherTool };
