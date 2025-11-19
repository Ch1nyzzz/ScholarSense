
import React, { useState, useCallback } from 'react';
import { UploadCloud, Loader2, FileText, Layers } from 'lucide-react';
import { useStore } from '../store';
import { extractTextFromPdf } from '../services/pdfService';
import { analyzePaperWithGemini } from '../services/geminiService';
import { Paper, PaperStatus } from '../types';
import { translations } from '../i18n';

const generateId = () => Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

export const FileUpload: React.FC = () => {
  const { 
    addPaper, 
    updatePaperStatus, 
    updatePaperAnalysis, 
    apiKey, 
    toggleSettings, 
    language, 
    analysisLanguage, 
    setAnalysisLanguage 
  } = useStore();
  const [isDragging, setIsDragging] = useState(false);
  const [processingCount, setProcessingCount] = useState(0);
  const t = translations[language];

  const processFiles = async (files: File[]) => {
    if (!apiKey) {
      alert("Please configure your Gemini API Key in Settings first.");
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
        const id = generateId();
        const pdfUrl = URL.createObjectURL(file); // Create a temporary URL for viewing

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
            pdfUrl: pdfUrl 
        };

        addPaper(newPaper);

        try {
            // 1. Extract Text
            const text = await extractTextFromPdf(file);
            updatePaperStatus(id, PaperStatus.ANALYZING);

            // 2. Analyze with Gemini (Using analysisLanguage from store)
            const analysis = await analyzePaperWithGemini(text, apiKey, analysisLanguage);
            
            // 3. Save Result
            updatePaperAnalysis(id, analysis);
        } catch (error: any) {
            console.error(error);
            updatePaperStatus(id, PaperStatus.ERROR, error.message || "Unknown error occurred");
        } finally {
            setProcessingCount(prev => Math.max(0, prev - 1));
        }
    });
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        processFiles(Array.from(e.dataTransfer.files));
    }
  }, [apiKey, language, analysisLanguage]); 

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
        processFiles(Array.from(e.target.files));
    }
  };

  return (
    <div className="mb-6">
      {/* Analysis Language Control */}
      <div className="flex justify-between items-center mb-2 px-1">
          <div className="text-sm font-medium text-gray-600 hidden sm:block"></div>
          <div className="flex items-center gap-2 bg-white/50 backdrop-blur-sm border border-gray-200 rounded-lg p-1 ml-auto">
            <span className="text-xs font-medium text-gray-500 px-1">{t.analysisLanguageLabel}:</span>
            <button
                onClick={() => setAnalysisLanguage('en')}
                className={`px-2 py-0.5 text-xs rounded-md transition-all ${analysisLanguage === 'en' ? 'bg-white text-apple-dark shadow-sm font-bold border border-gray-100' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'}`}
            >
                English
            </button>
            <button
                onClick={() => setAnalysisLanguage('zh')}
                className={`px-2 py-0.5 text-xs rounded-md transition-all ${analysisLanguage === 'zh' ? 'bg-white text-apple-dark shadow-sm font-bold border border-gray-100' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'}`}
            >
                中文
            </button>
          </div>
      </div>

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
                  <p className="text-xs text-gray-400 mt-1">{t.batchSupport}</p>
              </>
          )}
        </div>
      </div>
    </div>
  );
};
