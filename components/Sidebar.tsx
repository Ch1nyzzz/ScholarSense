
import React, { useState, useRef, useEffect } from 'react';
import { Book, Star, Archive, Settings, Key, Languages, Folder, Plus, Tag, Hash, GripVertical, Cloud, AlertCircle, RotateCw, Smartphone } from 'lucide-react';
import { useStore } from '../store';
import { translations } from '../i18n';

const Logo = () => (
  <svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-apple-dark">
    <path d="M9 11V29" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
    <path d="M9 11C9 11 14 5 22 5C30 5 28 12 24 15C20 18 9 20 9 20C9 20 5 24 9 30C13 36 28 35 28 35" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M28 14V35" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
  </svg>
);

export const Sidebar: React.FC = () => {
  const { 
    toggleSettings, 
    papers, 
    activePaperId, 
    aiConfig, 
    language, 
    setLanguage,
    collections,
    activeFilter,
    setFilter,
    createCollection,
    cloudConfig,
    cloudSyncError,
    refreshLibrary,
    isSyncing,
    setMobilePreview,
    setDraggingTag // Destructure new action
  } = useStore();

  const t = translations[language];

  const PRESET_TAGS = [
    { label: t.tagReadLater, color: 'bg-blue-500' },
    { label: t.tagInProgress, color: 'bg-amber-500' },
    { label: t.tagDone, color: 'bg-green-500' },
    { label: t.tagDeepRead, color: 'bg-purple-500' },
  ];

  const [isCreating, setIsCreating] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const favoriteCount = papers.filter(p => p.isFavorite).length;

  // Check if the ACTIVE provider has a key set
  const hasActiveKey = !!aiConfig.keys[aiConfig.activeProvider];

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

  const handleDragStart = (e: React.DragEvent, tag: string) => {
      e.dataTransfer.setData("scholar-tag", tag);
      e.dataTransfer.effectAllowed = "copy";
      setDraggingTag(tag); // Update global state
  };

  const handleDragEnd = () => {
      setDraggingTag(null); // Reset global state
  };

  const handleManualSync = (e: React.MouseEvent) => {
      e.stopPropagation();
      refreshLibrary();
  };

  // Get unique tags
  const allTags: string[] = Array.from(new Set(papers.flatMap(p => p.tags || []) as string[])).sort();

  return (
    <div className="w-64 h-screen bg-white/80 backdrop-blur-md border-r border-gray-200 flex flex-col shrink-0 fixed md:relative z-10">
      <div className="p-6 flex items-center gap-3">
        <div className="flex items-center justify-center">
            <Logo />
        </div>
        <h1 className="font-bold text-lg tracking-tight text-apple-dark">One Glance</h1>
      </div>

      <nav className="flex-1 px-4 space-y-1 mt-4 overflow-y-auto">
        {/* Library Section */}
        <div className="px-3 py-2 text-xs font-semibold text-apple-text uppercase tracking-wider">
          {t.library}
        </div>
        
        <button 
            onClick={() => setFilter({ type: 'all' })}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${activeFilter.type === 'all' && !activePaperId ? 'bg-gray-100 text-apple-dark' : 'text-apple-text hover:bg-gray-50'}`}
        >
          <Book className="w-4 h-4" />
          {t.allPapers}
          <span className="ml-auto text-xs bg-gray-200 px-2 py-0.5 rounded-full text-gray-600">{papers.length}</span>
        </button>

        <button 
            onClick={() => setFilter({ type: 'favorites' })}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${activeFilter.type === 'favorites' ? 'bg-gray-100 text-apple-dark' : 'text-apple-text hover:bg-gray-50'}`}
        >
          <Star className="w-4 h-4" />
          {t.favorites}
          {favoriteCount > 0 && (
             <span className="ml-auto text-xs bg-gray-200 px-2 py-0.5 rounded-full text-gray-600">{favoriteCount}</span>
          )}
        </button>

        <button 
            onClick={() => setFilter({ type: 'archived' })}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${activeFilter.type === 'archived' ? 'bg-gray-100 text-apple-dark' : 'text-apple-text hover:bg-gray-50'}`}
        >
          <Archive className="w-4 h-4" />
          {t.archived}
        </button>

        {/* Collections Section */}
        <div className="mt-6 px-3 py-2 text-xs font-semibold text-apple-text uppercase tracking-wider flex justify-between items-center group">
          <span>{t.collections}</span>
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
                placeholder={t.createCollectionPlaceholder}
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
            <div className="px-3 py-2 text-xs text-gray-400 italic">{t.noCollections}</div>
        )}

        {/* Quick Drag Section (New Design) */}
        <div className="mt-6 px-3 py-2 text-xs font-semibold text-apple-text uppercase tracking-wider">
            {t.quickDrag}
        </div>
        <div className="px-3 space-y-1 mb-4">
            {PRESET_TAGS.map(tag => (
                <div
                    key={tag.label}
                    draggable
                    onDragStart={(e) => handleDragStart(e, tag.label)}
                    onDragEnd={handleDragEnd}
                    className="group flex items-center gap-3 px-2 py-1.5 rounded-md hover:bg-gray-100 cursor-move transition-colors select-none"
                >
                    <div className={`w-2.5 h-2.5 rounded-full ${tag.color} ring-1 ring-offset-1 ring-transparent group-hover:ring-gray-200 transition-all`} />
                    <span className="text-sm text-gray-600 group-hover:text-apple-dark font-medium">{tag.label}</span>
                    <GripVertical className="w-3 h-3 text-gray-300 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
            ))}
        </div>

        {/* All Tags Section */}
        <div className="px-3 py-2 text-xs font-semibold text-apple-text uppercase tracking-wider">
          {t.allTags}
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
                <div className="text-xs text-gray-400 italic py-1">{t.noTags}</div>
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
          <span>{t.languageLabel}: <span className="font-bold text-apple-dark">{language === 'en' ? 'English' : '中文'}</span></span>
        </button>

        {/* Settings & Sync Controls */}
        <div className="flex items-center gap-2">
            <button 
                onClick={toggleSettings}
                className="flex-1 flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-apple-text hover:bg-white transition-colors border border-transparent hover:border-gray-200 hover:shadow-sm"
            >
                <Settings className={`w-4 h-4 ${!hasActiveKey ? 'text-amber-500' : ''}`} />
                <span className="truncate">{t.settings}</span>
            </button>

            {/* Sync Status/Trigger Button */}
            {cloudConfig.isEnabled && (
                <button 
                    onClick={handleManualSync}
                    disabled={isSyncing}
                    title={language === 'zh' ? "点击手动同步" : "Click to Sync"}
                    className="flex items-center justify-center w-9 h-9 rounded-lg hover:bg-white transition-colors border border-transparent hover:border-gray-200 hover:shadow-sm text-apple-text"
                >
                    {isSyncing ? (
                        <RotateCw className="w-4 h-4 animate-spin text-apple-blue" />
                    ) : cloudSyncError ? (
                        <div className="relative">
                             <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full border border-white"></div>
                             <Cloud className="w-4 h-4 text-red-500" />
                        </div>
                    ) : (
                        <div className="relative">
                             <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full border border-white"></div>
                             <Cloud className="w-4 h-4 text-green-600" />
                        </div>
                    )}
                </button>
            )}
        </div>

        {/* Mobile View Link (Changed to Button) */}
        <button 
            onClick={() => setMobilePreview(true)}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-apple-text hover:bg-white transition-colors border border-transparent hover:border-gray-200 hover:shadow-sm"
            title={language === 'zh' ? '预览手机版' : 'Preview Mobile Version'}
        >
            <Smartphone className="w-4 h-4" />
            <span>{language === 'zh' ? '手机版预览' : 'Mobile View'}</span>
        </button>
      </div>
    </div>
  );
};