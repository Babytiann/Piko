import type { HomePageData } from '../../../types/home.js';

export async function getHomePageData(): Promise<HomePageData> {
  return {
    header: { title: '首页' },
    welcome_card: {
      title: '欢迎使用 Piko',
      description: '此页面后续可展示更多内容。',
    },
  };
}
