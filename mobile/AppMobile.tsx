import React, { useEffect, useState } from 'react';
import { useStore } from '../store'; // Import from shared store
import { translations } from '../i18n'; // Import shared translations
import { PaperListMobile } from './components/PaperListMobile';
import { MobileReader } from './components/MobileReader';
import { MobileNav } from './components/MobileNav';
import { MobileSidebar } from './components/MobileSidebar';
import { FileUpload } from '../components/FileUpload'; // Reuse generic file upload
import { SettingsModal } from '../components/SettingsModal'; // Reuse settings modal
import { Settings, Monitor, Menu } from 'lucide-react';

export default function AppMobile() {
  const { viewMode, language, cloudConfig, refreshLibrary, activePaperId, toggleSettings, setMobilePreview } = useStore();
  const t = translations[language];

  // Mobile specific state
  const [mobileTab, setMobileTab] = useState<'home' | 'upload'>('home');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    if (cloudConfig.isEnabled) {
      refreshLibrary().catch(console.error);
    }
  }, [cloudConfig.isEnabled]);

  // If in reader mode (activePaperId set), show Reader overlay
  const showReader = viewMode === 'reader' && activePaperId;

  return (
    <div className="flex flex-col h-full w-full bg-apple-gray relative overflow-hidden">
      
      <MobileSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto no-scrollbar pb-24">
        {mobileTab === 'home' && (
            <div className="px-4 py-4">
                <div className="flex items-center justify-between mb-4 bg-white/50 backdrop-blur-sm sticky top-0 z-10 py-3 -mx-4 px-4 border-b border-gray-200/50">
                    <div className="flex items-center gap-3">
                        <button 
                            onClick={() => setIsSidebarOpen(true)}
                            className="p-2 -ml-2 rounded-full active:bg-gray-200 transition-colors"
                        >
                            <Menu className="w-6 h-6 text-apple-dark" />
                        </button>
                        <h1 className="text-xl font-bold text-apple-dark tracking-tight">ScholarSense</h1>
                    </div>
                    <div className="flex gap-2">
                        <button 
                            onClick={() => setMobilePreview(false)}
                            className="p-2 bg-white rounded-full shadow-sm text-gray-600 active:bg-gray-50" 
                            title="Desktop View"
                        >
                            <Monitor className="w-5 h-5" />
                        </button>
                        <button 
                            onClick={toggleSettings} 
                            className="p-2 bg-white rounded-full shadow-sm active:bg-gray-50"
                        >
                            <Settings className="w-5 h-5 text-gray-600" />
                        </button>
                    </div>
                </div>
                <PaperListMobile />
            </div>
        )}

        {mobileTab === 'upload' && (
            <div className="px-4 py-6">
                <h2 className="text-xl font-bold text-apple-dark mb-4">{t.clickToUpload}</h2>
                <div className="bg-white rounded-2xl p-4 shadow-sm">
                    <FileUpload />
                </div>
                <p className="text-xs text-gray-500 mt-4 text-center">
                    Use desktop for batch management.
                </p>
            </div>
        )}
      </main>

      {/* Reader Overlay - Full Screen */}
      {showReader && (
        <div className="absolute inset-0 z-50 bg-white animate-in slide-in-from-bottom-full duration-300">
           <MobileReader />
        </div>
      )}

      {/* Settings Modal (Reused) */}
      <SettingsModal />

      {/* Bottom Navigation Bar */}
      {!showReader && (
        <MobileNav activeTab={mobileTab} onTabChange={setMobileTab} />
      )}
    </div>
  );
}