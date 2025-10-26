import React, { useState, useEffect } from 'react';
import { StoredConfig } from '../types';

interface ApiModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: StoredConfig;
  setConfig: React.Dispatch<React.SetStateAction<StoredConfig>>;
}

const GEMINI_MODELS = ['gemini-2.5-pro', 'gemini-2.5-flash'];
const OPENAI_MODELS = ['gpt-5', 'gpt-4o', 'gpt-4-turbo', 'gpt-3.5-turbo'];

const ApiTextarea = ({ value, onChange, placeholder }: { value: string, onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void, placeholder?: string }) => (
    <textarea
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      rows={3}
      className="w-full bg-[#1a1b26] border border-[#414868] rounded-md px-3 py-2 text-sm text-white focus:ring-1 focus:ring-indigo-500 outline-none"
    />
);

const HowToGetApiKey = () => (
    <details className="text-sm mt-2 cursor-pointer">
        <summary className="text-gray-400 hover:text-white">Làm thế nào để lấy API Key?</summary>
        <div className="mt-2 p-3 bg-[#1a1b26] rounded-md text-gray-300 space-y-2">
            <p><strong>1. YouTube Data API:</strong></p>
            <ol className="list-decimal list-inside pl-4 text-xs">
                <li>Truy cập <a href="https://console.cloud.google.com/" target="_blank" rel="noopener noreferrer" className="text-indigo-400 underline">Google Cloud Console</a>.</li>
                <li>Tạo một dự án mới.</li>
                <li>Vào "APIs & Services" &gt; "Library", tìm và bật "YouTube Data API v3".</li>
                <li>Vào "APIs & Services" &gt; "Credentials", tạo một API key mới.</li>
                <li>Sao chép key và dán vào ô ở trên.</li>
            </ol>
             <p><strong>2. Google Gemini API:</strong></p>
            <ol className="list-decimal list-inside pl-4 text-xs">
                <li>Truy cập <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-indigo-400 underline">Google AI Studio</a>.</li>
                <li>Đăng nhập bằng tài khoản Google của bạn.</li>
                <li>Nhấp vào "Create API key" để tạo một key mới.</li>
            </ol>
             <p><strong>3. OpenAI API (ChatGPT):</strong></p>
            <ol className="list-decimal list-inside pl-4 text-xs">
                <li>Truy cập <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-indigo-400 underline">OpenAI API Keys page</a>.</li>
                <li>Đăng nhập hoặc tạo một tài khoản mới.</li>
                <li>Nhấp vào "Create new secret key".</li>
            </ol>
        </div>
    </details>
);


export const ApiModal: React.FC<ApiModalProps> = ({ isOpen, onClose, config, setConfig }) => {
  const [localConfig, setLocalConfig] = useState<StoredConfig>(config);

  useEffect(() => {
    if (isOpen) {
      setLocalConfig(JSON.parse(JSON.stringify(config)));
    }
  }, [config, isOpen]);

  if (!isOpen) return null;

  const handleSaveAndClose = () => {
    setConfig(localConfig);
    onClose();
  };
  
  const handleConfigChange = <S extends keyof StoredConfig, K extends keyof StoredConfig[S]>(service: S, key: K, value: StoredConfig[S][K]) => {
      setLocalConfig(prev => ({
          ...prev,
          [service]: {
              ...prev[service],
              [key]: value
          }
      }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 transition-opacity duration-300" onClick={onClose}>
      <div className="bg-[#24283b] rounded-lg shadow-2xl p-6 w-full max-w-lg transform transition-all duration-300" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-white">Quản lý API Keys</h2>
           <button onClick={onClose} className="text-gray-400 hover:text-white">&times;</button>
        </div>

        <div className="space-y-6">
            {/* YouTube Section */}
            <div>
              <h3 className="text-lg font-semibold text-red-400 mb-2">YouTube Data API</h3>
              <label className="block text-sm font-medium text-gray-300 mb-1">API Keys (Bắt buộc)</label>
              <ApiTextarea 
                value={localConfig.youtube.key} 
                onChange={e => handleConfigChange('youtube', 'key', e.target.value)}
                placeholder="Dán một hoặc nhiều API Key, mỗi key một dòng."
              />
              <HowToGetApiKey />
            </div>
            
            {/* Gemini Section */}
            <div>
              <h3 className="text-lg font-semibold text-purple-400 mb-2">Google Gemini</h3>
              <label className="block text-sm font-medium text-gray-300 mb-1">API Keys</label>
              <ApiTextarea 
                value={localConfig.gemini.key} 
                onChange={e => handleConfigChange('gemini', 'key', e.target.value)}
                placeholder="Dán một hoặc nhiều API Key, mỗi key một dòng."
              />
               <label className="block text-sm font-medium text-gray-300 mt-3 mb-1">Model</label>
                <select 
                    value={localConfig.gemini.model} 
                    onChange={e => handleConfigChange('gemini', 'model', e.target.value)} 
                    className="w-full bg-[#1a1b26] border border-[#414868] rounded-md px-3 py-2 text-sm text-white focus:ring-1 focus:ring-indigo-500 outline-none"
                >
                    {GEMINI_MODELS.map(m => <option key={m} value={m}>{m.charAt(0).toUpperCase() + m.slice(1).replace(/-/g, ' ')}</option>)}
                </select>
            </div>

            {/* OpenAI Section */}
            <div>
              <h3 className="text-lg font-semibold text-cyan-400 mb-2">OpenAI</h3>
                <label className="block text-sm font-medium text-gray-300 mb-1">API Keys</label>
                <ApiTextarea 
                    value={localConfig.openai.key} 
                    onChange={e => handleConfigChange('openai', 'key', e.target.value)}
                    placeholder="Dán một hoặc nhiều API Key, mỗi key một dòng."
                />
                <label className="block text-sm font-medium text-gray-300 mt-3 mb-1">Model</label>
                <select 
                    value={localConfig.openai.model} 
                    onChange={e => handleConfigChange('openai', 'model', e.target.value)} 
                    className="w-full bg-[#1a1b26] border border-[#414868] rounded-md px-3 py-2 text-sm text-white focus:ring-1 focus:ring-indigo-500 outline-none"
                >
                    <option value="gpt-5">GPT-5 (Mới nhất)</option>
                    <option value="gpt-4o">GPT-4o</option>
                    <option value="gpt-4-turbo">GPT-4 Turbo</option>
                    <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                </select>
            </div>
        </div>

        <div className="mt-8 flex justify-end">
          <button onClick={handleSaveAndClose} className="py-2 px-6 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold transition-colors">Lưu và Đóng</button>
        </div>
      </div>
    </div>
  );
};