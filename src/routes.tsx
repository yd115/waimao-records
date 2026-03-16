import HomePage from './pages/HomePage';
import { QuoteGeneratorPage } from './pages/QuoteGeneratorPage';
import AnalyticsPage from './pages/AnalyticsPage';
import LoginPage from './pages/LoginPage';
import type { ReactNode } from 'react';

interface RouteConfig {
  name: string;
  path: string;
  element: ReactNode;
  visible?: boolean;
}

const routes: RouteConfig[] = [
  {
    name: '登录',
    path: '/login',
    element: <LoginPage />
  },
  {
    name: '外贸工作记录',
    path: '/',
    element: <HomePage />
  },
  {
    name: '筛选统计',
    path: '/analytics',
    element: <AnalyticsPage />
  },
  {
    name: '报价格式生成器',
    path: '/quote-generator',
    element: <QuoteGeneratorPage />
  }
];

export default routes;