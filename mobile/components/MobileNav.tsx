import React from 'react';
import { Home, UploadCloud } from 'lucide-react';

interface MobileNavProps {
    activeTab: 'home' | 'upload';
    onTabChange: (tab: 'home' | 'upload') => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({ activeTab, onTabChange }) => {
    return (
        <div className="absolute bottom-0 left-0 right-0 bg-white/90 backdrop-blur-lg border-t border-gray-200 px-6 py-3 flex justify-around items-center z-40 safe-bottom shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
            <button 
                onClick={() => onTabChange('home')}
                className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'home' ? 'text-apple-blue' : 'text-gray-400'}`}
            >
                <Home className="w-6 h-6" />
                <span className="text-[10px] font-medium">Library</span>
            </button>
            
            <div className="w-px h-8 bg-gray-200 mx-2"></div>

            <button 
                onClick={() => onTabChange('upload')}
                className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'upload' ? 'text-apple-blue' : 'text-gray-400'}`}
            >
                <div className={`p-3 rounded-full -mt-8 border-4 border-apple-gray shadow-lg transition-transform active:scale-95 ${activeTab === 'upload' ? 'bg-apple-blue text-white' : 'bg-apple-dark text-white'}`}>
                    <UploadCloud className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-medium mt-1">Upload</span>
            </button>
        </div>
    );
};