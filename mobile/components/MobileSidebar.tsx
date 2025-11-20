
import React, { useState } from 'react';
import { Book, Star, Archive, Folder, Hash, Plus, X, Languages } from 'lucide-react';
import { useStore } from '../../store';
import { translations } from '../../i18n';

interface MobileSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MobileSidebar: React.FC<MobileSidebarProps> = ({ isOpen, onClose }) => {
  const { 
    papers, 
    collections, 
    activeFilter, 
    setFilter, 
    createCollection, 
    language,
    setLanguage
  } = useStore();
  
  const t = translations[language];
  const [isCreating, setIsCreating] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState('');

  const handleSetFilter = (filter: any) => {
    setFilter(filter);
    onClose();
  };

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'zh' : 'en');
  };

  const submitCollection = () => {
    if (newCollectionName.trim()) {
      createCollection(newCollectionName.trim());
      setNewCollectionName('');
      setIsCreating(false);
    }
  };

  const allTags: string[] = Array.from(new Set(papers.flatMap(p => p.tags || []) as string[])).sort();

  return (
    <>
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 bg-black/30 z-40 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />
      
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 w-[85vw] max-w-[300px] bg-apple-gray z-50 shadow-2xl transform transition-transform duration-300 ease-out flex flex-col ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="p-6 flex items-center justify-between border-b border-gray-100 bg-white/50 backdrop-blur-xl sticky top-0 shrink-0">
            <h2 className="text-xl font-bold text-apple-dark">One Glance</h2>
            <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200">
               <X className="w-6 h-6 text-gray-500" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-6 no-scrollbar">
            {/* Library */}
            <div>
                <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 px-2">{t.library}</div>
                <div className="space-y-1">
                    <button 
                        onClick={() => handleSetFilter({ type: 'all' })}
                        className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-colors ${activeFilter.type === 'all' ? 'bg-white shadow-sm text-apple-blue ring-1 ring-black/5' : 'text-gray-600 active:bg-gray-100'}`}
                    >
                        <Book className="w-5 h-5" /> {t.allPapers}
                        <span className="ml-auto text-xs bg-gray-200 px-2 py-0.5 rounded-full text-gray-600">{papers.length}</span>
                    </button>
                    <button 
                        onClick={() => handleSetFilter({ type: 'favorites' })}
                        className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-colors ${activeFilter.type === 'favorites' ? 'bg-white shadow-sm text-apple-blue ring-1 ring-black/5' : 'text-gray-600 active:bg-gray-100'}`}
                    >
                        <Star className="w-5 h-5" /> {t.favorites}
                    </button>
                    <button 
                        onClick={() => handleSetFilter({ type: 'archived' })}
                        className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-colors ${activeFilter.type === 'archived' ? 'bg-white shadow-sm text-apple-blue ring-1 ring-black/5' : 'text-gray-600 active:bg-gray-100'}`}
                    >
                        <Archive className="w-5 h-5" /> {t.archived}
                    </button>
                </div>
            </div>

            {/* Collections */}
            <div>
                <div className="flex items-center justify-between text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 px-2">
                    <span>{t.collections}</span>
                    <button onClick={() => setIsCreating(!isCreating)} className="p-1 active:bg-gray-200 rounded">
                        <Plus className="w-4 h-4" />
                    </button>
                </div>
                
                {isCreating && (
                    <div className="px-2 mb-2 flex gap-2 animate-in fade-in slide-in-from-top-1">
                        <input 
                            autoFocus
                            className="flex-1 bg-white rounded-lg px-3 py-2 text-sm border border-gray-200 outline-none focus:border-apple-blue focus:ring-2 focus:ring-blue-100"
                            placeholder={t.createCollectionPlaceholder}
                            value={newCollectionName}
                            onChange={e => setNewCollectionName(e.target.value)}
                            onBlur={submitCollection}
                            onKeyDown={e => e.key === 'Enter' && submitCollection()}
                        />
                    </div>
                )}

                <div className="space-y-1">
                    {collections.map(c => (
                        <button 
                            key={c.id}
                            onClick={() => handleSetFilter({ type: 'collection', id: c.id })}
                            className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-colors ${activeFilter.type === 'collection' && activeFilter.id === c.id ? 'bg-white shadow-sm text-apple-blue ring-1 ring-black/5' : 'text-gray-600 active:bg-gray-100'}`}
                        >
                            <Folder className="w-5 h-5" /> 
                            <span className="truncate flex-1 text-left">{c.name}</span>
                            <span className="text-xs text-gray-400">
                                {papers.filter(p => p.collectionIds?.includes(c.id)).length}
                            </span>
                        </button>
                    ))}
                    {collections.length === 0 && !isCreating && (
                        <div className="px-3 text-sm text-gray-400 italic py-2">{t.noCollections}</div>
                    )}
                </div>
            </div>

            {/* Tags */}
            <div>
                <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 px-2">{t.allTags}</div>
                <div className="space-y-1">
                    {allTags.map(tag => (
                        <button 
                            key={tag}
                            onClick={() => handleSetFilter({ type: 'tag', id: tag })}
                            className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${activeFilter.type === 'tag' && activeFilter.id === tag ? 'bg-white shadow-sm text-apple-blue ring-1 ring-black/5' : 'text-gray-600 active:bg-gray-100'}`}
                        >
                            <Hash className="w-4 h-4 opacity-60" /> 
                            <span className="truncate flex-1 text-left">{tag}</span>
                            <span className="text-xs text-gray-400">
                                {papers.filter(p => p.tags?.includes(tag)).length}
                            </span>
                        </button>
                    ))}
                    {allTags.length === 0 && (
                        <div className="px-3 text-sm text-gray-400 italic py-2">{t.noTags}</div>
                    )}
                </div>
            </div>
          </div>

          {/* Footer / Language Toggle */}
          <div className="p-4 border-t border-gray-200 bg-gray-50">
             <button 
                onClick={toggleLanguage}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white border border-gray-200 rounded-xl shadow-sm text-apple-dark font-medium active:bg-gray-100 transition-colors"
             >
                <Languages className="w-4 h-4 text-gray-500" />
                <span>{language === 'en' ? 'English' : '中文'}</span>
             </button>
          </div>
      </div>
    </>
  );
};