// src/services/dashboardService.ts
import apiService from './api';

export interface StatsCard {
  totalContacts: number;
  blacklistCount: number;
  pendingMatters: number;
  completedMatters: number;
  birthdayThisMonth: number;
}

export interface ChartItem {
  name: string;
  value: number;
}

export interface CompletionRate {
  completed: number;
  uncompleted: number;
  percentage: number;
}

export interface GrowthItem {
  month: string;
  count: number;
}

export interface BirthdayReminder {
  ctId: string;
  ctName: string;
  ctBirth: string;
  daysUntilBirthday: number;
  description: string;
}

export interface DashboardData {
  statsCard: StatsCard;
  genderDistribution: ChartItem[];
  matterCompletion: CompletionRate;
  contactGrowth: GrowthItem[];
  birthdayReminders: BirthdayReminder[];
}

class DashboardService {
  async getDashboardStats(): Promise<DashboardData> {
    return apiService.get<DashboardData>('/dashboard/stats');
  }
}

export const dashboardService = new DashboardService();