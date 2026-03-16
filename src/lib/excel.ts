import * as XLSX from 'xlsx';
import type { BusinessRecord } from '@/types';
import { format } from 'date-fns';

export function exportToExcel(records: BusinessRecord[], filename?: string) {
  if (records.length === 0) {
    throw new Error('没有可导出的记录');
  }

  const data = records.map(record => ({
    '时间': format(new Date(record.timestamp), 'yyyy-MM-dd HH:mm'),
    '内容': record.content,
    '标签': record.tags.join(', '),
    '客户': record.structured?.customers?.join(', ') || '',
    '公司': record.structured?.companies?.join(', ') || '',
    '船公司': record.structured?.shippingCompanies?.join(', ') || '',
    '国家/地区': record.structured?.countries?.join(', ') || '',
    '产品型号': record.structured?.products?.join(', ') || '',
    '工作流程': record.structured?.workflows?.join(', ') || '',
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, '工作记录');

  ws['!cols'] = [
    { wch: 16 },
    { wch: 50 },
    { wch: 20 },
    { wch: 20 },
    { wch: 24 },
    { wch: 16 },
    { wch: 15 },
    { wch: 20 },
    { wch: 20 },
  ];

  const defaultFilename = `工作记录_${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
  const finalFilename = filename || defaultFilename;

  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = finalFilename;

  if (navigator.userAgent.match(/iPhone|iPad|iPod/i)) {
    link.target = '_blank';
  }

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 100);
}

export async function importFromExcel(file: File): Promise<Partial<BusinessRecord>[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        const records: Partial<BusinessRecord>[] = jsonData.map((row: any) => {
          let timestamp = new Date();
          if (row['时间']) {
            const parsedDate = new Date(row['时间']);
            if (!isNaN(parsedDate.getTime())) {
              timestamp = parsedDate;
            }
          }

          const tags = row['标签'] ? String(row['标签']).split(',').map((t: string) => t.trim()).filter(Boolean) : [];
          const structured: any = {};

          if (row['客户']) {
            structured.customers = String(row['客户']).split(',').map((s: string) => s.trim()).filter(Boolean);
          }
          if (row['公司']) {
            structured.companies = String(row['公司']).split(',').map((s: string) => s.trim()).filter(Boolean);
          }
          if (row['船公司']) {
            structured.shippingCompanies = String(row['船公司']).split(',').map((s: string) => s.trim()).filter(Boolean);
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

        resolve(records.filter(record => record.content));
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
