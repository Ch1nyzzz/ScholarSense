
import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { useStore } from '../store';
import { ArrowLeft, Share, MessageSquare, Bookmark, X, Save, Eye, EyeOff, FileText, ExternalLink } from 'lucide-react';
import { translations } from '../i18n';

export const ReaderView: React.FC = () => {
  const { papers, activePaperId, closeReader, language, toggleFavorite, updatePaperNotes } = useStore();
  const paper = papers.find(p => p.id === activePaperId);
  const t = translations[language];
  
  // State for Notes Panel
  const [showNotes, setShowNotes] = useState(false);
  const [showPdf, setShowPdf] = useState(false);
  const [localNotes, setLocalNotes] = useState('');
  const [pdfDisplayUrl, setPdfDisplayUrl] = useState<string | null>(null);
  
  // Initialize notes from store when panel opens or paper changes
  useEffect(() => {
    if (paper) setLocalNotes(paper.userNotes || '');
  }, [paper]);

  // Effect to create object URL from stored Base64 Data
  useEffect(() => {
      if (paper?.pdfData) {
          fetch(paper.pdfData)
            .then(res => res.blob())
            .then(blob => {
                const url = URL.createObjectURL(blob);
                setPdfDisplayUrl(url);
                return () => URL.revokeObjectURL(url);
            })
            .catch(err => console.error("Error converting PDF data:", err));
      } else if (paper?.pdfUrl) {
          // Fallback for legacy legacy session data (should generally not happen with persistence change)
          setPdfDisplayUrl(paper.pdfUrl);
      }
      
      return () => {
          if (pdfDisplayUrl && pdfDisplayUrl.startsWith('blob:')) {
              URL.revokeObjectURL(pdfDisplayUrl);
          }
      };
  }, [paper?.id, paper?.pdfData]);

  if (!paper || !paper.analysis) return null;

  const { analysis } = paper;

  const handleShare = () => {
    const text = `${analysis.title}\n\n${analysis.research_conclusion}\n\nAnalyzed by ScholarSense`;
    navigator.clipboard.writeText(text).then(() => {
        alert(t.copied);
    });
  };

  const handleSaveNotes = () => {
    if (activePaperId) {
        updatePaperNotes(activePaperId, localNotes);
    }
  };

  const headers = {
    background: language === 'zh' ? "研究背景" : "Research Background",
    motivation: language === 'zh' ? "研究动机" : "Motivation",
    conclusion: language === 'zh' ? "研究结论" : "Conclusion",
    methodology: language === 'zh' ? "数学表示及建模" : "Methodology & Math",
    implementation: language === 'zh' ? "实验方法与复现" : "Implementation Details",
    results: language === 'zh' ? "实验结果及结论" : "Evaluation & Results",
    critique: language === 'zh' ? "犀利锐评" : "Reviewer Critique",
    oneMoreThing: language === 'zh' ? "One More Thing" : "One More Thing",
  };

  // Pre-process content to ensure LaTeX delimiters are handled correctly by remark-math
  const preprocessContent = (content: string) => {
    if (!content) return "";
    return content
      // Normalize newlines
      .replace(/\r\n/g, '\n')
      // Replace \[ ... \] with $$ ... $$
      .replace(/\\\[([\s\S]*?)\\\]/g, '$$$1$$')
      // Replace \( ... \) with $ ... $
      .replace(/\\\(([\s\S]*?)\\\)/g, '$$$1$$')
      // Ensure block math has newlines around it for cleaner rendering
      .replace(/\$\$/g, '\n$$$\n');
  };

  const Section: React.FC<{ title: string; content: string; className?: string; theme?: 'default' | 'success' | 'warning' }> = ({ 
    title, 
    content, 
    className = "",
    theme = 'default' 
  }) => {
    let bgClass = "";
    let titleColor = "text-apple-dark";
    let proseColor = "prose-slate text-gray-600";

    if (theme === 'success') {
        bgClass = "bg-green-50/50 border border-green-100 rounded-3xl p-8";
        titleColor = "text-green-900";
        proseColor = "prose-sm text-green-800";
    } else if (theme === 'warning') {
        bgClass = "bg-amber-50/50 border border-amber-100 rounded-3xl p-8";
        titleColor = "text-amber-900";
        proseColor = "prose-sm text-amber-800";
    }

    const processedContent = preprocessContent(content);

    return (
      <div className={`mb-12 ${bgClass} ${className}`}>
        <h3 className={`text-xl font-bold ${titleColor} mb-4 tracking-tight`}>{title}</h3>
        <div className={`prose ${proseColor} max-w-none leading-relaxed font-serif`}>
          <ReactMarkdown
              remarkPlugins={[remarkMath]}
              rehypePlugins={[rehypeKatex]}
              components={{
                  p: ({node, ...props}) => <p className="mb-4 text-lg leading-8 font-light" {...props} />,
                  ul: ({node, ...props}) => <ul className="list-disc pl-5 mb-4 space-y-2" {...props} />,
                  li: ({node, ...props}) => <li className="text-lg font-light" {...props} />,
                  span: ({node, ...props}) => <span className="inline-block" {...props} /> 
              }}
          >
              {processedContent}
          </ReactMarkdown>
        </div>
      </div>
    );
  };

  return (
    <div className="absolute inset-0 z-20 bg-white overflow-hidden flex">
      {/* Main Split Container */}
      <div className="flex-1 flex overflow-hidden">
          
          {/* Analysis Column */}
          <div className={`flex-1 flex flex-col relative transition-all duration-300 ${showPdf ? 'w-1/2 border-r border-gray-200' : 'w-full'}`}>
            
            {/* Sticky Header */}
            <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-gray-100 px-6 py-4 flex items-center justify-between shrink-0">
                <button 
                    onClick={closeReader}
                    className="flex items-center gap-2 text-apple-blue font-medium hover:opacity-80 transition-opacity"
                >
                <ArrowLeft className="w-5 h-5" />
                <span className="hidden sm:inline">{t.back}</span>
                </button>
                
                <div className="flex items-center gap-2 sm:gap-3">
                {pdfDisplayUrl && (
                    <button
                        onClick={() => window.open(pdfDisplayUrl!, '_blank')}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500"
                        title={t.openNewTab}
                    >
                        <ExternalLink className="w-5 h-5" />
                    </button>
                )}

                <button
                    onClick={() => setShowPdf(!showPdf)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${showPdf ? 'bg-apple-dark text-white' : 'bg-gray-100 text-apple-dark hover:bg-gray-200'}`}
                >
                    {showPdf ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    <span className="hidden sm:inline">{showPdf ? t.hidePdf : t.viewPdf}</span>
                </button>

                <div className="h-6 w-px bg-gray-200 mx-1"></div>

                <button 
                    onClick={() => setShowNotes(!showNotes)}
                    className={`p-2 hover:bg-gray-100 rounded-full transition-colors ${showNotes ? 'text-apple-blue bg-blue-50' : 'text-gray-500'}`}
                    title={t.notes}
                >
                    <MessageSquare className="w-5 h-5" />
                </button>
                <button 
                    onClick={() => toggleFavorite(paper.id)}
                    className={`p-2 hover:bg-gray-100 rounded-full transition-colors ${paper.isFavorite ? 'text-yellow-500' : 'text-gray-500'}`}
                    title="Favorite"
                >
                    <Bookmark className={`w-5 h-5 ${paper.isFavorite ? 'fill-current' : ''}`} />
                </button>
                <button 
                    onClick={handleShare}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500"
                    title={t.copySummary}
                >
                    <Share className="w-5 h-5" />
                </button>
                </div>
            </div>

            {/* Scrollable Analysis Content */}
            <div className="flex-1 overflow-y-auto">
                <div className="max-w-3xl mx-auto px-6 py-12 animate-fadeIn">
                    {/* Header Section */}
                    <div className="mb-16 text-center">
                    <span className="inline-block px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-xs font-bold tracking-wide uppercase mb-4">
                        {t.aiAnalysis} ({language.toUpperCase()})
                    </span>
                    <h1 className="text-3xl md:text-4xl font-extrabold text-apple-dark mb-6 leading-tight">
                        {analysis.title}
                    </h1>
                    <div className="flex flex-wrap justify-center gap-2 text-gray-500 text-sm md:text-base">
                        {analysis.authors.map((author, i) => (
                            <span key={i} className="bg-gray-50 px-3 py-1 rounded-md">{author}</span>
                        ))}
                    </div>
                    </div>

                    {/* Content Blocks */}
                    <Section title={headers.background} content={analysis.background} />
                    
                    <div className="bg-gray-50 -mx-6 px-6 py-8 mb-12 rounded-3xl">
                        <Section title={headers.motivation} content={analysis.motivation} className="mb-0" />
                    </div>

                    <Section title={headers.conclusion} content={analysis.research_conclusion} />

                    <Section title={headers.methodology} content={analysis.methodology_math} />
                    
                    <Section title={headers.implementation} content={analysis.implementation_details} />
                    
                    <div className="grid md:grid-cols-1 gap-8 mb-12">
                        <Section title={headers.results} content={analysis.evaluation_results} theme="success" />
                        <Section title={headers.critique} content={analysis.reviewer_critique} theme="warning" />
                    </div>

                    <div className="p-8 bg-apple-dark rounded-3xl text-white shadow-2xl shadow-black/20">
                        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">{headers.oneMoreThing}</h3>
                        <div className="prose prose-invert prose-lg">
                            <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                                {preprocessContent(analysis.one_more_thing)}
                            </ReactMarkdown>
                        </div>
                    </div>

                    <div className="h-24"></div>
                </div>
            </div>
          </div>

          {/* PDF Column (Split View) */}
          {showPdf && (
              <div className="w-1/2 h-full bg-gray-100 flex flex-col animate-in slide-in-from-right-4 duration-300 border-l border-gray-200">
                  {pdfDisplayUrl ? (
                      <object
                        data={pdfDisplayUrl}
                        type="application/pdf"
                        className="w-full h-full"
                      >
                        <div className="flex flex-col items-center justify-center h-full p-8 text-center text-gray-500">
                            <FileText className="w-12 h-12 mb-4 opacity-50" />
                            <p className="mb-2 font-medium">{t.cantDisplay}</p>
                            <a 
                                href={pdfDisplayUrl} 
                                target="_blank" 
                                rel="noreferrer"
                                className="text-apple-blue underline hover:text-blue-700 text-sm"
                            >
                                {t.clickToView}
                            </a>
                        </div>
                      </object>
                  ) : (
                      <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-8 text-center">
                          <FileText className="w-12 h-12 mb-4 opacity-50" />
                          <p className="font-medium text-gray-600">{t.pdfUnavailable}</p>
                          <p className="text-sm mt-2">{t.pdfExpired}</p>
                      </div>
                  )}
              </div>
          )}
      </div>

      {/* Notes Side Panel (Overlay) */}
      <div className={`border-l border-gray-200 bg-gray-50 flex flex-col transition-all duration-300 shadow-2xl z-40 ${showNotes ? 'w-96 translate-x-0' : 'w-0 translate-x-full overflow-hidden'}`}>
         <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-white">
            <h3 className="font-bold text-apple-dark">{t.notes}</h3>
            <button onClick={() => setShowNotes(false)} className="p-1 hover:bg-gray-100 rounded-full">
                <X className="w-4 h-4 text-gray-500" />
            </button>
         </div>
         <div className="flex-1 p-4 overflow-y-auto">
            <textarea 
                value={localNotes}
                onChange={(e) => setLocalNotes(e.target.value)}
                onBlur={handleSaveNotes}
                placeholder="Type your personal notes here..."
                className="w-full h-full min-h-[300px] bg-transparent resize-none outline-none text-sm text-gray-700 leading-relaxed"
            />
         </div>
         <div className="p-4 border-t border-gray-200 bg-white text-xs text-gray-400 flex justify-between items-center">
            <span>{t.markdownSupport}</span>
            <span className="flex items-center gap-1 text-green-600">
                <Save className="w-3 h-3" /> {t.autoSaving}
            </span>
         </div>
      </div>
    </div>
  );
};