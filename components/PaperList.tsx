import React from 'react';
import { useStore } from '../store';
import { PaperStatus } from '../types';
import { FileText, AlertCircle, Clock, CheckCircle2, ChevronRight, Trash2, Star } from 'lucide-react';

export const PaperList: React.FC = () => {
  const { papers, openPaper, deletePaper, toggleFavorite } = useStore();

  const formatDate = (timestamp: number) => {
    return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(new Date(timestamp));
  };

  if (papers.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-gray-300" />
        </div>
        <h3 className="text-lg font-medium text-gray-900">No papers yet</h3>
        <p className="text-gray-500 text-sm max-w-xs mx-auto mt-1">
          Upload a PDF to get started with your AI-powered analysis.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-20">
      {papers.map((paper) => (
        <div 
          key={paper.id}
          className="group bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-lg hover:scale-[1.005] transition-all duration-300 cursor-pointer relative overflow-hidden"
          onClick={() => paper.status === PaperStatus.COMPLETED && openPaper(paper.id)}
        >
           {/* Status Indicator Line */}
           <div className={`absolute left-0 top-0 bottom-0 w-1 ${
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

            <div className="flex flex-col items-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
               <button 
                onClick={(e) => { e.stopPropagation(); toggleFavorite(paper.id); }}
                className={`p-2 rounded-full hover:bg-gray-100 ${paper.isFavorite ? 'text-yellow-500 opacity-100' : 'text-gray-400'}`}
               >
                 <Star className={`w-4 h-4 ${paper.isFavorite ? 'fill-current' : ''}`} />
               </button>
               <button 
                onClick={(e) => { e.stopPropagation(); deletePaper(paper.id); }}
                className="p-2 rounded-full hover:bg-red-50 text-gray-400 hover:text-red-500"
               >
                 <Trash2 className="w-4 h-4" />
               </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};