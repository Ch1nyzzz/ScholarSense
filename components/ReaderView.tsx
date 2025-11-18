import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { useStore } from '../store';
import { ArrowLeft, Share, MessageSquare, Bookmark } from 'lucide-react';

export const ReaderView: React.FC = () => {
  const { papers, activePaperId, closeReader } = useStore();
  const paper = papers.find(p => p.id === activePaperId);

  if (!paper || !paper.analysis) return null;

  const { analysis } = paper;

  const Section: React.FC<{ title: string; content: string; className?: string }> = ({ title, content, className = "" }) => (
    <div className={`mb-12 ${className}`}>
      <h3 className="text-xl font-bold text-apple-dark mb-4 tracking-tight">{title}</h3>
      <div className="prose prose-lg prose-slate max-w-none text-gray-600 leading-relaxed font-serif">
        <ReactMarkdown
            remarkPlugins={[remarkMath]}
            rehypePlugins={[rehypeKatex]}
            components={{
                p: ({node, ...props}) => <p className="mb-4 text-lg leading-8 font-light" {...props} />,
                ul: ({node, ...props}) => <ul className="list-disc pl-5 mb-4 space-y-2" {...props} />,
                li: ({node, ...props}) => <li className="text-lg font-light" {...props} />
            }}
        >
            {content}
        </ReactMarkdown>
      </div>
    </div>
  );

  return (
    <div className="absolute inset-0 z-20 bg-white overflow-auto">
      {/* Sticky Header */}
      <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-gray-100 px-6 py-4 flex items-center justify-between">
        <button 
            onClick={closeReader}
            className="flex items-center gap-2 text-apple-blue font-medium hover:opacity-80 transition-opacity"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Library</span>
        </button>
        
        <div className="flex items-center gap-3">
           <button className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500">
               <MessageSquare className="w-5 h-5" />
           </button>
           <button className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500">
               <Bookmark className="w-5 h-5" />
           </button>
           <button className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500">
               <Share className="w-5 h-5" />
           </button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-12 animate-fadeIn">
        {/* Header Section */}
        <div className="mb-16 text-center">
           <span className="inline-block px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-xs font-bold tracking-wide uppercase mb-4">
             AI Analysis
           </span>
           <h1 className="text-4xl md:text-5xl font-extrabold text-apple-dark mb-6 leading-tight">
             {analysis.title}
           </h1>
           <div className="flex flex-wrap justify-center gap-2 text-gray-500 text-lg">
             {analysis.authors.map((author, i) => (
                <span key={i} className="bg-gray-50 px-3 py-1 rounded-md">{author}</span>
             ))}
           </div>
        </div>

        {/* Content Blocks */}
        <Section title="Background & Context" content={analysis.summary_background} />
        
        <div className="bg-gray-50 -mx-6 px-6 py-8 mb-12 rounded-3xl">
            <Section title="Core Motivation" content={analysis.motivation} className="mb-0" />
        </div>

        <Section title="Methodology & Math" content={analysis.core_method_math_latex} />
        
        <Section title="Experiments" content={analysis.experiments_setup} />
        
        <div className="grid md:grid-cols-2 gap-8 mb-12">
            <div className="bg-green-50/50 p-6 rounded-3xl border border-green-100">
                 <h3 className="text-lg font-bold text-green-900 mb-3">Results</h3>
                 <div className="prose prose-sm text-green-800">
                    <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                        {analysis.results_metrics}
                    </ReactMarkdown>
                 </div>
            </div>
            <div className="bg-amber-50/50 p-6 rounded-3xl border border-amber-100">
                 <h3 className="text-lg font-bold text-amber-900 mb-3">Critique</h3>
                 <div className="prose prose-sm text-amber-800">
                    <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                        {analysis.reviewer_critique}
                    </ReactMarkdown>
                 </div>
            </div>
        </div>

        <div className="p-8 bg-apple-dark rounded-3xl text-white shadow-2xl shadow-black/20">
             <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">One More Thing</h3>
             <p className="text-xl md:text-2xl font-medium leading-relaxed">
                "{analysis.one_more_thing}"
             </p>
        </div>

        <div className="h-24"></div>
      </div>
    </div>
  );
};