// src/types/contact.ts

// 联系人信息（列表用）
export interface Contact {
  ctId: string;
  userId: string;
  ctName: string;
  ctPhone: string;
  ctAd?: string;
  ctYb?: string;
  ctQq?: string;
  ctWx?: string;
  ctEm?: string;
  ctMf: '男' | '女';
  ctBirth?: string;
  avatar?: string;
  ctDelete: number;
  createdAt?: string;
  updatedAt?: string;
}

// 联系人详情（含事项列表）
export interface ContactDetail extends Contact {
  matters: MatterItem[];
}

// 事项摘要（详情内嵌）
export interface MatterItem {
  matterId: string;
  ctId: string;
  contactName: string;
  matterTime: string;
  matter: string;
  matterDelete: number;
  createdAt: string;
  updatedAt: string;
}

// 联系人表单数据
export interface ContactFormData {
  ctName: string;
  ctPhone: string;
  ctAd?: string;
  ctYb?: string;
  ctQq?: string;
  ctWx?: string;
  ctEm?: string;
  ctMf: '男' | '女';
  ctBirth?: string;
}

// 联系人查询参数
export interface ContactQueryParams {
  page?: number;
  pageSize?: number;
  ctName?: string;
  ctPhone?: string;
  ctMf?: '男' | '女' | '';
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}
