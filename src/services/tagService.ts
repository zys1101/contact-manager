// src/services/tagService.ts
import apiService from './api';
import { Tag, ContactWithTag, TagFormData } from '../types/tag';

class TagService {
  async getTags(): Promise<Tag[]> {
    return apiService.get<Tag[]>('/tags');
  }

  async createTag(data: TagFormData): Promise<{ tagId: string }> {
    return apiService.post<{ tagId: string }>('/tags', data);
  }

  async updateTag(tagId: string, data: TagFormData): Promise<void> {
    return apiService.put<void>(`/tags/${tagId}`, data);
  }

  async deleteTag(tagId: string): Promise<void> {
    return apiService.delete(`/tags/${tagId}`);
  }

  async assignTagsToContact(ctId: string, tagIds: string[]): Promise<void> {
    return apiService.post(`/tags/contacts/${ctId}/tags`, { tagIds });
  }

  async removeTagFromContact(ctId: string, tagId: string): Promise<void> {
    return apiService.delete(`/tags/contacts/${ctId}/tags/${tagId}`);
  }

  async getContactsByTagId(tagId: string): Promise<ContactWithTag[]> {
    return apiService.get<ContactWithTag[]>(`/tags/contacts?tagId=${tagId}`);
  }

  async getContactDetailWithTags(ctId: string): Promise<ContactWithTag> {
    return apiService.get<ContactWithTag>(`/tags/contacts/${ctId}`);
  }
}

export const tagService = new TagService();
