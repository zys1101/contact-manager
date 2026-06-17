// src/services/contactService.ts
import apiService, { PageResponse } from './api';
import { Contact, ContactDetail, ContactFormData, ContactQueryParams } from '../types';

class ContactService {
  async getContacts(params: ContactQueryParams): Promise<PageResponse<Contact>> {
    return apiService.get<PageResponse<Contact>>('/contacts', { params });
  }

  async getContactById(id: string): Promise<ContactDetail> {
    return apiService.get<ContactDetail>(`/contacts/${id}`);
  }

  async createContact(data: ContactFormData): Promise<{ ctId: string }> {
    return apiService.post<{ ctId: string }>('/contacts', data);
  }

  async updateContact(id: string, data: Partial<ContactFormData>): Promise<void> {
    return apiService.put<void>(`/contacts/${id}`, data);
  }

  async deleteContact(id: string): Promise<void> {
    return apiService.delete(`/contacts/${id}`);
  }

  async addToBlacklist(id: string): Promise<void> {
    return apiService.post(`/contacts/${id}/blacklist`);
  }

  async uploadAvatar(id: string, file: File): Promise<{ avatar: string }> {
    return apiService.upload<{ avatar: string }>(`/contacts/${id}/avatar`, file);
  }
}

export const contactService = new ContactService();
