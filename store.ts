
import { create } from 'zustand';
import { persist, createJSONStorage, StateStorage } from 'zustand/middleware';
import { Paper, PaperStatus, PaperAnalysis, ViewMode, Language, Collection, FilterState, CloudConfig } from './types';
import { v4 as uuidv4 } from 'uuid';
import { get, set, del } from 'idb-keyval';
import { syncToCloud, pullFromCloud, resetSupabaseClient, getSupabaseClient } from './services/supabase';

// Custom Storage Adapter using IndexedDB
const idbStorage: StateStorage = {
  getItem: async (name: string): Promise<string | null> => {
    return (await get(name)) || null;
  },
  setItem: async (name: string, value: string): Promise<void> => {
    await set(name, value);
  },
  removeItem: async (name: string): Promise<void> => {
    await del(name);
  },
};

interface AppState {
  apiKey: string;
  papers: Paper[];
  collections: Collection[];
  activePaperId: string | null;
  viewMode: ViewMode;
  activeFilter: FilterState;
  isSettingsOpen: boolean;
  language: Language;
  analysisLanguage: Language;
  
  // Cloud State
  cloudConfig: CloudConfig;
  isSyncing: boolean;
  lastCloudSync?: number;
  
  // Actions
  setApiKey: (key: string) => void;
  toggleSettings: () => void;
  setLanguage: (lang: Language) => void;
  setAnalysisLanguage: (lang: Language) => void;
  
  // Cloud Actions
  setCloudConfig: (config: Partial<CloudConfig>) => void;
  startCloudSync: () => Promise<void>;
  restoreFromCloud: () => Promise<void>;
  
  // Paper Actions
  addPaper: (paper: Paper) => void;
  updatePaperStatus: (id: string, status: PaperStatus, error?: string) => void;
  updatePaperAnalysis: (id: string, analysis: PaperAnalysis) => void;
  updatePaperNotes: (id: string, notes: string) => void;
  deletePaper: (id: string) => void;
  toggleFavorite: (id: string) => void;
  addTagToPaper: (id: string, tag: string) => void;
  removeTagFromPaper: (id: string, tag: string) => void;
  
  // Navigation Actions
  openPaper: (id: string) => void;
  closeReader: () => void;
  setFilter: (filter: FilterState) => void;

  // Collection Actions
  createCollection: (name: string) => void;
  deleteCollection: (id: string) => void;
  addPaperToCollection: (paperId: string, collectionId: string) => void;
  removePaperFromCollection: (paperId: string, collectionId: string) => void;

  // Data Management
  importData: (data: Partial<AppState>) => void;
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      apiKey: '',
      papers: [],
      collections: [],
      activePaperId: null,
      viewMode: 'dashboard',
      activeFilter: { type: 'all' },
      isSettingsOpen: false,
      language: 'zh',
      analysisLanguage: 'zh',
      
      cloudConfig: {
        supabaseUrl: '',
        supabaseKey: '',
        isEnabled: false
      },
      isSyncing: false,

      setApiKey: (key) => set({ apiKey: key }),
      toggleSettings: () => set((state) => ({ isSettingsOpen: !state.isSettingsOpen })),
      setLanguage: (lang) => set({ language: lang }),
      setAnalysisLanguage: (lang) => set({ analysisLanguage: lang }),

      setCloudConfig: (config) => {
        set((state) => {
            const newConfig = { ...state.cloudConfig, ...config };
            if (newConfig.supabaseUrl !== state.cloudConfig.supabaseUrl || newConfig.supabaseKey !== state.cloudConfig.supabaseKey) {
                resetSupabaseClient();
            }
            return { cloudConfig: newConfig };
        });
      },

      startCloudSync: async () => {
          const state = get();
          if (!state.cloudConfig.isEnabled) return;

          set({ isSyncing: true });
          try {
              const backupData = {
                  papers: state.papers,
                  collections: state.collections,
                  updatedAt: Date.now(),
                  deviceId: navigator.userAgent
              };
              const timestamp = await syncToCloud(state.cloudConfig, backupData);
              set({ lastCloudSync: timestamp });
              // alert(state.language === 'zh' ? '云端同步成功' : 'Cloud sync successful');
          } catch (error: any) {
              console.error('Sync error:', error);
              alert(`Sync Failed: ${error.message}`);
          } finally {
              set({ isSyncing: false });
          }
      },

      restoreFromCloud: async () => {
          const state = get();
          if (!state.cloudConfig.isEnabled) return;

          set({ isSyncing: true });
          try {
              const data = await pullFromCloud(state.cloudConfig);
              if (data) {
                  set({ 
                      papers: data.papers,
                      collections: data.collections,
                      lastCloudSync: data.updatedAt
                  });
                  alert(state.language === 'zh' ? '从云端恢复成功' : 'Restored from cloud successfully');
              } else {
                  alert(state.language === 'zh' ? '云端暂无数据' : 'No data found in cloud');
              }
          } catch (error: any) {
              console.error('Restore error:', error);
              alert(`Restore Failed: ${error.message}`);
          } finally {
              set({ isSyncing: false });
          }
      },
      
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
            tags: [...(p.tags || []), ...(analysis.suggested_tags || [])]
          } : p
        )
      })),

      updatePaperNotes: (id, notes) => set((state) => ({
        papers: state.papers.map((p) =>
          p.id === id ? { ...p, userNotes: notes } : p
        )
      })),

      addTagToPaper: (id, tag) => set((state) => ({
        papers: state.papers.map((p) => {
          if (p.id !== id) return p;
          const currentTags = p.tags || [];
          if (currentTags.includes(tag)) return p;
          return { ...p, tags: [...currentTags, tag] };
        })
      })),

      removeTagFromPaper: (id, tag) => set((state) => ({
        papers: state.papers.map((p) => 
          p.id === id ? { ...p, tags: (p.tags || []).filter(t => t !== tag) } : p
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
      })),

      importData: (data) => set((state) => ({
        ...state,
        papers: data.papers || state.papers,
        collections: data.collections || state.collections,
        apiKey: data.apiKey || state.apiKey,
        cloudConfig: data.cloudConfig || state.cloudConfig
      }))
    }),
    {
      name: 'scholarfeed-storage-v2',
      storage: createJSONStorage(() => idbStorage),
      partialize: (state) => ({ 
        apiKey: state.apiKey, 
        papers: state.papers,
        collections: state.collections,
        language: state.language,
        analysisLanguage: state.analysisLanguage,
        cloudConfig: state.cloudConfig // Persist cloud config
      }),
    }
  )
);