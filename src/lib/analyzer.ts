import type { StructuredInfo } from '@/types';

// 常见国家和地区关键词
const COUNTRIES = [
  '中国', '美国', '英国', '法国', '德国', '意大利', '西班牙', '葡萄牙',
  '日本', '韩国', '印度', '巴西', '澳大利亚', '加拿大', '墨西哥',
  '俄罗斯', '土耳其', '沙特', '阿联酋', '埃及', '南非',
  '欧洲', '亚洲', '北美', '南美', '非洲', '大洋洲', '中东',
  '欧盟', '东南亚', '中亚', '西欧', '东欧', '北欧', '南欧',
];

// 工作流程关键词
const WORKFLOWS = [
  '舱单', '报关', '集港', '装柜', '提柜', '报检', '商检',
  '寄样', '打样', '确认样', '大货', '订单', '合同', '发票',
  '提单', '运费', '海运', '空运', '快递', '物流', '清关',
  '付款', '收款', '定金', '尾款', '退税', '核销',
  '询价', '报价', '下单', '生产', '质检', '包装', '发货',
  '到港', '提货', '派送', '签收', '反馈', '投诉', '索赔',
  '代理', '佣金',
];

/**
 * 去除数组中被其他元素包含的子串
 * 例如：["GB-CKP106", "CKP106"] → ["GB-CKP106"]
 */
export function deduplicateByInclusion(items: string[]): string[] {
  if (!items || items.length === 0) return [];
  
  return items.filter(item => {
    // 检查是否有其他更长的项包含当前项
    return !items.some(other => 
      other !== item && other.includes(item)
    );
  });
}

/**
 * 智能分析文本内容，提取结构化信息
 */
export function analyzeContent(content: string): StructuredInfo {
  const structured: StructuredInfo = {};

  // 1. 提取公司名称（优先识别，避免被拆分）
  const companies = extractCompanies(content);
  if (companies.length > 0) {
    structured.companies = companies;
  }

  // 2. 提取客户名称（人名，排除已识别的公司名）
  const customers = extractCustomers(content, companies);
  if (customers.length > 0) {
    structured.customers = customers;
  }

  // 3. 提取国家/地区
  const countries = extractCountries(content);
  if (countries.length > 0) {
    structured.countries = countries;
  }

  // 4. 提取产品型号
  const products = extractProducts(content);
  if (products.length > 0) {
    structured.products = products;
  }

  // 5. 提取工作流程关键词
  const workflows = extractWorkflows(content);
  if (workflows.length > 0) {
    structured.workflows = workflows;
  }

  return structured;
}

/**
 * 提取公司名称
 * 规则：
 * 1. 明确标注的公司：客户公司：后面的内容
 * 2. 完整公司名称：Kaizen Paint (Pvt) Ltd, Agro Drisa GmbH Dresden
 * 3. 公司缩写：PPI, IBM, ABC（2-5个大写字母）
 */
function extractCompanies(content: string): string[] {
  const companies = new Set<string>();
  let match: RegExpExecArray | null;
  
  // 1. 提取明确标注的公司名称："客户公司："或"公司："后面的内容
  const explicitCompanyPattern = /(?:客户公司|公司)[：:]\s*([^\n，。,;；]+)/g;
  while ((match = explicitCompanyPattern.exec(content)) !== null) {
    const company = match[1].trim();
    if (company) {
      companies.add(company);
    }
  }
  
  // 2. 匹配完整公司名称（包含括号、GmbH、后缀等）
  // 例如：Kaizen Paint (Pvt) Ltd, Agro Drisa GmbH Dresden, ABC Company Inc
  const companyFullPattern = /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\s*(?:\([A-Za-z.]+\))?\s*(?:GmbH|Ltd|Inc|Corp|LLC|Co|Company|Group|International|Industries)?(?:\s+[A-Z][a-z]+)?\.?)\b/g;
  while ((match = companyFullPattern.exec(content)) !== null) {
    const company = match[1].trim();
    // 只保留包含特殊标识的公司名（括号、GmbH 或后缀）
    if (company.includes('(') || 
        company.includes('GmbH') || 
        /\b(Ltd|Inc|Corp|LLC|Co|Company|Group|International|Industries)\.?(\s+[A-Z][a-z]+)?$/.test(company)) {
      // 检查是否已经被明确标注的公司包含
      if (!Array.from(companies).some(c => c.includes(company))) {
        companies.add(company);
      }
    }
  }

  // 3. 匹配公司缩写：PPI, IBM, ABC（2-5个大写字母）
  const companyPattern = /\b([A-Z]{2,5})\b/g;
  while ((match = companyPattern.exec(content)) !== null) {
    const company = match[1];
    // 过滤常见缩写词和已经被其他公司名包含的缩写
    if (!isCommonAbbreviation(company) && !Array.from(companies).some(c => c.includes(company))) {
      companies.add(company);
    }
  }

  return Array.from(companies);
}

/**
 * 提取客户名称（仅人名）
 * 规则：
 * 1. 明确标注的客户名称：客户名称：后面的内容
 * 2. 英文人名：Paolo Tartarini, John Smith, René Kahlich（2-4个单词）
 * 3. 单个英文名：Noi, John, Mary（单个大写开头的单词）
 */
function extractCustomers(content: string, companies: string[]): string[] {
  const customers = new Set<string>();
  let match: RegExpExecArray | null;

  // 1. 提取明确标注的客户名称："客户名称："或"客户："后面的内容
  const explicitCustomerPattern = /(?:客户名称|客户)[：:]\s*([^\n，。,;；]+)/g;
  while ((match = explicitCustomerPattern.exec(content)) !== null) {
    const name = match[1].trim();
    if (name && !companies.some(c => c.includes(name))) {
      customers.add(name);
    }
  }

  // 2. 匹配完整英文人名模式：Paolo Tartarini, John Smith, René Kahlich
  // 支持带重音符号的字符（如 René）
  const fullNamePattern = /\b([A-ZÀ-ÖØ-Þ][a-zà-öø-ÿ]+(?:\s+[A-ZÀ-ÖØ-Þ][a-zà-öø-ÿ]+){1,3})\b/g;
  while ((match = fullNamePattern.exec(content)) !== null) {
    const name = match[1];
    // 过滤常见词汇、已经被公司名包含的名字、已经被明确标注的名字
    if (!isCommonWord(name) && 
        !companies.some(c => c.includes(name)) &&
        !Array.from(customers).some(c => c.includes(name))) {
      customers.add(name);
    }
  }

  // 3. 匹配单个英文名：Noi, John, Mary（3-10个字母，大写开头）
  const singleNamePattern = /\b([A-ZÀ-ÖØ-Þ][a-zà-öø-ÿ]{2,9})\b/g;
  while ((match = singleNamePattern.exec(content)) !== null) {
    const name = match[1];
    // 过滤常见词汇、已经被公司名包含的名字、已经被其他名字包含的名字
    if (!isCommonWord(name) && 
        !companies.some(c => c.includes(name)) && 
        !Array.from(customers).some(c => c.includes(name))) {
      customers.add(name);
    }
  }

  return Array.from(customers);
}

/**
 * 提取国家/地区
 */
function extractCountries(content: string): string[] {
  const countries = new Set<string>();
  
  for (const country of COUNTRIES) {
    if (content.includes(country)) {
      countries.add(country);
    }
  }

  return Array.from(countries);
}

/**
 * 提取产品型号
 * 规则：匹配产品型号格式，支持带连字符的型号
 * 例如：GB-CKP106, CKP-325, A-123, HY-T-80
 */
function extractProducts(content: string): string[] {
  const products = new Set<string>();
  
  // 匹配产品型号模式：支持多个连字符
  const patterns = [
    /\b([A-Z]{1,4}-[A-Z0-9]+-[A-Z0-9]+)\b/g,  // HY-T-80, GB-CKP-106（多个连字符）
    /\b([A-Z]{1,4}-[A-Z0-9]{3,})\b/g,  // GB-CKP106, CKP-325
    /\b([A-Z]{1,2}-[0-9]{2,}[A-Z]*)\b/g,  // A-325, GB-106
    /\b([0-9]{2,}-[A-Z]{2,})\b/g,      // 325-CKP
  ];

  for (const pattern of patterns) {
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(content)) !== null) {
      products.add(match[1]);
    }
  }

  // 去重：移除被其他型号包含的子串
  // 例如：["GB-CKP106", "CKP106"] → 只保留 "GB-CKP106"
  return deduplicateByInclusion(Array.from(products));
}

/**
 * 提取工作流程关键词
 */
function extractWorkflows(content: string): string[] {
  const workflows = new Set<string>();
  
  for (const workflow of WORKFLOWS) {
    if (content.includes(workflow)) {
      workflows.add(workflow);
    }
  }

  return Array.from(workflows);
}

/**
 * 判断是否为常见非人名词汇
 */
function isCommonWord(word: string): boolean {
  const commonWords = [
    'FedEx', 'DHL', 'UPS', 'TNT', 'EMS',
    'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday',
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
    'Today', 'Tomorrow', 'Yesterday', 'Next', 'Last', 'This', 'That',
    'Please', 'Thanks', 'Hello', 'Regards', 'Best', 'Dear',
    // 港口名称
    'Bremen', 'Hamburg', 'Rotterdam', 'Antwerp', 'Shanghai', 'Ningbo',
    'Shenzhen', 'Guangzhou', 'Qingdao', 'Tianjin', 'Dalian', 'Xiamen',
    'Singapore', 'Dubai', 'Jebel', 'Santos', 'Busan', 'Tokyo',
    // 护肤品相关
    'Water', 'Cream', 'Lotion', 'Serum', 'Toner', 'Cleanser',
    'Essence', 'Mask', 'Moisturizer', 'Sunscreen',
  ];
  
  return commonWords.includes(word);
}

/**
 * 判断是否为常见缩写词（非公司名）
 */
function isCommonAbbreviation(abbr: string): boolean {
  const commonAbbrs = [
    'OK', 'NO', 'YES', 'USD', 'CNY', 'EUR', 'GBP', 'JPY',
    'USA', 'UK', 'CN', 'JP', 'KR', 'DE', 'FR', 'IT', 'ES',
    'AM', 'PM', 'GMT', 'UTC', 'EST', 'PST', 'CST',
    'CEO', 'CFO', 'CTO', 'COO', 'HR', 'IT', 'PR', 'QA',
    'PDF', 'DOC', 'XLS', 'PPT', 'CSV', 'XML', 'JSON',
    'HTTP', 'HTTPS', 'FTP', 'SSH', 'API', 'URL', 'HTML', 'CSS',
    'GB', 'MB', 'KB', 'TB', // 存储单位
    // 外贸术语
    'CIF', 'FOB', 'CFR', 'EXW', 'FCA', 'CPT', 'CIP', 'DAP', 'DDP',
    'MT', 'KG', 'FCL', 'LCL', 'TEU', 'FEU',
    'ETD', 'ETA', 'ATD', 'ATA', // 船期术语
    // 技术文档
    'TDS', 'MSDS', 'COA', 'SGS', 'ISO', 'FDA', 'GMP',
  ];
  
  return commonAbbrs.includes(abbr);
}

/**
 * 高亮显示文本中的关键信息
 */
export function highlightContent(content: string, structured: StructuredInfo): Array<{ text: string; type?: 'customer' | 'company' | 'country' | 'product' | 'workflow' }> {
  const segments: Array<{ text: string; type?: 'customer' | 'company' | 'country' | 'product' | 'workflow' }> = [];
  
  // 收集所有需要高亮的关键词及其类型
  const highlights: Array<{ keyword: string; type: 'customer' | 'company' | 'country' | 'product' | 'workflow' }> = [];
  
  if (structured.customers) {
    structured.customers.forEach(c => highlights.push({ keyword: c, type: 'customer' }));
  }
  if (structured.companies) {
    structured.companies.forEach(c => highlights.push({ keyword: c, type: 'company' }));
  }
  if (structured.countries) {
    structured.countries.forEach(c => highlights.push({ keyword: c, type: 'country' }));
  }
  if (structured.products) {
    structured.products.forEach(p => highlights.push({ keyword: p, type: 'product' }));
  }
  if (structured.workflows) {
    structured.workflows.forEach(w => highlights.push({ keyword: w, type: 'workflow' }));
  }

  // 按关键词长度降序排序，优先匹配长关键词
  highlights.sort((a, b) => b.keyword.length - a.keyword.length);

  // 构建正则表达式
  if (highlights.length === 0) {
    return [{ text: content }];
  }

  const escapedKeywords = highlights.map(h => 
    h.keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  );
  const pattern = new RegExp(`(${escapedKeywords.join('|')})`, 'g');

  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(content)) !== null) {
    // 添加匹配前的普通文本
    if (match.index > lastIndex) {
      segments.push({ text: content.slice(lastIndex, match.index) });
    }

    // 添加高亮文本
    const matchedText = match[1];
    const highlight = highlights.find(h => h.keyword === matchedText);
    if (highlight) {
      segments.push({ text: matchedText, type: highlight.type });
    }

    lastIndex = match.index + matchedText.length;
  }

  // 添加剩余的普通文本
  if (lastIndex < content.length) {
    segments.push({ text: content.slice(lastIndex) });
  }

  return segments;
}
