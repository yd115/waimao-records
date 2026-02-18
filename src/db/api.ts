import { supabase } from './supabase';
import type { BusinessRecord, Tag, StructuredInfo } from '@/types';

/**
 * 转换数据库记录为应用模型
 */
function mapRecord(dbRecord: any): BusinessRecord {
  return {
    id: dbRecord.id,
    content: dbRecord.content,
    tags: dbRecord.tags || [],
    timestamp: dbRecord.timestamp,
    createdAt: dbRecord.created_at,
    structured: dbRecord.structured as StructuredInfo
  };
}

/**
 * 转换数据库标签为应用模型
 */
function mapTag(dbTag: any): Tag {
  return {
    id: dbTag.id,
    name: dbTag.name
  };
}

export const recordApi = {
  // 获取所有记录
  async getAll(): Promise<BusinessRecord[]> {
    const { data, error } = await supabase
      .from('records')
      .select('*')
      .order('timestamp', { ascending: false });
    
    if (error) {
      console.error('获取记录失败:', error);
      return [];
    }
    return (data || []).map(mapRecord);
  },

  // 创建记录
  async create(record: Omit<BusinessRecord, 'id' | 'createdAt'>, userId: string): Promise<BusinessRecord | null> {
    const { data, error } = await supabase
      .from('records')
      .insert({
        user_id: userId,
        content: record.content,
        tags: record.tags,
        timestamp: record.timestamp,
        structured: record.structured || {}
      })
      .select()
      .single();
    
    if (error) {
      console.error('创建记录失败:', error);
      return null;
    }
    return mapRecord(data);
  },

  // 更新记录
  async update(id: string, updates: Partial<BusinessRecord>): Promise<BusinessRecord | null> {
    const dbUpdates: any = {};
    if (updates.content !== undefined) dbUpdates.content = updates.content;
    if (updates.tags !== undefined) dbUpdates.tags = updates.tags;
    if (updates.timestamp !== undefined) dbUpdates.timestamp = updates.timestamp;
    if (updates.structured !== undefined) dbUpdates.structured = updates.structured;

    const { data, error } = await supabase
      .from('records')
      .update(dbUpdates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('更新记录失败:', error);
      return null;
    }
    return mapRecord(data);
  },

  // 删除记录
  async delete(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('records')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('删除记录失败:', error);
      return false;
    }
    return true;
  }
};

export const tagApi = {
  // 获取所有标签
  async getAll(): Promise<Tag[]> {
    const { data, error } = await supabase
      .from('tags')
      .select('*')
      .order('created_at', { ascending: true });
    
    if (error) {
      console.error('获取标签失败:', error);
      return [];
    }
    return (data || []).map(mapTag);
  },

  // 创建标签
  async create(name: string, userId: string): Promise<Tag | null> {
    const { data, error } = await supabase
      .from('tags')
      .insert({ user_id: userId, name })
      .select()
      .single();
    
    if (error) {
      console.error('创建标签失败:', error);
      return null;
    }
    return mapTag(data);
  },

  // 删除标签
  async delete(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('tags')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('删除标签失败:', error);
      return false;
    }
    return true;
  },

  // 批量初始化默认标签
  async initializeDefaults(userId: string): Promise<Tag[]> {
    const defaultNames = ['客户', '品名', '业务类型', '运费', '反馈', '护肤'];
    const tags = defaultNames.map(name => ({ user_id: userId, name }));
    const { data, error } = await supabase
      .from('tags')
      .upsert(tags, { onConflict: 'user_id,name' })
      .select();
    
    if (error) {
      console.error('初始化默认标签失败:', error);
      return [];
    }
    return (data || []).map(mapTag);
  }
};
