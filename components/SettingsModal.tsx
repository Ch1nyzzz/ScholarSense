

import React, { useState, useEffect } from 'react';
import { X, Key, Cloud, FolderDown, Database, Info, HelpCircle, Copy, Check, Cpu, Globe, Zap, Rocket, Server, Edit, Brain, ChevronDown, ChevronUp, LogIn, UserPlus, Bot, Sparkles, Code, Command } from 'lucide-react';
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
  
  // UI State
  const [showServerConfig, setShowServerConfig] = useState(false);

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

        // Auto-expand server config if empty
        if (!cloudConfig.supabaseUrl || !cloudConfig.supabaseKey) {
            setShowServerConfig(true);
        } else {
            setShowServerConfig(false);
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
             // Trigger immediate sync after login to push local papers to cloud
             refreshLibrary();
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
        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all border whitespace-nowrap ${
            activeTab === id 
            ? 'bg-apple-dark text-white border-apple-dark shadow-md' 
            : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
        }`}
    >
        {icon}
        {name}
    </button>
  );
  
  const getProviderLink = (provider: AiProvider) => {
      switch(provider) {
          case 'gemini': return "https://aistudio.google.com/app/apikey";
          case 'siliconflow': return "https://cloud.siliconflow.cn/";
          case 'minimax': return "https://platform.minimax.io";
          case 'moonshot': return "https://platform.moonshot.ai";
          case 'zhipu': return "https://bigmodel.cn";
          case 'deepseek': return "https://platform.deepseek.com";
          case 'qwen': return "https://qwen.ai";
          case 'openai': return "https://platform.openai.com/";
          default: return "";
      }
  };

  const getDefaultBaseUrl = (provider: AiProvider) => {
       switch(provider) {
          case 'siliconflow': return 'https://api.siliconflow.cn/v1';
          case 'minimax': return 'https://api.minimax.io/v1';
          case 'moonshot': return 'https://api.moonshot.ai/v1';
          case 'zhipu': return 'https://open.bigmodel.cn/api/paas/v4';
          case 'deepseek': return 'https://api.deepseek.com';
          case 'qwen': return 'https://dashscope-intl.aliyuncs.com/compatible-mode/v1';
          case 'openai': return 'https://api.openai.com/v1';
          default: return '';
      }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/30 backdrop-blur-sm md:p-4 transition-all duration-300">
      <div className="bg-white w-full h-[92vh] md:h-auto md:max-h-[85vh] md:max-w-2xl rounded-t-3xl md:rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in slide-in-from-bottom-10 md:slide-in-from-bottom-4 duration-300">
        
        {/* Mobile Drag Handle */}
        <div className="md:hidden w-full flex justify-center pt-3 pb-1 shrink-0">
            <div className="w-12 h-1.5 bg-gray-200 rounded-full"></div>
        </div>

        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between relative shrink-0">
          <h2 className="text-lg font-bold text-apple-dark">{t.settingsTitle}</h2>
          <button onClick={toggleSettings} className="p-1.5 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors">
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        <div className="p-6 space-y-8 overflow-y-auto flex-1 overscroll-contain">
          
          {/* AI Provider Section */}
          <section>
            <label className="block text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-apple-blue" />
              {language === 'zh' ? 'AI 模型服务商' : 'AI Provider & Model'}
            </label>

            <div className="flex flex-wrap gap-2 mb-4">
                {renderProviderTab('gemini', 'Gemini', <Zap className="w-3 h-3" />)}
                {renderProviderTab('deepseek', 'DeepSeek', <Brain className="w-3 h-3" />)}
                {renderProviderTab('moonshot', 'Kimi/Moonshot', <Sparkles className="w-3 h-3" />)}
                {renderProviderTab('qwen', 'Qwen (Aliyun)', <Cloud className="w-3 h-3" />)}
                {renderProviderTab('zhipu', 'Zhipu GLM', <Bot className="w-3 h-3" />)}
                {renderProviderTab('minimax', 'MiniMax', <Command className="w-3 h-3" />)}
                {renderProviderTab('siliconflow', 'SiliconFlow', <Rocket className="w-3 h-3" />)}
                {renderProviderTab('openai', 'OpenAI', <Globe className="w-3 h-3" />)}
            </div>

            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                {/* API Key Input */}
                <div className="mb-4">
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                        API Key
                    </label>
                    <div className="relative">
                        <Key className="absolute left-3 top-3.5 w-4 h-4 text-gray-400" />
                        <input
                            type="password"
                            value={localKeys[activeTab]}
                            onChange={(e) => setLocalKeys({ ...localKeys, [activeTab]: e.target.value })}
                            className="block w-full pl-9 pr-3 py-3 border border-gray-300 rounded-xl text-base focus:ring-2 focus:ring-apple-blue outline-none bg-white transition-shadow"
                            placeholder={`sk-... (${activeTab} API Key)`}
                        />
                    </div>
                    <p className="text-[10px] text-gray-400 mt-1 ml-1">
                        Get key at: <a href={getProviderLink(activeTab)} target="_blank" rel="noreferrer" className="text-apple-blue hover:underline">{getProviderLink(activeTab)}</a>
                    </p>
                </div>

                {/* Model Selector */}
                <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                        {language === 'zh' ? '选择模型' : 'Select Model'}
                    </label>
                    <div className="space-y-2">
                        <select
                            value={isCustomModel ? 'custom_input' : aiConfig.activeModel}
                            onChange={handleModelSelectChange}
                            className="block w-full px-3 py-3 border border-gray-300 rounded-xl text-base focus:ring-2 focus:ring-apple-blue outline-none bg-white transition-shadow"
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
                                <Edit className="absolute left-3 top-3.5 w-4 h-4 text-gray-400" />
                                <input 
                                    type="text" 
                                    value={customModelId}
                                    onChange={(e) => setCustomModelId(e.target.value)}
                                    placeholder="e.g. user-custom-model-v1"
                                    className="block w-full pl-9 pr-3 py-3 border border-apple-blue rounded-xl text-base focus:ring-2 focus:ring-apple-blue outline-none bg-white shadow-sm"
                                />
                            </div>
                        )}
                    </div>
                </div>

                {/* Optional Base URL */}
                {activeTab !== 'gemini' && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                            API Base URL (Optional / Override)
                        </label>
                        <div className="relative">
                            <Server className="absolute left-3 top-3.5 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                value={aiConfig.baseUrls?.[activeTab] || ''}
                                onChange={(e) => setAiConfig({ 
                                    baseUrls: { 
                                        ...aiConfig.baseUrls, 
                                        [activeTab]: e.target.value 
                                    } 
                                })}
                                className="block w-full pl-9 pr-3 py-3 border border-gray-300 rounded-xl text-base focus:ring-2 focus:ring-apple-blue outline-none bg-white"
                                placeholder={getDefaultBaseUrl(activeTab)}
                            />
                        </div>
                        <p className="text-[10px] text-gray-400 mt-1 ml-1">
                            Default: {getDefaultBaseUrl(activeTab)}
                        </p>
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
                  {language === 'zh' ? '云端同步 (Localhost 永久保存)' : 'Cloud Sync (Persistence)'}
                </label>
            </div>
            <p className="text-xs text-gray-500 mb-4 bg-blue-50 p-3 rounded-xl border border-blue-100 leading-relaxed">
               <Info className="w-3 h-3 inline mr-1 -mt-0.5" />
               {language === 'zh' 
                ? '为了永久保存您的数据，请配置并登录 Supabase。' 
                : 'To persist data across sessions, configure and login to Supabase.'}
            </p>

            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                 {!authUser ? (
                     <div className="p-4 space-y-5">
                         
                         {/* Server Configuration - Collapsible */}
                         <div className="space-y-2">
                             <button 
                                onClick={() => setShowServerConfig(!showServerConfig)}
                                className="flex items-center justify-between w-full text-xs font-bold text-gray-500 uppercase tracking-wider"
                             >
                                <span>{language === 'zh' ? '服务器配置 (Supabase)' : 'Server Configuration'}</span>
                                <div className="flex items-center gap-1 text-apple-blue bg-blue-50 px-2 py-1 rounded-md">
                                    <span className="text-[10px]">{showServerConfig ? (language === 'zh' ? '收起' : 'Collapse') : (inputSupabaseUrl ? (language === 'zh' ? '已配置' : 'Configured') : (language === 'zh' ? '去配置' : 'Setup'))}</span>
                                    {showServerConfig ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                                </div>
                             </button>

                             {showServerConfig && (
                                 <div className="space-y-3 animate-in fade-in slide-in-from-top-2 pt-2">
                                     <div>
                                        <input 
                                            className="w-full px-4 py-3 text-base bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-apple-blue outline-none transition-colors" 
                                            placeholder="Supabase URL (e.g. https://xyz.supabase.co)"
                                            value={inputSupabaseUrl}
                                            onChange={e => setInputSupabaseUrl(e.target.value)}
                                        />
                                     </div>
                                     <div>
                                        <input 
                                            type="password"
                                            className="w-full px-4 py-3 text-base bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-apple-blue outline-none transition-colors" 
                                            placeholder="Supabase Anon Key"
                                            value={inputSupabaseKey}
                                            onChange={e => setInputSupabaseKey(e.target.value)}
                                        />
                                     </div>
                                 </div>
                             )}
                         </div>

                         <hr className="border-gray-100" />

                         {/* Auth Forms */}
                         <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
                                {language === 'zh' ? '账户登录' : 'Account Login'}
                            </label>
                             <div className="space-y-3">
                                 <input 
                                    type="email"
                                    className="w-full px-4 py-3.5 text-base border border-gray-200 rounded-xl focus:ring-2 focus:ring-apple-blue outline-none bg-white transition-shadow"
                                    placeholder="Email"
                                    value={authEmail}
                                    onChange={e => setAuthEmail(e.target.value)}
                                 />
                                 <input 
                                    type="password"
                                    className="w-full px-4 py-3.5 text-base border border-gray-200 rounded-xl focus:ring-2 focus:ring-apple-blue outline-none bg-white transition-shadow"
                                    placeholder="Password"
                                    value={authPassword}
                                    onChange={e => setAuthPassword(e.target.value)}
                                 />
                             </div>
                         </div>

                         <div className="grid grid-cols-1 gap-3 pt-1">
                             <button 
                                onClick={() => handleAuth('login')}
                                className="w-full flex items-center justify-center gap-2 bg-apple-blue text-white py-3.5 rounded-xl text-base font-bold hover:bg-blue-600 active:scale-[0.98] transition-all shadow-lg shadow-blue-500/20"
                                disabled={authLoading}
                             >
                                 {authLoading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <LogIn className="w-5 h-5" />}
                                 <span>{language === 'zh' ? '登录并同步' : 'Login & Sync'}</span>
                             </button>
                             <button 
                                onClick={() => handleAuth('signup')}
                                className="w-full flex items-center justify-center gap-2 bg-white text-gray-600 border border-gray-200 py-3.5 rounded-xl text-base font-bold hover:bg-gray-50 active:scale-[0.98] transition-all"
                                disabled={authLoading}
                             >
                                 <UserPlus className="w-5 h-5" />
                                 <span>{language === 'zh' ? '注册新账户' : 'Create Account'}</span>
                             </button>
                         </div>
                     </div>
                 ) : (
                     <div className="flex justify-between items-center bg-green-50 p-5">
                         <div className="flex items-center gap-3">
                             <div className="p-2 bg-green-100 rounded-full">
                                <Check className="w-5 h-5 text-green-600" />
                             </div>
                             <div>
                                 <p className="text-sm font-bold text-green-800">Sync Active</p>
                                 <p className="text-xs text-green-600">{authUser.email}</p>
                             </div>
                         </div>
                         <button 
                            onClick={() => { 
                                const c = getSupabaseClient(cloudConfig); 
                                if(c) c.auth.signOut().then(() => setAuthUser(null)); 
                            }} 
                            className="text-xs font-bold text-red-500 px-3 py-1.5 bg-white rounded-lg border border-red-100 shadow-sm"
                         >
                            Logout
                         </button>
                     </div>
                 )}
            </div>
            
            {/* SQL Helper */}
            <div className="mt-6 pb-8">
                <button 
                    onClick={() => setShowSqlHelp(!showSqlHelp)} 
                    className="flex items-center gap-1 text-xs font-medium text-gray-400 hover:text-gray-600 transition-colors"
                >
                    <Database className="w-3 h-3" />
                    {showSqlHelp ? (language === 'zh' ? '隐藏 SQL 配置脚本' : 'Hide Database Setup SQL') : (language === 'zh' ? '查看数据库配置 SQL' : 'View Database Setup SQL')}
                </button>
                
                {showSqlHelp && (
                    <div className="mt-3 bg-gray-800 rounded-xl p-4 text-[10px] text-gray-300 font-mono overflow-x-auto shadow-inner">
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

-- Policies (DB)
create policy "Users can manage their own papers" on papers for all using (auth.uid() = user_id);

-- Policies (Storage)
create policy "Users can upload pdfs" on storage.objects for insert with check ( bucket_id = 'papers' and auth.uid()::text = (storage.foldername(name))[1] );
create policy "Users can view pdfs" on storage.objects for select using ( bucket_id = 'papers' and auth.uid()::text = (storage.foldername(name))[1] );
create policy "Users can delete pdfs" on storage.objects for delete using ( bucket_id = 'papers' and auth.uid()::text = (storage.foldername(name))[1] );`}</pre>
                    </div>
                )}
            </div>
          </section>
        </div>

        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end shrink-0 md:rounded-b-2xl pb-8 md:pb-4">
          <button
            onClick={handleSave}
            className="w-full md:w-auto px-8 py-3 bg-apple-dark text-white text-base font-bold rounded-xl hover:bg-black transition-colors shadow-lg shadow-black/10 active:scale-[0.98]"
          >
            {t.save}
          </button>
        </div>
      </div>
    </div>
  );
};