import React, { useState, useEffect, useRef } from 'react';
import { ChannelInfo, StoredConfig, AiProvider, ChatMessage } from '../types';
import { generateGeminiChatResponse } from '../services/geminiService';
import { generateOpenAIChatResponse } from '../services/openaiService';
import { PaperAirplaneIcon } from './Icons';

interface BrainstormModalProps {
  isOpen: boolean;
  onClose: () => void;
  channelInfo: ChannelInfo;
  appConfig: StoredConfig;
  messages: ChatMessage[];
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
}

const AiProviderSelector: React.FC<{
    selected: AiProvider;
    onSelect: (provider: AiProvider) => void;
    config: StoredConfig;
}> = ({ selected, onSelect, config }) => {
    const hasGemini = !!config.gemini.key;
    const hasOpenAI = !!config.openai.key;

    const buttonClass = (provider: AiProvider) => 
        `px-4 py-2 text-sm font-semibold rounded-md transition-colors ${
            selected === provider 
            ? 'bg-indigo-600 text-white' 
            : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
        }`;

    return (
        <div className="flex justify-center space-x-2 mb-4">
            {hasGemini && <button onClick={() => onSelect('gemini')} className={buttonClass('gemini')}>Gemini</button>}
            {hasOpenAI && <button onClick={() => onSelect('openai')} className={buttonClass('openai')}>ChatGPT</button>}
        </div>
    )
};


export const BrainstormModal: React.FC<BrainstormModalProps> = ({ isOpen, onClose, channelInfo, appConfig, messages, setMessages }) => {
  const [selectedAi, setSelectedAi] = useState<AiProvider>('gemini');
  const [currentMessage, setCurrentMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    // Set default AI provider based on available keys
    if (appConfig.gemini.key) {
        setSelectedAi('gemini');
    } else if (appConfig.openai.key) {
        setSelectedAi('openai');
    }
  }, [isOpen, appConfig.gemini.key, appConfig.openai.key]);

  useEffect(() => {
    // Auto-scroll to the bottom of the chat
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedMessage = currentMessage.trim();
    if (!trimmedMessage || isLoading) return;

    const userMessage: ChatMessage = { role: 'user', content: trimmedMessage };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setCurrentMessage('');
    setIsLoading(true);

    try {
        let response: string;
        if (selectedAi === 'gemini') {
            response = await generateGeminiChatResponse(appConfig.gemini.key, appConfig.gemini.model, newMessages);
        } else {
            response = await generateOpenAIChatResponse(appConfig.openai.key, appConfig.openai.model, newMessages);
        }
        setMessages(prev => [...prev, { role: 'model', content: response }]);
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Đã có lỗi xảy ra.";
        setMessages(prev => [...prev, { role: 'model', content: `Lỗi: ${errorMessage}` }]);
    } finally {
        setIsLoading(false);
    }
  };


  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 transition-opacity" onClick={onClose}>
      <div className="bg-[#24283b] rounded-lg shadow-2xl w-full max-w-2xl flex flex-col" style={{ height: '80vh' }} onClick={(e) => e.stopPropagation()}>
        <div className="p-4 border-b border-gray-700">
          <div className="flex justify-between items-center">
             <h2 className="text-xl font-bold text-white">Brainstorm với AI</h2>
             <button onClick={onClose} className="text-gray-400 hover:text-white text-3xl leading-none">&times;</button>
          </div>
          <p className="text-sm text-gray-400">Kênh đang phân tích: {channelInfo.title}</p>
        </div>

        <AiProviderSelector selected={selectedAi} onSelect={setSelectedAi} config={appConfig} />

        <div ref={chatContainerRef} className="flex-grow p-4 overflow-y-auto space-y-4">
            {messages.map((msg, index) => (
                <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-lg p-3 rounded-lg ${msg.role === 'user' ? 'bg-indigo-700 text-white' : 'bg-gray-700 text-gray-200'}`}>
                        <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                    </div>
                </div>
            ))}
            {isLoading && (
                 <div className="flex justify-start">
                    <div className="max-w-lg p-3 rounded-lg bg-gray-700 text-gray-200">
                        <div className="flex items-center space-x-2">
                           <div className="w-2 h-2 bg-indigo-300 rounded-full animate-pulse"></div>
                           <div className="w-2 h-2 bg-indigo-300 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                           <div className="w-2 h-2 bg-indigo-300 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                        </div>
                    </div>
                </div>
            )}
        </div>

        <div className="p-4 border-t border-gray-700">
          <form onSubmit={handleSendMessage} className="flex items-center space-x-2">
            <input
              type="text"
              value={currentMessage}
              onChange={(e) => setCurrentMessage(e.target.value)}
              placeholder="Nhập câu hỏi hoặc ý tưởng của bạn..."
              className="w-full bg-[#1a1b26] border border-[#414868] rounded-lg px-4 py-2 text-sm text-white focus:ring-1 focus:ring-indigo-500 outline-none"
              disabled={isLoading}
            />
            <button type="submit" disabled={isLoading || !currentMessage.trim()} className="bg-indigo-600 hover:bg-indigo-700 text-white p-2.5 rounded-lg disabled:opacity-50 transition-colors">
              <PaperAirplaneIcon className="w-5 h-5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};