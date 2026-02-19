import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Settings, Plus, Trash2 } from 'lucide-react';
import type { Tag } from '@/types';
import { tagStorage } from '@/lib/storage';
import { toast } from 'sonner';

export function TagManager() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [newTagName, setNewTagName] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadTags();
    }
  }, [isOpen]);

  const loadTags = () => {
    const allTags = tagStorage.getAll();
    setTags(allTags);
  };

  const handleAddTag = () => {
    const trimmedName = newTagName.trim();
    if (!trimmedName) {
      toast.error('标签名称不能为空');
      return;
    }

    if (tags.some(t => t.name === trimmedName)) {
      toast.error('标签已存在');
      return;
    }

    const newTag: Tag = {
      id: `tag-${Date.now()}`,
      name: trimmedName,
    };

    tagStorage.add(newTag);
    loadTags();
    setNewTagName('');
    toast.success('标签已添加');
  };

  const handleDeleteTag = (id: string, name: string) => {
    if (window.confirm(`确定要删除标签"${name}"吗？`)) {
      tagStorage.delete(id);
      loadTags();
      toast.success('标签已删除');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 h-8 px-2 text-xs flex-shrink-0">
          <Settings className="h-3 w-3" />
          <span className="hidden sm:inline">标签</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg mx-4">
        <DialogHeader>
          <DialogTitle className="text-base">标签管理</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* 添加新标签 - 移动端优化 */}
          <div className="flex gap-2">
            <div className="flex-1">
              <Input
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                placeholder="输入新标签名称"
                className="h-10 text-base"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
              />
            </div>
            <Button onClick={handleAddTag} className="gap-2 h-10 px-4">
              <Plus className="h-4 w-4" />
              添加
            </Button>
          </div>

          {/* 标签列表 - 移动端优化 */}
          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">
              已有标签 ({tags.length})
            </Label>
            <div className="max-h-[50vh] overflow-y-auto space-y-2 border rounded-md p-2">
              {tags.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  暂无标签
                </p>
              ) : (
                tags.map((tag) => (
                  <div
                    key={tag.id}
                    className="flex items-center justify-between p-2 rounded-md hover:bg-accent"
                  >
                    <Badge variant="secondary" className="text-sm">{tag.name}</Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteTag(tag.id, tag.name)}
                      className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
