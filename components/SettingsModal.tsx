
import React, { useState, useEffect, useRef } from 'react';
import { X, Key, CheckCircle, AlertCircle, Download, Upload, HardDrive, Cloud, RefreshCw, LogIn } from 'lucide-react';
import { useStore } from '../store';
import { translations } from '../i18n';
import { getSupabaseClient } from '../services/supabase';

export const SettingsModal: React.FC = () => {
  const { 
    isSettingsOpen, toggleSettings, 
    apiKey, setApiKey, 
    language, papers, collections, importData,
    cloudConfig, setCloudConfig,
    startCloudSync, restoreFromCloud, isSyncing, lastCloudSync
  } = useStore();

  const [inputKey, setInputKey] = useState('');
  const [inputSupabaseUrl, setInputSupabaseUrl] = useState('');
  const [inputSupabaseKey, setInputSupabaseKey] = useState('');
  const [authUser, setAuthUser] = useState<any>(null);
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [authLoading, setAuthLoading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const t = translations[language];

  useEffect(() => {
    if (isSettingsOpen) {
        setInputKey(apiKey);
        setInputSupabaseUrl(cloudConfig.supabaseUrl);
        setInputSupabaseKey(cloudConfig.supabaseKey);
        checkUser();
    }
  }, [apiKey, cloudConfig, isSettingsOpen]);

  const checkUser = async () => {
    const client = getSupabaseClient(cloudConfig);
    if (client) {
        const { data: { user } } = await client.auth.getUser();
        setAuthUser(user);
    } else {
        setAuthUser(null);
    }
  };

  if (!isSettingsOpen) return null;

  const handleSave = () => {
    setApiKey(inputKey);
    
    // Only update cloud config if changed to avoid unnecessary client resets
    if (inputSupabaseUrl !== cloudConfig.supabaseUrl || inputSupabaseKey !== cloudConfig.supabaseKey) {
        setCloudConfig({
            supabaseUrl: inputSupabaseUrl,
            supabaseKey: inputSupabaseKey,
            isEnabled: !!(inputSupabaseUrl && inputSupabaseKey)
        });
    }

    toggleSettings();
  };

  const handleAuth = async () => {
    setAuthLoading(true);
    try {
        // Temporarily create a config object to get the client immediately
        const tempConfig = { ...cloudConfig, supabaseUrl: inputSupabaseUrl, supabaseKey: inputSupabaseKey, isEnabled: true };
        const client = getSupabaseClient(tempConfig);
        
        if (!client) {
            alert("Please enter valid Supabase URL and Key first");
            return;
        }

        let error;
        if (authMode === 'signup') {
            const res = await client.auth.signUp({ email: authEmail, password: authPassword });
            error = res.error;
            if (!error) alert(language === 'zh' ? "注册成功！请检查邮箱验证。" : "Signup successful! Please check email for verification.");
        } else {
            const res = await client.auth.signInWithPassword({ email: authEmail, password: authPassword });
            error = res.error;
            if (!error) {
                setAuthUser(res.data.user);
                // Ensure config is saved in store if login successful
                setCloudConfig({
                    supabaseUrl: inputSupabaseUrl,
                    supabaseKey: inputSupabaseKey,
                    isEnabled: true
                });
            }
        }

        if (error) alert(error.message);
    } catch (e: any) {
        alert(e.message);
    } finally {
        setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    const client = getSupabaseClient(cloudConfig);
    if (client) {
        await client.auth.signOut();
        setAuthUser(null);
    }
  };

  const handleExport = () => {
    const data = {
      apiKey,
      papers,
      collections,
      cloudConfig,
      language,
      exportedAt: Date.now()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `scholarsense-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (confirm(language === 'zh' ? '这将覆盖您当前的资料库。确定要继续吗？' : 'This will overwrite your current library. Are you sure?')) {
           importData(json);
           alert(language === 'zh' ? '导入成功！' : 'Import successful!');
           toggleSettings();
        }
      } catch (err) {
        alert(language === 'zh' ? '文件格式错误' : 'Invalid JSON file');
      }
    };
    reader.readAsText(file);
    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between shrink-0">
          <h2 className="text-lg font-bold text-apple-dark">{t.settingsTitle}</h2>
          <button onClick={toggleSettings} className="p-1 rounded-full hover:bg-gray-100 transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {/* API Key Section */}
          <section>
            <label className="block text-sm font-bold text-gray-800 mb-2 flex items-center gap-2">
              <Key className="w-4 h-4 text-gray-500" />
              {t.apiKeyLabel}
            </label>
            <input
              type="password"
              value={inputKey}
              onChange={(e) => setInputKey(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-apple-blue focus:border-transparent outline-none"
              placeholder="AIzaSy..."
            />
            <div className="mt-2 flex items-center gap-2 text-xs">
                 {inputKey ? <CheckCircle className="w-3 h-3 text-green-500" /> : <AlertCircle className="w-3 h-3 text-amber-500" />}
                 <span className="text-gray-500">{inputKey ? t.systemReady : t.neededMsg}</span>
            </div>
          </section>

          <hr className="border-gray-100" />

          {/* Cloud Sync Section */}
          <section>
            <label className="block text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
              <Cloud className="w-4 h-4 text-apple-blue" />
              {language === 'zh' ? '云端同步 (Supabase)' : 'Cloud Sync (Supabase)'}
            </label>
            
            <div className="bg-blue-50/50 rounded-xl p-4 border border-blue-100 space-y-3">
                {!authUser ? (
                    <>
                        <div className="text-xs text-gray-600 mb-2">
                            {language === 'zh' ? '配置 Supabase 以启用多端同步功能。' : 'Configure Supabase to enable cross-device sync.'}
                            <a href="https://supabase.com" target="_blank" className="text-apple-blue underline ml-1">Get Free Project</a>
                        </div>
                        <input
                            type="text"
                            value={inputSupabaseUrl}
                            onChange={(e) => setInputSupabaseUrl(e.target.value)}
                            className="block w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-apple-blue outline-none"
                            placeholder="Project URL (https://xyz.supabase.co)"
                        />
                        <input
                            type="password"
                            value={inputSupabaseKey}
                            onChange={(e) => setInputSupabaseKey(e.target.value)}
                            className="block w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-apple-blue outline-none"
                            placeholder="Anon Public Key"
                        />

                        {(inputSupabaseUrl && inputSupabaseKey) && (
                            <div className="pt-2 border-t border-blue-100 mt-2">
                                <div className="flex gap-2 mb-2">
                                    <input 
                                        type="email" 
                                        placeholder="Email"
                                        className="flex-1 px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs"
                                        value={authEmail}
                                        onChange={e => setAuthEmail(e.target.value)}
                                    />
                                    <input 
                                        type="password" 
                                        placeholder="Password"
                                        className="flex-1 px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs"
                                        value={authPassword}
                                        onChange={e => setAuthPassword(e.target.value)}
                                    />
                                </div>
                                <div className="flex gap-2">
                                    <button 
                                        onClick={() => { setAuthMode('login'); handleAuth(); }}
                                        disabled={authLoading}
                                        className="flex-1 py-1.5 bg-apple-blue text-white text-xs rounded-lg font-medium hover:bg-blue-600 disabled:opacity-50"
                                    >
                                        {authLoading ? '...' : 'Log In'}
                                    </button>
                                    <button 
                                        onClick={() => { setAuthMode('signup'); handleAuth(); }}
                                        disabled={authLoading}
                                        className="flex-1 py-1.5 bg-white border border-gray-300 text-gray-600 text-xs rounded-lg font-medium hover:bg-gray-50 disabled:opacity-50"
                                    >
                                        Sign Up
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-sm font-medium text-green-700">
                                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                {authUser.email}
                            </div>
                            <button onClick={handleLogout} className="text-xs text-gray-400 hover:text-red-500">Log Out</button>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2">
                            <button 
                                onClick={startCloudSync}
                                disabled={isSyncing}
                                className="flex items-center justify-center gap-2 py-2 bg-white border border-green-200 text-green-700 rounded-lg text-xs font-medium hover:bg-green-50 transition-colors"
                            >
                                <Upload className={`w-3 h-3 ${isSyncing ? 'animate-bounce' : ''}`} />
                                {language === 'zh' ? '上传同步' : 'Push to Cloud'}
                            </button>
                            <button 
                                onClick={restoreFromCloud}
                                disabled={isSyncing}
                                className="flex items-center justify-center gap-2 py-2 bg-white border border-blue-200 text-blue-700 rounded-lg text-xs font-medium hover:bg-blue-50 transition-colors"
                            >
                                <Download className={`w-3 h-3 ${isSyncing ? 'animate-bounce' : ''}`} />
                                {language === 'zh' ? '下载恢复' : 'Pull from Cloud'}
                            </button>
                        </div>
                        {lastCloudSync && (
                            <p className="text-[10px] text-center text-gray-400">
                                Last Sync: {new Date(lastCloudSync).toLocaleString()}
                            </p>
                        )}
                    </div>
                )}
            </div>
          </section>

          <hr className="border-gray-100" />
          
          {/* Local Data Management */}
          <section>
            <label className="block text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                <HardDrive className="w-4 h-4 text-gray-500" />
                {language === 'zh' ? '本地备份' : 'Local Backup'}
            </label>
            <div className="grid grid-cols-2 gap-3">
                <button 
                    onClick={handleExport}
                    className="flex flex-col items-center justify-center p-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors group"
                >
                    <Download className="w-5 h-5 text-gray-500 mb-1 group-hover:text-apple-dark transition-colors" />
                    <span className="text-xs font-medium text-gray-600">{language === 'zh' ? '导出文件' : 'Export JSON'}</span>
                </button>

                <button 
                    onClick={handleImportClick}
                    className="flex flex-col items-center justify-center p-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors group"
                >
                    <Upload className="w-5 h-5 text-gray-500 mb-1 group-hover:text-apple-dark transition-colors" />
                    <span className="text-xs font-medium text-gray-600">{language === 'zh' ? '导入文件' : 'Import JSON'}</span>
                </button>
                <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept=".json" 
                    onChange={handleFileChange}
                />
            </div>
          </section>
        </div>

        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end shrink-0">
          <button
            onClick={handleSave}
            className="px-6 py-2 bg-apple-dark text-white text-sm font-medium rounded-lg hover:bg-black transition-colors shadow-lg shadow-black/10"
          >
            {t.save}
          </button>
        </div>
      </div>
    </div>
  );
};