export interface PaperAnalysis {
  title: string;
  authors: string[];
  // Background: What is the field, context for non-experts
  background: string;
  // Motivation: Problem discovered, significance, purpose
  motivation: string;
  // Conclusion: High level conclusion, relation to motivation
  research_conclusion: string;
  // Math & Modeling: Symbols, formulas (LaTeX), algorithmic differences
  methodology_math: string;
  // Experiments: System setup, data, hyperparams, prompts (Reproducible level)
  implementation_details: string;
  // Results: Baselines comparison, metrics, insights
  evaluation_results: string;
  // Critique: Pros, cons, future directions
  reviewer_critique: string;
  // One More Thing: Unique insight
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
  rawText?: string;
  tags: string[];
  isFavorite: boolean;
  isRead: boolean;
  errorMessage?: string;
}

export type ViewMode = 'dashboard' | 'reader';
export type Language = 'en' | 'zh';