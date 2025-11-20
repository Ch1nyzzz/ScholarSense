
import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { useStore } from '../../store';
import { ArrowLeft, FileText, MessageSquare, Send, ChevronDown, Bot, Sparkles } from 'lucide-react';
import { translations } from '../../i18n';
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

type ChatMessage = {
    role: 'user' | 'model';
    text: string;
};

// Memoized Section to prevent re-renders
const Section: React.FC<{ title: string; content: string; theme?: string }> = React.memo(({ title, content, theme }) => {
    const preprocessContent = (content: string) => {
        if (!content) return "";
        return content
          .replace(/\r\n/g, '\n')
          .replace(/\\\[([\s\S]*?)\\\]/g, '$$$1$$')
          .replace(/\\\(([\s\S]*?)\\\)/g, '$$$1$$')
          .replace(/\$\$/g, '\n$$$\n');
    };

    return (
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
});

// Isolated Chat Component for Performance
const MobileChatOverlay: React.FC<{ 
    isOpen: boolean; 
    onClose: () => void; 
    paper: any;
    aiConfig: any;
    language: string;
}> = ({ isOpen, onClose, paper, aiConfig, language }) => {
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
    const [chatInput, setChatInput] = useState('');
    const [isChatLoading, setIsChatLoading] = useState(false);
    const chatSessionRef = useRef<any>(null);
    const chatEndRef = useRef<HTMLDivElement>(null);
    const t = translations[language];

    useEffect(() => {
        if (isOpen) {
            setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
        }
    }, [chatMessages, isOpen]);

    const getSystemInstruction = () => {
        if (!paper?.analysis) return "";
        return `You are One Glance AI, an expert research assistant. 
        You are discussing the paper titled "${paper.analysis.title}".
        Here is the structured analysis: ${JSON.stringify(paper.analysis)}.
        Answer concisely and use Markdown.`;
    };

    const handleSendMessage = async () => {
        if (!chatInput.trim()) return;
        
        const userMsg = chatInput.trim();
        setChatInput('');
        setChatMessages(prev => [...prev, { role: 'user', text: userMsg }]);
        setIsChatLoading(true);

        try {
            if (aiConfig.activeProvider === 'gemini') {
                if (!chatSessionRef.current) {
                    const ai = new GoogleGenAI({ apiKey: aiConfig.keys.gemini });
                    chatSessionRef.current = ai.chats.create({
                        model: aiConfig.activeModel,
                        config: { systemInstruction: getSystemInstruction() }
                    });
                }
                
                const result = await chatSessionRef.current.sendMessageStream({ message: userMsg });
                
                let fullText = "";
                setChatMessages(prev => [...prev, { role: 'model', text: "" }]);
                
                for await (const chunk of result) {
                    const c = chunk as GenerateContentResponse;
                    if (c.text) {
                        fullText += c.text;
                        setChatMessages(prev => {
                            const newArr = [...prev];
                            newArr[newArr.length - 1] = { role: 'model', text: fullText };
                            return newArr;
                        });
                    }
                }
            } else {
                 const apiKey = aiConfig.keys[aiConfig.activeProvider];
                 const baseUrl = aiConfig.baseUrls[aiConfig.activeProvider] || 'https://api.openai.com/v1';
                 
                 const response = await fetch(`${baseUrl}/chat/completions`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
                    body: JSON.stringify({
                        model: aiConfig.activeModel,
                        messages: [
                            { role: "system", content: getSystemInstruction() },
                            ...chatMessages.map(m => ({ role: m.role === 'model' ? 'assistant' : 'user', content: m.text })),
                            { role: "user", content: userMsg }
                        ],
                        stream: false 
                    })
                 });
                 const data = await response.json();
                 setChatMessages(prev => [...prev, { role: 'model', text: data.choices?.[0]?.message?.content || "Error" }]);
            }
        } catch (error: any) {
            setChatMessages(prev => [...prev, { role: 'model', text: "Error: " + error.message }]);
        } finally {
            setIsChatLoading(false);
        }
    };
    
    const preprocessContent = (content: string) => {
        if (!content) return "";
        return content
          .replace(/\r\n/g, '\n')
          .replace(/\\\[([\s\S]*?)\\\]/g, '$$$1$$')
          .replace(/\\\(([\s\S]*?)\\\)/g, '$$$1$$')
          .replace(/\$\$/g, '\n$$$\n');
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
            <div className="absolute inset-0 bg-black/20 backdrop-blur-sm transition-opacity" onClick={onClose} />
            
            <div className="bg-[#F5F5F7] h-[92vh] w-full rounded-t-[2rem] shadow-2xl flex flex-col z-10 animate-in slide-in-from-bottom duration-300 relative overflow-hidden">
                {/* Chat Header */}
                <div className="flex items-center justify-between px-6 py-4 bg-white/80 backdrop-blur-md border-b border-gray-200/50 sticky top-0 z-20">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-tr from-blue-500 to-cyan-500 rounded-full flex items-center justify-center text-white shadow-lg">
                            <Sparkles className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900 text-base">{t.aiAssistant}</h3>
                            <p className="text-xs text-gray-500 font-medium">One Glance AI</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors">
                        <ChevronDown className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-6">
                    {chatMessages.length === 0 && (
                        <div className="flex flex-col items-center justify-center h-64 text-gray-400 px-8 text-center space-y-4">
                            <Bot className="w-12 h-12 opacity-20" />
                            <p className="text-sm font-medium text-gray-500">{t.chatPlaceholder}</p>
                        </div>
                    )}
                    
                    {chatMessages.map((msg, idx) => (
                        <div key={idx} className={`flex w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[85%] px-5 py-3 text-[15px] leading-relaxed shadow-sm relative group transition-all
                                ${msg.role === 'user' 
                                    ? 'bg-[#007AFF] text-white rounded-[20px] rounded-br-[4px]' 
                                    : 'bg-white text-gray-900 rounded-[20px] rounded-bl-[4px] border border-gray-100'
                                }
                            `}>
                                {msg.role === 'model' ? (
                                    <div className="prose prose-sm prose-neutral max-w-none">
                                        <ReactMarkdown 
                                            remarkPlugins={[remarkMath]} 
                                            rehypePlugins={[rehypeKatex]}
                                            components={{
                                                p: ({node, ...props}) => <p className="mb-2 last:mb-0" {...props} />,
                                                code: ({node, ...props}) => <code className="bg-gray-100 text-gray-800 px-1 py-0.5 rounded text-xs font-mono" {...props} />,
                                                pre: ({node, ...props}) => <pre className="bg-gray-50 p-2 rounded-lg overflow-x-auto text-xs" {...props} />
                                            }}
                                        >
                                            {preprocessContent(msg.text)}
                                        </ReactMarkdown>
                                    </div>
                                ) : (
                                    msg.text
                                )}
                            </div>
                        </div>
                    ))}
                    
                    {isChatLoading && chatMessages[chatMessages.length - 1]?.role !== 'model' && (
                        <div className="flex justify-start">
                            <div className="bg-white border border-gray-100 px-4 py-3 rounded-[20px] rounded-bl-[4px] shadow-sm flex gap-1.5 items-center">
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }} />
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }} />
                            </div>
                        </div>
                    )}
                    <div ref={chatEndRef} className="h-4" />
                </div>

                {/* Input Area */}
                <div className="bg-white/80 backdrop-blur-xl border-t border-gray-200 p-4 pb-safe safe-bottom w-full">
                    <div className="flex items-end gap-3 max-w-3xl mx-auto">
                        <div className="flex-1 bg-gray-100 rounded-[24px] px-5 py-3 focus-within:bg-white focus-within:ring-2 focus-within:ring-[#007AFF]/20 transition-all border border-transparent focus-within:border-[#007AFF]/30">
                            <textarea 
                                className="w-full bg-transparent outline-none text-[15px] text-gray-900 placeholder-gray-500 resize-none max-h-32 align-middle"
                                rows={1}
                                style={{ minHeight: '24px' }}
                                placeholder="Message One Glance..."
                                value={chatInput}
                                onChange={(e) => setChatInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSendMessage())}
                            />
                        </div>
                        <button 
                            onClick={handleSendMessage}
                            disabled={!chatInput.trim() || isChatLoading}
                            className="w-11 h-11 bg-[#007AFF] rounded-full flex items-center justify-center text-white shadow-lg shadow-blue-500/30 active:scale-95 transition-all disabled:opacity-50 disabled:shadow-none disabled:bg-gray-300"
                        >
                            <Send className="w-5 h-5 ml-0.5" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export const MobileReader: React.FC = () => {
  const { papers, activePaperId, closeReader, language, aiConfig } = useStore();
  const paper = papers.find(p => p.id === activePaperId);
  const t = translations[language];

  const [isChatOpen, setIsChatOpen] = useState(false);

  if (!paper || !paper.analysis) return null;
  const { analysis } = paper;

  return (
    <div className="flex flex-col h-full bg-white relative">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-white/90 backdrop-blur-md sticky top-0 z-10">
            <button 
                onClick={closeReader} 
                className="p-2 -ml-2 rounded-full hover:bg-gray-100 active:bg-gray-200 transition-colors"
            >
                <ArrowLeft className="w-6 h-6 text-gray-900" />
            </button>
            <div className="flex gap-3">
                 {paper.sourceUrl && (
                     <a href={paper.sourceUrl} target="_blank" rel="noreferrer" className="p-2 text-gray-600 bg-gray-100/50 rounded-full">
                         <FileText className="w-5 h-5" />
                     </a>
                 )}
                 <button onClick={() => setIsChatOpen(true)} className="p-2 text-[#007AFF] bg-blue-50 rounded-full active:bg-blue-100 transition-colors relative">
                    <MessageSquare className="w-5 h-5" />
                    {!isChatOpen && <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white" />}
                 </button>
            </div>
        </div>

        {/* Content - With reduced re-renders */}
        <div className="flex-1 overflow-y-auto px-5 py-6 safe-bottom">
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 text-[10px] font-bold uppercase tracking-wide mb-4 border border-blue-100">
                    <Sparkles className="w-3 h-3" /> AI Analysis
                </span>
                <h1 className="text-[28px] font-bold text-gray-900 mb-4 leading-[1.2] tracking-tight">
                    {analysis.title}
                </h1>
                <div className="flex flex-wrap gap-2 mb-8">
                    {analysis.authors.map((author: string, i: number) => (
                        <span key={i} className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-xs font-medium">{author}</span>
                    ))}
                </div>

                <Section title="Motivation" content={analysis.motivation} theme="highlight" />
                <Section title="Conclusion" content={analysis.research_conclusion} />
                <Section title="Methodology" content={analysis.methodology_math} />
                <Section title="Results" content={analysis.evaluation_results} />
                <Section title="Critique" content={analysis.reviewer_critique} />
                
                <div className="h-32"></div>
            </div>
        </div>

        {/* Floating Chat Button */}
        {!isChatOpen && (
            <button 
                onClick={() => setIsChatOpen(true)}
                className="absolute bottom-8 right-6 w-14 h-14 bg-black text-white rounded-full shadow-2xl shadow-black/30 flex items-center justify-center active:scale-90 transition-all z-20 animate-in zoom-in duration-300"
            >
                <Sparkles className="w-6 h-6" />
            </button>
        )}

        {/* Chat Overlay */}
        <MobileChatOverlay 
            isOpen={isChatOpen} 
            onClose={() => setIsChatOpen(false)} 
            paper={paper} 
            aiConfig={aiConfig} 
            language={language}
        />
    </div>
  );
};