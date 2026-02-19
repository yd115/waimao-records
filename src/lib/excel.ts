import * as XLSX from 'xlsx';
import type { BusinessRecord } from '@/types';
import { format } from 'date-fns';

/**
 * 导出记录为 Excel 文件（iOS 兼容）
 */
export function exportToExcel(records: BusinessRecord[], filename?: string) {
  if (records.length === 0) {
    throw new Error('没有可导出的记录');
  }

  // 准备数据
  const data = records.map(record => ({
    '时间': format(new Date(record.timestamp), 'yyyy-MM-dd HH:mm'),
    '内容': record.content,
    '标签': record.tags.join(', '),
    '客户': record.structured?.customers?.join(', ') || '',
    '公司': record.structured?.companies?.join(', ') || '',
    '国家/地区': record.structured?.countries?.join(', ') || '',
    '产品型号': record.structured?.products?.join(', ') || '',
    '工作流程': record.structured?.workflows?.join(', ') || '',
  }));

  // 创建工作簿
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, '工作记录');

  // 设置列宽
  const colWidths = [
    { wch: 16 }, // 时间
    { wch: 50 }, // 内容
    { wch: 20 }, // 标签
    { wch: 20 }, // 客户
    { wch: 20 }, // 公司
    { wch: 15 }, // 国家/地区
    { wch: 20 }, // 产品型号
    { wch: 20 }, // 工作流程
  ];
  ws['!cols'] = colWidths;

  // 生成文件名
  const defaultFilename = `工作记录_${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
  const finalFilename = filename || defaultFilename;

  // iOS Safari 兼容的导出方式
  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  
  // 创建下载链接
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = finalFilename;
  
  // iOS Safari 需要特殊处理
  if (navigator.userAgent.match(/iPhone|iPad|iPod/i)) {
    // 在 iOS 上，直接触发下载会打开文件选择器
    link.target = '_blank';
  }
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // 延迟释放 URL 对象，确保下载完成
  setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 100);
}

/**
 * 从 Excel 文件导入记录
 */
export async function importFromExcel(file: File): Promise<Partial<BusinessRecord>[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        
        // 读取第一个工作表
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // 转换为 JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        
        // 转换为应用数据格式
        const records: Partial<BusinessRecord>[] = jsonData.map((row: any) => {
          // 解析时间
          let timestamp = new Date();
          if (row['时间']) {
            const parsedDate = new Date(row['时间']);
            if (!isNaN(parsedDate.getTime())) {
              timestamp = parsedDate;
            }
          }

          // 解析标签
          const tags = row['标签'] ? String(row['标签']).split(',').map((t: string) => t.trim()).filter(Boolean) : [];

          // 解析结构化信息
          const structured: any = {};
          if (row['客户']) {
            structured.customers = String(row['客户']).split(',').map((s: string) => s.trim()).filter(Boolean);
          }
          if (row['公司']) {
            structured.companies = String(row['公司']).split(',').map((s: string) => s.trim()).filter(Boolean);
          }
          if (row['国家/地区']) {
            structured.countries = String(row['国家/地区']).split(',').map((s: string) => s.trim()).filter(Boolean);
          }
          if (row['产品型号']) {
            structured.products = String(row['产品型号']).split(',').map((s: string) => s.trim()).filter(Boolean);
          }
          if (row['工作流程']) {
            structured.workflows = String(row['工作流程']).split(',').map((s: string) => s.trim()).filter(Boolean);
          }

          return {
            content: row['内容'] || '',
            tags,
            timestamp: timestamp.toISOString(),
            structured: Object.keys(structured).length > 0 ? structured : undefined,
          };
        });

        resolve(records.filter(r => r.content)); // 只返回有内容的记录
      } catch (error) {
        reject(new Error('解析 Excel 文件失败'));
      }
    };

    reader.onerror = () => {
      reject(new Error('读取文件失败'));
    };

    reader.readAsBinaryString(file);
  });
}
