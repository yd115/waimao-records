import type { BusinessRecord, Tag } from '@/types';
import { DEFAULT_TAGS } from '@/types';

const STORAGE_KEYS = {
  RECORDS: 'kaolin_business_records',
  TAGS: 'kaolin_business_tags',
};

// 记录存储操作
export const recordStorage = {
  // 获取所有记录
  getAll(): BusinessRecord[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.RECORDS);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('读取记录失败:', error);
      return [];
    }
  },

  // 保存记录
  save(record: BusinessRecord): void {
    try {
      const records = this.getAll();
      records.unshift(record); // 新记录添加到开头
      localStorage.setItem(STORAGE_KEYS.RECORDS, JSON.stringify(records));
    } catch (error) {
      console.error('保存记录失败:', error);
      throw new Error('保存失败，请检查存储空间');
    }
  },

  // 更新记录
  update(id: string, updatedRecord: Partial<BusinessRecord>): void {
    try {
      const records = this.getAll();
      const index = records.findIndex(r => r.id === id);
      if (index !== -1) {
        records[index] = { ...records[index], ...updatedRecord };
        localStorage.setItem(STORAGE_KEYS.RECORDS, JSON.stringify(records));
      }
    } catch (error) {
      console.error('更新记录失败:', error);
      throw new Error('更新失败');
    }
  },

  // 删除记录
  delete(id: string): void {
    try {
      const records = this.getAll();
      const filtered = records.filter(r => r.id !== id);
      localStorage.setItem(STORAGE_KEYS.RECORDS, JSON.stringify(filtered));
    } catch (error) {
      console.error('删除记录失败:', error);
      throw new Error('删除失败');
    }
  },

  // 批量删除
  deleteMultiple(ids: string[]): void {
    try {
      const records = this.getAll();
      const filtered = records.filter(r => !ids.includes(r.id));
      localStorage.setItem(STORAGE_KEYS.RECORDS, JSON.stringify(filtered));
    } catch (error) {
      console.error('批量删除失败:', error);
      throw new Error('批量删除失败');
    }
  },
};

// 标签存储操作
export const tagStorage = {
  // 获取所有标签
  getAll(): Tag[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.TAGS);
      if (!data) {
        // 首次使用，初始化默认标签
        this.saveAll(DEFAULT_TAGS);
        return DEFAULT_TAGS;
      }
      return JSON.parse(data);
    } catch (error) {
      console.error('读取标签失败:', error);
      return DEFAULT_TAGS;
    }
  },

  // 保存所有标签
  saveAll(tags: Tag[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.TAGS, JSON.stringify(tags));
    } catch (error) {
      console.error('保存标签失败:', error);
      throw new Error('保存标签失败');
    }
  },

  // 添加标签
  add(tag: Tag): void {
    try {
      const tags = this.getAll();
      tags.push(tag);
      this.saveAll(tags);
    } catch (error) {
      console.error('添加标签失败:', error);
      throw new Error('添加标签失败');
    }
  },

  // 删除标签
  delete(id: string): void {
    try {
      const tags = this.getAll();
      const filtered = tags.filter(t => t.id !== id);
      this.saveAll(filtered);
    } catch (error) {
      console.error('删除标签失败:', error);
      throw new Error('删除标签失败');
    }
  },

  // 更新标签
  update(id: string, updatedTag: Partial<Tag>): void {
    try {
      const tags = this.getAll();
      const index = tags.findIndex(t => t.id === id);
      if (index !== -1) {
        tags[index] = { ...tags[index], ...updatedTag };
        this.saveAll(tags);
      }
    } catch (error) {
      console.error('更新标签失败:', error);
      throw new Error('更新标签失败');
    }
  },
};
