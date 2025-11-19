

import { create } from 'zustand';
import { persist, createJSONStorage, StateStorage } from 'zustand/middleware';
import { Paper, PaperStatus, PaperAnalysis, ViewMode, Language, Collection, FilterState, CloudConfig, AiConfig, AiProvider } from './types';
import { v4 as uuidv4 } from 'uuid';
import { get, set, del } from 'idb-keyval';
import { resetSupabaseClient, savePaperToCloud, fetchPapersFromCloud, deletePaperFromCloud } from './services/supabase';

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
  // AI Config (Replaces simple apiKey)
  aiConfig: AiConfig;
  
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
  cloudSyncError: string | null;
  
  // Actions
  setAiConfig: (config: Partial<AiConfig>) => void;
  updateAiKey: (provider: AiProvider, key: string) => void;

  toggleSettings: () => void;
  setLanguage: (lang: Language) => void;
  setAnalysisLanguage: (lang: Language) => void;
  
  // Cloud Actions
  setCloudConfig: (config: Partial<CloudConfig>) => void;
  refreshLibrary: () => Promise<void>;
  
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
      // Initial Default Config
      aiConfig: {
        activeProvider: 'gemini',
        activeModel: 'gemini-3-pro-preview',
        keys: {
            gemini: '',
            openai: '',
            siliconflow: ''
        },
        baseUrls: {}
      },
      
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
      cloudSyncError: null,

      setAiConfig: (config) => set((state) => ({ 
          aiConfig: { ...state.aiConfig, ...config } 
      })),

      updateAiKey: (provider, key) => set((state) => ({
          aiConfig: {
              ...state.aiConfig,
              keys: {
                  ...state.aiConfig.keys,
                  [provider]: key
              }
          }
      })),

      toggleSettings: () => set((state) => ({ isSettingsOpen: !state.isSettingsOpen })),
      setLanguage: (lang) => set({ language: lang }),
      setAnalysisLanguage: (lang) => set({ analysisLanguage: lang }),

      setCloudConfig: (config) => {
        set((state) => {
            const newConfig = { ...state.cloudConfig, ...config };
            if (newConfig.supabaseUrl !== state.cloudConfig.supabaseUrl || newConfig.supabaseKey !== state.cloudConfig.supabaseKey) {
                resetSupabaseClient();
            }
            return { cloudConfig: newConfig, cloudSyncError: null };
        });
      },

      refreshLibrary: async () => {
          const state = get();
          if (!state.cloudConfig.isEnabled) return;

          set({ isSyncing: true, cloudSyncError: null });
          try {
              const cloudPapers = await fetchPapersFromCloud(state.cloudConfig);
              if (cloudPapers && cloudPapers.length > 0) {
                  const mergedPapers = cloudPapers.map(cp => {
                      const local = state.papers.find(p => p.id === cp.id);
                      return { 
                          ...cp, 
                          pdfData: local?.pdfData, 
                          status: local?.status === PaperStatus.ANALYZING ? PaperStatus.ANALYZING : cp.status 
                      };
                  });
                  
                  const cloudIds = new Set(cloudPapers.map(p => p.id));
                  const unsyncedLocals = state.papers.filter(p => !cloudIds.has(p.id));
                  
                  set({ papers: [...mergedPapers, ...unsyncedLocals], lastCloudSync: Date.now(), cloudSyncError: null });
              } else {
                  set({ lastCloudSync: Date.now(), cloudSyncError: null });
              }
          } catch (error: any) {
              console.error("Cloud sync failed", error);
              set({ cloudSyncError: error.message || "Unknown sync error" });
          } finally {
              set({ isSyncing: false });
          }
      },
      
      addPaper: (paper) => {
          set((state) => ({ papers: [paper, ...state.papers] }));
          const state = get();
          if (state.cloudConfig.isEnabled) {
              savePaperToCloud(state.cloudConfig, paper)
                .catch(e => set({ cloudSyncError: e.message }));
          }
      },
      
      updatePaperStatus: (id, status, errorMessage) => {
          set((state) => ({
            papers: state.papers.map((p) => 
              p.id === id ? { ...p, status, errorMessage } : p
            )
          }));
          const state = get();
          if (state.cloudConfig.isEnabled) {
              const p = state.papers.find(p => p.id === id);
              const freshPaper = { ...p, status, errorMessage };
              if (freshPaper) savePaperToCloud(state.cloudConfig, freshPaper).catch(e => set({ cloudSyncError: e.message }));
          }
      },
      
      updatePaperAnalysis: (id, analysis) => {
          set((state) => ({
            papers: state.papers.map((p) => 
              p.id === id ? { 
                ...p, 
                analysis, 
                status: PaperStatus.COMPLETED,
                tags: [...(p.tags || []), ...(analysis.suggested_tags || [])]
              } : p
            )
          }));
          const state = get();
          if (state.cloudConfig.isEnabled) {
              const p = state.papers.find(p => p.id === id);
              if (p) {
                  const updatedP = { 
                      ...p, 
                      analysis, 
                      status: PaperStatus.COMPLETED,
                      tags: [...(p.tags || []), ...(analysis.suggested_tags || [])]
                  };
                  savePaperToCloud(state.cloudConfig, updatedP).catch(e => set({ cloudSyncError: e.message }));
              }
          }
      },

      updatePaperNotes: (id, notes) => {
          set((state) => ({
            papers: state.papers.map((p) =>
              p.id === id ? { ...p, userNotes: notes } : p
            )
          }));
          const state = get();
          if (state.cloudConfig.isEnabled) {
              const p = state.papers.find(p => p.id === id);
              if (p) savePaperToCloud(state.cloudConfig, { ...p, userNotes: notes }).catch(e => set({ cloudSyncError: e.message }));
          }
      },

      addTagToPaper: (id, tag) => {
          set((state) => ({
            papers: state.papers.map((p) => {
              if (p.id !== id) return p;
              const currentTags = p.tags || [];
              if (currentTags.includes(tag)) return p;
              return { ...p, tags: [...currentTags, tag] };
            })
          }));
          const state = get();
          if (state.cloudConfig.isEnabled) {
              const p = state.papers.find(p => p.id === id);
              const updatedTags = p?.tags?.includes(tag) ? p.tags : [...(p?.tags || []), tag];
              if (p) savePaperToCloud(state.cloudConfig, { ...p, tags: updatedTags }).catch(e => set({ cloudSyncError: e.message }));
          }
      },

      removeTagFromPaper: (id, tag) => {
          set((state) => ({
            papers: state.papers.map((p) => 
              p.id === id ? { ...p, tags: (p.tags || []).filter(t => t !== tag) } : p
            )
          }));
          const state = get();
          if (state.cloudConfig.isEnabled) {
              const p = state.papers.find(p => p.id === id);
              const updatedTags = (p?.tags || []).filter(t => t !== tag);
              if (p) savePaperToCloud(state.cloudConfig, { ...p, tags: updatedTags }).catch(e => set({ cloudSyncError: e.message }));
          }
      },

      openPaper: (id) => set({ activePaperId: id, viewMode: 'reader' }),
      
      closeReader: () => set({ activePaperId: null, viewMode: 'dashboard' }),
      
      toggleFavorite: (id) => {
          set((state) => ({
            papers: state.papers.map(p => 
              p.id === id ? { ...p, isFavorite: !p.isFavorite } : p
            )
          }));
          const state = get();
          if (state.cloudConfig.isEnabled) {
              const p = state.papers.find(p => p.id === id);
              if (p) savePaperToCloud(state.cloudConfig, { ...p, isFavorite: !p?.isFavorite }).catch(e => set({ cloudSyncError: e.message }));
          }
      },

      deletePaper: (id) => {
          const state = get();
          const paper = state.papers.find(p => p.id === id);
          if (state.cloudConfig.isEnabled) {
              deletePaperFromCloud(state.cloudConfig, id, paper?.storagePath).catch(e => set({ cloudSyncError: e.message }));
          }

          set((state) => ({
            papers: state.papers.filter(p => p.id !== id),
            activePaperId: state.activePaperId === id ? null : state.activePaperId,
            viewMode: state.activePaperId === id ? 'dashboard' : state.viewMode
          }));
      },

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

      importData: (data) => set((state) => {
        // Handle backward compatibility for old apiKey
        let newAiConfig = state.aiConfig;
        if (data.aiConfig) {
            newAiConfig = data.aiConfig;
        } else if ((data as any).apiKey) {
            // Migration from old backup
            newAiConfig = {
                ...state.aiConfig,
                keys: { ...state.aiConfig.keys, gemini: (data as any).apiKey }
            };
        }

        return {
            ...state,
            papers: data.papers || state.papers,
            collections: data.collections || state.collections,
            aiConfig: newAiConfig,
            cloudConfig: data.cloudConfig || state.cloudConfig
        };
      })
    }),
    {
      name: 'scholarfeed-storage-v2',
      storage: createJSONStorage(() => idbStorage),
      partialize: (state) => ({ 
        aiConfig: state.aiConfig, 
        papers: state.papers, 
        collections: state.collections,
        language: state.language,
        analysisLanguage: state.analysisLanguage,
        cloudConfig: state.cloudConfig
      }),
      onRehydrateStorage: () => (state) => {
          // Migration logic
          if (state && !state.aiConfig) {
              state.setAiConfig({
                  activeProvider: 'gemini',
                  activeModel: 'gemini-3-pro-preview',
                  keys: { gemini: (state as any).apiKey || '', openai: '', siliconflow: '' },
                  baseUrls: {}
              });
          } else if (state && (state as any).apiKey && !state.aiConfig.keys.gemini) {
              state.updateAiKey('gemini', (state as any).apiKey);
          }
          
          // Ensure keys exist
          if (state && state.aiConfig && !state.aiConfig.keys.siliconflow) {
               state.setAiConfig({
                  keys: { ...state.aiConfig.keys, siliconflow: '' }
               });
          }
      }
    }
  )
);