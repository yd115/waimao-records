import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreVertical, Copy, Edit, Trash2, User, Building2, Globe, Package, Workflow, Ship } from 'lucide-react';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import type { BusinessRecord } from '@/types';
import { highlightContent, deduplicateByInclusion } from '@/lib/analyzer';
import { toast } from 'sonner';

interface RecordItemProps {
  record: BusinessRecord;
  onEdit: (record: BusinessRecord) => void;
  onDelete: (id: string) => void;
}

export function RecordItem({ record, onEdit, onDelete }: RecordItemProps) {
  const [isHovered, setIsHovered] = useState(false);

  const handleCopy = () => {
    const text = `${format(new Date(record.timestamp), 'yyyy-MM-dd HH:mm')} - ${record.content}${record.tags.length > 0 ? ` [${record.tags.join(', ')}]` : ''}`;
    navigator.clipboard.writeText(text);
    toast.success('已复制到剪贴板');
  };

  const handleDelete = () => {
    if (window.confirm('确定要删除这条记录吗？')) {
      onDelete(record.id);
      toast.success('记录已删除');
    }
  };

  const renderHighlightedContent = () => {
    if (!record.structured || Object.keys(record.structured).length === 0) {
      return <p className="text-foreground whitespace-pre-wrap break-words">{record.content}</p>;
    }

    const segments = highlightContent(record.content, record.structured);

    return (
      <p className="text-foreground whitespace-pre-wrap break-words">
        {segments.map((segment, index) => {
          if (!segment.type) {
            return <span key={index}>{segment.text}</span>;
          }

          const colorMap = {
            customer: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
            company: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300',
            shippingCompany: 'bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-300',
            country: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
            product: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
            workflow: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
          } as const;

          return (
            <span key={index} className={`px-1 py-0.5 rounded ${colorMap[segment.type]}`}>
              {segment.text}
            </span>
          );
        })}
      </p>
    );
  };

  return (
    <Card
      className="p-3 hover:shadow-md transition-shadow"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 space-y-2 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium text-primary">
              {format(new Date(record.timestamp), 'MM-dd HH:mm', { locale: zhCN })}
            </span>
            {record.timestamp !== record.createdAt && (
              <Badge variant="outline" className="text-xs h-5 px-1.5">
                已编辑
              </Badge>
            )}
          </div>

          <div className="text-sm leading-relaxed">{renderHighlightedContent()}</div>

          {record.structured && (
            <div className="flex flex-wrap gap-2 text-xs">
              {record.structured.customers && record.structured.customers.length > 0 && (
                <div className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
                  <User className="h-3 w-3 flex-shrink-0" />
                  <span className="truncate">{deduplicateByInclusion(record.structured.customers).join(', ')}</span>
                </div>
              )}
              {record.structured.companies && record.structured.companies.length > 0 && (
                <div className="flex items-center gap-1 text-cyan-600 dark:text-cyan-400">
                  <Building2 className="h-3 w-3 flex-shrink-0" />
                  <span className="truncate">{deduplicateByInclusion(record.structured.companies).join(', ')}</span>
                </div>
              )}
              {record.structured.shippingCompanies && record.structured.shippingCompanies.length > 0 && (
                <div className="flex items-center gap-1 text-sky-600 dark:text-sky-400">
                  <Ship className="h-3 w-3 flex-shrink-0" />
                  <span className="truncate">{deduplicateByInclusion(record.structured.shippingCompanies).join(', ')}</span>
                </div>
              )}
              {record.structured.countries && record.structured.countries.length > 0 && (
                <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                  <Globe className="h-3 w-3 flex-shrink-0" />
                  <span className="truncate">{deduplicateByInclusion(record.structured.countries).join(', ')}</span>
                </div>
              )}
              {record.structured.products && record.structured.products.length > 0 && (
                <div className="flex items-center gap-1 text-purple-600 dark:text-purple-400">
                  <Package className="h-3 w-3 flex-shrink-0" />
                  <span className="truncate">{deduplicateByInclusion(record.structured.products).join(', ')}</span>
                </div>
              )}
              {record.structured.workflows && record.structured.workflows.length > 0 && (
                <div className="flex items-center gap-1 text-orange-600 dark:text-orange-400">
                  <Workflow className="h-3 w-3 flex-shrink-0" />
                  <span className="truncate">{deduplicateByInclusion(record.structured.workflows).join(', ')}</span>
                </div>
              )}
            </div>
          )}

          {record.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {record.tags.map((tag, index) => (
                <Badge key={index} variant="secondary" className="text-xs h-5 px-2">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-1 flex-shrink-0">
          <Button variant="ghost" size="sm" className="h-9 w-9 p-0" onClick={handleCopy} title="复制内容">
            <Copy className="h-4 w-4" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-9 w-9 p-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-32">
              <DropdownMenuItem onClick={() => onEdit(record)} className="gap-2">
                <Edit className="h-4 w-4" />
                <span>编辑</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleDelete} className="gap-2 text-destructive focus:text-destructive">
                <Trash2 className="h-4 w-4" />
                <span>删除</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </Card>
  );
}
