

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

export type AiProvider = 'gemini' | 'openai' | 'siliconflow' | 'minimax' | 'moonshot' | 'zhipu' | 'deepseek' | 'qwen';

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
        minimax: string;
        moonshot: string;
        zhipu: string;
        deepseek: string;
        qwen: string;
    };
    baseUrls: {
        openai?: string;
        siliconflow?: string;
        minimax?: string;
        moonshot?: string;
        zhipu?: string;
        deepseek?: string;
        qwen?: string;
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
        { provider: 'openai', modelId: 'o3-mini', name: 'GPT o3 Mini' },
        { provider: 'openai', modelId: 'gpt-4o', name: 'GPT-4o' },
        { provider: 'openai', modelId: 'gpt-4o-mini', name: 'GPT-4o Mini' },
    ],
    siliconflow: [
        { provider: 'siliconflow', modelId: 'deepseek-ai/DeepSeek-R1', name: 'DeepSeek R1 (SiliconFlow)' },
        { provider: 'siliconflow', modelId: 'deepseek-ai/DeepSeek-V3', name: 'DeepSeek V3 (SiliconFlow)' },
        { provider: 'siliconflow', modelId: 'Qwen/Qwen2.5-72B-Instruct', name: 'Qwen 2.5 72B' },
        { provider: 'siliconflow', modelId: 'THUDM/glm-4-9b-chat', name: 'GLM-4 9B' },
    ],
    minimax: [
        { provider: 'minimax', modelId: 'MiniMax-M2', name: 'MiniMax M2 (General/Agent)' },
        { provider: 'minimax', modelId: 'MiniMax-M2-Stable', name: 'MiniMax M2 Stable' },
        { provider: 'minimax', modelId: 'abab6.5s-chat', name: 'Abab 6.5s' },
        { provider: 'minimax', modelId: 'abab6.5g-chat', name: 'Abab 6.5g' },
    ],
    moonshot: [
        { provider: 'moonshot', modelId: 'kimi-latest', name: 'Kimi Latest' },
        { provider: 'moonshot', modelId: 'kimi-k2-thinking', name: 'Kimi K2 Thinking' },
        { provider: 'moonshot', modelId: 'moonshot-v1-128k', name: 'Moonshot V1 128k' },
        { provider: 'moonshot', modelId: 'moonshot-v1-32k', name: 'Moonshot V1 32k' },
    ],
    zhipu: [
        { provider: 'zhipu', modelId: 'glm-4.6', name: 'GLM-4.6 (Flagship)' },
        { provider: 'zhipu', modelId: 'glm-4-plus', name: 'GLM-4 Plus' },
        { provider: 'zhipu', modelId: 'glm-4-flash', name: 'GLM-4 Flash (Fast)' },
        { provider: 'zhipu', modelId: 'glm-4-air', name: 'GLM-4 Air' },
    ],
    deepseek: [
        { provider: 'deepseek', modelId: 'deepseek-reasoner', name: 'DeepSeek R1 (Reasoner)' },
        { provider: 'deepseek', modelId: 'deepseek-chat', name: 'DeepSeek V3 (Chat)' },
        // Official API mainly exposes these two as the primary endpoints. 
        // Older versions are deprecated or aliased.
        { provider: 'deepseek', modelId: 'deepseek-coder', name: 'DeepSeek Coder V2' },
    ],
    qwen: [
        { provider: 'qwen', modelId: 'qwen3-max', name: 'Qwen3 Max' },
        { provider: 'qwen', modelId: 'qwen-plus', name: 'Qwen Plus' },
        { provider: 'qwen', modelId: 'qwen-flash', name: 'Qwen Flash' },
        { provider: 'qwen', modelId: 'qwen3-coder-plus', name: 'Qwen3 Coder Plus' },
    ]
};