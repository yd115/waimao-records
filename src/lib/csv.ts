import type { BusinessRecord } from '@/types';
import { format } from 'date-fns';

/**
 * 将记录数组导出为 CSV 格式
 */
export function exportToCSV(records: BusinessRecord[], filename?: string): void {
  if (records.length === 0) {
    throw new Error('没有可导出的记录');
  }

  // CSV 表头
  const headers = ['时间', '内容', '标签', '创建时间'];
  
  // 转换数据行
  const rows = records.map(record => {
    const timestamp = format(new Date(record.timestamp), 'yyyy-MM-dd HH:mm');
    const content = escapeCSVField(record.content);
    const tags = escapeCSVField(record.tags.join(', '));
    const createdAt = format(new Date(record.createdAt), 'yyyy-MM-dd HH:mm');
    
    return [timestamp, content, tags, createdAt];
  });

  // 组装 CSV 内容
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');

  // 添加 BOM 以支持 Excel 正确显示中文
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });

  // 生成文件名
  const defaultFilename = `业务记录_${format(new Date(), 'yyyy-MM-dd')}.csv`;
  const finalFilename = filename || defaultFilename;

  // 触发下载
  downloadBlob(blob, finalFilename);
}

/**
 * 转义 CSV 字段（处理逗号、引号、换行符）
 */
function escapeCSVField(field: string): string {
  if (!field) return '""';
  
  // 如果包含逗号、引号或换行符，需要用引号包裹并转义内部引号
  if (field.includes(',') || field.includes('"') || field.includes('\n')) {
    return `"${field.replace(/"/g, '""')}"`;
  }
  
  return `"${field}"`;
}

/**
 * 下载 Blob 对象
 */
function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * 按日期分组导出多个 CSV 文件
 */
export function exportByDate(records: BusinessRecord[]): void {
  if (records.length === 0) {
    throw new Error('没有可导出的记录');
  }

  // 按日期分组
  const groupedByDate = records.reduce((acc, record) => {
    const date = format(new Date(record.timestamp), 'yyyy-MM-dd');
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(record);
    return acc;
  }, {} as Record<string, BusinessRecord[]>);

  // 为每个日期生成 CSV 文件
  Object.entries(groupedByDate).forEach(([date, dateRecords]) => {
    exportToCSV(dateRecords, `业务记录_${date}.csv`);
  });
}
