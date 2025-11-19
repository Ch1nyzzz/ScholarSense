
import React, { useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { PaperList } from './components/PaperList';
import { ReaderView } from './components/ReaderView';
import { FileUpload } from './components/FileUpload';
import { SettingsModal } from './components/SettingsModal';
import { useStore } from './store';
import { translations } from './i18n';

function App() {
  const { viewMode, language, cloudConfig, refreshLibrary } = useStore();
  const t = translations[language];

  // Automatic Cloud Sync on App Start
  useEffect(() => {
    if (cloudConfig.isEnabled) {
      refreshLibrary().catch(console.error);
    }
  }, [cloudConfig.isEnabled]); // Re-run if config is enabled/updated

  return (
    <div className="flex h-screen w-screen bg-apple-gray overflow-hidden">
      <Sidebar />
      
      {/* Main Content Area */}
      <main className="flex-1 flex flex-col relative h-full overflow-hidden">
        
        {/* Dashboard View */}
        <div className={`absolute inset-0 flex flex-col overflow-y-auto transition-transform duration-500 ease-out ${viewMode === 'reader' ? 'scale-95 opacity-0 pointer-events-none' : 'scale-100 opacity-100'}`}>
            <div className="max-w-4xl w-full mx-auto px-6 py-8">
                <header className="mb-8">
                    <h2 className="text-2xl font-bold text-apple-dark">{t.inbox}</h2>
                    <p className="text-gray-500 text-sm">{t.inboxSubtitle}</p>
                </header>
                
                <FileUpload />
                <PaperList />
            </div>
        </div>

        {/* Reader Overlay */}
        {viewMode === 'reader' && <ReaderView />}
        
      </main>

      {/* Modals */}
      <SettingsModal />
    </div>
  );
}

export default App;
