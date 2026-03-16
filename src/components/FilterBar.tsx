import React, { useState, useEffect, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Search, Filter, X, CalendarIcon, MapPin } from 'lucide-react';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import type { Tag } from '@/types';
import { tagApi } from '@/db/api';

interface FilterBarProps {
  onFilterChange: (tags: string[], keyword: string, date?: Date, port?: string) => void;
  availablePorts?: string[];
}

export function FilterBar({ onFilterChange, availablePorts = [] }: FilterBarProps) {
  const [keyword, setKeyword] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedPort, setSelectedPort] = useState('');
  const [allTags, setAllTags] = useState<Tag[]>([]);

  const loadTags = useCallback(async () => {
    const tags = await tagApi.getAll();
    setAllTags(tags);
  }, []);

  useEffect(() => {
    onFilterChange(selectedTags, keyword, selectedDate, selectedPort);
  }, [selectedTags, keyword, selectedDate, selectedPort, onFilterChange]);

  useEffect(() => {
    loadTags();
  }, [loadTags]);

  const toggleTag = (tagName: string) => {
    if (selectedTags.includes(tagName)) {
      setSelectedTags(selectedTags.filter(t => t !== tagName));
    } else {
      setSelectedTags([...selectedTags, tagName]);
    }
  };

  const clearFilters = () => {
    setKeyword('');
    setSelectedTags([]);
    setSelectedDate(undefined);
    setSelectedPort('');
  };

  const hasActiveFilters = keyword.length > 0 || selectedTags.length > 0 || selectedDate !== undefined || selectedPort.length > 0;

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="搜索记录内容..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            className="pl-9 h-10 text-base"
          />
        </div>

        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="按港口筛选，如 PENANG / XINGANG / CATLAI"
            value={selectedPort}
            onChange={(e) => setSelectedPort(e.target.value)}
            list="port-options"
            className="pl-9 h-10 text-base"
          />
          <datalist id="port-options">
            {availablePorts.map((port) => (
              <option key={port} value={port} />
            ))}
          </datalist>
        </div>

        <div className="flex gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2 flex-1 h-9 text-sm">
                <CalendarIcon className="h-4 w-4" />
                <span className="truncate">
                  {selectedDate ? format(selectedDate, 'MM-dd', { locale: zhCN }) : '日期'}
                </span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="center">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                locale={zhCN}
                initialFocus
              />
            </PopoverContent>
          </Popover>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2 flex-1 h-9 text-sm">
                <Filter className="h-4 w-4" />
                <span>标签</span>
                {selectedTags.length > 0 && (
                  <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                    {selectedTags.length}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80" align="end">
              <div className="space-y-3">
                <div className="font-medium text-sm">选择标签</div>
                <div className="flex flex-wrap gap-2">
                  {allTags.length === 0 ? (
                    <p className="text-sm text-muted-foreground">暂无标签</p>
                  ) : (
                    allTags.map((tag) => (
                      <Badge
                        key={tag.id}
                        variant={selectedTags.includes(tag.name) ? 'default' : 'outline'}
                        className="cursor-pointer hover:bg-primary/90 text-sm py-1 px-3"
                        onClick={() => toggleTag(tag.name)}
                      >
                        {tag.name}
                      </Badge>
                    ))
                  )}
                </div>
              </div>
            </PopoverContent>
          </Popover>

          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-2 h-9 px-3">
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {(selectedTags.length > 0 || selectedDate || selectedPort) && (
        <div className="flex flex-wrap gap-2 items-center text-xs">
          {selectedDate && (
            <Badge
              variant="secondary"
              className="gap-1 cursor-pointer py-1 px-2"
              onClick={() => setSelectedDate(undefined)}
            >
              {format(selectedDate, 'MM月dd日', { locale: zhCN })}
              <X className="h-3 w-3" />
            </Badge>
          )}
          {selectedPort && (
            <Badge
              variant="secondary"
              className="gap-1 cursor-pointer py-1 px-2"
              onClick={() => setSelectedPort('')}
            >
              港口: {selectedPort}
              <X className="h-3 w-3" />
            </Badge>
          )}
          {selectedTags.map((tag) => (
            <Badge
              key={tag}
              variant="secondary"
              className="gap-1 cursor-pointer py-1 px-2"
              onClick={() => toggleTag(tag)}
            >
              {tag}
              <X className="h-3 w-3" />
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}