import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import type { BusinessRecord, Tag } from '@/types';
import { tagApi } from '@/db/api';
import { toast } from 'sonner';

interface EditDialogProps {
  record: BusinessRecord | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (id: string, content: string, tags: string[], timestamp: Date, keepOriginalTime: boolean) => void;
}

export function EditDialog({ record, open, onOpenChange, onSave }: EditDialogProps) {
  const [content, setContent] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [timestamp, setTimestamp] = useState<Date>(new Date());
  const [keepOriginalTime, setKeepOriginalTime] = useState(false);
  const [allTags, setAllTags] = useState<Tag[]>([]);

  const loadTags = useCallback(async () => {
    const tags = await tagApi.getAll();
    setAllTags(tags);
  }, []);

  useEffect(() => {
    if (record && open) {
      setContent(record.content);
      setSelectedTags(record.tags);
      setTimestamp(new Date(record.timestamp));
      setKeepOriginalTime(false);
      loadTags();
    }
  }, [record, open, loadTags]);

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

  const handleSave = () => {
    const trimmedContent = content.trim();
    if (!trimmedContent) {
      toast.error('记录内容不能为空');
      return;
    }

    if (!record) return;

    onSave(record.id, trimmedContent, selectedTags, timestamp, keepOriginalTime);
    onOpenChange(false);
    toast.success('记录已更新');
  };

  if (!record) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>编辑记录</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* 时间戳选择 */}
          <div className="space-y-2">
            <Label>记录时间</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start gap-2">
                  <CalendarIcon className="h-4 w-4" />
                  {format(timestamp, 'yyyy-MM-dd HH:mm', { locale: zhCN })}
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
                    className="mt-1"
                  />
                </div>
              </PopoverContent>
            </Popover>
            
            {/* 保留原始时间选项 */}
            <div className="flex items-center gap-2">
              <Checkbox
                id="keep-original"
                checked={keepOriginalTime}
                onCheckedChange={(checked) => setKeepOriginalTime(checked === true)}
              />
              <Label
                htmlFor="keep-original"
                className="text-sm text-muted-foreground cursor-pointer"
              >
                保留原始记录时间
              </Label>
            </div>
          </div>

          {/* 内容编辑 */}
          <div className="space-y-2">
            <Label>记录内容</Label>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-[120px]"
              placeholder="输入记录内容..."
            />
          </div>

          {/* 标签选择 */}
          <div className="space-y-2">
            <Label>标签（最多2个）</Label>
            <div className="flex flex-wrap gap-2">
              {allTags.map((tag) => (
                <Badge
                  key={tag.id}
                  variant={selectedTags.includes(tag.name) ? 'default' : 'outline'}
                  className="cursor-pointer hover:bg-primary/90"
                  onClick={() => toggleTag(tag.name)}
                >
                  {tag.name}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button onClick={handleSave}>
            保存
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
