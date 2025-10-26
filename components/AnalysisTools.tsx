import React, { useState } from 'react';
import { ChannelInfo, Video, StoredConfig } from '../types';
import { ChannelStatsModal } from './ChannelStatsModal';
import { HashtagModal } from './HashtagModal';
import { BrainstormModal } from './BrainstormModal';
import { SparklesIcon } from './Icons';

interface AnalysisToolsProps {
    channelInfo: ChannelInfo;
    videos: Video[];
    appConfig: StoredConfig;
}

export const AnalysisTools: React.FC<AnalysisToolsProps> = ({ channelInfo, videos, appConfig }) => {
    const [isStatsModalOpen, setIsStatsModalOpen] = useState(false);
    const [isHashtagModalOpen, setIsHashtagModalOpen] = useState(false);
    const [isBrainstormModalOpen, setIsBrainstormModalOpen] = useState(false);

    const isBrainstormDisabled = !appConfig.gemini.key && !appConfig.openai.key;

    return (
        <>
            <ChannelStatsModal 
                isOpen={isStatsModalOpen}
                onClose={() => setIsStatsModalOpen(false)}
                channelInfo={channelInfo}
            />
            <HashtagModal
                isOpen={isHashtagModalOpen}
                onClose={() => setIsHashtagModalOpen(false)}
                videos={videos}
            />
            <BrainstormModal
                isOpen={isBrainstormModalOpen}
                onClose={() => setIsBrainstormModalOpen(false)}
                channelInfo={channelInfo}
                videos={videos}
                appConfig={appConfig}
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
                    <div className="flex space-x-3">
                        <button 
                            onClick={() => setIsStatsModalOpen(true)}
                            className="w-full flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-4 rounded-lg transition-colors duration-200">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                               <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                            </svg>
                            Thống kê
                        </button>
                        <button 
                             onClick={() => setIsHashtagModalOpen(true)}
                            className="w-full flex items-center justify-center bg-teal-600 hover:bg-teal-700 text-white font-semibold py-2.5 px-4 rounded-lg transition-colors duration-200">
                            <span className="font-bold text-lg mr-2">#</span> Thẻ tag
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
};
