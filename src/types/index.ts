export interface Option {
  label: string;
  value: string;
  icon?: React.ComponentType<{ className?: string }>;
  withCount?: boolean;
}

// 结构化信息
export interface StructuredInfo {
  customers?: string[]; // 客户名称（人名）
  companies?: string[]; // 公司名称
  countries?: string[]; // 国家/地区
  products?: string[]; // 产品型号
  workflows?: string[]; // 工作流程关键词
}

// 业务记录数据结构
export interface BusinessRecord {
  id: string;
  timestamp: string; // ISO 8601 格式
  content: string;
  tags: string[];
  createdAt: string; // 原始创建时间，用于"保留原始记录时间"功能
  structured?: StructuredInfo; // 智能分析提取的结构化信息
}

// 标签数据结构
export interface Tag {
  id: string;
  name: string;
  category?: string;
}

// 筛选条件
export interface FilterOptions {
  tags: string[];
  keyword: string;
  customer?: string;
  country?: string;
  product?: string;
  workflow?: string;
}

// 默认标签预设
export const DEFAULT_TAGS: Tag[] = [
  { id: 'tag-1', name: '客户', category: '业务' },
  { id: 'tag-2', name: '品名', category: '产品' },
  { id: 'tag-3', name: '业务类型', category: '业务' },
  { id: 'tag-4', name: '运费', category: '财务' },
  { id: 'tag-5', name: '反馈', category: '跟进' },
  { id: 'tag-6', name: '护肤', category: '生活' },
];
