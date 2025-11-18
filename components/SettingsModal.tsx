import React, { useState, useEffect } from 'react';
import { X, Key, CheckCircle, AlertCircle } from 'lucide-react';
import { useStore } from '../store';

export const SettingsModal: React.FC = () => {
  const { isSettingsOpen, toggleSettings, apiKey, setApiKey } = useStore();
  const [inputKey, setInputKey] = useState('');

  useEffect(() => {
    setInputKey(apiKey);
  }, [apiKey, isSettingsOpen]);

  if (!isSettingsOpen) return null;

  const handleSave = () => {
    setApiKey(inputKey);
    toggleSettings();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all scale-100">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-lg font-bold text-apple-dark">Settings</h2>
          <button onClick={toggleSettings} className="p-1 rounded-full hover:bg-gray-100 transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Google Gemini API Key
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Key className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="password"
                value={inputKey}
                onChange={(e) => setInputKey(e.target.value)}
                className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-apple-blue focus:border-apple-blue transition-shadow outline-none"
                placeholder="AIzaSy..."
              />
            </div>
            <p className="mt-2 text-xs text-gray-500">
              Your key is stored locally on your device via localStorage. It is never sent to any server other than Google's API.
            </p>
          </div>

          <div className="bg-gray-50 rounded-xl p-4 flex items-start gap-3">
             {apiKey ? (
                <CheckCircle className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
             ) : (
                <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
             )}
             <div>
                <h3 className="text-sm font-medium text-gray-900">
                    {apiKey ? "System Ready" : "Configuration Needed"}
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                    {apiKey 
                        ? "ScholarFeed is connected to Gemini." 
                        : "Please enter your API key to enable AI analysis features."}
                </p>
             </div>
          </div>
        </div>

        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end">
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-apple-dark text-white text-sm font-medium rounded-lg hover:bg-black transition-colors shadow-lg shadow-black/10"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};