
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Paper, PaperStatus, PaperAnalysis, ViewMode, Language, Collection, FilterState } from './types';
import { v4 as uuidv4 } from 'uuid';

interface AppState {
  apiKey: string;
  papers: Paper[];
  collections: Collection[];
  activePaperId: string | null;
  viewMode: ViewMode;
  activeFilter: FilterState;
  isSettingsOpen: boolean;
  language: Language;
  
  // Actions
  setApiKey: (key: string) => void;
  toggleSettings: () => void;
  setLanguage: (lang: Language) => void;
  
  // Paper Actions
  addPaper: (paper: Paper) => void;
  updatePaperStatus: (id: string, status: PaperStatus, error?: string) => void;
  updatePaperAnalysis: (id: string, analysis: PaperAnalysis) => void;
  updatePaperNotes: (id: string, notes: string) => void;
  deletePaper: (id: string) => void;
  toggleFavorite: (id: string) => void;
  
  // Navigation Actions
  openPaper: (id: string) => void;
  closeReader: () => void;
  setFilter: (filter: FilterState) => void;

  // Collection Actions
  createCollection: (name: string) => void;
  deleteCollection: (id: string) => void;
  addPaperToCollection: (paperId: string, collectionId: string) => void;
  removePaperFromCollection: (paperId: string, collectionId: string) => void;
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      apiKey: '',
      papers: [],
      collections: [],
      activePaperId: null,
      viewMode: 'dashboard',
      activeFilter: { type: 'all' },
      isSettingsOpen: false,
      language: 'zh',

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
          p.id === id ? { 
            ...p, 
            analysis, 
            status: PaperStatus.COMPLETED,
            tags: analysis.suggested_tags || [] // Auto-populate tags
          } : p
        )
      })),

      updatePaperNotes: (id, notes) => set((state) => ({
        papers: state.papers.map((p) =>
          p.id === id ? { ...p, userNotes: notes } : p
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
      })),

      setFilter: (filter) => set({ activeFilter: filter, viewMode: 'dashboard', activePaperId: null }),

      createCollection: (name) => set((state) => ({
        collections: [...state.collections, { id: uuidv4(), name, createdAt: Date.now() }]
      })),

      deleteCollection: (id) => set((state) => ({
        collections: state.collections.filter(c => c.id !== id),
        // Remove this collection ID from all papers
        papers: state.papers.map(p => ({
          ...p,
          collectionIds: p.collectionIds ? p.collectionIds.filter(cid => cid !== id) : []
        })),
        activeFilter: state.activeFilter.type === 'collection' && state.activeFilter.id === id 
          ? { type: 'all' } 
          : state.activeFilter
      })),

      addPaperToCollection: (paperId, collectionId) => set((state) => ({
        papers: state.papers.map(p => {
          if (p.id !== paperId) return p;
          const currentIds = p.collectionIds || [];
          if (currentIds.includes(collectionId)) return p;
          return { ...p, collectionIds: [...currentIds, collectionId] };
        })
      })),

      removePaperFromCollection: (paperId, collectionId) => set((state) => ({
        papers: state.papers.map(p => {
          if (p.id !== paperId) return p;
          return { ...p, collectionIds: (p.collectionIds || []).filter(id => id !== collectionId) };
        })
      }))
    }),
    {
      name: 'scholarfeed-storage',
      partialize: (state) => ({ 
        apiKey: state.apiKey, 
        papers: state.papers,
        collections: state.collections,
        language: state.language
      }),
    }
  )
);
