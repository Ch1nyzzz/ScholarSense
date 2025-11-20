

import React, { useState, useCallback } from 'react';
import { UploadCloud, Loader2, FileText, Layers, Link as LinkIcon } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { useStore } from '../store';
import { extractTextFromPdf } from '../services/pdfService';
import { analyzePaperWithGemini, analyzePaperFromUrl } from '../services/geminiService';
import { Paper, PaperStatus } from '../types';
import { translations } from '../i18n';
import { uploadPdfToStorage, getSupabaseClient } from '../services/supabase';

// Utility to convert File to Base64
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
};

export const FileUpload: React.FC = () => {
  const { 
    addPaper, 
    updatePaperStatus, 
    updatePaperAnalysis, 
    aiConfig,
    toggleSettings, 
    language, 
    analysisLanguage, 
    setAnalysisLanguage,
    cloudConfig
  } = useStore();
  const [isDragging, setIsDragging] = useState(false);
  const [processingCount, setProcessingCount] = useState(0);
  const [activeTab, setActiveTab] = useState<'file' | 'url'>('file');
  const [inputUrl, setInputUrl] = useState('');
  const t = translations[language];

  const processFiles = async (files: File[]) => {
    // Check if current provider has a key
    if (!aiConfig.keys[aiConfig.activeProvider]) {
      alert(`Please configure your ${aiConfig.activeProvider.toUpperCase()} API Key in Settings first.`);
      toggleSettings();
      return;
    }

    // Filter only PDFs
    const pdfFiles = files.filter(f => f.type === 'application/pdf');
    if (pdfFiles.length === 0) {
        alert("Please upload valid PDF files.");
        return;
    }

    setProcessingCount(prev => prev + pdfFiles.length);

    // Process each file
    pdfFiles.forEach(async (file) => {
        const id = uuidv4(); // Use UUID for database compatibility
        let storagePath: string | undefined = undefined;
        
        try {
          // 1. Upload to Supabase Storage FIRST if enabled
          if (cloudConfig.isEnabled) {
              const client = getSupabaseClient(cloudConfig);
              if (client) {
                  const { data: { user } } = await client.auth.getUser();
                  if (user) {
                      // Upload and get path
                      const path = await uploadPdfToStorage(cloudConfig, file, user.id);
                      if (path) storagePath = path;
                  }
              }
          }

          // 2. Convert to Base64 for local cache (Still useful for offline/immediate view)
          const base64Data = await fileToBase64(file);
          
          const newPaper: Paper = {
              id,
              originalTitle: file.name,
              dateAdded: Date.now(),
              status: PaperStatus.EXTRACTING,
              analysis: null,
              tags: [],
              collectionIds: [], 
              userNotes: '',     
              isFavorite: false,
              isRead: false,
              pdfData: base64Data, // Keep local copy
              storagePath: storagePath // Add remote path
          };

          addPaper(newPaper);

          // 3. Extract Text
          const text = await extractTextFromPdf(file);
          updatePaperStatus(id, PaperStatus.ANALYZING);

          // 4. Analyze with AI (Generic Service)
          const analysis = await analyzePaperWithGemini(text, aiConfig, analysisLanguage);
          
          // 5. Save Result
          updatePaperAnalysis(id, analysis);
        } catch (error: any) {
            console.error(error);
            updatePaperStatus(id, PaperStatus.ERROR, error.message || "Unknown error occurred");
        } finally {
            setProcessingCount(prev => Math.max(0, prev - 1));
        }
    });
  };

  const handleUrlSubmit = async () => {
    const activeKey = aiConfig.keys[aiConfig.activeProvider];
    
      if (!inputUrl || !activeKey) {
          alert(activeKey ? "Please enter a URL" : "Please configure API Key first");
          if (!activeKey) toggleSettings();
          return;
      }

      const id = uuidv4();
      const guessTitle = inputUrl.split('/').pop()?.replace('.pdf', '') || "Web Document";

      const newPaper: Paper = {
          id,
          originalTitle: guessTitle,
          dateAdded: Date.now(),
          status: PaperStatus.ANALYZING, // Start directly at analyzing for URL
          analysis: null,
          tags: ["Link"],
          collectionIds: [],
          userNotes: '',
          isFavorite: false,
          isRead: false,
          sourceUrl: inputUrl
      };

      addPaper(newPaper);
      setProcessingCount(prev => prev + 1);
      setInputUrl('');

      try {
        // Call the search-grounded analysis function
        // Note: This currently enforces Gemini inside the service for search capabilities
        const analysis = await analyzePaperFromUrl(
            newPaper.sourceUrl!, 
            aiConfig, 
            analysisLanguage
        );
        
        updatePaperAnalysis(id, analysis);

      } catch (error: any) {
          console.error(error);
          updatePaperStatus(id, PaperStatus.ERROR, "Analysis failed. " + error.message);
      } finally {
          setProcessingCount(prev => Math.max(0, prev - 1));
      }
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (activeTab === 'file' && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        processFiles(Array.from(e.dataTransfer.files));
    }
  }, [aiConfig, language, analysisLanguage, activeTab, cloudConfig]); 

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
        processFiles(Array.from(e.target.files));
    }
  };

  return (
    <div className="mb-6">
      {/* Header Controls */}
      <div className="flex justify-between items-center mb-4 px-1">
          <div className="flex space-x-4">
              <button 
                onClick={() => setActiveTab('file')}
                className={`text-sm font-medium pb-1 border-b-2 transition-colors ${activeTab === 'file' ? 'text-apple-dark border-apple-blue' : 'text-gray-400 border-transparent'}`}
              >
                  {language === 'zh' ? '上传 PDF' : 'Upload PDF'}
              </button>
              <button 
                onClick={() => setActiveTab('url')}
                className={`text-sm font-medium pb-1 border-b-2 transition-colors ${activeTab === 'url' ? 'text-apple-dark border-apple-blue' : 'text-gray-400 border-transparent'}`}
              >
                  {language === 'zh' ? '网络链接 / Arxiv' : 'URL / Arxiv'}
              </button>
          </div>

          <div className="flex items-center gap-2">
             {/* Model Badge */}
             <div className="hidden sm:flex px-2 py-1 bg-gray-100 rounded-md text-xs font-medium text-gray-500 items-center gap-1">
                <Layers className="w-3 h-3" />
                <span className="uppercase">{aiConfig.activeProvider}</span>
                <span className="opacity-50">|</span>
                <span className="truncate max-w-[80px]">{aiConfig.activeModel}</span>
             </div>

             <div className="flex items-center gap-1 bg-white/50 backdrop-blur-sm border border-gray-200 rounded-lg p-1">
                <button
                    onClick={() => setAnalysisLanguage('en')}
                    className={`px-2 py-0.5 text-xs rounded-md transition-all ${analysisLanguage === 'en' ? 'bg-white text-apple-dark shadow-sm font-bold border border-gray-100' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'}`}
                >
                    En
                </button>
                <button
                    onClick={() => setAnalysisLanguage('zh')}
                    className={`px-2 py-0.5 text-xs rounded-md transition-all ${analysisLanguage === 'zh' ? 'bg-white text-apple-dark shadow-sm font-bold border border-gray-100' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'}`}
                >
                    中
                </button>
            </div>
          </div>
      </div>

      {activeTab === 'file' ? (
          <div 
            className={`
              relative group cursor-pointer rounded-2xl border-2 border-dashed transition-all duration-200 ease-in-out h-32 flex flex-col items-center justify-center
              ${isDragging ? 'border-apple-blue bg-blue-50' : 'border-gray-300 hover:border-gray-400 bg-white'}
            `}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={onDrop}
          >
            <input 
              type="file" 
              accept=".pdf"
              multiple 
              onChange={handleInputChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
            />
            
            <div className="flex flex-col items-center text-center pointer-events-none">
              {processingCount > 0 ? (
                <div className="flex flex-col items-center text-apple-blue animate-pulse">
                  <Loader2 className="w-8 h-8 animate-spin mb-2" />
                  <span className="text-sm font-medium">
                      {t.processing} {processingCount} {processingCount === 1 ? t.paperFound : t.papersFound}...
                  </span>
                </div>
              ) : (
                  <>
                      <div className={`p-2 rounded-full mb-2 transition-colors ${isDragging ? 'bg-blue-100' : 'bg-gray-100 group-hover:bg-gray-200'}`}>
                          {isDragging ? <Layers className="w-6 h-6 text-apple-blue" /> : <UploadCloud className="w-6 h-6 text-gray-500" />}
                      </div>
                      <p className="text-sm font-medium text-gray-700">
                          <span className="text-apple-blue">{t.clickToUpload}</span> {t.uploadDrag}
                      </p>
                  </>
              )}
            </div>
          </div>
      ) : (
          <div className="bg-white rounded-2xl border border-gray-200 p-6 h-32 flex flex-col justify-center">
              <div className="flex gap-2">
                  <input 
                    type="url" 
                    placeholder="https://arxiv.org/pdf/2507.xxxxx.pdf"
                    className="flex-1 px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-apple-blue outline-none text-sm"
                    value={inputUrl}
                    onChange={(e) => setInputUrl(e.target.value)}
                  />
                  <button 
                    onClick={handleUrlSubmit}
                    disabled={processingCount > 0}
                    className="px-6 py-2 bg-apple-dark text-white rounded-xl text-sm font-medium hover:bg-black transition-colors flex items-center gap-2 disabled:opacity-50"
                  >
                    {processingCount > 0 ? (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            {language === 'zh' ? '解析中...' : 'Processing...'}
                        </>
                    ) : (
                        <>
                            <LinkIcon className="w-4 h-4" />
                            {language === 'zh' ? '开始分析' : 'Analyze'}
                        </>
                    )}
                  </button>
              </div>
              <p className="text-xs text-gray-400 mt-2 text-center">
                  {language === 'zh' ? '支持 Arxiv PDF 链接或直接网页链接 (AI 搜索)' : 'Supports Arxiv PDF links or direct web URLs (AI Search)'}
              </p>
          </div>
      )}
    </div>
  );
};