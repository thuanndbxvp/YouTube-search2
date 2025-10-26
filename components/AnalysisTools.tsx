import React, { useState } from 'react';
import { ChannelInfo, Video, StoredConfig, ChatMessage } from '../types';
import { BrainstormModal } from './BrainstormModal';
import { SparklesIcon } from './Icons';

interface AnalysisToolsProps {
    channelInfo: ChannelInfo;
    videos: Video[];
    appConfig: StoredConfig;
    brainstormMessages: ChatMessage[];
    setBrainstormMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
}

export const AnalysisTools: React.FC<AnalysisToolsProps> = ({ channelInfo, videos, appConfig, brainstormMessages, setBrainstormMessages }) => {
    const [isBrainstormModalOpen, setIsBrainstormModalOpen] = useState(false);

    const isBrainstormDisabled = !appConfig.gemini.key && !appConfig.openai.key;

    return (
        <>
            <BrainstormModal
                isOpen={isBrainstormModalOpen}
                onClose={() => setIsBrainstormModalOpen(false)}
                channelInfo={channelInfo}
                appConfig={appConfig}
                messages={brainstormMessages}
                setMessages={setBrainstormMessages}
            />
            <div>
                <h2 className="text-xl font-bold text-indigo-300 mb-2">
                    Công cụ Phân tích & Sáng tạo
                </h2>
                <p className="text-gray-400 mb-4 text-sm">
                    Sử dụng các công cụ để hiểu sâu hơn về kênh và tìm kiếm ý tưởng mới.
                </p>
                <div className="flex flex-col space-y-3">
                    <button 
                        onClick={() => setIsBrainstormModalOpen(true)}
                        disabled={isBrainstormDisabled}
                        title={isBrainstormDisabled ? "Vui lòng thêm API key của Gemini hoặc OpenAI để sử dụng tính năng này" : "Bắt đầu phiên brainstorm ý tưởng với AI"}
                        className="w-full flex items-center justify-center bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2.5 px-4 rounded-lg transition-colors duration-200 disabled:opacity-60 disabled:cursor-not-allowed">
                        <SparklesIcon className="h-5 w-5 mr-2" />
                        Brainstorm Ý tưởng
                    </button>
                </div>
            </div>
        </>
    );
};