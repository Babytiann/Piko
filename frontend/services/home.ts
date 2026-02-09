import type { HomePageData } from '@/types/home';
import { post } from './api-client';

/** Fetch all data for the Home page. */
export function fetchHomePage(): Promise<HomePageData> {
  return post<HomePageData>('homepage/summary/v1');
}
