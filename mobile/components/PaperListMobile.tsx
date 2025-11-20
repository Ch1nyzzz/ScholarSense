
import React, { useState, useRef, useEffect } from 'react';
import { useStore } from '../../store'; // Import from root store
import { PaperStatus, Paper } from '../../types';
import { Clock, AlertCircle, ChevronRight, Star, MoreVertical, Trash2, Check, X, Folder, Tag, GripVertical } from 'lucide-react';
import { translations } from '../../i18n';

export const PaperListMobile: React.FC = () => {
  const { 
      papers, 
      openPaper, 
      activeFilter, 
      collections, 
      addPaperToCollection, 
      removePaperFromCollection, 
      addTagToPaper, 
      removeTagFromPaper, 
      deletePaper, 
      toggleFavorite,
      language 
  } = useStore();

  const t = translations[language];
  const [activeActionPaperId, setActiveActionPaperId] = useState<string | null>(null);

  // Quick Drag State
  const [isDragging, setIsDragging] = useState(false);
  const [dragTag, setDragTag] = useState<{label: string, color: string} | null>(null);
  const [dragPos, setDragPos] = useState({ x: 0, y: 0 });
  const [dragTargetId, setDragTargetId] = useState<string | null>(null);
  
  // Ref to track current target without re-binding event listeners
  const dragTargetIdRef = useRef<string | null>(null);

  // Sync ref with state
  useEffect(() => {
    dragTargetIdRef.current = dragTargetId;
  }, [dragTargetId]);

  const PRESET_TAGS = [
    { label: t.tagReadLater, color: 'bg-blue-500' },
    { label: t.tagInProgress, color: 'bg-amber-500' },
    { label: t.tagDone, color: 'bg-green-500' },
    { label: t.tagDeepRead, color: 'bg-purple-500' },
  ];

  // Helper for gradient color mapping (duplicated here to ensure self-contained mobile logic)
  const getTagColorHex = (tagName: string) => {
      if (tagName === t.tagReadLater) return '#3B82F6'; // Blue 500
      if (tagName === t.tagInProgress) return '#F59E0B'; // Amber 500
      if (tagName === t.tagDone) return '#22C55E'; // Green 500
      if (tagName === t.tagDeepRead) return '#A855F7'; // Purple 500
      return null;
  };

  // Filter papers
  const filteredPapers = papers.filter(paper => {
    if (activeFilter.type === 'all') return true;
    if (activeFilter.type === 'favorites') return paper.isFavorite;
    if (activeFilter.type === 'archived') return false;
    if (activeFilter.type === 'collection') return paper.collectionIds?.includes(activeFilter.id!);
    if (activeFilter.type === 'tag') return paper.tags?.includes(activeFilter.id!);
    return true;
  });

  // Sort by date descending
  const sortedPapers = [...filteredPapers].sort((a, b) => b.dateAdded - a.dateAdded);

  const getFilterTitle = () => {
      switch(activeFilter.type) {
          case 'favorites': return t.favorites;
          case 'collection': return collections.find(c => c.id === activeFilter.id)?.name || t.collections;
          case 'tag': return `#${activeFilter.id}`;
          default: return t.allPapers;
      }
  };

  // --- Quick Drag Logic ---

  const startDrag = (clientX: number, clientY: number, tag: typeof PRESET_TAGS[0]) => {
      setIsDragging(true);
      setDragTag(tag);
      setDragPos({ x: clientX, y: clientY });
      setDragTargetId(null);
      dragTargetIdRef.current = null;
  };

  const handleTouchStart = (e: React.TouchEvent, tag: typeof PRESET_TAGS[0]) => {
      const touch = e.touches[0];
      startDrag(touch.clientX, touch.clientY, tag);
  };

  const handleMouseDown = (e: React.MouseEvent, tag: typeof PRESET_TAGS[0]) => {
      e.preventDefault();
      startDrag(e.clientX, e.clientY, tag);
  };

  useEffect(() => {
      if (!isDragging) return;

      const updateDragState = (x: number, y: number) => {
          setDragPos({ x, y });
          
          // Manual Hit Testing using getBoundingClientRect
          const paperCards = document.querySelectorAll('[data-paper-id]');
          let foundId: string | null = null;

          for (let i = 0; i < paperCards.length; i++) {
              const rect = paperCards[i].getBoundingClientRect();
              if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
                  foundId = paperCards[i].getAttribute('data-paper-id');
                  break;
              }
          }
          
          if (foundId !== dragTargetIdRef.current) {
              setDragTargetId(foundId);
          }
      };

      // Touch Handlers
      const handleWindowTouchMove = (e: TouchEvent) => {
          e.preventDefault(); // Prevent scrolling
          const touch = e.touches[0];
          updateDragState(touch.clientX, touch.clientY);
      };

      // Mouse Handlers
      const handleWindowMouseMove = (e: MouseEvent) => {
          e.preventDefault();
          updateDragState(e.clientX, e.clientY);
      };

      const handleEnd = () => {
          // Use ref for latest target to avoid stale closure issues
          const targetId = dragTargetIdRef.current;
          
          if (targetId && dragTag) {
              addTagToPaper(targetId, dragTag.label);
              if (navigator.vibrate) navigator.vibrate(50);
          }
          setIsDragging(false);
          setDragTag(null);
          setDragTargetId(null);
          dragTargetIdRef.current = null;
      };

      window.addEventListener('touchmove', handleWindowTouchMove, { passive: false });
      window.addEventListener('touchend', handleEnd);
      window.addEventListener('mousemove', handleWindowMouseMove);
      window.addEventListener('mouseup', handleEnd);

      return () => {
          window.removeEventListener('touchmove', handleWindowTouchMove);
          window.removeEventListener('touchend', handleEnd);
          window.removeEventListener('mousemove', handleWindowMouseMove);
          window.removeEventListener('mouseup', handleEnd);
      };
  }, [isDragging, dragTag, addTagToPaper]); 


  // --- Standard Handlers ---

  const handleToggleCollection = (paperId: string, collectionId: string, isIncluded: boolean) => {
      if (isIncluded) removePaperFromCollection(paperId, collectionId);
      else addPaperToCollection(paperId, collectionId);
  };

  const handleToggleTag = (paperId: string, tag: string, isIncluded: boolean) => {
      if (isIncluded) removeTagFromPaper(paperId, tag);
      else addTagToPaper(paperId, tag);
  };

  const handleDelete = (paperId: string) => {
      if(confirm(t.confirmDeleteMessage)) {
          deletePaper(paperId);
          setActiveActionPaperId(null);
      }
  };

  const activePaper = activeActionPaperId ? papers.find(p => p.id === activeActionPaperId) : null;

  // Render logic for the left status bar (Mobile)
  const renderStatusBar = (paper: Paper) => {
      // 1. Determine Base Colors from existing tags
      const paperTags = paper.tags || [];
      let activeColors = paperTags.map(getTagColorHex).filter(c => c !== null) as string[];

      // 2. If dragging over THIS paper, add the dragged tag color temporarily
      if (dragTargetId === paper.id && dragTag) {
          const dragColor = getTagColorHex(dragTag.label);
          if (dragColor && !activeColors.includes(dragColor)) {
              activeColors.push(dragColor);
          }
      }

      // 3. Construct Style
      const style: React.CSSProperties = {};
      let className = "absolute left-0 top-0 bottom-0 w-1.5 rounded-l-2xl transition-all duration-200 "; // Faster transition on mobile

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
    <>
        {/* Quick Drag Bar (Compact) */}
        <div className="mb-4 px-1 sticky top-[70px] z-30">
             <div className="flex items-center justify-between bg-white/90 backdrop-blur-md rounded-xl px-4 py-3 shadow-sm border border-gray-200/50">
                 <div className="flex items-center gap-2">
                    <GripVertical className="w-4 h-4 text-apple-blue" />
                    <span className="text-xs font-bold text-apple-dark uppercase tracking-wider">
                        {t.quickDrag}
                    </span>
                 </div>
                 <div className="flex gap-4">
                     {PRESET_TAGS.map(tag => (
                         <div 
                            key={tag.label}
                            className="relative group"
                         >
                             <div 
                                className={`w-6 h-6 rounded-full ${tag.color} ring-2 ring-white shadow-sm cursor-grab active:cursor-grabbing transition-transform active:scale-125`}
                                onTouchStart={(e) => handleTouchStart(e, tag)}
                                onMouseDown={(e) => handleMouseDown(e, tag)}
                                title={tag.label}
                             />
                         </div>
                     ))}
                 </div>
             </div>
        </div>

        {/* Filter Header Info */}
        {activeFilter.type !== 'all' && (
            <div className="flex items-center gap-2 mb-4 px-1">
                {activeFilter.type === 'tag' && <Tag className="w-4 h-4 text-apple-blue" />}
                {activeFilter.type === 'collection' && <Folder className="w-4 h-4 text-apple-blue" />}
                <h2 className="text-lg font-bold text-apple-dark">{getFilterTitle()}</h2>
                <span className="text-xs bg-gray-200 px-2 py-0.5 rounded-full text-gray-600">{sortedPapers.length}</span>
            </div>
        )}

        {/* Paper List */}
        {sortedPapers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <Folder className="w-8 h-8 text-gray-300" />
              </div>
              <p className="font-medium text-gray-600">{t.noPapers}</p>
              {activeFilter.type !== 'all' && (
                  <p className="text-xs mt-2">{t.adjustFilter}</p>
              )}
          </div>
        ) : (
            <div className="space-y-3 pb-20">
            {sortedPapers.map((paper) => (
                <div 
                key={paper.id}
                data-paper-id={paper.id}
                className={`
                    bg-white p-4 rounded-2xl shadow-sm border transition-all duration-200 relative overflow-hidden transform
                    ${paper.status !== PaperStatus.COMPLETED ? 'opacity-80' : ''}
                    ${dragTargetId === paper.id 
                        ? 'border-apple-blue ring-4 ring-apple-blue/20 scale-[1.02] z-20 shadow-lg' 
                        : 'border-gray-100 active:bg-gray-50'}
                `}
                onClick={() => paper.status === PaperStatus.COMPLETED && openPaper(paper.id)}
                >
                    {/* Dynamic Status Bar */}
                    {renderStatusBar(paper)}

                    {/* Drop Overlay Hint - More prominent */}
                    {dragTargetId === paper.id && isDragging && (
                        <div className="absolute inset-0 bg-apple-blue/10 z-20 flex items-center justify-center backdrop-blur-[2px] animate-in fade-in duration-150">
                            <div className={`px-5 py-3 rounded-full font-bold shadow-xl text-white flex items-center gap-2 transform scale-110 ${dragTag?.color}`}>
                                <Tag className="w-5 h-5 fill-current" />
                                <span>{t.dropToAddTag}</span>
                            </div>
                        </div>
                    )}

                    <div className="flex justify-between items-start pl-2">
                        <div className="flex-1 min-w-0 pr-2">
                            <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-bold text-apple-dark text-base leading-snug line-clamp-2">
                                    {paper.analysis ? paper.analysis.title : paper.originalTitle}
                                </h3>
                            </div>
                            
                            <p className="text-xs text-gray-500 line-clamp-1 mb-2">
                                {paper.analysis?.authors?.join(', ') || t.unknownAuthor}
                            </p>

                            <div className="flex items-center gap-2 flex-wrap">
                                {paper.isFavorite && <Star className="w-3 h-3 text-yellow-500 fill-current" />}
                                
                                {paper.status === PaperStatus.ANALYZING && (
                                    <span className="text-xs text-amber-600 flex items-center gap-1 bg-amber-50 px-2 py-0.5 rounded-full">
                                        <Clock className="w-3 h-3 animate-spin" /> {t.aiThinking}
                                    </span>
                                )}
                                {paper.status === PaperStatus.ERROR && (
                                    <span className="text-xs text-red-600 flex items-center gap-1 bg-red-50 px-2 py-0.5 rounded-full">
                                        <AlertCircle className="w-3 h-3" /> {t.error}
                                    </span>
                                )}
                                {paper.tags?.map(tag => (
                                    <span key={tag} className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-md font-medium">
                                        #{tag}
                                    </span>
                                ))}
                            </div>
                        </div>
                        
                        <div className="flex flex-col items-center gap-2 ml-1">
                            <button 
                                onClick={(e) => { e.stopPropagation(); setActiveActionPaperId(paper.id); }}
                                className="p-2 text-gray-400 hover:bg-gray-100 rounded-full active:bg-gray-200"
                            >
                                <MoreVertical className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>
            ))}
            </div>
        )}

        {/* Ghost Drag Element (Follows Finger/Mouse) */}
        {isDragging && dragTag && (
            <div 
                className="fixed z-[100] pointer-events-none flex items-center gap-2 bg-white px-4 py-2.5 rounded-full shadow-2xl border-2 border-white ring-2 ring-black/5"
                style={{ 
                    left: dragPos.x, 
                    top: dragPos.y,
                    transform: 'translate(-50%, -150%)'
                }}
            >
                <div className={`w-3 h-3 rounded-full ${dragTag.color}`}></div>
                <span className="text-sm font-bold text-gray-800">{dragTag.label}</span>
            </div>
        )}

        {/* Quick Actions Sheet (Bottom Modal) */}
        {activeActionPaperId && activePaper && (
            <>
                <div 
                    className="fixed inset-0 bg-black/40 z-[60] animate-in fade-in duration-200" 
                    onClick={() => setActiveActionPaperId(null)}
                />
                <div className="fixed bottom-0 left-0 right-0 bg-white z-[70] rounded-t-3xl shadow-2xl animate-in slide-in-from-bottom duration-300 max-h-[85vh] overflow-y-auto safe-bottom">
                    <div className="p-6 space-y-6">
                        {/* Header */}
                        <div className="flex justify-between items-start border-b border-gray-100 pb-4">
                            <div>
                                <h3 className="font-bold text-lg text-apple-dark line-clamp-1">{activePaper.analysis?.title || activePaper.originalTitle}</h3>
                                <p className="text-xs text-gray-500">Quick Actions</p>
                            </div>
                            <button 
                                onClick={() => setActiveActionPaperId(null)} 
                                className="p-1 bg-gray-100 rounded-full"
                            >
                                <X className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>

                        {/* Quick Tags */}
                        <div>
                             <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">{t.quickDrag} (Tags)</h4>
                             <div className="grid grid-cols-2 gap-3">
                                 {PRESET_TAGS.map(tag => {
                                     const isActive = activePaper.tags?.includes(tag.label);
                                     return (
                                         <button
                                            key={tag.label}
                                            onClick={() => handleToggleTag(activePaper.id, tag.label, !!isActive)}
                                            className={`
                                                flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-bold transition-all border
                                                ${isActive ? 'border-transparent ' + tag.color + ' text-white' : 'bg-gray-50 border-gray-100 text-gray-600'}
                                            `}
                                         >
                                             {tag.label}
                                             {isActive && <Check className="w-4 h-4" />}
                                         </button>
                                     );
                                 })}
                             </div>
                        </div>

                        {/* Collections */}
                        <div>
                            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">{t.collections}</h4>
                            <div className="space-y-2">
                                {collections.map(col => {
                                    const isActive = activePaper.collectionIds?.includes(col.id);
                                    return (
                                        <button
                                            key={col.id}
                                            onClick={() => handleToggleCollection(activePaper.id, col.id, !!isActive)}
                                            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-all ${isActive ? 'border-apple-blue bg-blue-50 text-apple-blue' : 'border-gray-200 bg-white text-gray-700'}`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <Folder className={`w-4 h-4 ${isActive ? 'fill-current' : ''}`} />
                                                <span className="font-medium text-sm">{col.name}</span>
                                            </div>
                                            {isActive && <Check className="w-4 h-4" />}
                                        </button>
                                    );
                                })}
                                {collections.length === 0 && (
                                    <div className="text-center py-4 bg-gray-50 rounded-xl text-sm text-gray-400 italic">
                                        {t.noCollections}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Toggle Favorite */}
                        <div>
                             <button 
                                onClick={() => toggleFavorite(activePaper.id)}
                                className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold border ${activePaper.isFavorite ? 'bg-yellow-50 border-yellow-200 text-yellow-600' : 'bg-white border-gray-200 text-gray-600'}`}
                             >
                                 <Star className={`w-5 h-5 ${activePaper.isFavorite ? 'fill-current' : ''}`} />
                                 {activePaper.isFavorite ? 'Favorited' : 'Add to Favorites'}
                             </button>
                        </div>

                        {/* Delete */}
                        <div className="pt-4 border-t border-gray-100">
                             <button 
                                onClick={() => handleDelete(activePaper.id)}
                                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-red-50 text-red-600 font-bold"
                             >
                                 <Trash2 className="w-5 h-5" />
                                 Delete Paper
                             </button>
                        </div>
                        
                        <div className="h-6"></div>
                    </div>
                </div>
            </>
        )}
    </>
  );
};
