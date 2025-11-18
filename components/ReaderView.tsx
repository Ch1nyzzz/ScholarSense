import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { useStore } from '../store';
import { ArrowLeft, Share, MessageSquare, Bookmark } from 'lucide-react';

export const ReaderView: React.FC = () => {
  const { papers, activePaperId, closeReader, language } = useStore();
  const paper = papers.find(p => p.id === activePaperId);

  if (!paper || !paper.analysis) return null;

  const { analysis } = paper;

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
                  // Ensure inline math doesn't break lines awkwardly if possible
                  span: ({node, ...props}) => <span className="inline-block" {...props} /> 
              }}
          >
              {content}
          </ReactMarkdown>
        </div>
      </div>
    );
  };

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
             AI Analysis ({language.toUpperCase()})
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
        <Section title={headers.background} content={analysis.background} />
        
        <div className="bg-gray-50 -mx-6 px-6 py-8 mb-12 rounded-3xl">
            <Section title={headers.motivation} content={analysis.motivation} className="mb-0" />
        </div>

        <Section title={headers.conclusion} content={analysis.research_conclusion} />

        <Section title={headers.methodology} content={analysis.methodology_math} />
        
        <Section title={headers.implementation} content={analysis.implementation_details} />
        
        <div className="grid md:grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
            <Section title={headers.results} content={analysis.evaluation_results} theme="success" />
            <Section title={headers.critique} content={analysis.reviewer_critique} theme="warning" />
        </div>

        <div className="p-8 bg-apple-dark rounded-3xl text-white shadow-2xl shadow-black/20">
             <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">{headers.oneMoreThing}</h3>
             <div className="prose prose-invert prose-lg">
                <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                    {analysis.one_more_thing}
                </ReactMarkdown>
             </div>
        </div>

        <div className="h-24"></div>
      </div>
    </div>
  );
};