import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { useStore } from '../../store';
import { ArrowLeft, Share, FileText } from 'lucide-react';
import { translations } from '../../i18n';

export const MobileReader: React.FC = () => {
  const { papers, activePaperId, closeReader, language } = useStore();
  const paper = papers.find(p => p.id === activePaperId);
  const t = translations[language];

  if (!paper || !paper.analysis) return null;
  const { analysis } = paper;

  const preprocessContent = (content: string) => {
    if (!content) return "";
    return content
      .replace(/\r\n/g, '\n')
      .replace(/\\\[([\s\S]*?)\\\]/g, '$$$1$$')
      .replace(/\\\(([\s\S]*?)\\\)/g, '$$$1$$')
      .replace(/\$\$/g, '\n$$$\n');
  };

  const Section: React.FC<{ title: string; content: string; theme?: string }> = ({ title, content, theme }) => (
      <div className={`mb-8 ${theme === 'highlight' ? 'bg-blue-50/50 p-4 rounded-xl -mx-2' : ''}`}>
          <h3 className="text-lg font-bold text-apple-dark mb-2">{title}</h3>
          <div className="prose prose-sm max-w-none text-gray-600 leading-relaxed font-sans break-words">
            <ReactMarkdown
                remarkPlugins={[remarkMath]}
                rehypePlugins={[rehypeKatex]}
                components={{
                    p: ({node, ...props}) => <p className="mb-2" {...props} />,
                }}
            >
                {preprocessContent(content)}
            </ReactMarkdown>
          </div>
      </div>
  );

  return (
    <div className="flex flex-col h-full bg-white">
        {/* Mobile Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-white/95 backdrop-blur sticky top-0 z-10">
            <button onClick={closeReader} className="p-2 -ml-2 text-apple-dark active:opacity-50">
                <ArrowLeft className="w-6 h-6" />
            </button>
            <div className="flex gap-2">
                 {paper.sourceUrl && (
                     <a href={paper.sourceUrl} target="_blank" rel="noreferrer" className="p-2 text-gray-500 active:bg-gray-100 rounded-full">
                         <FileText className="w-5 h-5" />
                     </a>
                 )}
                 <button 
                    onClick={() => {
                        if (navigator.share) {
                            navigator.share({ 
                                title: analysis.title, 
                                text: analysis.research_conclusion 
                            }).catch(() => {});
                        } else {
                             navigator.clipboard.writeText(analysis.research_conclusion).then(() => alert('Summary copied'));
                        }
                    }}
                    className="p-2 -mr-2 text-gray-500 active:bg-gray-100 rounded-full"
                 >
                    <Share className="w-5 h-5" />
                 </button>
            </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 safe-bottom">
            <span className="inline-block px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 text-[10px] font-bold uppercase tracking-wide mb-2">
                AI Analysis
            </span>
            <h1 className="text-2xl font-extrabold text-apple-dark mb-4 leading-tight">
                {analysis.title}
            </h1>
            <div className="flex flex-wrap gap-1 text-gray-500 text-xs mb-8">
                {analysis.authors.map((author, i) => (
                    <span key={i} className="bg-gray-50 px-2 py-1 rounded-md">{author}</span>
                ))}
            </div>

            <Section title="Motivation" content={analysis.motivation} theme="highlight" />
            <Section title="Conclusion" content={analysis.research_conclusion} />
            <Section title="Methodology" content={analysis.methodology_math} />
            <Section title="Results" content={analysis.evaluation_results} />
            <Section title="Critique" content={analysis.reviewer_critique} />
            
            <div className="h-12"></div>
        </div>
    </div>
  );
};