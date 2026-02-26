import { z } from 'zod';

import { toolRegistry, ToolDefinition } from '../ai-tools.js';
import {
  fetchCurrentWeather,
  fetchForecast,
  fetchAirPollution,
  type WeatherQueryType,
  type WeatherResult,
} from '../weather/index.js';

// ---------------------------------------------------------------------------
// 参数 Schema（Zod）
// ---------------------------------------------------------------------------

const parametersSchema = z.object({
  city: z
    .string()
    .describe(
      '城市名称（使用英文，如 Beijing、Shanghai、Hangzhou、Tokyo、London）',
    ),
  type: z
    .enum(['current', 'forecast', 'air_pollution'])
    .optional()
    .describe(
      '查询类型: current（实时天气，默认）、forecast（1~16天预报）、air_pollution（空气质量）',
    ),
  days: z
    .number()
    .min(1)
    .max(16)
    .optional()
    .describe(
      '预报天数（1~16），仅 type=forecast 时生效。今天=1，明天=2，后天=3，一周=7，默认=7',
    ),
});

type GetWeatherParams = z.infer<typeof parametersSchema>;

// ---------------------------------------------------------------------------
// 执行入口
// ---------------------------------------------------------------------------

const API_KEY = process.env.OPENWEATHER_API_KEY ?? '';

async function execute(params: GetWeatherParams): Promise<WeatherResult> {
  if (!API_KEY) {
    throw new Error('OPENWEATHER_API_KEY 未配置');
  }

  const queryType: WeatherQueryType = params.type ?? 'current';

  switch (queryType) {
    case 'current':
      return fetchCurrentWeather(params.city);
    case 'forecast':
      return fetchForecast(params.city, params.days ?? 7);
    case 'air_pollution':
      return fetchAirPollution(params.city);
    default: {
      const _exhaustive: never = queryType;
      throw new Error(`不支持的查询类型: ${_exhaustive}`);
    }
  }
}

// ---------------------------------------------------------------------------
// 工具定义 & 注册
// ---------------------------------------------------------------------------

const getWeatherTool: ToolDefinition<typeof parametersSchema> = {
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
  parameters: parametersSchema,
  execute: async (params) => execute(params),
};

toolRegistry.register(getWeatherTool);

export { getWeatherTool };
