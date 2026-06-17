// src/services/reminderService.ts
import apiService, { PageResponse } from './api';
import { Reminder, ReminderFormData, ReminderQueryParams } from '../types';

class ReminderService {
  async getReminders(params: ReminderQueryParams): Promise<PageResponse<Reminder>> {
    return apiService.get<PageResponse<Reminder>>('/reminders', { params });
  }

  async getReminderById(id: string): Promise<Reminder> {
    return apiService.get<Reminder>(`/reminders/${id}`);
  }

  async createReminder(data: ReminderFormData): Promise<Reminder> {
    return apiService.post<Reminder>('/reminders', data);
  }

  async updateReminder(id: string, data: Partial<ReminderFormData>): Promise<Reminder> {
    return apiService.put<Reminder>(`/reminders/${id}`, data);
  }

  async deleteReminder(id: string): Promise<void> {
    return apiService.delete(`/reminders/${id}`);
  }

  async completeReminder(id: string): Promise<void> {
    return apiService.put(`/reminders/${id}/complete`);
  }

  async cancelReminder(id: string): Promise<void> {
    return apiService.put(`/reminders/${id}/cancel`);
  }

  async reopenReminder(id: string): Promise<void> {
    return apiService.put(`/reminders/${id}/reopen`);
  }
}

export const reminderService = new ReminderService();
