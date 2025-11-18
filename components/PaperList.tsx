
import React, { useState } from 'react';
import { useStore } from '../store';
import { PaperStatus, Paper } from '../types';
import { FileText, AlertCircle, Clock, CheckCircle2, Trash2, Star, FolderPlus, MoreVertical, Tag, Folder } from 'lucide-react';

export const PaperList: React.FC = () => {
  const { papers, openPaper, deletePaper, toggleFavorite, activeFilter, collections, addPaperToCollection, removePaperFromCollection, setFilter } = useStore();
  
  // Local state for managing the "Add to Collection" dropdown
  const [managingPaperId, setManagingPaperId] = useState<string | null>(null);

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
        case 'favorites': return 'Favorites';
        case 'archived': return 'Archived';
        case 'collection': return collections.find(c => c.id === activeFilter.id)?.name || 'Collection';
        case 'tag': return `#${activeFilter.id}`;
        default: return 'Inbox';
    }
  };

  const formatDate = (timestamp: number) => {
    return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(new Date(timestamp));
  };

  const handleCollectionToggle = (paperId: string, collectionId: string, isIncluded: boolean) => {
      if (isIncluded) {
          removePaperFromCollection(paperId, collectionId);
      } else {
          addPaperToCollection(paperId, collectionId);
      }
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
            {filteredPapers.length} {filteredPapers.length === 1 ? 'paper' : 'papers'} found
         </p>
      </header>

      {filteredPapers.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-gray-300" />
          </div>
          <h3 className="text-lg font-medium text-gray-900">No papers found</h3>
          <p className="text-gray-500 text-sm max-w-xs mx-auto mt-1">
            {activeFilter.type === 'all' ? "Upload a PDF to get started." : "Try adjusting your filters."}
          </p>
          {activeFilter.type !== 'all' && (
              <button onClick={() => setFilter({ type: 'all' })} className="mt-4 text-apple-blue text-sm font-medium hover:underline">
                  View All Papers
              </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredPapers.map((paper) => (
            <div 
              key={paper.id}
              className="group bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-lg hover:scale-[1.005] transition-all duration-300 cursor-pointer relative overflow-visible"
              onClick={() => paper.status === PaperStatus.COMPLETED && openPaper(paper.id)}
            >
              {/* Status Indicator Line */}
              <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl ${
                  paper.status === PaperStatus.COMPLETED ? 'bg-apple-blue' : 
                  paper.status === PaperStatus.ERROR ? 'bg-red-500' : 'bg-amber-400 animate-pulse'
              }`} />

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
                    {paper.analysis?.authors?.join(', ') || "Unknown Author"} • Added {formatDate(paper.dateAdded)}
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
                     {paper.tags?.slice(0, 3).map(tag => (
                         <span key={tag} className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-600">
                             # {tag}
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
                      {paper.status === PaperStatus.EXTRACTING ? 'Reading PDF...' : 
                      paper.status === PaperStatus.ANALYZING ? 'AI Thinking...' :
                      paper.status === PaperStatus.COMPLETED ? 'Analyzed' : 'Error'}
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
                                   <div className="text-xs font-semibold text-gray-500 uppercase px-2 py-1 mb-1">Move to...</div>
                                   {collections.length === 0 ? (
                                       <div className="text-sm text-gray-400 px-2 py-1 italic">No collections</div>
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
                        onClick={(e) => { e.stopPropagation(); deletePaper(paper.id); }}
                        className="p-2 rounded-md hover:bg-red-50 text-gray-400 hover:text-red-500"
                        title="Delete"
                       >
                         <Trash2 className="w-4 h-4" />
                       </button>
                   </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
