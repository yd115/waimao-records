import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { QuickInput } from '@/components/QuickInput';
import { FilterBar } from '@/components/FilterBar';
import { RecordList } from '@/components/RecordList';
import { EditDialog } from '@/components/EditDialog';
import { TagManager } from '@/components/TagManager';
import { TodayCustomers } from '@/components/TodayCustomers';
import { Download, FileText, Info, Calculator, LogOut, User } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { BusinessRecord } from '@/types';
import { recordApi, tagApi } from '@/db/api';
import { useAuth } from '@/contexts/AuthContext';
import { exportToCSV, exportByDate } from '@/lib/csv';
import { analyzeContent } from '@/lib/analyzer';
import { toast } from 'sonner';

export default function HomePage() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [records, setRecords] = useState<BusinessRecord[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<BusinessRecord[]>([]);
  const [editingRecord, setEditingRecord] = useState<BusinessRecord | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // 加载记录
  const loadRecords = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const allRecords = await recordApi.getAll();
      setRecords(allRecords);
      setFilteredRecords(allRecords);
      
      // 检查是否需要初始化默认标签
      const tags = await tagApi.getAll();
      if (tags.length === 0) {
        await tagApi.initializeDefaults(user.id);
      }
    } catch (error) {
      toast.error('加载记录失败');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadRecords();
  }, [loadRecords]);

  // 添加新记录
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

  // 更新记录
  const handleUpdateRecord = async (
    id: string,
    content: string,
    tags: string[],
    timestamp: Date,
    keepOriginalTime: boolean
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

  // 删除记录
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

  // 筛选记录
  const handleFilterChange = useCallback((tags: string[], keyword: string, date?: Date) => {
    let filtered = [...records];

    // 日期筛选
    if (date) {
      const targetDate = new Date(date);
      targetDate.setHours(0, 0, 0, 0);
      
      filtered = filtered.filter(record => {
        const recordDate = new Date(record.timestamp);
        recordDate.setHours(0, 0, 0, 0);
        return recordDate.getTime() === targetDate.getTime();
      });
    }

    // 标签筛选
    if (tags.length > 0) {
      filtered = filtered.filter(record =>
        tags.some(tag => record.tags.includes(tag))
      );
    }

    // 关键词搜索
    if (keyword.trim()) {
      const lowerKeyword = keyword.toLowerCase();
      filtered = filtered.filter(record =>
        record.content.toLowerCase().includes(lowerKeyword)
      );
    }

    setFilteredRecords(filtered);
  }, [records]);

  // 编辑记录
  const handleEditRecord = (record: BusinessRecord) => {
    setEditingRecord(record);
    setIsEditDialogOpen(true);
  };

  // 导出 CSV
  const handleExportCSV = () => {
    try {
      if (filteredRecords.length === 0) {
        toast.error('没有可导出的记录');
        return;
      }
      exportToCSV(filteredRecords);
      toast.success('导出成功');
    } catch (error) {
      toast.error('导出失败');
      console.error(error);
    }
  };

  // 按日期导出
  const handleExportByDate = () => {
    try {
      if (records.length === 0) {
        toast.error('没有可导出的记录');
        return;
      }
      exportByDate(records);
      toast.success('按日期导出成功');
    } catch (error) {
      toast.error('导出失败');
      console.error(error);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-full mx-auto py-4 px-3 space-y-4">
        {/* 页头 - 移动端优化 */}
        <div className="space-y-3">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-xl font-bold text-foreground">
                外贸工作记录
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                快速记录和查找工作信息
              </p>
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
          
          {/* 操作按钮 - 移动端横向滚动 */}
          <div className="flex gap-2 overflow-x-auto pb-2 -mx-3 px-3">
            <Button variant="outline" size="sm" asChild className="flex-shrink-0">
              <Link to="/quote-generator" className="gap-2">
                <Calculator className="h-4 w-4" />
                <span className="text-sm">报价生成器</span>
              </Link>
            </Button>
            <TagManager />
            <Button variant="outline" size="sm" onClick={handleExportCSV} className="gap-2 flex-shrink-0">
              <Download className="h-4 w-4" />
              <span className="text-sm">导出当前</span>
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportByDate} className="gap-2 flex-shrink-0">
              <FileText className="h-4 w-4" />
              <span className="text-sm">按日期导出</span>
            </Button>
          </div>
        </div>

        <Separator />

        {/* 今日联系客户 */}
        <TodayCustomers records={records} />

        {/* 隐私承诺提示 - 移动端优化 */}
        <Alert className="text-sm">
          <Info className="h-4 w-4 flex-shrink-0" />
          <AlertDescription className="text-xs leading-relaxed">
            <div className="space-y-1">
              <div><strong>智能分析：</strong>自动识别客户、国家、产品和流程关键词</div>
              <div><strong>隐私安全：</strong>数据永久存储在 Supabase 数据库中，受加密保护</div>
            </div>
          </AlertDescription>
        </Alert>

        {/* 快速记录区 - 移动端优化 */}
        <div className="space-y-3">
          <h2 className="text-base font-semibold text-foreground">快速记录</h2>
          <QuickInput onSubmit={handleAddRecord} />
          <p className="text-xs text-muted-foreground">
            💡 提示：使用 Ctrl+Enter 快速保存
          </p>
          
          {/* 智能分析图例 - 移动端优化 */}
          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <span className="px-1.5 py-0.5 rounded text-xs bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">客户</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="px-1.5 py-0.5 rounded text-xs bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300">公司</span>
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

        {/* 筛选和搜索 - 移动端优化 */}
        <div className="space-y-3">
          <h2 className="text-base font-semibold text-foreground">
            记录列表
            <span className="text-xs font-normal text-muted-foreground ml-2">
              共 {records.length} 条，显示 {filteredRecords.length} 条
            </span>
          </h2>
          <FilterBar onFilterChange={handleFilterChange} />
        </div>

        {/* 记录列表 */}
        <RecordList
          records={filteredRecords}
          onEdit={handleEditRecord}
          onDelete={handleDeleteRecord}
        />

        {/* 编辑对话框 */}
        <EditDialog
          record={editingRecord}
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          onSave={handleUpdateRecord}
        />

        {/* 页脚信息 */}
        <div className="text-center text-sm text-muted-foreground pt-8 pb-4">
          <p>© 2026 外贸工作记录</p>
          <p className="mt-1">数据存储位置：Supabase 数据库</p>
        </div>
      </div>
    </div>
  );
}
