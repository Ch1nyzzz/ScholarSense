
import React, { useState, useRef, useEffect } from 'react';
import { Book, Star, Archive, Settings, Key, Languages, Folder, Plus, Tag, Hash } from 'lucide-react';
import { useStore } from '../store';

export const Sidebar: React.FC = () => {
  const { 
    toggleSettings, 
    papers, 
    activePaperId, 
    apiKey, 
    language, 
    setLanguage,
    collections,
    activeFilter,
    setFilter,
    createCollection,
  } = useStore();

  const [isCreating, setIsCreating] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const favoriteCount = papers.filter(p => p.isFavorite).length;

  // Focus input when creating starts
  useEffect(() => {
    if (isCreating && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isCreating]);

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'zh' : 'en');
  };

  const startCreating = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsCreating(true);
  };

  const submitCollection = () => {
    if (newCollectionName.trim()) {
      createCollection(newCollectionName.trim());
      setNewCollectionName('');
    }
    setIsCreating(false);
  };

  const cancelCreating = () => {
    setIsCreating(false);
    setNewCollectionName('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      submitCollection();
    } else if (e.key === 'Escape') {
      cancelCreating();
    }
  };

  // Get unique tags
  const allTags: string[] = Array.from(new Set(papers.flatMap(p => p.tags || []) as string[])).sort();

  return (
    <div className="w-64 h-screen bg-white/80 backdrop-blur-md border-r border-gray-200 flex flex-col shrink-0 fixed md:relative z-10">
      <div className="p-6 flex items-center gap-3">
        <div className="w-8 h-8 bg-apple-blue rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/30">
            <Book className="w-5 h-5 text-white" />
        </div>
        <h1 className="font-bold text-lg tracking-tight text-apple-dark">ScholarSense</h1>
      </div>

      <nav className="flex-1 px-4 space-y-1 mt-4 overflow-y-auto">
        {/* Library Section */}
        <div className="px-3 py-2 text-xs font-semibold text-apple-text uppercase tracking-wider">
          Library
        </div>
        
        <button 
            onClick={() => setFilter({ type: 'all' })}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${activeFilter.type === 'all' && !activePaperId ? 'bg-gray-100 text-apple-dark' : 'text-apple-text hover:bg-gray-50'}`}
        >
          <Book className="w-4 h-4" />
          All Papers
          <span className="ml-auto text-xs bg-gray-200 px-2 py-0.5 rounded-full text-gray-600">{papers.length}</span>
        </button>

        <button 
            onClick={() => setFilter({ type: 'favorites' })}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${activeFilter.type === 'favorites' ? 'bg-gray-100 text-apple-dark' : 'text-apple-text hover:bg-gray-50'}`}
        >
          <Star className="w-4 h-4" />
          Favorites
          {favoriteCount > 0 && (
             <span className="ml-auto text-xs bg-gray-200 px-2 py-0.5 rounded-full text-gray-600">{favoriteCount}</span>
          )}
        </button>

        <button 
            onClick={() => setFilter({ type: 'archived' })}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${activeFilter.type === 'archived' ? 'bg-gray-100 text-apple-dark' : 'text-apple-text hover:bg-gray-50'}`}
        >
          <Archive className="w-4 h-4" />
          Archived
        </button>

        {/* Collections Section */}
        <div className="mt-6 px-3 py-2 text-xs font-semibold text-apple-text uppercase tracking-wider flex justify-between items-center group">
          <span>Collections</span>
          <button 
            onClick={startCreating} 
            className="hover:bg-gray-200 rounded-md p-1 transition-colors"
            title="Create Collection"
          >
            <Plus className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        {/* Inline Creation Input */}
        {isCreating && (
          <div className="px-2 py-1 mb-1">
             <input
                ref={inputRef}
                type="text"
                className="w-full px-3 py-1.5 text-sm border border-apple-blue rounded-lg shadow-sm outline-none focus:ring-2 focus:ring-blue-100 bg-white"
                placeholder="Name..."
                value={newCollectionName}
                onChange={(e) => setNewCollectionName(e.target.value)}
                onKeyDown={handleKeyDown}
                onBlur={submitCollection}
             />
          </div>
        )}
        
        {collections.map(collection => (
           <div key={collection.id} className="group flex items-center">
             <button
               onClick={() => setFilter({ type: 'collection', id: collection.id })}
               className={`flex-1 flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${activeFilter.type === 'collection' && activeFilter.id === collection.id ? 'bg-gray-100 text-apple-dark' : 'text-apple-text hover:bg-gray-50'}`}
             >
               <Folder className={`w-4 h-4 ${activeFilter.type === 'collection' && activeFilter.id === collection.id ? 'text-apple-blue' : 'text-gray-400'}`} />
               <span className="truncate max-w-[120px]">{collection.name}</span>
               <span className="ml-auto text-xs text-gray-400">
                 {papers.filter(p => p.collectionIds?.includes(collection.id)).length}
               </span>
             </button>
           </div>
        ))}
        {collections.length === 0 && !isCreating && (
            <div className="px-3 py-2 text-xs text-gray-400 italic">No collections yet</div>
        )}


        {/* Tags Section */}
        <div className="mt-6 px-3 py-2 text-xs font-semibold text-apple-text uppercase tracking-wider">
          Tags
        </div>
        <div className="px-3 space-y-1">
            {allTags.map(tag => (
                <button 
                    key={tag}
                    onClick={() => setFilter({ type: 'tag', id: tag })}
                    className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors ${activeFilter.type === 'tag' && activeFilter.id === tag ? 'bg-blue-50 text-blue-700' : 'text-apple-text hover:bg-gray-50'}`}
                >
                    <Hash className="w-3 h-3 opacity-50" />
                    <span className="truncate">{tag}</span>
                    <span className="ml-auto text-xs text-gray-300">
                        {papers.filter(p => p.tags?.includes(tag)).length}
                    </span>
                </button>
            ))}
            {allTags.length === 0 && (
                <div className="text-xs text-gray-400 italic py-1">Analysis generates tags...</div>
            )}
        </div>
      </nav>

      <div className="p-4 space-y-2 border-t border-gray-200 bg-gray-50/50">
        {/* Language Toggle */}
        <button 
          onClick={toggleLanguage}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-apple-text hover:bg-white transition-colors border border-transparent hover:border-gray-200 hover:shadow-sm"
        >
          <Languages className="w-4 h-4" />
          <span>Language: <span className="font-bold text-apple-dark">{language === 'en' ? 'English' : '中文'}</span></span>
        </button>

        {/* Settings / API Key */}
        {!apiKey ? (
           <button 
             onClick={toggleSettings}
             className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-amber-700 bg-amber-50 border border-amber-200 hover:bg-amber-100 transition-colors animate-pulse"
           >
             <Key className="w-4 h-4" />
             Set API Key
           </button>
        ) : (
           <button 
             onClick={toggleSettings}
             className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-apple-text hover:bg-white transition-colors border border-transparent hover:border-gray-200 hover:shadow-sm"
           >
             <Settings className="w-4 h-4" />
             Settings
           </button>
        )}
      </div>
    </div>
  );
};
