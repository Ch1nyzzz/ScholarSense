

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
  
  // Content Source
  sourceUrl?: string; // e.g., https://arxiv.org/pdf/...
  storagePath?: string; // Supabase Storage path e.g., "uid/paper.pdf"
  
  // Local Cache (Optional/Legacy)
  rawText?: string;
  pdfData?: string; // Base64 string (kept for offline cache if needed, but optional now)
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

// --- AI Configuration Types ---

export type AiProvider = 'gemini' | 'openai' | 'siliconflow';

export interface AiModelConfig {
    provider: AiProvider;
    modelId: string;
    name: string;
}

export interface AiConfig {
    activeProvider: AiProvider;
    activeModel: string;
    keys: {
        gemini: string;
        openai: string;
        siliconflow: string;
    };
    baseUrls: {
        openai?: string; // Optional custom base URL for OpenAI proxies
        siliconflow?: string; // Optional custom base URL
    }
}

export const AVAILABLE_MODELS: Record<AiProvider, AiModelConfig[]> = {
    gemini: [
        { provider: 'gemini', modelId: 'gemini-3-pro-preview', name: 'Gemini 3.0 Pro Preview' },
        { provider: 'gemini', modelId: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash' },
        { provider: 'gemini', modelId: 'gemini-2.0-pro-exp-02-05', name: 'Gemini 2.0 Pro Exp' },
        { provider: 'gemini', modelId: 'gemini-2.0-flash-thinking-exp-01-21', name: 'Gemini 2.0 Flash Thinking' },
    ],
    openai: [
        { provider: 'openai', modelId: 'o1', name: 'GPT o1 (Reasoning)' },
        { provider: 'openai', modelId: 'o1-preview', name: 'GPT o1 Preview' },
        { provider: 'openai', modelId: 'o1-mini', name: 'GPT o1 Mini' },
        { provider: 'openai', modelId: 'o3-mini', name: 'GPT o3 Mini' },
        { provider: 'openai', modelId: 'gpt-4o', name: 'GPT-4o' },
        { provider: 'openai', modelId: 'gpt-4o-mini', name: 'GPT-4o Mini' },
    ],
    siliconflow: [
        { provider: 'siliconflow', modelId: 'deepseek-ai/DeepSeek-R1', name: 'DeepSeek R1 (Thinking)' },
        { provider: 'siliconflow', modelId: 'deepseek-ai/DeepSeek-V3', name: 'DeepSeek V3' },
        { provider: 'siliconflow', modelId: 'Qwen/Qwen2.5-72B-Instruct', name: 'Qwen 2.5 72B' },
        { provider: 'siliconflow', modelId: 'THUDM/glm-4-9b-chat', name: 'Zhipu GLM-4 9B' },
        // Including IDs for Minimax/Kimi if supported by user's SiliconFlow mapping or future support
        { provider: 'siliconflow', modelId: 'internlm/internlm2_5-7b-chat', name: 'InternLM 2.5' },
        { provider: 'siliconflow', modelId: '01-ai/Yi-1.5-34B-Chat', name: 'Yi 1.5 34B' },
    ],
};