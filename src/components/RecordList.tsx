import React from 'react';
import { RecordItem } from './RecordItem';
import type { BusinessRecord } from '@/types';

interface RecordListProps {
  records: BusinessRecord[];
  onEdit: (record: BusinessRecord) => void;
  onDelete: (id: string) => void;
}

export function RecordList({ records, onEdit, onDelete }: RecordListProps) {
  if (records.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">暂无记录</p>
        <p className="text-sm text-muted-foreground mt-2">
          开始记录您的业务信息吧
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {records.map((record) => (
        <RecordItem
          key={record.id}
          record={record}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
