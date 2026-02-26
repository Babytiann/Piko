import { geocodeCity } from './geocoding.js';
import { CurrentWeatherResponse, CurrentWeatherResult } from './types.js';

const API_KEY = process.env.OPENWEATHER_API_KEY ?? '';
const BASE = 'https://api.openweathermap.org';

/** 查询指定城市的实时天气 */
export async function fetchCurrentWeather(
  city: string,
): Promise<CurrentWeatherResult> {
  console.log(`[Weather] fetchCurrentWeather("${city}")`);
  const t0 = Date.now();
  const geo = await geocodeCity(city);

  const url = new URL(`${BASE}/data/2.5/weather`);
  url.searchParams.set('lat', String(geo.lat));
  url.searchParams.set('lon', String(geo.lon));
  url.searchParams.set('appid', API_KEY);
  url.searchParams.set('units', 'metric');
  url.searchParams.set('lang', 'zh_cn');

  const tApi = Date.now();
  const res = await fetch(url.toString());
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`实时天气查询失败 (${res.status}): ${text}`);
  }

  const data = (await res.json()) as CurrentWeatherResponse;
  console.log(`[Weather]   current API 响应 (${Date.now() - tApi}ms)`);

  const w = data.weather[0];
  if (!w) throw new Error('天气数据格式异常');

  const result: CurrentWeatherResult = {
    type: 'current',
    city: geo.name,
    country: geo.country,
    weather: w.main,
    description: w.description,
    temperature: Math.round(data.main.temp),
    feelsLike: Math.round(data.main.feels_like),
    tempMin: Math.round(data.main.temp_min),
    tempMax: Math.round(data.main.temp_max),
    humidity: data.main.humidity,
    windSpeed: data.wind.speed,
    visibility: data.visibility,
  };

  console.log(
    `[Weather] fetchCurrentWeather 完成 (总 ${Date.now() - t0}ms): ${result.temperature}°C, ${result.description}`,
  );
  return result;
}
