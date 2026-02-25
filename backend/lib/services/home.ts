import type { HomePageData } from '@/types/home';

/**
 * Aggregate all data needed by the Home page.
 * Currently returns static copy; extend as needed.
 */
export async function getHomePageData(): Promise<HomePageData> {
  return {
    header: { title: '首页' },
    welcome_card: {
      title: '欢迎使用 Piko',
      description: '此页面后续可展示更多内容。',
    },
  };
}
