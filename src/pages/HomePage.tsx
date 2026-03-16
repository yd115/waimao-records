import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { QuickInput } from '@/components/QuickInput';
import { FilterBar } from '@/components/FilterBar';
import { RecordList } from '@/components/RecordList';
import { EditDialog } from '@/components/EditDialog';
import { TagManager } from '@/components/TagManager';
import { TodayCustomers } from '@/components/TodayCustomers';
import { Download, Upload, Info, Calculator, LogOut } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { BusinessRecord } from '@/types';
import { recordApi, tagApi } from '@/db/api';
import { useAuth } from '@/contexts/AuthContext';
import { exportToExcel, importFromExcel } from '@/lib/excel';
import { analyzeContent } from '@/lib/analyzer';
import { toast } from 'sonner';

export default function HomePage() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [records, setRecords] = useState<BusinessRecord[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<BusinessRecord[]>([]);
  const [availablePorts, setAvailablePorts] = useState<string[]>([]);
  const [editingRecord, setEditingRecord] = useState<BusinessRecord | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);

  const loadRecords = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const allRecords = await recordApi.getAll();
      setRecords(allRecords);
      setFilteredRecords(allRecords);
      setAvailablePorts(Array.from(new Set(allRecords.flatMap(record => record.structured?.ports || []))).sort());

      await tagApi.initializeDefaults(user.id);
    } catch (error) {
      toast.error('加载记录失败');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadRecords();
  }, [loadRecords]);

  const handleAddRecord = async (content: string, tags: string[], timestamp: Date) => {
    if (!user) return;

    const newRecordData = {
      timestamp: timestamp.toISOString(),
      content,
      tags,
      structured: analyzeContent(content),
    };

    const result = await recordApi.create(newRecordData, user.id);
    if (result) {
      loadRecords();
    } else {
      toast.error('保存记录失败');
    }
  };

  const handleUpdateRecord = async (
    id: string,
    content: string,
    tags: string[],
    timestamp: Date,
    _keepOriginalTime: boolean
  ) => {
    if (!user) return;

    const updatedData: Partial<BusinessRecord> = {
      content,
      tags,
      timestamp: timestamp.toISOString(),
      structured: analyzeContent(content),
    };

    const result = await recordApi.update(id, updatedData);
    if (result) {
      loadRecords();
    } else {
      toast.error('更新记录失败');
    }
  };

  const handleDeleteRecord = async (id: string) => {
    const success = await recordApi.delete(id);
    if (success) {
      loadRecords();
      toast.success('记录已删除');
    } else {
      toast.error('删除记录失败');
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
    toast.success('已注销');
  };

  const handleFilterChange = useCallback((tags: string[], keyword: string, date?: Date, port?: string) => {
    let filtered = [...records];

    if (date) {
      const targetDate = new Date(date);
      targetDate.setHours(0, 0, 0, 0);

      filtered = filtered.filter(record => {
        const recordDate = new Date(record.timestamp);
        recordDate.setHours(0, 0, 0, 0);
        return recordDate.getTime() === targetDate.getTime();
      });
    }

    if (tags.length > 0) {
      filtered = filtered.filter(record => tags.some(tag => record.tags.includes(tag)));
    }

    if (keyword.trim()) {
      const lowerKeyword = keyword.toLowerCase();
      filtered = filtered.filter(record => record.content.toLowerCase().includes(lowerKeyword));
    }

    if (port?.trim()) {
      const upperPort = port.trim().toUpperCase();
      filtered = filtered.filter(record =>
        (record.structured?.ports || []).some(item => item.toUpperCase().includes(upperPort))
      );
    }

    setFilteredRecords(filtered);
  }, [records]);

  const handleEditRecord = (record: BusinessRecord) => {
    setEditingRecord(record);
    setIsEditDialogOpen(true);
  };

  const handleExport = () => {
    try {
      if (records.length === 0) {
        toast.error('没有可导出的记录');
        return;
      }
      exportToExcel(records);
      toast.success('导出成功');
    } catch (error) {
      toast.error('导出失败');
      console.error(error);
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      toast.error('请选择 Excel 文件（.xlsx 或 .xls）');
      return;
    }

    setImporting(true);
    try {
      const importedRecords = await importFromExcel(file);

      if (importedRecords.length === 0) {
        toast.error('文件中没有有效的记录');
        return;
      }

      let successCount = 0;
      for (const record of importedRecords) {
        if (user && record.content) {
          const result = await recordApi.create(
            {
              content: record.content,
              tags: record.tags || [],
              timestamp: record.timestamp || new Date().toISOString(),
              structured: record.structured || analyzeContent(record.content),
            },
            user.id
          );
          if (result) successCount++;
        }
      }

      loadRecords();
      toast.success(`成功导入 ${successCount} 条记录`);
    } catch (error) {
      toast.error('导入失败：' + (error as Error).message);
      console.error(error);
    } finally {
      setImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-full mx-auto py-4 px-3 space-y-4">
        <div className="space-y-3">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-xl font-bold text-foreground">外贸工作记录</h1>
              <p className="text-sm text-muted-foreground mt-1">快速记录和查找工作信息</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="text-right hidden sm:block mr-2">
                <p className="text-xs font-medium">{user?.email?.split('@')[0]}</p>
                <p className="text-[10px] text-muted-foreground uppercase">在线</p>
              </div>
              <Button variant="ghost" size="icon" onClick={handleSignOut} title="注销">
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" asChild className="flex-shrink-0">
              <Link to="/quote-generator" className="gap-2">
                <Calculator className="h-4 w-4" />
                <span className="text-sm">报价生成器</span>
              </Link>
            </Button>
            <TagManager />
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              className="gap-2 flex-shrink-0"
              disabled={records.length === 0}
            >
              <Download className="h-4 w-4" />
              <span className="text-sm">导出</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleImportClick}
              className="gap-2 flex-shrink-0"
              disabled={importing}
            >
              <Upload className="h-4 w-4" />
              <span className="text-sm">{importing ? '导入中...' : '导入'}</span>
            </Button>

            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>
        </div>

        <Separator />

        <TodayCustomers records={records} />

        <Alert className="text-sm">
          <Info className="h-4 w-4 flex-shrink-0" />
          <AlertDescription className="text-xs leading-relaxed">
            <div className="space-y-1">
              <div><strong>智能分析：</strong>自动识别客户、港口、国家、产品和流程关键词</div>
              <div><strong>隐私安全：</strong>数据永久存储在 Supabase 数据库中，受加密保护</div>
            </div>
          </AlertDescription>
        </Alert>

        <div className="space-y-3">
          <h2 className="text-base font-semibold text-foreground">快速记录</h2>
          <QuickInput onSubmit={handleAddRecord} />
          <p className="text-xs text-muted-foreground">提示：使用 Ctrl+Enter 快速保存</p>

          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <span className="px-1.5 py-0.5 rounded text-xs bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">客户</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="px-1.5 py-0.5 rounded text-xs bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300">公司</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="px-1.5 py-0.5 rounded text-xs bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300">港口</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="px-1.5 py-0.5 rounded text-xs bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">国家</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="px-1.5 py-0.5 rounded text-xs bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300">产品</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="px-1.5 py-0.5 rounded text-xs bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300">流程</span>
            </div>
          </div>
        </div>

        <Separator />

        <div className="space-y-3">
          <h2 className="text-base font-semibold text-foreground">
            记录列表
            <span className="text-xs font-normal text-muted-foreground ml-2">
              共 {records.length} 条，显示 {filteredRecords.length} 条
            </span>
          </h2>
          <FilterBar onFilterChange={handleFilterChange} availablePorts={availablePorts} />
        </div>

        <RecordList records={filteredRecords} onEdit={handleEditRecord} onDelete={handleDeleteRecord} />

        <EditDialog
          record={editingRecord}
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          onSave={handleUpdateRecord}
        />

        <div className="text-center text-sm text-muted-foreground pt-8 pb-4">
          <p>© 2026 外贸工作记录</p>
          <p className="mt-1">数据存储位置：Supabase 数据库</p>
        </div>
      </div>
    </div>
  );
}