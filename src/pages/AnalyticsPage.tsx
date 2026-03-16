import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  BarChart3,
  CalendarDays,
  Download,
  MapPin,
  RefreshCw,
  Ship,
  User,
} from 'lucide-react';
import { endOfWeek, format, isSameMonth, isThisWeek, isToday, startOfWeek } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { recordApi } from '@/db/api';
import type { BusinessRecord } from '@/types';
import { deduplicateByInclusion } from '@/lib/analyzer';
import PageMeta from '@/components/common/PageMeta';
import { toast } from 'sonner';

interface GroupSummary {
  name: string;
  count: number;
  latestTimestamp: string;
}

interface CustomerDetailSummary extends GroupSummary {
  records: BusinessRecord[];
}

function buildGroupedSummary(records: BusinessRecord[], selector: (record: BusinessRecord) => string[] | undefined): GroupSummary[] {
  const counter = new Map<string, GroupSummary>();

  for (const record of records) {
    const values = deduplicateByInclusion(selector(record) || []);
    for (const rawValue of values) {
      const value = rawValue.trim();
      if (!value) continue;

      const existing = counter.get(value);
      if (!existing) {
        counter.set(value, {
          name: value,
          count: 1,
          latestTimestamp: record.timestamp,
        });
        continue;
      }

      existing.count += 1;
      if (new Date(record.timestamp) > new Date(existing.latestTimestamp)) {
        existing.latestTimestamp = record.timestamp;
      }
    }
  }

  return Array.from(counter.values()).sort((a, b) => {
    if (b.count !== a.count) return b.count - a.count;
    return new Date(b.latestTimestamp).getTime() - new Date(a.latestTimestamp).getTime();
  });
}

function buildCustomerDetailSummary(records: BusinessRecord[]): CustomerDetailSummary[] {
  const counter = new Map<string, CustomerDetailSummary>();

  for (const record of records) {
    const values = deduplicateByInclusion(record.structured?.customers || []);
    for (const rawValue of values) {
      const value = rawValue.trim();
      if (!value) continue;

      const existing = counter.get(value);
      if (!existing) {
        counter.set(value, {
          name: value,
          count: 1,
          latestTimestamp: record.timestamp,
          records: [record],
        });
        continue;
      }

      existing.count += 1;
      existing.records.push(record);
      if (new Date(record.timestamp) > new Date(existing.latestTimestamp)) {
        existing.latestTimestamp = record.timestamp;
      }
    }
  }

  return Array.from(counter.values()).sort((a, b) => {
    if (b.count !== a.count) return b.count - a.count;
    return new Date(b.latestTimestamp).getTime() - new Date(a.latestTimestamp).getTime();
  });
}

function buildTimeSummary(records: BusinessRecord[], formatter: (date: Date) => string) {
  const counter = new Map<string, number>();

  for (const record of records) {
    const key = formatter(new Date(record.timestamp));
    counter.set(key, (counter.get(key) || 0) + 1);
  }

  return Array.from(counter.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.name.localeCompare(a.name));
}

function exportGroupedSummary(filename: string, headers: string[], rows: string[][]) {
  const csvContent = ['\uFEFF' + headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function SummarySection({
  title,
  description,
  icon,
  items,
  emptyText,
  exportName,
  onViewDetail,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  items: GroupSummary[];
  emptyText: string;
  exportName: string;
  onViewDetail?: (name: string) => void;
}) {
  const handleExport = () => {
    if (items.length === 0) {
      toast.error('当前没有可导出的统计数据');
      return;
    }

    exportGroupedSummary(
      `${exportName}_${format(new Date(), 'yyyy-MM-dd')}.csv`,
      ['名称', '记录数', '最近记录时间'],
      items.map((item) => [
        `"${item.name}"`,
        item.count.toString(),
        format(new Date(item.latestTimestamp), 'yyyy-MM-dd HH:mm'),
      ])
    );
    toast.success('统计导出成功');
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              {icon}
              {title}
            </CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={handleExport} className="gap-2">
            <Download className="h-4 w-4" />
            导出
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">{emptyText}</p>
        ) : (
          items.slice(0, 12).map((item, index) => (
            <div key={item.name} className="flex items-start justify-between gap-3 rounded-lg border p-3">
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="min-w-8 justify-center">
                    {index + 1}
                  </Badge>
                  <p className="truncate text-sm font-medium text-foreground">{item.name}</p>
                </div>
                <p className="text-xs text-muted-foreground">
                  最近记录：{format(new Date(item.latestTimestamp), 'yyyy-MM-dd HH:mm', { locale: zhCN })}
                </p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <Badge>{item.count} 条</Badge>
                {onViewDetail && (
                  <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => onViewDetail(item.name)}>
                    查看记录
                  </Button>
                )}
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

export default function AnalyticsPage() {
  const [records, setRecords] = useState<BusinessRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [customerKeyword, setCustomerKeyword] = useState('');
  const [portKeyword, setPortKeyword] = useState('');
  const [shippingKeyword, setShippingKeyword] = useState('');
  const [monthFilter, setMonthFilter] = useState('');
  const [activeCustomer, setActiveCustomer] = useState<CustomerDetailSummary | null>(null);

  useEffect(() => {
    const loadRecords = async () => {
      setLoading(true);
      try {
        const data = await recordApi.getAll();
        setRecords(data);
      } catch (error) {
        toast.error('加载统计数据失败');
      } finally {
        setLoading(false);
      }
    };

    loadRecords();
  }, []);

  const filteredRecords = useMemo(() => {
    return records.filter((record) => {
      const monthMatched = monthFilter
        ? format(new Date(record.timestamp), 'yyyy-MM') === monthFilter
        : true;

      const customerMatched = customerKeyword.trim()
        ? (record.structured?.customers || []).some((item) => item.toLowerCase().includes(customerKeyword.trim().toLowerCase()))
        : true;

      const portMatched = portKeyword.trim()
        ? (record.structured?.ports || []).some((item) => item.toLowerCase().includes(portKeyword.trim().toLowerCase()))
        : true;

      const shippingMatched = shippingKeyword.trim()
        ? (record.structured?.shippingCompanies || []).some((item) => item.toLowerCase().includes(shippingKeyword.trim().toLowerCase()))
        : true;

      return monthMatched && customerMatched && portMatched && shippingMatched;
    });
  }, [records, monthFilter, customerKeyword, portKeyword, shippingKeyword]);

  const customerDetails = useMemo(() => buildCustomerDetailSummary(filteredRecords), [filteredRecords]);
  const customerSummary = useMemo(() => customerDetails.map(({ records: _records, ...rest }) => rest), [customerDetails]);
  const portSummary = useMemo(
    () => buildGroupedSummary(filteredRecords, (record) => record.structured?.ports),
    [filteredRecords]
  );
  const shippingSummary = useMemo(
    () => buildGroupedSummary(filteredRecords, (record) => record.structured?.shippingCompanies),
    [filteredRecords]
  );
  const daySummary = useMemo(
    () => buildTimeSummary(filteredRecords, (date) => format(date, 'yyyy-MM-dd')),
    [filteredRecords]
  );
  const monthSummary = useMemo(
    () => buildTimeSummary(filteredRecords, (date) => format(date, 'yyyy-MM')),
    [filteredRecords]
  );

  const todayCount = useMemo(
    () => filteredRecords.filter((record) => isToday(new Date(record.timestamp))).length,
    [filteredRecords]
  );
  const weekCount = useMemo(
    () => filteredRecords.filter((record) => isThisWeek(new Date(record.timestamp), { weekStartsOn: 1 })).length,
    [filteredRecords]
  );
  const monthCount = useMemo(
    () => filteredRecords.filter((record) => isSameMonth(new Date(record.timestamp), new Date())).length,
    [filteredRecords]
  );

  const totalCustomers = customerSummary.length;
  const totalPorts = portSummary.length;
  const totalShippingCompanies = shippingSummary.length;

  const resetFilters = () => {
    setCustomerKeyword('');
    setPortKeyword('');
    setShippingKeyword('');
    setMonthFilter('');
  };

  const openCustomerDetail = (name: string) => {
    const detail = customerDetails.find((item) => item.name === name) || null;
    setActiveCustomer(detail);
  };

  const exportTimeSummary = () => {
    if (daySummary.length === 0 && monthSummary.length === 0) {
      toast.error('当前没有可导出的时间统计');
      return;
    }

    exportGroupedSummary(
      `时间统计_${format(new Date(), 'yyyy-MM-dd')}.csv`,
      ['类型', '时间', '记录数'],
      [
        ...monthSummary.map((item) => ['按月', `"${item.name}"`, item.count.toString()]),
        ...daySummary.map((item) => ['按天', `"${item.name}"`, item.count.toString()]),
      ]
    );
    toast.success('时间统计导出成功');
  };

  return (
    <>
      <PageMeta title="筛选统计 | 外贸工作记录" description="按客户、港口、船公司和时间汇总外贸工作记录" />
      <div className="container mx-auto max-w-6xl p-4 md:p-6 space-y-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" asChild className="h-9 px-2">
                <Link to="/" className="gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  返回
                </Link>
              </Button>
            </div>
            <h1 className="text-2xl font-bold text-foreground">筛选统计</h1>
            <p className="text-sm text-muted-foreground">按客户、港口、船公司和时间汇总记录，快速查看业务分布。</p>
          </div>
          <Button variant="outline" onClick={resetFilters} className="gap-2 self-start">
            <RefreshCw className="h-4 w-4" />
            清空筛选
          </Button>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">筛选条件</CardTitle>
            <CardDescription>支持按客户、港口、船公司和月份查看汇总结果。</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <Input placeholder="按客户筛选" value={customerKeyword} onChange={(e) => setCustomerKeyword(e.target.value)} />
            <Input placeholder="按港口筛选" value={portKeyword} onChange={(e) => setPortKeyword(e.target.value)} />
            <Input placeholder="按船公司筛选" value={shippingKeyword} onChange={(e) => setShippingKeyword(e.target.value)} />
            <Input type="month" value={monthFilter} onChange={(e) => setMonthFilter(e.target.value)} />
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>筛选后记录</CardDescription>
              <CardTitle className="text-2xl">{filteredRecords.length}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>客户数量</CardDescription>
              <CardTitle className="text-2xl">{totalCustomers}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>港口数量</CardDescription>
              <CardTitle className="text-2xl">{totalPorts}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>船公司数量</CardDescription>
              <CardTitle className="text-2xl">{totalShippingCompanies}</CardTitle>
            </CardHeader>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>今天新增记录</CardDescription>
              <CardTitle className="text-2xl">{todayCount}</CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground">
              统计今天的记录数量，适合快速看当日工作量。
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>本周记录</CardDescription>
              <CardTitle className="text-2xl">{weekCount}</CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground">
              统计本周一到今天的记录数量。
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>本月记录</CardDescription>
              <CardTitle className="text-2xl">{monthCount}</CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground">
              统计当前月份的全部记录数量。
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 xl:grid-cols-2">
          <SummarySection
            title="按客户汇总"
            description="查看客户联系频次和最近跟进时间"
            icon={<User className="h-4 w-4 text-blue-600" />}
            items={customerSummary}
            emptyText="当前筛选条件下暂无客户数据"
            exportName="客户统计"
            onViewDetail={openCustomerDetail}
          />
          <SummarySection
            title="按港口汇总"
            description="查看不同港口的记录分布"
            icon={<MapPin className="h-4 w-4 text-emerald-600" />}
            items={portSummary}
            emptyText="当前筛选条件下暂无港口数据"
            exportName="港口统计"
          />
          <SummarySection
            title="按船公司汇总"
            description="查看各船公司的出现频次"
            icon={<Ship className="h-4 w-4 text-sky-600" />}
            items={shippingSummary}
            emptyText="当前筛选条件下暂无船公司数据"
            exportName="船公司统计"
          />
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <CalendarDays className="h-4 w-4 text-orange-600" />
                    按时间汇总
                  </CardTitle>
                  <CardDescription>查看按月和按天的记录数量变化。</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={exportTimeSummary} className="gap-2">
                  <Download className="h-4 w-4" />
                  导出
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm font-medium text-foreground">按月</p>
                {monthSummary.length === 0 ? (
                  <p className="text-sm text-muted-foreground">当前筛选条件下暂无月份数据</p>
                ) : (
                  monthSummary.slice(0, 6).map((item) => (
                    <div key={item.name} className="flex items-center justify-between rounded-lg border p-3">
                      <span className="text-sm text-foreground">{item.name}</span>
                      <Badge>{item.count} 条</Badge>
                    </div>
                  ))
                )}
              </div>
              <Separator />
              <div className="space-y-2">
                <p className="text-sm font-medium text-foreground">按天</p>
                {daySummary.length === 0 ? (
                  <p className="text-sm text-muted-foreground">当前筛选条件下暂无日期数据</p>
                ) : (
                  daySummary.slice(0, 10).map((item) => (
                    <div key={item.name} className="flex items-center justify-between rounded-lg border p-3">
                      <span className="text-sm text-foreground">{item.name}</span>
                      <Badge variant="secondary">{item.count} 条</Badge>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="border-dashed">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <BarChart3 className="h-4 w-4 text-primary" />
              使用建议
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>先按月份筛，再按港口或船公司筛，会更容易看出某段时间的业务重点。</p>
            <p>客户榜单支持点击“查看记录”，可以快速回看该客户最近跟进内容。</p>
            <p>统计榜单和时间汇总都支持导出，方便你留档或做阶段总结。</p>
          </CardContent>
        </Card>

        <Dialog open={!!activeCustomer} onOpenChange={(open) => !open && setActiveCustomer(null)}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>{activeCustomer?.name || '客户详情'}</DialogTitle>
              <DialogDescription>
                {activeCustomer
                  ? `共 ${activeCustomer.count} 条记录，最近更新时间 ${format(new Date(activeCustomer.latestTimestamp), 'yyyy-MM-dd HH:mm', { locale: zhCN })}`
                  : '查看该客户最近记录'}
              </DialogDescription>
            </DialogHeader>
            {activeCustomer && (
              <ScrollArea className="h-[60vh] pr-4">
                <div className="space-y-3">
                  {activeCustomer.records
                    .slice()
                    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                    .map((record) => (
                      <Card key={record.id}>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium">
                            {format(new Date(record.timestamp), 'yyyy-MM-dd HH:mm', { locale: zhCN })}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2 text-sm">
                          <p className="whitespace-pre-wrap break-words text-foreground">{record.content}</p>
                          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                            {(record.structured?.ports || []).length > 0 && (
                              <Badge variant="secondary">港口: {deduplicateByInclusion(record.structured?.ports || []).join(', ')}</Badge>
                            )}
                            {(record.structured?.shippingCompanies || []).length > 0 && (
                              <Badge variant="secondary">船公司: {deduplicateByInclusion(record.structured?.shippingCompanies || []).join(', ')}</Badge>
                            )}
                            {(record.structured?.products || []).length > 0 && (
                              <Badge variant="secondary">产品: {deduplicateByInclusion(record.structured?.products || []).join(', ')}</Badge>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                </div>
              </ScrollArea>
            )}
          </DialogContent>
        </Dialog>

        {loading && <p className="text-sm text-muted-foreground">正在加载统计数据...</p>}
        {!loading && filteredRecords.length > 0 && (
          <p className="text-xs text-muted-foreground">
            本周统计区间：{format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd')} - {format(endOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd')}
          </p>
        )}
      </div>
    </>
  );
}