import HomePage from './pages/HomePage';
import { QuoteGeneratorPage } from './pages/QuoteGeneratorPage';
import type { ReactNode } from 'react';

interface RouteConfig {
  name: string;
  path: string;
  element: ReactNode;
  visible?: boolean;
}

const routes: RouteConfig[] = [
  {
    name: '外贸工作记录',
    path: '/',
    element: <HomePage />
  },
  {
    name: '报价格式生成器',
    path: '/quote-generator',
    element: <QuoteGeneratorPage />
  }
];

export default routes;
