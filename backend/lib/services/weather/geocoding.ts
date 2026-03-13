import type { GeoLocation } from './types.js';

const API_KEY = process.env.OPENWEATHER_API_KEY ?? '';
const BASE = 'https://api.openweathermap.org';

// OpenWeather reverse geocode response item (local_names 含多语言地名)
interface ReverseGeoItem {
  name: string;
  local_names?: { zh?: string; zh_cn?: string; en?: string };
  country: string;
}

/** 将城市名转为经纬度坐标 */
export async function geocodeCity(city: string): Promise<GeoLocation> {
  console.log(`[Weather]   geocode: "${city}" → 查询坐标...`);
  const t0 = Date.now();

  const url = new URL(`${BASE}/geo/1.0/direct`);
  url.searchParams.set('q', city);
  url.searchParams.set('limit', '1');
  url.searchParams.set('appid', API_KEY);

  const res = await fetch(url.toString());
  if (!res.ok) {
    throw new Error(`Geocoding 失败 (${res.status})`);
  }

  const data = (await res.json()) as GeoLocation[];
  if (!data[0]) {
    throw new Error(`找不到城市: ${city}`);
  }

  console.log(
    `[Weather]   geocode: "${city}" → (${data[0].lat}, ${data[0].lon}) ${data[0].name}, ${data[0].country} (${Date.now() - t0}ms)`,
  );
  return data[0];
}

/** 反向地理编码：经纬度 → 城市名 */
export async function reverseGeocode(
  lat: number,
  lon: number,
): Promise<{ city: string; country: string }> {
  const url = new URL(`${BASE}/geo/1.0/reverse`);
  url.searchParams.set('lat', String(lat));
  url.searchParams.set('lon', String(lon));
  url.searchParams.set('limit', '1');
  url.searchParams.set('appid', API_KEY);

  const res = await fetch(url.toString());
  if (!res.ok) {
    throw new Error(`Reverse geocoding 失败 (${res.status})`);
  }

  const data = (await res.json()) as ReverseGeoItem[];
  if (!data[0]) {
    throw new Error('无法解析该位置');
  }
  const item = data[0];
  const city = item.local_names?.zh ?? item.local_names?.zh_cn ?? item.name;
  return { city, country: item.country };
}
