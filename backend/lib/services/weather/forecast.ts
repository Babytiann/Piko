import { geocodeCity } from './geocoding.js';
import { ForecastDailyResponse, ForecastResult } from './types.js';

const API_KEY = process.env.OPENWEATHER_API_KEY ?? '';
const BASE = 'https://api.openweathermap.org';

/** 查询指定城市未来 1~16 天的每日天气预报 */
export async function fetchForecast(
  city: string,
  days: number,
): Promise<ForecastResult> {
  console.log(`[Weather] fetchForecast("${city}", ${days} 天)`);
  const t0 = Date.now();
  const geo = await geocodeCity(city);
  const cnt = Math.min(Math.max(days, 1), 16);

  const url = new URL(`${BASE}/data/2.5/forecast/daily`);
  url.searchParams.set('lat', String(geo.lat));
  url.searchParams.set('lon', String(geo.lon));
  url.searchParams.set('cnt', String(cnt));
  url.searchParams.set('appid', API_KEY);
  url.searchParams.set('units', 'metric');
  url.searchParams.set('lang', 'zh_cn');

  const tApi = Date.now();
  const res = await fetch(url.toString());
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`天气预报查询失败 (${res.status}): ${text}`);
  }

  const data = (await res.json()) as ForecastDailyResponse;
  console.log(
    `[Weather]   forecast API 响应 (${Date.now() - tApi}ms), ${data.list.length} 天数据`,
  );

  const result: ForecastResult = {
    type: 'forecast',
    city: data.city.name,
    country: data.city.country,
    days: data.list.map((d) => {
      const w = d.weather[0];
      return {
        date: new Date(d.dt * 1000).toISOString().split('T')[0]!,
        weather: w?.main ?? '',
        description: w?.description ?? '',
        tempDay: Math.round(d.temp.day),
        tempNight: Math.round(d.temp.night),
        tempMin: Math.round(d.temp.min),
        tempMax: Math.round(d.temp.max),
        humidity: d.humidity,
        windSpeed: d.speed,
        rainProbability: Math.round(d.pop * 100),
      };
    }),
  };

  console.log(`[Weather] fetchForecast 完成 (总 ${Date.now() - t0}ms)`);
  return result;
}
