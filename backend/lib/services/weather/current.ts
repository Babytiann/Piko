/** 实时天气查询 — OpenWeatherMap Current Weather API */

import type { CurrentWeatherResponse, CurrentWeatherResult } from './types';
import { geocodeCity } from './geocoding';

const API_KEY = process.env.OPENWEATHER_API_KEY ?? '';
const BASE = 'https://api.openweathermap.org';

/** 查询指定城市的实时天气 */
export async function fetchCurrentWeather(
  city: string,
): Promise<CurrentWeatherResult> {
  const geo = await geocodeCity(city);

  const url = new URL(`${BASE}/data/2.5/weather`);
  url.searchParams.set('lat', String(geo.lat));
  url.searchParams.set('lon', String(geo.lon));
  url.searchParams.set('appid', API_KEY);
  url.searchParams.set('units', 'metric');
  url.searchParams.set('lang', 'zh_cn');

  const res = await fetch(url.toString());
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`实时天气查询失败 (${res.status}): ${text}`);
  }

  const data = (await res.json()) as CurrentWeatherResponse;
  const w = data.weather[0];
  if (!w) throw new Error('天气数据格式异常');

  return {
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
}
