
import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { useStore } from '../store';
import { ArrowLeft, Share, MessageSquare, Bookmark, X, Save, Eye, EyeOff, FileText, ExternalLink, Cloud, Link as LinkIcon, Send, Sparkles, Bot } from 'lucide-react';
import { translations } from '../i18n';
import { getPdfUrlFromStorage } from '../services/supabase';
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

type ChatMessage = {
    role: 'user' | 'model';
    text: string;
};

export const ReaderView: React.FC = () => {
  const { papers, activePaperId, closeReader, language, toggleFavorite, updatePaperNotes, cloudConfig, aiConfig } = useStore();
  const paper = papers.find(p => p.id === activePaperId);
  const t = translations[language];
  
  // UI State
  const [activeSidePanel, setActiveSidePanel] = useState<'none' | 'notes' | 'chat'>('none');
  const [showPdf, setShowPdf] = useState(false);
  
  // Notes State
  const [localNotes, setLocalNotes] = useState('');
  
  // PDF State
  const [pdfDisplayUrl, setPdfDisplayUrl] = useState<string | null>(null);

  // Chat State
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const chatSessionRef = useRef<any>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  
  // Initialize notes from store when paper changes
  useEffect(() => {
    if (paper) {
        setLocalNotes(paper.userNotes || '');
        setChatMessages([]);
        chatSessionRef.current = null;
    }
  }, [paper?.id]);

  // Auto-scroll chat
  useEffect(() => {
      if (chatContainerRef.current) {
          chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
      }
  }, [chatMessages, isChatLoading]);

  // Effect to resolve PDF URL
  useEffect(() => {
      let activeUrl = '';
      let isBlob = false;

      const loadPdf = async () => {
          if (!paper) return;

          // 1. Priority: Local Cache
          if (paper.pdfData) {
              try {
                  const res = await fetch(paper.pdfData);
                  const blob = await res.blob();
                  activeUrl = URL.createObjectURL(blob);
                  isBlob = true;
                  setPdfDisplayUrl(activeUrl);
                  return;
              } catch (e) {
                  console.warn("Failed to load local PDF data", e);
              }
          }

          // 2. Secondary: Cloud Storage
          if (paper.storagePath && cloudConfig.isEnabled) {
             const url = await getPdfUrlFromStorage(cloudConfig, paper.storagePath);
             if (url) {
                 setPdfDisplayUrl(url);
                 return;
             }
          }

          // 3. Fallback: Source URL
          if (paper.sourceUrl) {
              setPdfDisplayUrl(paper.sourceUrl);
              return;
          }
      };

      loadPdf();
      
      return () => {
          if (isBlob && activeUrl) {
              URL.revokeObjectURL(activeUrl);
          }
      };
  }, [paper, cloudConfig]);

  // Chat Initialization
  const getSystemInstruction = () => {
      if (!paper?.analysis) return "";
      return `You are One Glance AI, an expert research assistant. 
      You are currently discussing the paper titled "${paper.analysis.title}".
      
      Here is the structured analysis of the paper:
      ${JSON.stringify(paper.analysis)}

      Answer the user's questions based on this analysis. 
      If the question is outside the scope of the paper, use your general knowledge but mention that it's external info.
      Keep answers concise, academic yet accessible. 
      Use Markdown for formatting. Use LaTeX for math ($...$).`;
  };

  const initChatSession = async () => {
      if (chatSessionRef.current) return chatSessionRef.current;

      if (aiConfig.activeProvider === 'gemini') {
          const ai = new GoogleGenAI({ apiKey: aiConfig.keys.gemini });
          const chat = ai.chats.create({
              model: aiConfig.activeModel,
              config: {
                  systemInstruction: getSystemInstruction(),
              }
          });
          chatSessionRef.current = chat;
          return chat;
      }
      return null;
  };

  const handleSendMessage = async () => {
      if (!chatInput.trim() || !paper) return;
      
      const userMsg = chatInput.trim();
      setChatInput('');
      setChatMessages(prev => [...prev, { role: 'user', text: userMsg }]);
      setIsChatLoading(true);

      try {
          // GEMINI PROVIDER
          if (aiConfig.activeProvider === 'gemini') {
              const chat = await initChatSession();
              const result = await chat.sendMessageStream({ message: userMsg });
              
              let fullText = "";
              // Add placeholder for AI response
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
          } 
          // OPENAI / SILICONFLOW / OTHERS (Stateless via Fetch)
          else {
              const apiKey = aiConfig.keys[aiConfig.activeProvider];
              const baseUrl = aiConfig.baseUrls[aiConfig.activeProvider] || 
                             (aiConfig.activeProvider === 'siliconflow' ? 'https://api.siliconflow.cn/v1' : 'https://api.openai.com/v1');
              
              // Construct history for stateless API
              const historyPayload = [
                  { role: "system", content: getSystemInstruction() },
                  ...chatMessages.map(m => ({ role: m.role === 'model' ? 'assistant' : 'user', content: m.text })),
                  { role: "user", content: userMsg }
              ];

              const response = await fetch(`${baseUrl}/chat/completions`, {
                  method: 'POST',
                  headers: {
                      'Content-Type': 'application/json',
                      'Authorization': `Bearer ${apiKey}`
                  },
                  body: JSON.stringify({
                      model: aiConfig.activeModel,
                      messages: historyPayload,
                      stream: false 
                  })
              });

              if (!response.ok) throw new Error(`API Error: ${response.status}`);
              
              const data = await response.json();
              const aiText = data.choices?.[0]?.message?.content || "No response.";
              
              setChatMessages(prev => [...prev, { role: 'model', text: aiText }]);
          }

      } catch (error: any) {
          console.error("Chat Error:", error);
          setChatMessages(prev => [...prev, { role: 'model', text: `Error: ${error.message}` }]);
      } finally {
          setIsChatLoading(false);
      }
  };

  if (!paper || !paper.analysis) return null;
  const { analysis } = paper;

  const handleShare = () => {
    const text = `${analysis.title}\n\n${analysis.research_conclusion}\n\nAnalyzed by One Glance`;
    navigator.clipboard.writeText(text).then(() => {
        alert(t.copied);
    });
  };

  const handleSaveNotes = () => {
    if (activePaperId) {
        updatePaperNotes(activePaperId, localNotes);
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

  const Section: React.FC<{ title: string; content: string; className?: string; theme?: 'default' | 'success' | 'warning' }> = ({ 
    title, content, className = "", theme = 'default' 
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
        <div className={`prose ${proseColor} max-w-none leading-relaxed font-sans`}>
          <ReactMarkdown
              remarkPlugins={[remarkMath]}
              rehypePlugins={[rehypeKatex]}
              components={{
                  p: ({node, ...props}) => <p className="mb-4 text-lg leading-8 font-normal" {...props} />,
                  ul: ({node, ...props}) => <ul className="list-disc pl-5 mb-4 space-y-2" {...props} />,
                  li: ({node, ...props}) => <li className="text-lg font-normal" {...props} />,
              }}
          >
              {preprocessContent(content)}
          </ReactMarkdown>
        </div>
      </div>
    );
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

  return (
    <div className="absolute inset-0 z-20 bg-white overflow-hidden flex">
      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
          
          {/* Analysis Column */}
          <div className={`flex-1 flex flex-col relative transition-all duration-300 ${showPdf ? 'w-1/2 border-r border-gray-200' : 'w-full'}`}>
            
            {/* Header */}
            <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-gray-100 px-6 py-4 flex items-center justify-between shrink-0">
                <button onClick={closeReader} className="flex items-center gap-2 text-apple-blue font-medium hover:opacity-80 transition-opacity">
                    <ArrowLeft className="w-5 h-5" />
                    <span className="hidden sm:inline">{t.back}</span>
                </button>
                
                <div className="flex items-center gap-2 sm:gap-3">
                    {pdfDisplayUrl && (
                        <button onClick={() => window.open(pdfDisplayUrl!, '_blank')} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500" title={t.openNewTab}>
                            <ExternalLink className="w-5 h-5" />
                        </button>
                    )}

                    <button onClick={() => setShowPdf(!showPdf)} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${showPdf ? 'bg-apple-dark text-white' : 'bg-gray-100 text-apple-dark hover:bg-gray-200'}`}>
                        {showPdf ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        <span className="hidden sm:inline">{showPdf ? t.hidePdf : t.viewPdf}</span>
                    </button>

                    <div className="h-6 w-px bg-gray-200 mx-1"></div>

                    <button 
                        onClick={() => setActiveSidePanel(activeSidePanel === 'chat' ? 'none' : 'chat')}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${activeSidePanel === 'chat' ? 'bg-[#007AFF] text-white shadow-md' : 'text-gray-600 hover:bg-gray-100'}`}
                        title={t.chat}
                    >
                        <MessageSquare className="w-5 h-5" />
                        <span className="hidden lg:inline text-sm font-medium">{t.chat}</span>
                    </button>

                    <button 
                        onClick={() => setActiveSidePanel(activeSidePanel === 'notes' ? 'none' : 'notes')}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${activeSidePanel === 'notes' ? 'bg-blue-50 text-apple-blue' : 'text-gray-600 hover:bg-gray-100'}`}
                        title={t.notes}
                    >
                        <FileText className="w-5 h-5" />
                        <span className="hidden lg:inline text-sm font-medium">{t.notes}</span>
                    </button>

                    <div className="h-6 w-px bg-gray-200 mx-1"></div>

                    <button onClick={() => toggleFavorite(paper.id)} className={`p-2 hover:bg-gray-100 rounded-full transition-colors ${paper.isFavorite ? 'text-yellow-500' : 'text-gray-500'}`}>
                        <Bookmark className={`w-5 h-5 ${paper.isFavorite ? 'fill-current' : ''}`} />
                    </button>
                    <button onClick={handleShare} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500">
                        <Share className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Analysis Content */}
            <div className="flex-1 overflow-y-auto">
                <div className="max-w-3xl mx-auto px-6 py-12 animate-fadeIn">
                    {/* Header Section */}
                    <div className="mb-16 text-center">
                    <div className="flex justify-center gap-2 mb-4">
                        <span className="inline-block px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-xs font-bold tracking-wide uppercase">
                            {t.aiAnalysis} ({language.toUpperCase()})
                        </span>
                        {paper.storagePath && (
                             <span className="inline-block px-3 py-1 rounded-full bg-green-50 text-green-600 text-xs font-bold tracking-wide uppercase flex items-center gap-1">
                                <Cloud className="w-3 h-3" /> Cloud
                             </span>
                        )}
                        {paper.sourceUrl && (
                             <span className="inline-block px-3 py-1 rounded-full bg-purple-50 text-purple-600 text-xs font-bold tracking-wide uppercase flex items-center gap-1">
                                <LinkIcon className="w-3 h-3" /> Web
                             </span>
                        )}
                    </div>
                    <h1 className="text-3xl md:text-4xl font-extrabold text-apple-dark mb-6 leading-tight">
                        {analysis.title}
                    </h1>
                    <div className="flex flex-wrap justify-center gap-2 text-gray-500 text-sm md:text-base">
                        {analysis.authors.map((author, i) => (
                            <span key={i} className="bg-gray-50 px-3 py-1 rounded-md">{author}</span>
                        ))}
                    </div>
                    </div>

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
                      <iframe src={pdfDisplayUrl} className="w-full h-full" title="PDF Viewer"></iframe>
                  ) : (
                      <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-8 text-center">
                          <FileText className="w-12 h-12 mb-4 opacity-50" />
                          <p className="font-medium text-gray-600">{t.pdfUnavailable}</p>
                      </div>
                  )}
              </div>
          )}
      </div>

      {/* Right Sidebar (Notes or Chat) */}
      <div className={`border-l border-gray-200 bg-[#F5F5F7] flex flex-col transition-all duration-300 shadow-2xl z-40 ${activeSidePanel !== 'none' ? 'w-96 translate-x-0' : 'w-0 translate-x-full overflow-hidden'}`}>
         
         {/* NOTES PANEL */}
         {activeSidePanel === 'notes' && (
             <>
                <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-white">
                    <h3 className="font-bold text-apple-dark">{t.notes}</h3>
                    <button onClick={() => setActiveSidePanel('none')} className="p-1 hover:bg-gray-100 rounded-full">
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
             </>
         )}

         {/* CHAT PANEL (Refined Design) */}
         {activeSidePanel === 'chat' && (
             <>
                <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between bg-white/80 backdrop-blur-md sticky top-0 z-10">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center text-white shadow-sm">
                            <Sparkles className="w-4 h-4" />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900 text-sm">{t.aiAssistant}</h3>
                            <p className="text-[10px] text-gray-500">One Glance AI</p>
                        </div>
                    </div>
                    <button onClick={() => setActiveSidePanel('none')} className="p-1.5 hover:bg-gray-100 rounded-full transition-colors">
                        <X className="w-4 h-4 text-gray-500" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={chatContainerRef}>
                    {chatMessages.length === 0 && (
                        <div className="flex flex-col items-center justify-center h-48 text-gray-400 text-center px-4">
                            <Bot className="w-10 h-10 mb-3 opacity-20" />
                            <p className="text-sm font-medium text-gray-500">{t.askQuestion}</p>
                            <p className="text-xs mt-1 opacity-60">Powered by {aiConfig.activeProvider === 'gemini' ? 'Gemini' : aiConfig.activeModel}</p>
                        </div>
                    )}
                    
                    {chatMessages.map((msg, idx) => (
                        <div key={idx} className={`flex w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`
                                max-w-[85%] px-4 py-2.5 text-[14px] leading-relaxed shadow-sm relative
                                ${msg.role === 'user' 
                                    ? 'bg-[#007AFF] text-white rounded-[18px] rounded-br-[4px]' 
                                    : 'bg-white text-gray-900 border border-gray-200 rounded-[18px] rounded-bl-[4px]'}
                            `}>
                                {msg.role === 'user' ? (
                                    msg.text
                                ) : (
                                    <div className="prose prose-sm prose-neutral max-w-none">
                                    <ReactMarkdown 
                                        remarkPlugins={[remarkMath]} 
                                        rehypePlugins={[rehypeKatex]}
                                        components={{
                                            p: ({node, ...props}) => <p className="mb-1 last:mb-0" {...props} />,
                                            code: ({node, ...props}) => <code className="bg-gray-100 text-gray-800 px-1 rounded text-xs font-mono" {...props} />
                                        }}
                                    >
                                        {preprocessContent(msg.text)}
                                    </ReactMarkdown>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                    {isChatLoading && chatMessages[chatMessages.length - 1]?.role !== 'model' && (
                        <div className="flex justify-start">
                            <div className="bg-white border border-gray-200 px-4 py-3 rounded-[18px] rounded-bl-[4px] shadow-sm">
                                <div className="flex gap-1">
                                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0s'}}></div>
                                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s'}}></div>
                                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s'}}></div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-4 bg-white border-t border-gray-200">
                    <div className="flex items-end gap-2">
                        <div className="flex-1 bg-gray-100 rounded-[20px] px-4 py-2 focus-within:bg-white focus-within:ring-2 focus-within:ring-[#007AFF]/20 transition-all border border-transparent focus-within:border-[#007AFF]/30">
                            <textarea 
                                value={chatInput}
                                onChange={(e) => setChatInput(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleSendMessage();
                                    }
                                }}
                                placeholder="Message..."
                                className="w-full bg-transparent resize-none outline-none text-[14px] text-gray-900 max-h-32 py-1"
                                rows={1}
                                style={{ minHeight: '24px' }}
                            />
                        </div>
                        <button 
                            onClick={handleSendMessage}
                            disabled={isChatLoading || !chatInput.trim()}
                            className="w-9 h-9 bg-[#007AFF] text-white rounded-full flex items-center justify-center hover:bg-blue-600 active:scale-95 transition-all shadow-sm disabled:opacity-50 disabled:shadow-none"
                        >
                            <Send className="w-4 h-4 ml-0.5" />
                        </button>
                    </div>
                </div>
             </>
         )}
      </div>
    </div>
  );
};