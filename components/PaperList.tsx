
import React, { useState } from 'react';
import { useStore } from '../store';
import { PaperStatus, Paper } from '../types';
import { FileText, AlertCircle, Clock, CheckCircle2, Trash2, Star, FolderPlus, MoreVertical, Tag, Folder, X } from 'lucide-react';
import { translations } from '../i18n';

export const PaperList: React.FC = () => {
  const { 
      papers, 
      openPaper, 
      deletePaper, 
      toggleFavorite, 
      activeFilter, 
      collections, 
      addPaperToCollection, 
      removePaperFromCollection, 
      setFilter,
      addTagToPaper,
      removeTagFromPaper,
      language,
      draggingTag // Use global dragging state
  } = useStore();

  const t = translations[language];
  
  // Local state for managing the "Add to Collection" dropdown
  const [managingPaperId, setManagingPaperId] = useState<string | null>(null);
  const [dragOverPaperId, setDragOverPaperId] = useState<string | null>(null);

  const filteredPapers = papers.filter(paper => {
    if (activeFilter.type === 'all') return true;
    if (activeFilter.type === 'favorites') return paper.isFavorite;
    if (activeFilter.type === 'archived') return false; // Placeholder implementation
    if (activeFilter.type === 'collection') return paper.collectionIds?.includes(activeFilter.id!);
    if (activeFilter.type === 'tag') return paper.tags?.includes(activeFilter.id!);
    return true;
  });

  const getFilterTitle = () => {
    switch(activeFilter.type) {
        case 'favorites': return t.favorites;
        case 'archived': return t.archived;
        case 'collection': return collections.find(c => c.id === activeFilter.id)?.name || t.collections;
        case 'tag': return `#${activeFilter.id}`;
        default: return t.allPapers; // Explicitly returns "All Papers" or "全部文献"
    }
  };

  const getTagStyle = (tagName: string) => {
    if (tagName === t.tagReadLater) return 'bg-blue-50 text-blue-700 border-blue-100';
    if (tagName === t.tagInProgress) return 'bg-amber-50 text-amber-700 border-amber-100';
    if (tagName === t.tagDone) return 'bg-green-50 text-green-700 border-green-100';
    if (tagName === t.tagDeepRead) return 'bg-purple-50 text-purple-700 border-purple-100';
    return 'bg-gray-100 text-gray-600 border-gray-200';
  };

  const getTagColorHex = (tagName: string) => {
      if (tagName === t.tagReadLater) return '#3B82F6'; // Blue 500
      if (tagName === t.tagInProgress) return '#F59E0B'; // Amber 500
      if (tagName === t.tagDone) return '#22C55E'; // Green 500
      if (tagName === t.tagDeepRead) return '#A855F7'; // Purple 500
      return null;
  };

  const formatDate = (timestamp: number) => {
    return new Intl.DateTimeFormat(language === 'zh' ? 'zh-CN' : 'en-US', { month: 'short', day: 'numeric' }).format(new Date(timestamp));
  };

  const handleCollectionToggle = (paperId: string, collectionId: string, isIncluded: boolean) => {
      if (isIncluded) {
          removePaperFromCollection(paperId, collectionId);
      } else {
          addPaperToCollection(paperId, collectionId);
      }
  };

  const handleDelete = (e: React.MouseEvent, paperId: string) => {
      e.stopPropagation();
      if (window.confirm(t.confirmDeleteMessage)) {
          deletePaper(paperId);
      }
  };

  // Drag and Drop Handlers
  const handleDragOver = (e: React.DragEvent, paperId: string) => {
      e.preventDefault(); // Necessary to allow dropping
      if (dragOverPaperId !== paperId) {
          setDragOverPaperId(paperId);
      }
  };

  const handleDragLeave = (e: React.DragEvent) => {
      setDragOverPaperId(null);
  };

  const handleDrop = (e: React.DragEvent, paperId: string) => {
      e.preventDefault();
      setDragOverPaperId(null);
      const tag = e.dataTransfer.getData("scholar-tag");
      if (tag) {
          addTagToPaper(paperId, tag);
      }
  };

  // Render logic for the left status bar
  const renderStatusBar = (paper: Paper) => {
      // 1. Determine Base Colors from existing tags
      const paperTags = paper.tags || [];
      let activeColors = paperTags.map(getTagColorHex).filter(c => c !== null) as string[];

      // 2. If dragging over THIS paper, add the dragging tag color temporarily
      if (dragOverPaperId === paper.id && draggingTag) {
          const dragColor = getTagColorHex(draggingTag);
          if (dragColor && !activeColors.includes(dragColor)) {
              activeColors.push(dragColor);
          }
      }

      // 3. Construct Style
      const style: React.CSSProperties = {};
      let className = "absolute left-0 top-0 bottom-0 w-1.5 rounded-l-2xl transition-all duration-300 ";

      if (activeColors.length > 0) {
          // Use Gradient if multiple, or single color
          if (activeColors.length === 1) {
              style.backgroundColor = activeColors[0];
          } else {
              style.background = `linear-gradient(to bottom, ${activeColors.join(', ')})`;
          }
      } else {
          // Fallback to Status Color
          if (paper.status === PaperStatus.COMPLETED) className += "bg-apple-blue";
          else if (paper.status === PaperStatus.ERROR) className += "bg-red-500";
          else className += "bg-amber-400 animate-pulse";
      }

      return <div className={className} style={style} />;
  };

  return (
    <div className="pb-20" onClick={() => setManagingPaperId(null)}>
      <header className="mb-8">
         <div className="flex items-center gap-2 mb-1">
             {activeFilter.type === 'tag' && <Tag className="w-5 h-5 text-apple-blue" />}
             {activeFilter.type === 'collection' && <Folder className="w-5 h-5 text-apple-blue" />}
             <h2 className="text-2xl font-bold text-apple-dark">{getFilterTitle()}</h2>
         </div>
         <p className="text-gray-500 text-sm">
            {filteredPapers.length} {filteredPapers.length === 1 ? t.paperFound : t.papersFound}
         </p>
      </header>

      {filteredPapers.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-gray-300" />
          </div>
          <h3 className="text-lg font-medium text-gray-900">{t.noPapers}</h3>
          <p className="text-gray-500 text-sm max-w-xs mx-auto mt-1">
            {activeFilter.type === 'all' ? t.uploadToStart : t.adjustFilter}
          </p>
          {activeFilter.type !== 'all' && (
              <button onClick={() => setFilter({ type: 'all' })} className="mt-4 text-apple-blue text-sm font-medium hover:underline">
                  {t.viewAll}
              </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredPapers.map((paper) => (
            <div 
              key={paper.id}
              className={`
                group bg-white rounded-2xl p-5 shadow-sm border transition-all duration-300 cursor-pointer relative overflow-visible
                ${dragOverPaperId === paper.id ? 'border-apple-blue ring-2 ring-apple-blue/20 scale-[1.01]' : 'border-gray-100 hover:shadow-lg hover:scale-[1.005]'}
              `}
              onClick={() => paper.status === PaperStatus.COMPLETED && openPaper(paper.id)}
              onDragOver={(e) => handleDragOver(e, paper.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, paper.id)}
            >
              {/* Dynamic Status/Tag Bar */}
              {renderStatusBar(paper)}

              <div className="flex items-start justify-between pl-3">
                <div className="flex-1 min-w-0 pr-4">
                  {/* Title Area */}
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-base font-bold text-apple-dark truncate">
                      {paper.analysis ? paper.analysis.title : paper.originalTitle}
                    </h3>
                  </div>

                  {/* Authors & Meta */}
                  <div className="text-sm text-gray-500 mb-3 truncate">
                    {paper.analysis?.authors?.join(', ') || t.unknownAuthor} • {formatDate(paper.dateAdded)}
                  </div>
                  
                  {/* Tags & Collections Pills */}
                  <div className="flex flex-wrap gap-2 mb-3">
                     {paper.collectionIds?.map(cid => {
                         const col = collections.find(c => c.id === cid);
                         if (!col) return null;
                         return (
                             <span key={cid} className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-blue-50 text-blue-700">
                                 <Folder className="w-3 h-3 mr-1" /> {col.name}
                             </span>
                         );
                     })}
                     {paper.tags?.map(tag => (
                         <span key={tag} className={`group/tag inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium border ${getTagStyle(tag)}`}>
                             # {tag}
                             <button 
                                onClick={(e) => { e.stopPropagation(); removeTagFromPaper(paper.id, tag); }}
                                className="ml-1 hover:text-red-500 opacity-0 group-hover/tag:opacity-100 transition-opacity"
                             >
                                 <X className="w-3 h-3" />
                             </button>
                         </span>
                     ))}
                  </div>

                  {/* Status Pill */}
                  <div className="flex items-center gap-3">
                    <span className={`
                      inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium
                      ${paper.status === PaperStatus.COMPLETED ? 'bg-green-50 text-green-700' : 
                        paper.status === PaperStatus.ERROR ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'}
                    `}>
                      {paper.status === PaperStatus.COMPLETED && <CheckCircle2 className="w-3 h-3" />}
                      {paper.status === PaperStatus.ANALYZING && <Clock className="w-3 h-3 animate-spin" />}
                      {paper.status === PaperStatus.ERROR && <AlertCircle className="w-3 h-3" />}
                      {paper.status === PaperStatus.EXTRACTING ? t.readingPdf : 
                      paper.status === PaperStatus.ANALYZING ? t.aiThinking :
                      paper.status === PaperStatus.COMPLETED ? t.analyzed : t.error}
                    </span>
                    
                    {paper.status === PaperStatus.ERROR && (
                        <span className="text-xs text-red-500 truncate max-w-[200px]">{paper.errorMessage}</span>
                    )}
                  </div>
                </div>

                {/* Hover Actions */}
                <div className="flex flex-col items-end gap-2">
                   <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-white/80 backdrop-blur-sm p-1 rounded-lg shadow-sm border border-gray-100">
                       <button 
                        onClick={(e) => { e.stopPropagation(); toggleFavorite(paper.id); }}
                        className={`p-2 rounded-md hover:bg-gray-100 ${paper.isFavorite ? 'text-yellow-500' : 'text-gray-400'}`}
                        title="Favorite"
                       >
                         <Star className={`w-4 h-4 ${paper.isFavorite ? 'fill-current' : ''}`} />
                       </button>
                       
                       <div className="relative">
                           <button 
                            onClick={(e) => { e.stopPropagation(); setManagingPaperId(managingPaperId === paper.id ? null : paper.id); }}
                            className={`p-2 rounded-md hover:bg-gray-100 ${managingPaperId === paper.id ? 'bg-gray-100 text-apple-dark' : 'text-gray-400'}`}
                            title="Add to Collection"
                           >
                             <FolderPlus className="w-4 h-4" />
                           </button>
                           
                           {/* Collection Dropdown */}
                           {managingPaperId === paper.id && (
                               <div 
                                   className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 z-50 p-2 animate-in fade-in slide-in-from-top-2"
                                   onClick={(e) => e.stopPropagation()}
                               >
                                   <div className="text-xs font-semibold text-gray-500 uppercase px-2 py-1 mb-1">{t.moveTo}</div>
                                   {collections.length === 0 ? (
                                       <div className="text-sm text-gray-400 px-2 py-1 italic">{t.noCollections}</div>
                                   ) : (
                                       collections.map(col => {
                                           const isIncluded = paper.collectionIds?.includes(col.id);
                                           return (
                                               <button
                                                   key={col.id}
                                                   onClick={() => handleCollectionToggle(paper.id, col.id, !!isIncluded)}
                                                   className="w-full text-left px-2 py-1.5 text-sm rounded-lg hover:bg-gray-50 flex items-center gap-2"
                                               >
                                                   <div className={`w-4 h-4 rounded border flex items-center justify-center ${isIncluded ? 'bg-apple-blue border-apple-blue' : 'border-gray-300'}`}>
                                                       {isIncluded && <CheckCircle2 className="w-3 h-3 text-white" />}
                                                   </div>
                                                   <span className="truncate text-apple-dark">{col.name}</span>
                                               </button>
                                           );
                                       })
                                   )}
                               </div>
                           )}
                       </div>

                       <button 
                        onClick={(e) => handleDelete(e, paper.id)}
                        className="p-2 rounded-md hover:bg-red-50 text-gray-400 hover:text-red-500"
                        title="Delete"
                       >
                         <Trash2 className="w-4 h-4" />
                       </button>
                   </div>
                </div>
              </div>
              
              {/* Drag Overlay Hint */}
              {dragOverPaperId === paper.id && (
                 <div className="absolute inset-0 bg-apple-blue/5 rounded-2xl flex items-center justify-center pointer-events-none z-10">
                    <div className="bg-white px-3 py-1 rounded-full shadow-sm text-apple-blue text-xs font-bold flex items-center gap-1">
                        <Tag className="w-3 h-3" /> {t.dropToAddTag}
                    </div>
                 </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
