import type { ApiResponse } from '@/common/typings/api';
import type { HomeSlashResponse } from '@/common/typings/home';
import { fetch } from '@/services';

/** Fetch all data for the Home page (Slash: layout + nodes). */
export function fetchHomePage(
  selectedDate?: string,
  weatherCity?: string,
): Promise<ApiResponse<HomeSlashResponse>> {
  const body: Record<string, string> = {};
  if (selectedDate) body.selected_date = selectedDate;
  if (weatherCity?.trim()) body.weather_city = weatherCity.trim();
  return fetch<Record<string, unknown>, HomeSlashResponse>({
    method: 'POST',
    path: 'homepage/summary/v1',
    body: Object.keys(body).length > 0 ? body : {},
  });
}

/** Reverse geocode: lat/lon → city name (for weather). */
export function fetchReverseGeocode(
  lat: number,
  lon: number,
): Promise<ApiResponse<{ city: string }>> {
  return fetch<{ lat: string; lon: string }, { city: string }>({
    method: 'GET',
    path: 'homepage/weather/reverse-geocode',
    params: { lat: String(lat), lon: String(lon) },
  });
}
