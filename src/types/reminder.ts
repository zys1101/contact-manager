// src/types/reminder.ts

// 事项状态枚举
export enum MatterStatus {
  PENDING = 0,    // 待完成
  CANCELLED = 1,  // 已取消
  COMPLETED = 2,  // 已完成
}

// 事项信息
export interface Reminder {
  matterId: string;      // 事项ID
  ctId: string;          // 联系人ID
  contactName?: string;  // 联系人姓名
  matterTime: string;    // 事项时间
  matter: string;        // 事项内容
  matterDelete: MatterStatus; // 事项状态
  createdAt?: string;    // 创建时间
  updatedAt?: string;    // 更新时间
}

// 事项表单数据
export interface ReminderFormData {
  ctId: string;          // 联系人ID
  matterTime: string;    // 事项时间
  matter: string;        // 事项内容
}

// 事项查询参数
export interface ReminderQueryParams {
  page?: number;
  pageSize?: number;
  ctId?: string;         // 联系人ID
  contactName?: string;  // 联系人姓名搜索
  matter?: string;       // 事项内容搜索
  matterDelete?: MatterStatus | ''; // 状态筛选
  sortBy?: string;       // 排序字段
  sortOrder?: 'asc' | 'desc'; // 排序方向
}
