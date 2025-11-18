
import React, { useState, useCallback } from 'react';
import { UploadCloud, Loader2, FileText } from 'lucide-react';
import { useStore } from '../store';
import { extractTextFromPdf } from '../services/pdfService';
import { analyzePaperWithGemini } from '../services/geminiService';
import { Paper, PaperStatus } from '../types';
import { v4 as uuidv4 } from 'uuid'; 

const generateId = () => Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

export const FileUpload: React.FC = () => {
  const { addPaper, updatePaperStatus, updatePaperAnalysis, apiKey, toggleSettings, language } = useStore();
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFile = async (file: File) => {
    if (file.type !== 'application/pdf') {
      alert("Please upload a valid PDF file.");
      return;
    }

    if (!apiKey) {
      alert("Please configure your Gemini API Key in Settings first.");
      toggleSettings();
      return;
    }

    const id = generateId();
    const newPaper: Paper = {
      id,
      originalTitle: file.name,
      dateAdded: Date.now(),
      status: PaperStatus.EXTRACTING,
      analysis: null,
      tags: [],
      collectionIds: [], // Initialize
      userNotes: '',     // Initialize
      isFavorite: false,
      isRead: false
    };

    addPaper(newPaper);
    setIsProcessing(true);

    try {
      // 1. Extract Text
      const text = await extractTextFromPdf(file);
      updatePaperStatus(id, PaperStatus.ANALYZING);

      // 2. Analyze with Gemini
      const analysis = await analyzePaperWithGemini(text, apiKey, language);
      
      // 3. Save Result
      updatePaperAnalysis(id, analysis);
    } catch (error: any) {
      console.error(error);
      updatePaperStatus(id, PaperStatus.ERROR, error.message || "Unknown error occurred");
    } finally {
      setIsProcessing(false);
    }
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  }, [apiKey, language]); 

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
        handleFile(e.target.files[0]);
    }
  };

  return (
    <div 
      className={`
        relative group cursor-pointer mb-6 rounded-2xl border-2 border-dashed transition-all duration-200 ease-in-out h-32 flex flex-col items-center justify-center
        ${isDragging ? 'border-apple-blue bg-blue-50' : 'border-gray-300 hover:border-gray-400 bg-white'}
      `}
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={onDrop}
    >
      <input 
        type="file" 
        accept=".pdf" 
        onChange={handleInputChange}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
      />
      
      <div className="flex flex-col items-center text-center pointer-events-none">
        {isProcessing ? (
           <div className="flex flex-col items-center text-apple-blue animate-pulse">
             <Loader2 className="w-8 h-8 animate-spin mb-2" />
             <span className="text-sm font-medium">Reading Paper... ({language === 'en' ? 'EN' : 'ZH'})</span>
           </div>
        ) : (
            <>
                <div className={`p-2 rounded-full mb-2 transition-colors ${isDragging ? 'bg-blue-100' : 'bg-gray-100 group-hover:bg-gray-200'}`}>
                    <UploadCloud className={`w-6 h-6 ${isDragging ? 'text-apple-blue' : 'text-gray-500'}`} />
                </div>
                <p className="text-sm font-medium text-gray-700">
                    <span className="text-apple-blue">Click to upload</span> or drag PDF here
                </p>
                <p className="text-xs text-gray-400 mt-1">Supports academic PDFs up to 50MB</p>
            </>
        )}
      </div>
    </div>
  );
};
