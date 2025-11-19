

export interface PaperAnalysis {
  title: string;
  authors: string[];
  background: string;
  motivation: string;
  research_conclusion: string;
  methodology_math: string;
  implementation_details: string;
  evaluation_results: string;
  reviewer_critique: string;
  one_more_thing: string;
  suggested_tags: string[];
}

export enum PaperStatus {
  IDLE = 'IDLE',
  EXTRACTING = 'EXTRACTING',
  ANALYZING = 'ANALYZING',
  COMPLETED = 'COMPLETED',
  ERROR = 'ERROR',
}

export interface Paper {
  id: string;
  originalTitle: string;
  dateAdded: number;
  status: PaperStatus;
  analysis: PaperAnalysis | null;
  rawText?: string;
  pdfData?: string; // Base64 string of the PDF file for persistence
  pdfUrl?: string; // Temporary Blob URL for viewing (runtime only)
  tags: string[];
  collectionIds: string[];
  userNotes: string;
  isFavorite: boolean;
  isRead: boolean;
  errorMessage?: string;
}

export interface Collection {
  id: string;
  name: string;
  createdAt: number;
}

export type ViewMode = 'dashboard' | 'reader';
export type Language = 'en' | 'zh';
export type FilterType = 'all' | 'favorites' | 'archived' | 'collection' | 'tag';

export interface FilterState {
  type: FilterType;
  id?: string; // collectionId or tagName
}

export interface CloudConfig {
  supabaseUrl: string;
  supabaseKey: string;
  lastSync?: number;
  isEnabled: boolean;
}