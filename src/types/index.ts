export interface Profile {
  id: string;
  username?: string | null;
  email?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  [key: string]: unknown;
}

export interface Option {
  label: string;
  value: string;
  icon?: React.ComponentType<{ className?: string }>;
  withCount?: boolean;
}

export interface StructuredInfo {
  customers?: string[];
  companies?: string[];
  shippingCompanies?: string[];
  ports?: string[];
  countries?: string[];
  products?: string[];
  workflows?: string[];
}

export interface BusinessRecord {
  id: string;
  timestamp: string;
  content: string;
  tags: string[];
  createdAt: string;
  structured?: StructuredInfo;
}

export interface Tag {
  id: string;
  name: string;
  category?: string;
}

export interface FilterOptions {
  tags: string[];
  keyword: string;
  customer?: string;
  country?: string;
  product?: string;
  workflow?: string;
}

export const DEFAULT_TAGS: Tag[] = [
  { id: 'tag-1', name: '客户', category: '业务' },
  { id: 'tag-2', name: '品名', category: '产品' },
  { id: 'tag-3', name: '业务类型', category: '业务' },
  { id: 'tag-4', name: '运费', category: '财务' },
  { id: 'tag-5', name: '船公司', category: '物流' }
];