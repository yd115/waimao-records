import React, { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Users, Download, Globe, Package, Workflow } from 'lucide-react';
import { format, isToday } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import type { BusinessRecord } from '@/types';
import { deduplicateByInclusion } from '@/lib/analyzer';
import { toast } from 'sonner';

interface CustomerInfo {
  name: string;
  contactCount: number;
  lastContactTime: string;
  countries: Set<string>;
  products: Set<string>;
  workflows: Set<string>;
  records: BusinessRecord[];
}

interface TodayCustomersProps {
  records: BusinessRecord[];
}

export function TodayCustomers({ records }: TodayCustomersProps) {
  const [isOpen, setIsOpen] = useState(false);

  // 统计今日联系的客户
  const todayCustomers = useMemo(() => {
    const customerMap = new Map<string, CustomerInfo>();

    // 筛选今天的记录
    const todayRecords = records.filter(record => 
      isToday(new Date(record.timestamp))
    );

    // 提取客户信息
    for (const record of todayRecords) {
      if (!record.structured?.customers) continue;

      for (const customerName of record.structured.customers) {
        if (!customerMap.has(customerName)) {
          customerMap.set(customerName, {
            name: customerName,
            contactCount: 0,
            lastContactTime: record.timestamp,
            countries: new Set(),
            products: new Set(),
            workflows: new Set(),
            records: [],
          });
        }

        const customer = customerMap.get(customerName)!;
        customer.contactCount++;
        customer.records.push(record);

        // 更新最后联系时间
        if (new Date(record.timestamp) > new Date(customer.lastContactTime)) {
          customer.lastContactTime = record.timestamp;
        }

        // 收集相关信息
        if (record.structured.countries) {
          record.structured.countries.forEach(c => customer.countries.add(c));
        }
        if (record.structured.products) {
          record.structured.products.forEach(p => customer.products.add(p));
        }
        if (record.structured.workflows) {
          record.structured.workflows.forEach(w => customer.workflows.add(w));
        }
      }
    }

    // 转换为数组并按联系次数排序
    return Array.from(customerMap.values()).sort((a, b) => b.contactCount - a.contactCount);
  }, [records]);

  // 导出今日客户列表
  const handleExport = () => {
    if (todayCustomers.length === 0) {
      toast.error('今日暂无联系客户');
      return;
    }

    // 生成 CSV 内容
    const headers = ['客户名称', '联系次数', '最后联系时间', '国家/地区', '产品型号', '工作流程'];
    const rows = todayCustomers.map(customer => [
      `"${customer.name}"`,
      customer.contactCount.toString(),
      format(new Date(customer.lastContactTime), 'yyyy-MM-dd HH:mm'),
      `"${deduplicateByInclusion(Array.from(customer.countries)).join(', ')}"`,
      `"${deduplicateByInclusion(Array.from(customer.products)).join(', ')}"`,
      `"${deduplicateByInclusion(Array.from(customer.workflows)).join(', ')}"`,
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    // 添加 BOM 以支持 Excel 正确显示中文
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });

    // 触发下载
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `今日联系客户_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success('导出成功');
  };

  if (todayCustomers.length === 0) {
    return null;
  }

  return (
    <Card className="p-4 bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Users className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">今日联系客户</h3>
            <p className="text-sm text-muted-foreground">
              共联系 <span className="font-medium text-primary">{todayCustomers.length}</span> 位客户
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleExport} className="gap-2">
            <Download className="h-4 w-4" />
            导出列表
          </Button>
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2">
                查看详情
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[80vh]">
              <DialogHeader>
                <DialogTitle>今日联系客户详情</DialogTitle>
              </DialogHeader>

              <ScrollArea className="h-[60vh] pr-4">
                <div className="space-y-4">
                  {todayCustomers.map((customer, index) => (
                    <Card key={customer.name} className="p-4">
                      <div className="space-y-3">
                        {/* 客户名称和统计 */}
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-lg font-semibold text-foreground">
                              {index + 1}. {customer.name}
                            </span>
                            <Badge variant="secondary">
                              联系 {customer.contactCount} 次
                            </Badge>
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {format(new Date(customer.lastContactTime), 'HH:mm', { locale: zhCN })}
                          </span>
                        </div>

                        {/* 相关信息 */}
                        <div className="space-y-2">
                          {customer.countries.size > 0 && (
                            <div className="flex items-start gap-2 text-sm">
                              <Globe className="h-4 w-4 text-green-600 dark:text-green-400 mt-0.5" />
                              <div className="flex-1">
                                <span className="text-muted-foreground">国家/地区：</span>
                                <span className="text-foreground ml-1">
                                  {deduplicateByInclusion(Array.from(customer.countries)).join(', ')}
                                </span>
                              </div>
                            </div>
                          )}

                          {customer.products.size > 0 && (
                            <div className="flex items-start gap-2 text-sm">
                              <Package className="h-4 w-4 text-purple-600 dark:text-purple-400 mt-0.5" />
                              <div className="flex-1">
                                <span className="text-muted-foreground">产品型号：</span>
                                <span className="text-foreground ml-1">
                                  {deduplicateByInclusion(Array.from(customer.products)).join(', ')}
                                </span>
                              </div>
                            </div>
                          )}

                          {customer.workflows.size > 0 && (
                            <div className="flex items-start gap-2 text-sm">
                              <Workflow className="h-4 w-4 text-orange-600 dark:text-orange-400 mt-0.5" />
                              <div className="flex-1">
                                <span className="text-muted-foreground">工作流程：</span>
                                <span className="text-foreground ml-1">
                                  {deduplicateByInclusion(Array.from(customer.workflows)).join(', ')}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* 相关记录 */}
                        <div className="pt-2 border-t">
                          <p className="text-xs text-muted-foreground mb-2">相关记录：</p>
                          <div className="space-y-1">
                            {customer.records.map((record) => (
                              <div key={record.id} className="text-xs text-muted-foreground pl-4 border-l-2 border-muted">
                                <span className="font-medium">
                                  {format(new Date(record.timestamp), 'HH:mm')}
                                </span>
                                {' - '}
                                <span className="line-clamp-1">{record.content}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </Card>
  );
}
