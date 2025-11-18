import React from 'react';
import { Book, Star, Archive, Settings, Key, Languages } from 'lucide-react';
import { useStore } from '../store';

export const Sidebar: React.FC = () => {
  const { toggleSettings, papers, activePaperId, closeReader, apiKey, language, setLanguage } = useStore();

  const favoriteCount = papers.filter(p => p.isFavorite).length;

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'zh' : 'en');
  };

  return (
    <div className="w-64 h-screen bg-white/80 backdrop-blur-md border-r border-gray-200 flex flex-col shrink-0 fixed md:relative z-10">
      <div className="p-6 flex items-center gap-3">
        <div className="w-8 h-8 bg-apple-blue rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/30">
            <Book className="w-5 h-5 text-white" />
        </div>
        <h1 className="font-bold text-lg tracking-tight text-apple-dark">ScholarSense</h1>
      </div>

      <nav className="flex-1 px-4 space-y-1 mt-4">
        <div className="px-3 py-2 text-xs font-semibold text-apple-text uppercase tracking-wider">
          Library
        </div>
        
        <button 
            onClick={closeReader}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${!activePaperId ? 'bg-gray-100 text-apple-dark' : 'text-apple-text hover:bg-gray-50'}`}
        >
          <Book className="w-4 h-4" />
          All Papers
          <span className="ml-auto text-xs bg-gray-200 px-2 py-0.5 rounded-full text-gray-600">{papers.length}</span>
        </button>

        <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-apple-text hover:bg-gray-50 transition-colors">
          <Star className="w-4 h-4" />
          Favorites
          {favoriteCount > 0 && (
             <span className="ml-auto text-xs bg-gray-200 px-2 py-0.5 rounded-full text-gray-600">{favoriteCount}</span>
          )}
        </button>

        <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-apple-text hover:bg-gray-50 transition-colors">
          <Archive className="w-4 h-4" />
          Archived
        </button>

        <div className="mt-8 px-3 py-2 text-xs font-semibold text-apple-text uppercase tracking-wider">
          Tags
        </div>
        <div className="px-3">
            <div className="flex items-center gap-2 text-sm text-apple-text py-1">
                <div className="w-2 h-2 rounded-full bg-red-400"></div>
                Critical
            </div>
            <div className="flex items-center gap-2 text-sm text-apple-text py-1">
                <div className="w-2 h-2 rounded-full bg-green-400"></div>
                Completed
            </div>
             <div className="flex items-center gap-2 text-sm text-apple-text py-1">
                <div className="w-2 h-2 rounded-full bg-purple-400"></div>
                To Read
            </div>
        </div>
      </nav>

      <div className="p-4 space-y-2 border-t border-gray-200">
        {/* Language Toggle */}
        <button 
          onClick={toggleLanguage}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-apple-text hover:bg-gray-50 transition-colors"
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
             className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-apple-text hover:bg-gray-50 transition-colors"
           >
             <Settings className="w-4 h-4" />
             Settings
           </button>
        )}
      </div>
    </div>
  );
};