// 报价格式解析器

// 港口中英文映射
const PORT_MAP: Record<string, string> = {
  '汉堡': 'Hamburg',
  '不来梅': 'Bremen',
  '鹿特丹': 'Rotterdam',
  '安特卫普': 'Antwerp',
  '上海': 'Shanghai',
  '宁波': 'Ningbo',
  '深圳': 'Shenzhen',
  '广州': 'Guangzhou',
  '青岛': 'Qingdao',
  '天津': 'Tianjin',
  '天津新港': 'XINGANG, CHINA',
  '新港': 'XINGANG, CHINA',
  '大连': 'Dalian',
  '厦门': 'Xiamen',
  '新加坡': 'Singapore',
  '迪拜': 'Dubai',
  '桑托斯': 'Santos',
  '釜山': 'Busan',
  '东京': 'Tokyo',
};

// 柜型映射
const CONTAINER_MAP: Record<string, string> = {
  '小柜': "20'FCL",
  '大柜': "40'FCL",
  '高柜': "40'HQ",
  "20'": "20'FCL",
  "40'": "40'FCL",
  "20": "20'FCL",
  "40": "40'FCL",
};

// 包装类型映射
const PACKING_MAP: Record<string, string> = {
  '1000kg吨包': '1000kg big bags with pallets',
  '500kg吨包': '500kg big bags with pallets',
  '吨包': '1000kg big bags with pallets', // 默认1000kg
  '大袋': '1000kg big bags with pallets',
  '25kg小袋': '25kg bags with pallets',
  '20kg小袋': '20kg bags with pallets',
  '小袋': '25kg bags with pallets', // 默认25kg
  '袋装': '25kg bags with pallets',
};

export interface QuoteInfo {
  port?: string; // 港口（英文）
  product?: string; // 产品型号
  quantity?: number; // 数量（吨）
  container?: string; // 柜型
  packing?: string; // 包装方式
  price?: number; // 价格（美元/吨）
  priceType?: string; // 价格类型（CIF/FOB/CFR）
}

/**
 * 解析简短输入，提取报价信息
 * 示例输入：汉堡HRM95 20吨小柜吨包价格500
 */
export function parseQuoteInput(input: string): QuoteInfo {
  const info: QuoteInfo = {};

  // 1. 提取港口
  for (const [cn, en] of Object.entries(PORT_MAP)) {
    if (input.includes(cn)) {
      info.port = en;
      break;
    }
  }

  // 2. 提取产品型号（大写字母+数字组合）
  const productMatch = input.match(/([A-Z]{2,}[-]?[A-Z0-9]+)/);
  if (productMatch) {
    info.product = productMatch[1];
  }

  // 3. 提取数量（数字+吨）
  const quantityMatch = input.match(/(\d+(?:\.\d+)?)\s*(?:吨|MT|mt|T|t)/i);
  if (quantityMatch) {
    info.quantity = parseFloat(quantityMatch[1]);
  }

  // 4. 提取柜型
  for (const [cn, en] of Object.entries(CONTAINER_MAP)) {
    if (input.includes(cn)) {
      info.container = en;
      break;
    }
  }

  // 5. 提取包装方式（优先匹配带重量的包装）
  // 先匹配带重量的包装（如 1000kg吨包、25kg小袋）
  const packingWithWeightMatch = input.match(/(\d+kg[吨包|小袋|大袋])/);
  if (packingWithWeightMatch) {
    const packingText = packingWithWeightMatch[1];
    for (const [cn, en] of Object.entries(PACKING_MAP)) {
      if (packingText.includes(cn.replace(/\d+kg/, ''))) {
        // 提取重量并构建包装描述
        const weight = packingWithWeightMatch[1].match(/(\d+)kg/)?.[1];
        if (weight) {
          if (packingText.includes('吨包') || packingText.includes('大袋')) {
            info.packing = `${weight}kg big bags with pallets`;
          } else if (packingText.includes('小袋')) {
            info.packing = `${weight}kg bags with pallets`;
          }
        }
        break;
      }
    }
  }
  
  // 如果没有匹配到带重量的包装，再匹配普通包装
  if (!info.packing) {
    for (const [cn, en] of Object.entries(PACKING_MAP)) {
      if (input.includes(cn)) {
        info.packing = en;
        break;
      }
    }
  }

  // 6. 提取价格（数字，可能带小数）
  const priceMatch = input.match(/(?:价格|报价|USD|usd|\$)\s*(\d+(?:\.\d+)?)/i);
  if (priceMatch) {
    info.price = parseFloat(priceMatch[1]);
  }

  // 7. 提取价格类型（CIF/FOB/CFR）
  if (input.match(/CIF|cif/)) {
    info.priceType = 'CIF';
  } else if (input.match(/FOB|fob/)) {
    info.priceType = 'FOB';
  } else if (input.match(/CFR|cfr|C&F|c&f/)) {
    info.priceType = 'CFR';
  } else {
    info.priceType = 'CIF'; // 默认CIF
  }

  return info;
}

/**
 * 生成标准报价格式
 */
export function generateQuoteFormat(info: QuoteInfo): string {
  const parts: string[] = [];

  // 价格类型 + 港口（冒号后不加逗号）
  if (info.priceType && info.port) {
    parts.push(`${info.priceType} ${info.port}:`);
  } else if (info.port) {
    parts.push(`CIF ${info.port}:`);
  }

  // 价格
  if (info.price) {
    parts.push(`USD${info.price}/MT`);
  }

  // 数量 + 柜型
  if (info.quantity && info.container) {
    parts.push(`${info.quantity}MT for 1X${info.container}`);
  } else if (info.quantity) {
    parts.push(`${info.quantity}MT`);
  }

  // 包装方式
  if (info.packing) {
    parts.push(`packing in ${info.packing}`);
  }

  // 第一个部分（港口）后面不加逗号，其他部分用逗号+空格连接
  if (parts.length === 0) return '';
  if (parts.length === 1) return parts[0];
  
  return parts[0] + ' ' + parts.slice(1).join(', ');
}

/**
 * 一键解析并生成报价格式
 */
export function quickGenerateQuote(input: string): string {
  const info = parseQuoteInput(input);
  return generateQuoteFormat(info);
}
