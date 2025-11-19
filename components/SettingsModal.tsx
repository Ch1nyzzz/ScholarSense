
import React, { useState, useEffect } from 'react';
import { X, Key, Cloud, FolderDown, Database, Info, HelpCircle, Copy, Check, Cpu, Globe, Zap, Server, Edit, Brain, Rocket } from 'lucide-react';
import { useStore } from '../store';
import { translations } from '../i18n';
import { getSupabaseClient } from '../services/supabase';
import { AVAILABLE_MODELS, AiProvider } from '../types';

export const SettingsModal: React.FC = () => {
  const { 
    isSettingsOpen, toggleSettings, 
    aiConfig, setAiConfig, updateAiKey,
    language, papers, collections,
    cloudConfig, setCloudConfig,
    refreshLibrary, isSyncing, lastCloudSync, cloudSyncError
  } = useStore();

  // Local state for inputs (to avoid syncing on every keystroke)
  const [localKeys, setLocalKeys] = useState(aiConfig.keys);
  const [activeTab, setActiveTab] = useState<AiProvider>('gemini');
  const [customModelId, setCustomModelId] = useState('');
  const [isCustomModel, setIsCustomModel] = useState(false);
  
  // Supabase / Auth State
  const [inputSupabaseUrl, setInputSupabaseUrl] = useState('');
  const [inputSupabaseKey, setInputSupabaseKey] = useState('');
  const [authUser, setAuthUser] = useState<any>(null);
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [showSqlHelp, setShowSqlHelp] = useState(false);

  const t = translations[language];

  useEffect(() => {
    if (isSettingsOpen) {
        setLocalKeys(aiConfig.keys);
        setActiveTab(aiConfig.activeProvider);
        setInputSupabaseUrl(cloudConfig.supabaseUrl);
        setInputSupabaseKey(cloudConfig.supabaseKey);
        
        // Check if current model is custom
        const knownModels = AVAILABLE_MODELS[aiConfig.activeProvider].map(m => m.modelId);
        const isUnknown = !knownModels.includes(aiConfig.activeModel);
        setIsCustomModel(isUnknown);
        if (isUnknown) {
            setCustomModelId(aiConfig.activeModel);
        } else {
            setCustomModelId('');
        }

        checkUser();
    }
  }, [isSettingsOpen]);

  // Auto-expand SQL help if there is a table error
  useEffect(() => {
      const err = cloudSyncError?.toLowerCase() || '';
      if (err.includes('table') || err.includes('schema') || err.includes('database setup')) {
          setShowSqlHelp(true);
      }
  }, [cloudSyncError]);

  // When tab changes, reset model to first available if currently using custom from another provider
  useEffect(() => {
      if (isSettingsOpen) {
        const defaultModel = AVAILABLE_MODELS[activeTab][0].modelId;
        // We don't setAiConfig here immediately, we wait for save.
        // But we should update the UI state to reflect what would happen if they saved now, 
        // or just show the currently saved config if it matches the tab.
        if (aiConfig.activeProvider === activeTab) {
            const knownModels = AVAILABLE_MODELS[activeTab].map(m => m.modelId);
            const isUnknown = !knownModels.includes(aiConfig.activeModel);
            setIsCustomModel(isUnknown);
            setCustomModelId(isUnknown ? aiConfig.activeModel : '');
        } else {
            setIsCustomModel(false);
            setCustomModelId('');
        }
      }
  }, [activeTab]);

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

  const normalizeUrl = (url: string) => {
      let clean = url.trim();
      if (!clean.includes('.') && !clean.includes('://') && /^[a-z0-9-]{10,30}$/i.test(clean)) {
          return `https://${clean}.supabase.co`;
      }
      if (clean && !clean.startsWith('http')) {
          return `https://${clean}`;
      }
      return clean;
  };

  const handleSave = () => {
    // Save Keys
    Object.entries(localKeys).forEach(([provider, key]) => {
        updateAiKey(provider as AiProvider, key);
    });

    // Determine Active Model
    let finalModel = aiConfig.activeModel;
    
    // If we switched providers, pick the default or the custom one
    if (activeTab !== aiConfig.activeProvider) {
        finalModel = isCustomModel && customModelId ? customModelId : AVAILABLE_MODELS[activeTab][0].modelId;
    } else {
        // Same provider, check if we changed model
        if (isCustomModel && customModelId) {
            finalModel = customModelId;
        } 
        // If not custom, it's already handled by the select onChange
    }

    // Save Active Provider & Model
    setAiConfig({ 
        activeProvider: activeTab,
        activeModel: finalModel
    });

    // Save Cloud Config
    const finalUrl = normalizeUrl(inputSupabaseUrl);
    const finalKey = inputSupabaseKey.trim();

    if (finalUrl !== cloudConfig.supabaseUrl || finalKey !== cloudConfig.supabaseKey) {
        setCloudConfig({
            supabaseUrl: finalUrl,
            supabaseKey: finalKey,
            isEnabled: !!(finalUrl && finalKey)
        });
    }

    toggleSettings();
  };

  const handleModelSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const val = e.target.value;
      if (val === 'custom_input') {
          setIsCustomModel(true);
          setCustomModelId(''); // Reset so they can type
      } else {
          setIsCustomModel(false);
          setAiConfig({ activeModel: val });
      }
  };

  const handleAuth = async (mode: 'login' | 'signup') => {
     if (!authEmail || !authPassword) return alert("Missing email/password");
     setAuthLoading(true);
     try {
         const client = getSupabaseClient({ ...cloudConfig, supabaseUrl: normalizeUrl(inputSupabaseUrl), supabaseKey: inputSupabaseKey, isEnabled: true });
         if (!client) throw new Error("Invalid Config");
         if (mode === 'signup') {
             const { data, error } = await client.auth.signUp({ email: authEmail, password: authPassword });
             if (error) throw error;
             if (data.session) setAuthUser(data.user);
             else alert("Check email for confirmation");
         } else {
             const { data, error } = await client.auth.signInWithPassword({ email: authEmail, password: authPassword });
             if (error) throw error;
             setAuthUser(data.user);
         }
     } catch (e: any) {
         alert(e.message);
     } finally {
         setAuthLoading(false);
     }
  };

  const renderProviderTab = (id: AiProvider, name: string, icon: React.ReactNode) => (
    <button
        onClick={() => setActiveTab(id)}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all border ${
            activeTab === id 
            ? 'bg-apple-dark text-white border-apple-dark shadow-md' 
            : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
        }`}
    >
        {icon}
        {name}
    </button>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-center relative shrink-0">
          <h2 className="text-lg font-bold text-apple-dark">{t.settingsTitle}</h2>
          <button onClick={toggleSettings} className="absolute right-4 p-1 rounded-full hover:bg-gray-100 transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-8 overflow-y-auto flex-1">
          
          {/* AI Provider Section */}
          <section>
            <label className="block text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-apple-blue" />
              {language === 'zh' ? 'AI 模型服务商' : 'AI Provider & Model'}
            </label>

            <div className="flex flex-wrap gap-2 mb-4">
                {renderProviderTab('gemini', 'Gemini', <Zap className="w-3 h-3" />)}
                {renderProviderTab('siliconflow', 'SiliconCloud', <Rocket className="w-3 h-3" />)}
                {renderProviderTab('openai', 'OpenAI', <Globe className="w-3 h-3" />)}
            </div>

            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 animate-in fade-in">
                {/* API Key Input */}
                <div className="mb-4">
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                        API Key
                    </label>
                    <div className="relative">
                        <Key className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                        <input
                            type="password"
                            value={localKeys[activeTab]}
                            onChange={(e) => setLocalKeys({ ...localKeys, [activeTab]: e.target.value })}
                            className="block w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-apple-blue outline-none bg-white"
                            placeholder={`sk-... (${activeTab} API Key)`}
                        />
                    </div>
                    <p className="text-[10px] text-gray-400 mt-1 ml-1">
                        {activeTab === 'gemini' && "Get key at aistudio.google.com"}
                        {activeTab === 'siliconflow' && "Get key at cloud.siliconflow.cn (Supports DeepSeek, Qwen, GLM, etc.)"}
                        {activeTab === 'openai' && "OpenAI Platform or Compatible Proxy"}
                    </p>
                </div>

                {/* Model Selector */}
                <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                        {language === 'zh' ? '选择模型' : 'Select Model'}
                    </label>
                    <div className="space-y-2">
                        <select
                            value={isCustomModel ? 'custom_input' : aiConfig.activeModel}
                            onChange={handleModelSelectChange}
                            className="block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-apple-blue outline-none bg-white"
                        >
                            {AVAILABLE_MODELS[activeTab].map((m) => (
                                <option key={m.modelId} value={m.modelId}>
                                    {m.name} ({m.modelId})
                                </option>
                            ))}
                            <option value="custom_input" className="font-semibold text-apple-blue">
                                {language === 'zh' ? '+ 自定义模型 ID' : '+ Custom Model ID'}
                            </option>
                        </select>

                        {isCustomModel && (
                            <div className="relative animate-in fade-in slide-in-from-top-1">
                                <Edit className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                                <input 
                                    type="text" 
                                    value={customModelId}
                                    onChange={(e) => setCustomModelId(e.target.value)}
                                    placeholder="e.g. gemini-2.0-pro-exp-02-05"
                                    className="block w-full pl-9 pr-3 py-2 border border-apple-blue rounded-lg text-sm focus:ring-2 focus:ring-apple-blue outline-none bg-white shadow-sm"
                                />
                                <p className="text-[10px] text-gray-500 mt-1 ml-1">
                                    {language === 'zh' ? '请输入准确的模型 ID' : 'Enter the exact Model ID from the provider'}
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Optional Base URL for OpenAI & SiliconFlow */}
                {(activeTab === 'openai' || activeTab === 'siliconflow') && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                            Proxy Base URL (Optional)
                        </label>
                        <div className="relative">
                            <Server className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                value={aiConfig.baseUrls?.[activeTab] || ''}
                                onChange={(e) => setAiConfig({ 
                                    baseUrls: { 
                                        ...aiConfig.baseUrls, 
                                        [activeTab]: e.target.value 
                                    } 
                                })}
                                className="block w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-apple-blue outline-none bg-white"
                                placeholder={activeTab === 'siliconflow' ? 'https://api.siliconflow.cn/v1' : 'https://api.openai.com/v1'}
                            />
                        </div>
                    </div>
                )}
            </div>
          </section>

          <hr className="border-gray-100" />

          {/* Cloud Sync Section */}
          <section>
            <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-bold text-gray-800 flex items-center gap-2">
                  <Cloud className="w-4 h-4 text-apple-blue" />
                  {language === 'zh' ? '云端同步 (Localhost 永久保存)' : 'Cloud Data Sync (Persistent Storage)'}
                </label>
            </div>
            <p className="text-xs text-gray-500 mb-4 bg-blue-50 p-2 rounded-lg border border-blue-100">
               <Info className="w-3 h-3 inline mr-1" />
               {language === 'zh' 
                ? '在 Localhost 环境下，浏览器缓存清空会导致数据丢失。为了永久保存您的数据，请务必配置并登录 Supabase。' 
                : 'In Localhost, data may be lost if browser cache is cleared. Configure and login to Supabase to ensure permanent cloud storage.'}
            </p>

            <div className="bg-white rounded-xl p-4 border border-gray-200">
                 {!authUser ? (
                     <div className="space-y-2">
                        <input 
                            className="w-full px-3 py-2 text-sm border rounded-lg" 
                            placeholder="Supabase URL (e.g. https://xyz.supabase.co)"
                            value={inputSupabaseUrl}
                            onChange={e => setInputSupabaseUrl(e.target.value)}
                        />
                        <input 
                            type="password"
                            className="w-full px-3 py-2 text-sm border rounded-lg" 
                            placeholder="Supabase Anon Key"
                            value={inputSupabaseKey}
                            onChange={e => setInputSupabaseKey(e.target.value)}
                        />
                         <div className="flex gap-2 mt-2">
                             <input 
                                className="flex-1 px-3 py-2 text-sm border rounded-lg"
                                placeholder="Email"
                                value={authEmail}
                                onChange={e => setAuthEmail(e.target.value)}
                             />
                             <input 
                                type="password"
                                className="flex-1 px-3 py-2 text-sm border rounded-lg"
                                placeholder="Password"
                                value={authPassword}
                                onChange={e => setAuthPassword(e.target.value)}
                             />
                         </div>
                         <button 
                            onClick={() => handleAuth('login')}
                            className="w-full bg-apple-blue text-white py-2 rounded-lg text-sm mt-2 font-medium hover:bg-blue-600 transition-colors"
                            disabled={authLoading}
                         >
                             {authLoading ? 'Connecting...' : 'Login & Sync'}
                         </button>
                         <button 
                            onClick={() => handleAuth('signup')}
                            className="w-full bg-white text-apple-blue border border-apple-blue py-2 rounded-lg text-sm mt-1 hover:bg-blue-50 transition-colors"
                            disabled={authLoading}
                         >
                             Sign Up
                         </button>
                     </div>
                 ) : (
                     <div className="flex justify-between items-center bg-green-50 p-3 rounded-lg border border-green-100">
                         <div className="flex items-center gap-2">
                             <span className="relative flex h-2 w-2">
                               <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                               <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                             </span>
                             <span className="text-sm text-green-700 font-medium">Sync Active: {authUser.email}</span>
                         </div>
                         <button onClick={() => { 
                             const c = getSupabaseClient(cloudConfig); 
                             if(c) c.auth.signOut().then(() => setAuthUser(null)); 
                         }} className="text-xs text-red-500 hover:underline bg-white px-2 py-1 rounded border border-red-100">Logout</button>
                     </div>
                 )}
            </div>
            
            {/* SQL Helper */}
            <div className="mt-4">
                <button 
                    onClick={() => setShowSqlHelp(!showSqlHelp)} 
                    className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600"
                >
                    <Database className="w-3 h-3" />
                    {showSqlHelp ? (language === 'zh' ? '隐藏 SQL 配置脚本' : 'Hide Database Setup SQL') : (language === 'zh' ? '查看数据库配置 SQL' : 'View Database Setup SQL')}
                </button>
                
                {showSqlHelp && (
                    <div className="mt-2 bg-gray-800 rounded-lg p-3 text-[10px] text-gray-300 font-mono overflow-x-auto">
                        <pre>{`-- Run this in Supabase SQL Editor
create table papers (
  id uuid primary key,
  user_id uuid references auth.users not null,
  title text,
  original_title text,
  source_url text,
  storage_path text,
  analysis jsonb,
  tags text[],
  status text,
  is_favorite boolean default false,
  user_notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table papers enable row level security;
insert into storage.buckets (id, name, public) values ('papers', 'papers', false);

-- Policies
create policy "Users can manage their own papers" on papers for all using (auth.uid() = user_id);
create policy "Users can upload pdfs" on storage.objects for insert with check ( bucket_id = 'papers' and auth.uid()::text = (storage.foldername(name))[1] );
create policy "Users can view pdfs" on storage.objects for select using ( bucket_id = 'papers' and auth.uid()::text = (storage.foldername(name))[1] );`}</pre>
                    </div>
                )}
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
