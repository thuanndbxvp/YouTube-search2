
import React, { useState, useEffect } from 'react';
import { StoredConfig, UserProfile } from '../types';
import { validateSingleApiKey as validateYoutubeKey } from '../services/youtubeService';
import { validateSingleApiKey as validateGeminiKey } from '../services/geminiService';
import { validateSingleApiKey as validateOpenAIKey } from '../services/openaiService';
import { CheckCircleIcon, XCircleIcon, TrashIcon, SpinnerIcon, GoogleIcon } from './Icons';

interface ApiModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: StoredConfig;
  setConfig: React.Dispatch<React.SetStateAction<StoredConfig>>;
  user: UserProfile | null;
  onSignIn: () => void;
  onSignOut: () => void;
}

const GEMINI_MODELS = ['gemini-2.5-pro', 'gemini-2.5-flash'];
const OPENAI_MODELS = ['gpt-5', 'gpt-4o', 'gpt-4-turbo', 'gpt-3.5-turbo'];

interface KeyWithStatus {
  id: number;
  value: string;
  status: 'idle' | 'validating' | 'valid' | 'invalid';
}

const ApiKeyManager: React.FC<{
    keys: KeyWithStatus[];
    setKeys: React.Dispatch<React.SetStateAction<KeyWithStatus[]>>;
    validateFn: (key: string) => Promise<boolean>;
    placeholder: string;
}> = ({ keys, setKeys, validateFn, placeholder }) => {
    
    const handleAddKey = () => {
        setKeys(prev => [...prev, { id: Date.now(), value: '', status: 'idle' }]);
    };
    
    const handleDeleteKey = (id: number) => {
        setKeys(prev => prev.filter(k => k.id !== id));
    };

    const handleUpdateKey = (id: number, value: string) => {
        setKeys(prev => prev.map(k => k.id === id ? { ...k, value, status: 'idle' } : k));
    };

    const handleValidateKey = async (id: number) => {
        const keyToValidate = keys.find(k => k.id === id);
        if (!keyToValidate) return;

        setKeys(prev => prev.map(k => k.id === id ? { ...k, status: 'validating' } : k));
        
        const isValid = await validateFn(keyToValidate.value);

        setKeys(prev => prev.map(k => k.id === id ? { ...k, status: isValid ? 'valid' : 'invalid' } : k));
    };

    return (
        <div className="space-y-2">
            {keys.map((keyItem) => (
                <div key={keyItem.id} className="flex items-center space-x-2">
                    <div className="relative flex-grow">
                        <input
                            type="text"
                            value={keyItem.value}
                            onChange={(e) => handleUpdateKey(keyItem.id, e.target.value)}
                            placeholder={placeholder}
                            className="w-full bg-[#1a1b26] border border-[#414868] rounded-md px-3 py-2 text-sm text-white focus:ring-1 focus:ring-indigo-500 outline-none pr-10"
                        />
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                            {keyItem.status === 'validating' && <SpinnerIcon className="w-5 h-5 text-gray-400 animate-spin" />}
                            {keyItem.status === 'valid' && <CheckCircleIcon className="w-5 h-5 text-green-400" />}
                            {keyItem.status === 'invalid' && <XCircleIcon className="w-5 h-5 text-red-400" />}
                        </div>
                    </div>
                     <button 
                        type="button"
                        onClick={() => handleValidateKey(keyItem.id)} 
                        disabled={!keyItem.value || keyItem.status === 'validating'}
                        className="text-xs bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 px-3 rounded-md transition-colors disabled:opacity-50"
                    >
                        Kiểm tra
                    </button>
                    <button 
                        type="button"
                        onClick={() => handleDeleteKey(keyItem.id)} 
                        className="p-2 bg-red-800 hover:bg-red-900 text-white rounded-md transition-colors"
                    >
                        <TrashIcon className="w-4 h-4" />
                    </button>
                </div>
            ))}
            <button 
                type="button"
                onClick={handleAddKey} 
                className="text-sm text-indigo-300 hover:text-indigo-200 font-semibold"
            >
                + Thêm Key
            </button>
        </div>
    );
};


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

const parseKeysString = (keysString: string): KeyWithStatus[] => 
    keysString.split(/[\n,]+/).filter(Boolean).map(value => ({
        id: Date.now() + Math.random(),
        value,
        status: 'idle',
    }));

const joinKeys = (keys: KeyWithStatus[]): string =>
    keys.map(k => k.value.trim()).filter(Boolean).join('\n');

export const ApiModal: React.FC<ApiModalProps> = ({ isOpen, onClose, config, setConfig, user, onSignIn, onSignOut }) => {
  const [youtubeKeys, setYoutubeKeys] = useState<KeyWithStatus[]>([]);
  const [geminiKeys, setGeminiKeys] = useState<KeyWithStatus[]>([]);
  const [openaiKeys, setOpenaiKeys] = useState<KeyWithStatus[]>([]);
  const [googleClientId, setGoogleClientId] = useState('');
  
  const [geminiModel, setGeminiModel] = useState(config.gemini.model);
  const [openaiModel, setOpenaiModel] = useState(config.openai.model);


  useEffect(() => {
    if (isOpen) {
      setYoutubeKeys(parseKeysString(config.youtube.key));
      setGeminiKeys(parseKeysString(config.gemini.key));
      setOpenaiKeys(parseKeysString(config.openai.key));
      setGoogleClientId(config.googleClientId || '');
      setGeminiModel(config.gemini.model);
      setOpenaiModel(config.openai.model);
    }
  }, [config, isOpen]);

  if (!isOpen) return null;

  const handleSaveAndClose = () => {
    setConfig(prev => ({
        ...prev,
        youtube: { key: joinKeys(youtubeKeys) },
        gemini: { key: joinKeys(geminiKeys), model: geminiModel },
        openai: { key: joinKeys(openaiKeys), model: openaiModel },
        googleClientId,
    }));
    onClose();
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 transition-opacity duration-300" onClick={onClose}>
      <div className="bg-[#24283b] rounded-lg shadow-2xl p-6 w-full max-w-2xl transform transition-all duration-300" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-white">Quản lý API Keys &amp; Tài khoản</h2>
           <button onClick={onClose} className="text-gray-400 hover:text-white">&times;</button>
        </div>

        <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-3">
            {/* YouTube Section */}
            <div>
              <h3 className="text-lg font-semibold text-red-400 mb-2">YouTube Data API</h3>
              <label className="block text-sm font-medium text-gray-300 mb-2">API Keys (Bắt buộc)</label>
              <ApiKeyManager 
                keys={youtubeKeys}
                setKeys={setYoutubeKeys}
                validateFn={validateYoutubeKey}
                placeholder="Dán API Key YouTube vào đây"
              />
              <HowToGetApiKey />
            </div>

             {/* Google Auth Section */}
            <div>
              <h3 className="text-lg font-semibold text-blue-400 mb-2">Xác thực Google (Lưu trữ đám mây)</h3>
                <p className="text-xs text-gray-400 mb-3">Tùy chọn: Đăng nhập để lưu và đồng bộ hóa các phiên làm việc trên nhiều thiết bị bằng Google Drive.</p>
                {user ? (
                    <div className="bg-[#1a1b26] p-3 rounded-md flex items-center justify-between">
                        <div className="flex items-center">
                            <img src={user.picture} alt={user.name} className="w-10 h-10 rounded-full mr-3" />
                            <div>
                                <p className="font-semibold text-white truncate">{user.name}</p>
                                <p className="text-xs text-gray-400 truncate">{user.email}</p>
                            </div>
                        </div>
                        <button
                            onClick={onSignOut}
                            className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors text-sm"
                        >
                            Đăng xuất
                        </button>
                    </div>
                ) : (
                <>
                    <label htmlFor="google-client-id" className="block text-sm font-medium text-gray-300 mb-2">Google Client ID</label>
                    <input
                        id="google-client-id"
                        type="text"
                        value={googleClientId}
                        onChange={(e) => setGoogleClientId(e.target.value)}
                        placeholder="your-client-id.apps.googleusercontent.com"
                        className="w-full bg-[#1a1b26] border border-[#414868] rounded-md px-3 py-2 text-sm text-white focus:ring-1 focus:ring-indigo-500 outline-none"
                    />
                    <details className="text-sm mt-2 cursor-pointer">
                        <summary className="text-gray-400 hover:text-white">Làm thế nào để lấy Google Client ID?</summary>
                        <div className="mt-2 p-3 bg-[#1a1b26] rounded-md text-gray-300 space-y-2">
                            <ol className="list-decimal list-inside pl-4 text-xs">
                                <li>Đi tới <a href="https://console.cloud.google.com/" target="_blank" rel="noopener noreferrer" className="text-indigo-400 underline">Google Cloud Console</a>.</li>
                                <li>Tạo một dự án mới.</li>
                                <li>Đi tới "APIs & Services" &gt; "Library" và bật "Google Drive API".</li>
                                <li>Đi tới "APIs & Services" &gt; "Credentials".</li>
                                <li>Nhấp vào "Create Credentials" &gt; "OAuth client ID".</li>
                                <li>Chọn "Web application" làm loại ứng dụng.</li>
                                <li>Trong "Authorized JavaScript origins", hãy thêm URL của ứng dụng này.</li>
                                <li>Nhấp vào "Create". Sao chép "Client ID" và dán vào đây.</li>
                            </ol>
                        </div>
                    </details>
                     <button 
                        onClick={onSignIn}
                        className="mt-3 w-full flex items-center justify-center bg-white hover:bg-gray-200 text-gray-800 font-semibold py-2 px-4 rounded-lg shadow transition-colors duration-200"
                    >
                        <GoogleIcon />
                        Đăng nhập với Google để lưu trữ đám mây
                    </button>
                </>
              )}
            </div>
            
            {/* Gemini Section */}
            <div>
              <h3 className="text-lg font-semibold text-purple-400 mb-2">Google Gemini</h3>
              <label className="block text-sm font-medium text-gray-300 mb-2">API Keys</label>
               <ApiKeyManager 
                keys={geminiKeys}
                setKeys={setGeminiKeys}
                validateFn={validateGeminiKey}
                placeholder="Dán API Key Gemini vào đây"
              />
               <label className="block text-sm font-medium text-gray-300 mt-3 mb-1">Model</label>
                <select 
                    value={geminiModel} 
                    onChange={e => setGeminiModel(e.target.value)} 
                    className="w-full bg-[#1a1b26] border border-[#414868] rounded-md px-3 py-2 text-sm text-white focus:ring-1 focus:ring-indigo-500 outline-none"
                >
                    {GEMINI_MODELS.map(m => <option key={m} value={m}>{m.charAt(0).toUpperCase() + m.slice(1).replace(/-/g, ' ')}</option>)}
                </select>
            </div>

            {/* OpenAI Section */}
            <div>
              <h3 className="text-lg font-semibold text-cyan-400 mb-2">OpenAI</h3>
                <label className="block text-sm font-medium text-gray-300 mb-2">API Keys</label>
                <ApiKeyManager 
                    keys={openaiKeys}
                    setKeys={setOpenaiKeys}
                    validateFn={validateOpenAIKey}
                    placeholder="Dán API Key OpenAI vào đây"
                />
                <label className="block text-sm font-medium text-gray-300 mt-3 mb-1">Model</label>
                <select 
                    value={openaiModel} 
                    onChange={e => setOpenaiModel(e.target.value)} 
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
