import React, { useState, useEffect } from 'react';
import { StoredConfig, ApiKeyEntry } from '../types';
import { KeyIcon, TrashIcon, CheckCircleIcon, XCircleIcon } from './Icons';
import { validateApiKey as validateYoutubeKey } from '../services/youtubeService';
import { validateApiKey as validateGeminiKey } from '../services/geminiService';
import { validateApiKey as validateOpenAIKey } from '../services/openaiService';

interface ApiModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: StoredConfig;
  setConfig: React.Dispatch<React.SetStateAction<StoredConfig>>;
}

type ServiceName = keyof StoredConfig;
type ValidationStatus = 'validating' | 'valid' | 'invalid' | 'idle';

const GEMINI_MODELS = ['gemini-2.5-flash', 'gemini-2.5-pro'];
const OPENAI_MODELS = ['gpt-3.5-turbo', 'gpt-4', 'gpt-4-turbo'];

export const ApiModal: React.FC<ApiModalProps> = ({ isOpen, onClose, config, setConfig }) => {
  const [localConfig, setLocalConfig] = useState<StoredConfig>(config);
  const [newKeyInputs, setNewKeyInputs] = useState({ youtube: { label: '', key: '' }, gemini: { label: '', key: '' }, openai: { label: '', key: '' } });
  const [validationStatus, setValidationStatus] = useState<Record<string, ValidationStatus>>({});

  useEffect(() => {
    if (isOpen) {
      setLocalConfig(JSON.parse(JSON.stringify(config))); // Deep copy to prevent mutation
      setValidationStatus({}); // Reset validation status on open
    }
  }, [config, isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    setConfig(localConfig);
    onClose();
  };
  
  const handleAddKey = (service: ServiceName) => {
    const { label, key } = newKeyInputs[service];
    if (!label.trim() || !key.trim()) return;

    const newKey: ApiKeyEntry = { id: crypto.randomUUID(), label, key };
    setLocalConfig(prev => ({
      ...prev,
      [service]: { ...prev[service], keys: [...prev[service].keys, newKey] }
    }));
    setNewKeyInputs(prev => ({ ...prev, [service]: { label: '', key: '' } }));
  };

  const handleDeleteKey = (service: ServiceName, keyId: string) => {
    setLocalConfig(prev => {
        const newKeys = prev[service].keys.filter(k => k.id !== keyId);
        const newActiveKeyId = prev[service].activeKeyId === keyId ? (newKeys.length > 0 ? newKeys[0].id : null) : prev[service].activeKeyId;
        return {
            ...prev,
            [service]: { ...prev[service], keys: newKeys, activeKeyId: newActiveKeyId }
        };
    });
  };

  const handleSetActiveKey = (service: ServiceName, keyId: string) => {
    setLocalConfig(prev => ({
      ...prev,
      [service]: { ...prev[service], activeKeyId: keyId }
    }));
  };

  const handleModelChange = (service: 'gemini' | 'openai', model: string) => {
    setLocalConfig(prev => ({
      ...prev,
      [service]: { ...prev[service], model }
    }));
  };
  
  const handleValidateKey = async (service: ServiceName, keyId: string) => {
    const keyToValidate = localConfig[service].keys.find(k => k.id === keyId)?.key;
    if (!keyToValidate) return;

    setValidationStatus(prev => ({ ...prev, [keyId]: 'validating' }));
    
    let isValid = false;
    try {
        if (service === 'youtube') isValid = await validateYoutubeKey(keyToValidate);
        else if (service === 'gemini') isValid = await validateGeminiKey(keyToValidate);
        else if (service === 'openai') isValid = await validateOpenAIKey(keyToValidate);
    } catch (e) {
        isValid = false;
    }

    setValidationStatus(prev => ({ ...prev, [keyId]: isValid ? 'valid' : 'invalid' }));
  };

  const renderKeyList = (service: ServiceName) => {
    const serviceConfig = localConfig[service];
    
    return (
      <div className="mt-4 space-y-2">
        {serviceConfig.keys.length === 0 ? (
            <p className="text-sm text-gray-500 italic">Chưa có khóa nào được thêm.</p>
        ) : (
            <ul className="max-h-40 overflow-y-auto pr-2">
                {serviceConfig.keys.map(k => (
                <li key={k.id} className="flex items-center space-x-2 bg-[#1a1b26] p-2 rounded-md">
                    <input
                    type="radio"
                    name={`${service}-active`}
                    checked={serviceConfig.activeKeyId === k.id}
                    onChange={() => handleSetActiveKey(service, k.id)}
                    className="form-radio h-4 w-4 text-indigo-600 bg-gray-700 border-gray-600 focus:ring-indigo-500"
                    />
                    <div className="flex-grow">
                        <p className="font-semibold text-gray-200 text-sm">{k.label}</p>
                        <p className="text-xs text-gray-400 font-mono">{k.key.substring(0, 4)}...{k.key.substring(k.key.length - 4)}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                        {validationStatus[k.id] === 'validating' && <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>}
                        {validationStatus[k.id] === 'valid' && <CheckCircleIcon className="w-5 h-5 text-green-400" />}
                        {validationStatus[k.id] === 'invalid' && <XCircleIcon className="w-5 h-5 text-red-400" />}
                        <button onClick={() => handleValidateKey(service, k.id)} className="text-xs bg-gray-600 hover:bg-gray-700 px-2 py-1 rounded">Thử</button>
                        <button onClick={() => handleDeleteKey(service, k.id)} className="text-red-400 hover:text-red-300"><TrashIcon className="w-5 h-5"/></button>
                    </div>
                </li>
                ))}
            </ul>
        )}
      </div>
    );
  };
  
  const renderAddKeyForm = (service: ServiceName) => (
    <div className="mt-2 flex items-center space-x-2 p-2 bg-[#2d303e] rounded-md">
       <input
          type="text"
          placeholder="Nhãn (ví dụ: 'Key cá nhân')"
          value={newKeyInputs[service].label}
          onChange={e => setNewKeyInputs(p => ({ ...p, [service]: { ...p[service], label: e.target.value } }))}
          className="w-1/3 bg-[#1a1b26] border border-[#414868] rounded-md px-2 py-1 text-sm text-white focus:ring-1 focus:ring-indigo-500 outline-none"
        />
        <input
          type="password"
          placeholder="dán API key ở đây"
          value={newKeyInputs[service].key}
          onChange={e => setNewKeyInputs(p => ({ ...p, [service]: { ...p[service], key: e.target.value } }))}
          className="flex-grow bg-[#1a1b26] border border-[#414868] rounded-md px-2 py-1 text-sm text-white focus:ring-1 focus:ring-indigo-500 outline-none"
        />
        <button onClick={() => handleAddKey(service)} className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm px-3 py-1 rounded-md">+</button>
  </div>
  )

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 transition-opacity duration-300" onClick={onClose}>
      <div className="bg-[#24283b] rounded-xl shadow-2xl p-8 w-full max-w-2xl transform transition-all duration-300 scale-95" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center mb-6">
          <KeyIcon className="w-8 h-8 text-indigo-300 mr-3"/>
          <h2 className="text-2xl font-bold text-white">Quản lý API Keys</h2>
        </div>
        <div className="space-y-6">
            {/* YouTube Section */}
            <div>
              <h3 className="text-lg font-bold text-indigo-300 border-b border-gray-600 pb-1">YouTube</h3>
              {renderKeyList('youtube')}
              {renderAddKeyForm('youtube')}
            </div>
            
            {/* Gemini Section */}
            <div>
              <h3 className="text-lg font-bold text-indigo-300 border-b border-gray-600 pb-1">Gemini</h3>
               <div className="mt-2">
                    <label className="text-sm font-medium text-gray-300 mr-2">Model:</label>
                    <select value={localConfig.gemini.model} onChange={e => handleModelChange('gemini', e.target.value)} className="bg-[#1a1b26] border border-[#414868] rounded-md px-3 py-1 text-sm text-white focus:ring-1 focus:ring-indigo-500 outline-none">
                        {GEMINI_MODELS.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                </div>
              {renderKeyList('gemini')}
              {renderAddKeyForm('gemini')}
            </div>

            {/* OpenAI Section */}
            <div>
              <h3 className="text-lg font-bold text-indigo-300 border-b border-gray-600 pb-1">OpenAI (ChatGPT)</h3>
                <div className="mt-2">
                    <label className="text-sm font-medium text-gray-300 mr-2">Model:</label>
                    <select value={localConfig.openai.model} onChange={e => handleModelChange('openai', e.target.value)} className="bg-[#1a1b26] border border-[#414868] rounded-md px-3 py-1 text-sm text-white focus:ring-1 focus:ring-indigo-500 outline-none">
                        {OPENAI_MODELS.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                </div>
              {renderKeyList('openai')}
              {renderAddKeyForm('openai')}
            </div>
        </div>
        <div className="mt-8 flex justify-end space-x-3">
          <button onClick={onClose} className="py-2 px-4 rounded-md bg-gray-600 hover:bg-gray-700 text-white font-semibold transition-colors">Hủy</button>
          <button onClick={handleSave} className="py-2 px-4 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white font-semibold transition-colors">Lưu</button>
        </div>
      </div>
    </div>
  );
};