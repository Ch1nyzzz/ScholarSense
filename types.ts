export interface PaperAnalysis {
  title: string;
  authors: string[];
  summary_background: string;
  motivation: string;
  core_method_math_latex: string;
  experiments_setup: string;
  results_metrics: string;
  reviewer_critique: string;
  one_more_thing: string;
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
  rawText?: string; // Optional: store raw text if needed, though can be heavy
  tags: string[];
  isFavorite: boolean;
  isRead: boolean;
  errorMessage?: string;
}

export type ViewMode = 'dashboard' | 'reader';