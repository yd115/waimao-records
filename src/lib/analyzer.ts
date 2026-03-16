import type { StructuredInfo } from '@/types';

const COUNTRY_KEYWORDS = [
  '中国', '美国', '英国', '法国', '德国', '意大利', '西班牙', '葡萄牙',
  '日本', '韩国', '印度', '巴西', '澳大利亚', '加拿大', '墨西哥',
  '俄罗斯', '土耳其', '沙特', '阿联酋', '埃及', '南非', '越南', '马来西亚', '泰国', '印尼',
  '哥伦比亚', '苏丹', '伊朗', '台湾', '阿根廷', '孟加拉国', '新加坡',
  '欧洲', '亚洲', '北美', '南美', '非洲', '大洋洲', '中东',
  '欧盟', '东南亚', '中亚', '西欧', '东欧', '北欧', '南欧',
  'Vietnam', 'Malaysia', 'Thailand', 'Indonesia', 'Colombia', 'Sudan', 'Iran', 'Taiwan', 'Argentina', 'Bangladesh', 'Singapore', 'Germany',
  'Turkey', 'Egypt', 'South Africa'
];

const PORT_COUNTRY_MAP: Record<string, string> = {
  PENANG: '马来西亚',
  CATLAI: '越南',
  'CAT LAI': '越南',
  XINGANG: '中国',
  TIANJIN: '中国',
  HAMBURG: '德国',
  SINGAPORE: '新加坡',
  CHITTAGONG: '孟加拉国',
  '吉大港': '孟加拉国',
  '布宜诺斯艾利斯': '阿根廷',
  'BUENOS AIRES': '阿根廷',
  BUENOSAIRES: '阿根廷',
  '布埃纳文图拉': '哥伦比亚',
  BUENAVENTURA: '哥伦比亚',
  '阿巴斯': '伊朗',
  ABBAS: '伊朗',
  '高雄': '台湾',
  KAOHSIUNG: '台湾',
  HAIPHONG: '越南',
  '海防': '越南',
  '巴生西': '马来西亚',
  KLANG: '马来西亚',
  'PORT KLANG': '马来西亚',
  PORTKLANG: '马来西亚',
  PASIRGUDANG: '马来西亚',
  TAICHUNG: '台湾',
  TAICHUNGPORT: '台湾'
};

const WORKFLOWS = [
  '舱单', '报关', '集港', '装柜', '提柜', '报检', '商检',
  '寄样', '打样', '确认样', '大货', '订单', '合同', '发票',
  '提单', '运费', '海运', '空运', '快递', '物流', '清关',
  '付款', '收款', '定金', '尾款', '退税', '核销',
  '询价', '报价', '下单', '生产', '质检', '包装', '发货',
  '到港', '提货', '派送', '签收', '反馈', '投诉', '索赔',
  '代理', '佣金', '订舱', '结汇'
];

const SHIPPING_COMPANIES = [
  'MSC', 'CNC', 'CMA', 'MCC', 'COSCO', 'YML', 'PIL', 'EMC', 'MSK',
  'OOCL', 'ONE', 'HMM', 'ZIM', 'MAERSK', 'WHL'
];

const COMPANY_SUFFIXES = [
  '股份有限公司', '有限公司', '贸易公司', '集团', '工厂', '实业', '公司',
  'Sdn\\s+Bhd', 'GmbH', 'Limited', 'Ltd', 'Inc', 'Corp', 'Corporation', 'LLC',
  'Company', 'Group', 'International', 'Industries', 'Pvt\\.?\\s*Ltd',
  'Pte\\.?\\s*Ltd', 'B\\.V\\.', 'N\\.V\\.', 'SAS', 'SARL', 'SRL',
  'S\\.R\\.L\\.', 'SPA', 'S\\.P\\.A\\.', 'PLC'
];

const COMPANY_SUFFIX_REGEX = new RegExp(`(?:${COMPANY_SUFFIXES.join('|')})$`, 'i');
const COMPANY_SUFFIX_ANYWHERE_REGEX = new RegExp(
  `([A-ZÀ-ÖØ-Þ\\u4e00-\\u9fa5][A-Za-zÀ-ÖØ-öø-ÿ0-9&.()（）\\-/\\s]{1,80}?(?:${COMPANY_SUFFIXES.join('|')})(?:\\s+[A-ZÀ-ÖØ-Þ][A-Za-zÀ-ÖØ-öø-ÿ0-9&.()（）\\-/]{2,}){0,2})`,
  'gi'
);

const CONTAINER_CODES = new Set(['20GP', '40GP', '40HQ', '40HC', '40NOR', '20FCL', '40FCL', 'HQ', 'HC', 'GP', 'NOR', 'FCL']);
const TRADE_TERMS = new Set(['CIF', 'FOB', 'CFR', 'EXW', 'FCA', 'CPT', 'CIP', 'DAP', 'DDP', 'MT']);
const PORT_STOPWORDS = new Set([
  'PENANG', 'CATLAI', 'CAT LAI', 'XINGANG', 'HAMBURG', 'CHITTAGONG', 'SINGAPORE', 'BUENOS AIRES', 'BUENOSAIRES',
  'BUENAVENTURA', 'ABBAS', 'KAOHSIUNG', 'HAIPHONG', 'PORT KLANG', 'PORTKLANG', 'PASIRGUDANG', 'TAICHUNG',
  '吉大港', '布宜诺斯艾利斯', '布埃纳文图拉', '阿巴斯', '高雄', '海防', '巴生西', '新加坡'
]);
const PACKAGING_TERMS = new Set([
  'BAG', 'BAGS', 'BIG BAG', 'BIG BAGS', 'PACKING', 'PACKED', 'PALLET', 'PALLETS',
  'BAGS WITH PALLETS', 'WITHOUT PALLET', 'WITH PALLETS', 'WITHOUT PALLETS'
]);

const NON_PERSON_TOKENS = new Set([
  'FedEx', 'DHL', 'UPS', 'TNT', 'EMS',
  'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday',
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
  'Today', 'Tomorrow', 'Yesterday', 'Next', 'Last', 'This', 'That',
  'Please', 'Thanks', 'Hello', 'Regards', 'Best', 'Dear',
  'Water', 'Cream', 'Lotion', 'Serum', 'Toner', 'Cleanser', 'Essence', 'Mask', 'Moisturizer', 'Sunscreen',
  'Vinyl', 'Silane', 'Epoxy', 'Resin', 'Powder', 'Granule', 'Granules', 'Material', 'Materials',
  'PP', 'PE', 'PVC', 'PET', 'HDPE', 'LDPE', 'LLDPE',
  ...PORT_STOPWORDS,
  ...TRADE_TERMS,
  ...SHIPPING_COMPANIES
]);

const NON_COMPANY_TOKENS = new Set([
  'PP', 'PE', 'PVC', 'PET', 'HDPE', 'LDPE', 'LLDPE',
  'Vinyl', 'Silane', 'Epoxy', 'Holly200',
  'HQ', 'HC', 'GP', 'NOR', 'FCL', 'MT',
  ...PORT_STOPWORDS,
  ...TRADE_TERMS,
  ...SHIPPING_COMPANIES,
  ...PACKAGING_TERMS
]);

const COMMON_ABBREVIATIONS = new Set([
  'OK', 'NO', 'YES', 'USD', 'CNY', 'EUR', 'GBP', 'JPY',
  'USA', 'UK', 'CN', 'JP', 'KR', 'DE', 'FR', 'IT', 'ES',
  'AM', 'PM', 'GMT', 'UTC', 'EST', 'PST', 'CST',
  'CEO', 'CFO', 'CTO', 'COO', 'HR', 'IT', 'PR', 'QA',
  'PDF', 'DOC', 'XLS', 'PPT', 'CSV', 'XML', 'JSON',
  'HTTP', 'HTTPS', 'FTP', 'SSH', 'API', 'URL', 'HTML', 'CSS',
  'GB', 'MB', 'KB', 'TB',
  'TEU', 'FEU', 'ETD', 'ETA', 'ATD', 'ATA',
  'TDS', 'MSDS', 'COA', 'SGS', 'ISO', 'FDA', 'GMP'
]);

export function deduplicateByInclusion(items: string[]): string[] {
  if (!items || items.length === 0) return [];
  return items.filter(item => !items.some(other => other !== item && other.includes(item)));
}

export function analyzeContent(content: string): StructuredInfo {
  const structured: StructuredInfo = {};

  const shippingCompanies = extractShippingCompanies(content);
  if (shippingCompanies.length > 0) structured.shippingCompanies = shippingCompanies;

  const products = extractProducts(content);
  if (products.length > 0) structured.products = products;

  const companies = extractCompanies(content, shippingCompanies, products);
  if (companies.length > 0) structured.companies = companies;

  const customers = extractCustomers(content, companies, shippingCompanies, products);
  if (customers.length > 0) structured.customers = customers;

  const countries = extractCountries(content);
  if (countries.length > 0) structured.countries = countries;

  const workflows = extractWorkflows(content);
  if (workflows.length > 0) structured.workflows = workflows;

  return structured;
}

function extractShippingCompanies(content: string): string[] {
  const results = new Set<string>();
  for (const company of SHIPPING_COMPANIES) {
    const regex = new RegExp(`\\b${escapeRegExp(company)}\\b`, 'i');
    if (regex.test(content)) results.add(company);
  }
  return Array.from(results);
}

function extractCompanies(content: string, shippingCompanies: string[], products: string[]): string[] {
  const companies = new Set<string>();
  let match: RegExpExecArray | null;

  const explicitCompanyPattern = /(?:客户公司|公司名称|公司)[:：]\s*([^\n]+)/g;
  while ((match = explicitCompanyPattern.exec(content)) !== null) {
    for (const candidate of extractCompanyCandidates(match[1])) {
      if (isValidCompanyCandidate(candidate, shippingCompanies, products)) companies.add(candidate);
    }
  }

  const customerLinePattern = /客户[:：]\s*([^\n]+)/g;
  while ((match = customerLinePattern.exec(content)) !== null) {
    const line = sanitizeEntity(match[1]);
    const explicitCompanyPart = extractExplicitCompanyPart(line);

    if (explicitCompanyPart && isValidExplicitCompanyCandidate(explicitCompanyPart, shippingCompanies, products)) {
      companies.add(explicitCompanyPart);
    }

    for (const candidate of extractCompanyCandidates(line)) {
      if (isValidCompanyCandidate(candidate, shippingCompanies, products)) companies.add(candidate);
    }
  }

  while ((match = COMPANY_SUFFIX_ANYWHERE_REGEX.exec(content)) !== null) {
    const candidate = sanitizeEntity(match[1]);
    if (isValidCompanyCandidate(candidate, shippingCompanies, products)) companies.add(candidate);
  }

  return deduplicateByInclusion(Array.from(companies));
}

function extractCustomers(content: string, companies: string[], shippingCompanies: string[], products: string[]): string[] {
  const customers = new Set<string>();
  let match: RegExpExecArray | null;

  const explicitCustomerPattern = /(?:客户名称|联系人|越南客户|欧洲客户|客户)[:：]\s*([^\n]+)/g;
  while ((match = explicitCustomerPattern.exec(content)) !== null) {
    const line = sanitizeEntity(match[1]);

    if (line.startsWith('+')) {
      continue;
    }

    if (line.includes('+')) {
      const explicitCustomerPart = sanitizeEntity(line.slice(0, line.indexOf('+')));
      if (explicitCustomerPart && isValidCustomerCandidate(explicitCustomerPart, companies, shippingCompanies, products)) {
        customers.add(explicitCustomerPart);
      }
      continue;
    }

    if (line && isValidCustomerCandidate(line, companies, shippingCompanies, products)) {
      customers.add(line);
    }
  }

  const titleCustomerPattern = /\b([A-Z][A-Za-z]+(?:\s+[A-Z][A-Za-z]+){1,2})\s+客户\b/g;
  while ((match = titleCustomerPattern.exec(content)) !== null) {
    const name = sanitizeEntity(match[1]);
    if (isValidCustomerCandidate(name, companies, shippingCompanies, products)) customers.add(name);
  }

  const fullNamePattern = /\b((?:MD\s+)?[A-ZÀ-ÖØ-Þ][A-Za-zÀ-ÖØ-öø-ÿ]+(?:\s+[A-ZÀ-ÖØ-Þ][A-Za-zÀ-ÖØ-öø-ÿ]+){1,3})\b/g;
  while ((match = fullNamePattern.exec(content)) !== null) {
    const name = sanitizeEntity(match[1]);
    if (isValidCustomerCandidate(name, companies, shippingCompanies, products)) customers.add(name);
  }

  const uppercaseNamePattern = /\b((?:MD\s+)?[A-Z]{2,}(?:\s+[A-Z]{2,}){1,3})\b/g;
  while ((match = uppercaseNamePattern.exec(content)) !== null) {
    const name = sanitizeEntity(match[1]);
    if (isValidUppercaseCustomerCandidate(name, shippingCompanies, products)) customers.add(name);
  }

  return deduplicateByInclusion(Array.from(customers));
}

function extractCountries(content: string): string[] {
  const countries = new Set<string>();

  for (const item of COUNTRY_KEYWORDS) {
    if (content.includes(item)) countries.add(normalizeCountry(item));
  }

  const upperContent = content.toUpperCase();
  for (const [port, country] of Object.entries(PORT_COUNTRY_MAP)) {
    if (upperContent.includes(port) || content.includes(port)) {
      countries.add(country);
    }
  }

  return Array.from(countries);
}

function extractProducts(content: string): string[] {
  const products = new Set<string>();
  let match: RegExpExecArray | null;

  const explicitPattern = /(?:型号|品名|Model|Item)[:：]?\s*([^\n]+)/gi;
  while ((match = explicitPattern.exec(content)) !== null) {
    const tokens = match[1].split(/[，,、\s]+/).map(item => item.trim()).filter(Boolean);
    for (const token of tokens) {
      if (isValidProductCode(token)) products.add(token);
    }
  }

  const patterns = [
    /\b([A-Z0-9]{2,}(?:-[A-Z0-9]{1,})+)\b/g,
    /\b([A-Z]{2,}[0-9]+[A-Z0-9\-]*)\b/g,
    /\b([A-Za-z]{2,}[A-Za-z0-9-]*\d+[A-Za-z0-9-]*)\b/g
  ];

  for (const pattern of patterns) {
    while ((match = pattern.exec(content)) !== null) {
      const token = match[1];
      if (isValidProductCode(token)) products.add(token);
    }
  }

  return deduplicateByInclusion(Array.from(products));
}

function extractWorkflows(content: string): string[] {
  const workflows = new Set<string>();
  for (const workflow of WORKFLOWS) {
    if (content.includes(workflow)) workflows.add(workflow);
  }
  return Array.from(workflows);
}

function extractExplicitCompanyPart(line: string) {
  const normalized = sanitizeEntity(line);
  if (!normalized) return '';
  if (normalized.startsWith('+')) return sanitizeEntity(normalized.slice(1));
  if (!normalized.includes('+')) return '';
  return sanitizeEntity(normalized.slice(normalized.indexOf('+') + 1));
}

function isValidExplicitCompanyCandidate(value: string, shippingCompanies: string[], products: string[]) {
  if (!value) return false;
  if (shippingCompanies.includes(value)) return false;
  if (products.includes(value)) return false;
  if (NON_COMPANY_TOKENS.has(value)) return false;
  if (isPackagingLike(value)) return false;
  if (isPriceLike(value) || isPureNumericCode(value) || isContainerCode(value) || isPortLike(value)) return false;
  return true;
}

function extractCompanyCandidates(text: string): string[] {
  const normalized = sanitizeEntity(text);
  const results = new Set<string>();
  let match: RegExpExecArray | null;

  while ((match = COMPANY_SUFFIX_ANYWHERE_REGEX.exec(normalized)) !== null) {
    results.add(sanitizeEntity(match[1]));
  }

  COMPANY_SUFFIX_ANYWHERE_REGEX.lastIndex = 0;

  for (const segment of normalized.split('+')) {
    const trimmed = sanitizeEntity(segment);
    if (trimmed && COMPANY_SUFFIX_REGEX.test(trimmed)) {
      results.add(trimmed);
    }
  }

  return Array.from(results);
}

function isValidCompanyCandidate(value: string, shippingCompanies: string[], products: string[]) {
  if (!value) return false;
  if (NON_COMPANY_TOKENS.has(value)) return false;
  if (COMMON_ABBREVIATIONS.has(value)) return false;
  if (shippingCompanies.includes(value)) return false;
  if (products.includes(value)) return false;
  if (isPackagingLike(value)) return false;
  if (isPriceLike(value) || isPureNumericCode(value) || isContainerCode(value) || isPortLike(value)) return false;
  if (isValidProductCode(value)) return false;
  return COMPANY_SUFFIX_REGEX.test(value);
}

function isValidCustomerCandidate(value: string, companies: string[], shippingCompanies: string[], products: string[]) {
  if (!value) return false;
  if (value.includes('+')) return true;
  if (COMPANY_SUFFIX_REGEX.test(value)) return false;
  if (companies.some(company => company === value || company.includes(value))) return false;
  if (shippingCompanies.some(company => company === value || value.includes(company))) return false;
  if (products.some(product => product === value || value.includes(product))) return false;
  if (isPackagingLike(value)) return false;
  if (isPriceLike(value) || isPureNumericCode(value) || isContainerCode(value) || isPortLike(value) || isValidProductCode(value)) return false;

  const tokens = value.split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return false;

  for (const token of tokens) {
    if (NON_PERSON_TOKENS.has(token)) return false;
    if (/^[A-Z]{2,}$/.test(token) && token !== 'MD') return false;
  }

  return true;
}

function isValidUppercaseCustomerCandidate(value: string, shippingCompanies: string[], products: string[]) {
  if (!value) return false;
  if (shippingCompanies.some(company => value.includes(company))) return false;
  if (products.some(product => value.includes(product))) return false;
  if (isPackagingLike(value)) return false;
  if (isPriceLike(value) || isPureNumericCode(value) || isPortLike(value) || isContainerCode(value)) return false;

  const tokens = value.split(/\s+/).filter(Boolean);
  if (tokens.length < 2 || tokens.length > 4) return false;
  if (tokens.some(token => TRADE_TERMS.has(token) || PORT_STOPWORDS.has(token) || CONTAINER_CODES.has(token))) return false;
  return tokens.every(token => token === 'MD' || /^[A-Z]{2,}$/.test(token));
}

function isValidProductCode(value: string) {
  if (!value) return false;
  if (isPriceLike(value) || isPureNumericCode(value) || isContainerCode(value)) return false;
  if (/^ENS\d+$/i.test(value)) return false;
  if (TRADE_TERMS.has(value.toUpperCase()) || SHIPPING_COMPANIES.includes(value.toUpperCase())) return false;
  if (!/[A-Za-z]/.test(value) || !/[0-9]/.test(value)) return false;
  return /[A-Za-z0-9]+(?:-[A-Za-z0-9]+)+/.test(value) || /^[A-Za-z]{2,}[A-Za-z0-9-]*\d+[A-Za-z0-9-]*$/.test(value);
}

function isPureNumericCode(value: string) {
  return /^\d+(?:-\d+)+$/.test(value) || /^\d+$/.test(value);
}

function isPriceLike(value: string) {
  return /^(USD|EUR|CNY)\s*\d+(?:\.\d+)?$/i.test(value) || /^(USD|EUR|CNY)\d+(?:\.\d+)?$/i.test(value);
}

function isContainerCode(value: string) {
  return CONTAINER_CODES.has(value.toUpperCase()) || /^\d{1,2}(GP|HQ|HC|NOR|FCL)$/i.test(value);
}

function isPortLike(value: string) {
  const normalized = value.toUpperCase().replace(/\s+/g, '');
  return Array.from(PORT_STOPWORDS).some(port => port.replace(/\s+/g, '') === normalized);
}

function isPackagingLike(value: string) {
  const normalized = value.toUpperCase().replace(/\s+/g, ' ').trim();
  return Array.from(PACKAGING_TERMS).some(term => normalized.includes(term));
}

function normalizeCountry(value: string) {
  switch (value.toLowerCase()) {
    case 'vietnam':
      return '越南';
    case 'malaysia':
      return '马来西亚';
    case 'thailand':
      return '泰国';
    case 'indonesia':
      return '印尼';
    case 'colombia':
      return '哥伦比亚';
    case 'sudan':
      return '苏丹';
    case 'iran':
      return '伊朗';
    case 'taiwan':
      return '台湾';
    case 'argentina':
      return '阿根廷';
    case 'bangladesh':
      return '孟加拉国';
    case 'singapore':
      return '新加坡';
    case 'germany':
      return '德国';
    case 'turkey':
      return '土耳其';
    case 'egypt':
      return '埃及';
    case 'south africa':
      return '南非';
    default:
      return value;
  }
}

function sanitizeEntity(value: string) {
  return value.trim().replace(/[，。,;；]+$/g, '');
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function highlightContent(content: string, structured: StructuredInfo): Array<{ text: string; type?: 'customer' | 'company' | 'shippingCompany' | 'country' | 'product' | 'workflow' }> {
  const segments: Array<{ text: string; type?: 'customer' | 'company' | 'shippingCompany' | 'country' | 'product' | 'workflow' }> = [];
  const highlights: Array<{ keyword: string; type: 'customer' | 'company' | 'shippingCompany' | 'country' | 'product' | 'workflow' }> = [];

  if (structured.customers) structured.customers.forEach(item => highlights.push({ keyword: item, type: 'customer' }));
  if (structured.companies) structured.companies.forEach(item => highlights.push({ keyword: item, type: 'company' }));
  if (structured.shippingCompanies) structured.shippingCompanies.forEach(item => highlights.push({ keyword: item, type: 'shippingCompany' }));
  if (structured.countries) structured.countries.forEach(item => highlights.push({ keyword: item, type: 'country' }));
  if (structured.products) structured.products.forEach(item => highlights.push({ keyword: item, type: 'product' }));
  if (structured.workflows) structured.workflows.forEach(item => highlights.push({ keyword: item, type: 'workflow' }));

  highlights.sort((a, b) => b.keyword.length - a.keyword.length);

  if (highlights.length === 0) return [{ text: content }];

  const escapedKeywords = highlights.map(item => escapeRegExp(item.keyword));
  const pattern = new RegExp(`(${escapedKeywords.join('|')})`, 'g');

  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(content)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ text: content.slice(lastIndex, match.index) });
    }

    const matchedText = match[1];
    const highlight = highlights.find(item => item.keyword === matchedText);
    if (highlight) {
      segments.push({ text: matchedText, type: highlight.type });
    }

    lastIndex = match.index + matchedText.length;
  }

  if (lastIndex < content.length) {
    segments.push({ text: content.slice(lastIndex) });
  }

  return segments;
}



