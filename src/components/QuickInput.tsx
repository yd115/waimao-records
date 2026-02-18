import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CalendarIcon, Plus, X } from 'lucide-react';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import type { Tag } from '@/types';
import { tagApi } from '@/db/api';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface QuickInputProps {
  onSubmit: (content: string, tags: string[], timestamp: Date) => void;
}

export function QuickInput({ onSubmit }: QuickInputProps) {
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [timestamp, setTimestamp] = useState<Date>(new Date());
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [newTagName, setNewTagName] = useState('');
  const [isAddingTag, setIsAddingTag] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // 加载标签
  const loadTags = useCallback(async () => {
    const tags = await tagApi.getAll();
    setAllTags(tags);
  }, []);

  useEffect(() => {
    loadTags();
  }, [loadTags]);

  // 切换标签选择
  const toggleTag = (tagName: string) => {
    if (selectedTags.includes(tagName)) {
      setSelectedTags(selectedTags.filter(t => t !== tagName));
    } else {
      if (selectedTags.length >= 2) {
        toast.warning('最多只能选择2个标签');
        return;
      }
      setSelectedTags([...selectedTags, tagName]);
    }
  };

  // 添加新标签
  const handleAddTag = async () => {
    if (!user) return;
    const trimmedName = newTagName.trim();
    if (!trimmedName) {
      toast.error('标签名称不能为空');
      return;
    }

    if (allTags.some(t => t.name === trimmedName)) {
      toast.error('标签已存在');
      return;
    }

    const result = await tagApi.create(trimmedName, user.id);
    if (result) {
      loadTags();
      
      // 自动勾选新创建的标签
      if (selectedTags.length < 2) {
        setSelectedTags([...selectedTags, trimmedName]);
      }
      
      setNewTagName('');
      setIsAddingTag(false);
      toast.success('标签已创建并勾选');
    } else {
      toast.error('创建标签失败');
    }
  };

  // 提交记录
  const handleSubmit = () => {
    const trimmedContent = content.trim();
    if (!trimmedContent) {
      toast.error('请输入记录内容');
      textareaRef.current?.focus();
      return;
    }

    onSubmit(trimmedContent, selectedTags, timestamp);
    
    // 重置表单
    setContent('');
    setSelectedTags([]);
    setTimestamp(new Date());
    textareaRef.current?.focus();
    
    toast.success('记录已保存');
  };

  // 快捷键支持
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="bg-card border border-border rounded-lg p-3 shadow-sm">
      <div className="space-y-3">
        {/* 时间戳选择 - 移动端优化 */}
        <div className="flex items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2 text-sm h-9">
                <CalendarIcon className="h-4 w-4" />
                {format(timestamp, 'MM-dd HH:mm', { locale: zhCN })}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={timestamp}
                onSelect={(date) => date && setTimestamp(date)}
                locale={zhCN}
              />
              <div className="p-3 border-t">
                <Label className="text-xs text-muted-foreground">时间</Label>
                <Input
                  type="time"
                  value={format(timestamp, 'HH:mm')}
                  onChange={(e) => {
                    const [hours, minutes] = e.target.value.split(':');
                    const newDate = new Date(timestamp);
                    newDate.setHours(Number.parseInt(hours), Number.parseInt(minutes));
                    setTimestamp(newDate);
                  }}
                  className="mt-1 h-10"
                />
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* 文本输入框 - 移动端优化 */}
        <Textarea
          ref={textareaRef}
          placeholder="输入业务记录...（Ctrl+Enter 快速保存）"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          className="min-h-[100px] resize-none text-base"
          autoFocus
        />

        {/* 标签选择 - 移动端优化 */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-sm text-muted-foreground">选择标签（最多2个）</Label>
            <Dialog open={isAddingTag} onOpenChange={setIsAddingTag}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 gap-1 text-sm">
                  <Plus className="h-3 w-3" />
                  新建
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md mx-4">
                <DialogHeader>
                  <DialogTitle className="text-base">新建标签</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm">标签名称</Label>
                    <Input
                      value={newTagName}
                      onChange={(e) => setNewTagName(e.target.value)}
                      placeholder="输入标签名称"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddTag();
                        }
                      }}
                      className="h-10 text-base"
                      autoFocus
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setIsAddingTag(false)} className="h-10">
                      取消
                    </Button>
                    <Button onClick={handleAddTag} className="h-10">
                      创建
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {allTags.map((tag) => (
              <Badge
                key={tag.id}
                variant={selectedTags.includes(tag.name) ? 'default' : 'outline'}
                className="cursor-pointer hover:bg-primary/90 text-sm py-1 px-3"
                onClick={() => toggleTag(tag.name)}
              >
                {tag.name}
              </Badge>
            ))}
          </div>
        </div>

        {/* 提交按钮 - 移动端优化 */}
        <div className="flex justify-end">
          <Button onClick={handleSubmit} className="gap-2 h-10 px-6 text-base">
            保存记录
          </Button>
        </div>
      </div>
    </div>
  );
}
