import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Paper, PaperStatus, PaperAnalysis, ViewMode, Language } from './types';

interface AppState {
  apiKey: string;
  papers: Paper[];
  activePaperId: string | null;
  viewMode: ViewMode;
  isSettingsOpen: boolean;
  language: Language;
  
  // Actions
  setApiKey: (key: string) => void;
  toggleSettings: () => void;
  setLanguage: (lang: Language) => void;
  addPaper: (paper: Paper) => void;
  updatePaperStatus: (id: string, status: PaperStatus, error?: string) => void;
  updatePaperAnalysis: (id: string, analysis: PaperAnalysis) => void;
  openPaper: (id: string) => void;
  closeReader: () => void;
  toggleFavorite: (id: string) => void;
  deletePaper: (id: string) => void;
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      apiKey: '',
      papers: [],
      activePaperId: null,
      viewMode: 'dashboard',
      isSettingsOpen: false,
      language: 'zh', // Default to Chinese as requested by the detailed prompt context

      setApiKey: (key) => set({ apiKey: key }),
      toggleSettings: () => set((state) => ({ isSettingsOpen: !state.isSettingsOpen })),
      setLanguage: (lang) => set({ language: lang }),
      
      addPaper: (paper) => set((state) => ({ 
        papers: [paper, ...state.papers] 
      })),
      
      updatePaperStatus: (id, status, errorMessage) => set((state) => ({
        papers: state.papers.map((p) => 
          p.id === id ? { ...p, status, errorMessage } : p
        )
      })),
      
      updatePaperAnalysis: (id, analysis) => set((state) => ({
        papers: state.papers.map((p) => 
          p.id === id ? { ...p, analysis, status: PaperStatus.COMPLETED } : p
        )
      })),

      openPaper: (id) => set({ activePaperId: id, viewMode: 'reader' }),
      
      closeReader: () => set({ activePaperId: null, viewMode: 'dashboard' }),
      
      toggleFavorite: (id) => set((state) => ({
        papers: state.papers.map(p => 
          p.id === id ? { ...p, isFavorite: !p.isFavorite } : p
        )
      })),

      deletePaper: (id) => set((state) => ({
        papers: state.papers.filter(p => p.id !== id),
        activePaperId: state.activePaperId === id ? null : state.activePaperId,
        viewMode: state.activePaperId === id ? 'dashboard' : state.viewMode
      }))
    }),
    {
      name: 'scholarfeed-storage',
      partialize: (state) => ({ 
        apiKey: state.apiKey, 
        papers: state.papers,
        language: state.language
      }),
    }
  )
);