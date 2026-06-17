// src/services/blacklistService.ts
import apiService, { PageResponse } from './api';
import { Contact, ContactQueryParams } from '../types';

class BlacklistService {
  // 获取黑名单列表
  async getBlacklist(params: ContactQueryParams): Promise<PageResponse<Contact>> {
    return await apiService.get<PageResponse<Contact>>('/blacklist', { params });
  }

  // 恢复联系人
  async restoreContact(id: string): Promise<void> {
    await apiService.delete(`/blacklist/${id}`);
  }
}

export const blacklistService = new BlacklistService();
