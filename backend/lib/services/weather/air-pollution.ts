import { geocodeCity } from './geocoding.js';
import type { AirPollutionResponse, AirPollutionResult } from './types.js';

const API_KEY = process.env.OPENWEATHER_API_KEY ?? '';
const BASE = 'https://api.openweathermap.org';

/** AQI 等级描述映射 (1-5) */
const AQI_LABELS: Record<number, string> = {
  1: '优',
  2: '良',
  3: '轻度污染',
  4: '中度污染',
  5: '重度污染',
};

/** 查询指定城市的空气质量 */
export async function fetchAirPollution(
  city: string,
): Promise<AirPollutionResult> {
  console.log(`[Weather] fetchAirPollution("${city}")`);
  const t0 = Date.now();
  const geo = await geocodeCity(city);

  const url = new URL(`${BASE}/data/2.5/air_pollution`);
  url.searchParams.set('lat', String(geo.lat));
  url.searchParams.set('lon', String(geo.lon));
  url.searchParams.set('appid', API_KEY);

  const tApi = Date.now();
  const res = await fetch(url.toString());
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`空气质量查询失败 (${res.status}): ${text}`);
  }

  const data = (await res.json()) as AirPollutionResponse;
  console.log(`[Weather]   air_pollution API 响应 (${Date.now() - tApi}ms)`);

  const item = data.list[0];
  if (!item) throw new Error('空气质量数据格式异常');

  const result: AirPollutionResult = {
    type: 'air_pollution',
    city: geo.name,
    country: geo.country,
    aqi: item.main.aqi,
    aqiLabel: AQI_LABELS[item.main.aqi] ?? '未知',
    pm25: item.components.pm2_5,
    pm10: item.components.pm10,
    co: item.components.co,
    no2: item.components.no2,
    o3: item.components.o3,
    so2: item.components.so2,
  };

  console.log(
    `[Weather] fetchAirPollution 完成 (总 ${Date.now() - t0}ms): AQI=${result.aqi} (${result.aqiLabel})`,
  );
  return result;
}
