// src/types/tag.ts

export interface Tag {
  tagId: string;
  tagName: string;
  tagColor: string;
  contactIds?: string[];
  contactCount?: number;
}

export interface TagFormData {
  tagName: string;
  tagColor: string;
}

export interface ContactWithTag {
  ctId: string;
  ctName: string;
  ctPhone: string;
  ctMf: string;
  avatar?: string;
  tags?: Tag[];
}
