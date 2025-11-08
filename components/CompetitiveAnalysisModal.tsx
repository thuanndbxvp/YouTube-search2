import React, { useState, useEffect, useMemo } from 'react';
import { SavedSession, StoredConfig, Theme } from '../types';
import { SpinnerIcon, ChartBarIcon, DownloadIcon, ClipboardCopyIcon, UsersIcon, VideoCameraIcon, SparklesIcon } from './Icons';
import { formatNumber, formatNumberShort } from '../utils/formatters';

interface CompetitiveAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessions: SavedSession[];
  appConfig: StoredConfig;
  theme: Theme;
  onStartAnalysis: (selectedChannelIds: string[]) => void;
  analysisState: {
    isLoading: boolean;
    error: string | null;
    result: string;
    isComplete: boolean;
  };
  onResetAnalysis: () => void;
}

export const CompetitiveAnalysisModal: React.FC<CompetitiveAnalysisModalProps> = ({ isOpen, onClose, sessions, appConfig, theme, onStartAnalysis, analysisState, onResetAnalysis }) => {
    const [copyStatus, setCopyStatus] = useState<'idle' | 'copied'>('idle');
    const [selectedChannelIds, setSelectedChannelIds] = useState<string[]>([]);
    const [validationError, setValidationError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen && !analysisState.isLoading && !analysisState.isComplete) {
            setSelectedChannelIds([]);
            setValidationError(null);
        }
    }, [isOpen, analysisState.isLoading, analysisState.isComplete]);

    const totalSelectedVideos = useMemo(() => {
        if (selectedChannelIds.length === 0) return 0;
        return sessions
            .filter(s => selectedChannelIds.includes(s.id))
            .reduce((total, session) => total + parseInt(session.channelInfo.videoCount || '0', 10), 0);
    }, [selectedChannelIds, sessions]);


    const handleChannelSelection = (channelId: string) => {
        setSelectedChannelIds(prev =>
            prev.includes(channelId)
                ? prev.filter(id => id !== channelId)
                : [...prev, channelId]
        );
         if (validationError) {
            setValidationError(null);
        }
    };

    const handleStartAndClose = () => {
        if (selectedChannelIds.length < 2) {
            setValidationError("Vui lòng chọn ít nhất 2 kênh để phân tích.");
            return;
        }
        setValidationError(null);
        onStartAnalysis(selectedChannelIds);
        onClose();
    };

    const handleCopy = () => {
        if (!analysisState.result) return;
        navigator.clipboard.writeText(analysisState.result).then(() => {
            setCopyStatus('copied');
            setTimeout(() => setCopyStatus('idle'), 2000);
        });
    };

    const handleDownload = () => {
        if (!analysisState.result) return;
        const htmlHeader = "<html xmlns:o='urn:schemas-microsoft-com:office:office' "+
            "xmlns:w='urn:schemas-microsoft-com:office:word' "+
            "xmlns='http://www.w3.org/TR/REC-html40'>"+
            "<head><meta charset='utf-8'><title>Báo cáo Phân tích</title></head><body>";
        const htmlFooter = "</body></html>";
        const htmlContent = htmlHeader + '<pre style="white-space: pre-wrap; font-family: sans-serif;">' + analysisState.result + '</pre>' + htmlFooter;
        
        const blob = new Blob(['\ufeff', htmlContent], {
            type: 'application/msword'
        });
        
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        const date = new Date().toISOString().split('T')[0];
        link.download = `Phan_tich_doi_thu_${date}.doc`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    if (!isOpen) return null;

    const renderContent = () => {
        if (analysisState.isLoading) {
            return (
                <div className="text-center py-16 flex-grow flex flex-col justify-center">
                    <SpinnerIcon className="w-12 h-12 text-indigo-400 animate-spin mx-auto" />
                    <p className="mt-4 text-lg">AI đang phân tích dữ liệu...</p>
                    <p className="text-sm text-gray-400">Bạn có thể đóng cửa sổ này, quá trình vẫn sẽ tiếp tục chạy ngầm.</p>
                </div>
            );
        }

        if (analysisState.isComplete) {
            return (
                <>
                    <div className="flex-grow flex flex-col min-h-0">
                        {analysisState.error ? (
                            <div className="text-center py-16 flex-grow flex flex-col justify-center">
                                <p className="text-red-400 font-semibold">Đã xảy ra lỗi:</p>
                                <p className="mt-2 text-sm bg-red-900/50 p-3 rounded-md">{analysisState.error}</p>
                            </div>
                        ) : (
                            <div className="flex-grow overflow-y-auto pr-2 relative">
                                <div className="absolute top-0 right-2 flex space-x-2 z-10">
                                    <button onClick={handleCopy} className="p-1.5 bg-gray-600 hover:bg-gray-500 rounded-md text-white relative" title="Sao chép">
                                        <ClipboardCopyIcon className="w-5 h-5"/>
                                        {copyStatus === 'copied' && <span className="absolute -bottom-7 left-1/2 -translate-x-1/2 bg-green-600 text-white text-xs px-2 py-0.5 rounded-md">Đã chép!</span>}
                                    </button>
                                    <button onClick={handleDownload} className="p-1.5 bg-gray-600 hover:bg-gray-500 rounded-md text-white" title="Tải về (.doc)">
                                        <DownloadIcon className="w-5 h-5" />
                                    </button>
                                </div>
                                <div className="text-sm text-gray-200 bg-[#1a1b26] p-4 rounded-lg whitespace-pre-wrap leading-relaxed">
                                    {analysisState.result}
                                </div>
                            </div>
                        )}
                    </div>
                    <div className="pt-4 mt-4 border-t border-gray-700 flex-shrink-0 flex justify-between items-center">
                        <button 
                            onClick={onResetAnalysis}
                            className={`flex items-center justify-center bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200 text-sm`}
                        >
                            <SparklesIcon className="w-4 h-4 mr-2" />
                            Tạo phiên mới
                        </button>
                        <button 
                            onClick={onClose}
                            className="bg-gray-600 hover:bg-gray-700 text-white font-semibold text-sm py-2 px-4 rounded-md transition-colors"
                        >
                            Đóng
                        </button>
                    </div>
                </>
            );
        }
        
        // Initial View for channel selection
        return (
            <>
                <div className="flex-grow flex flex-col min-h-0">
                     <div className="text-center flex-shrink-0">
                        <ChartBarIcon className="w-16 h-16 mx-auto text-indigo-400" />
                        <h3 className="mt-4 text-lg font-semibold">Phân tích Đối thủ Cạnh tranh</h3>
                        <p className="mt-2 text-sm text-gray-400">
                            Chọn ít nhất 2 kênh từ thư viện để AI tạo ra một báo cáo so sánh chi tiết.
                        </p>
                    </div>
                    <div className="mt-6 bg-[#1a1b26] p-4 rounded-lg flex-grow flex flex-col min-h-0">
                        <h4 className="font-semibold text-left mb-3 flex-shrink-0">Chọn các kênh để phân tích:</h4>
                        <div className="space-y-2 overflow-y-auto pr-2 flex-grow">
                            {sessions.map(s => (
                                <label key={s.id} className="flex items-center justify-between p-2 rounded-md hover:bg-[#2d303e] transition-colors duration-200 cursor-pointer">
                                    <div className="flex items-center space-x-3 overflow-hidden mr-4">
                                        <input
                                            type="checkbox"
                                            checked={selectedChannelIds.includes(s.id)}
                                            onChange={() => handleChannelSelection(s.id)}
                                            className={`h-5 w-5 rounded bg-gray-700 border-gray-600 text-indigo-500 focus:ring-indigo-500 focus:ring-2 ring-offset-2 ring-offset-[#1a1b26] flex-shrink-0`}
                                        />
                                        <span className="text-sm text-gray-300 truncate" title={s.channelInfo.title}>{s.channelInfo.title}</span>
                                    </div>
                                    <div className="flex items-center space-x-4 text-xs text-gray-400 flex-shrink-0">
                                        <div className="flex items-center" title="Người đăng ký">
                                            <UsersIcon className="w-4 h-4 mr-1.5" />
                                            <span>{formatNumberShort(s.channelInfo.subscriberCount)}</span>
                                        </div>
                                        <div className="flex items-center" title="Video">
                                            <VideoCameraIcon className="w-4 h-4 mr-1.5" />
                                            <span>{formatNumber(s.channelInfo.videoCount)}</span>
                                        </div>
                                    </div>
                                </label>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="pt-4 flex-shrink-0">
                    {validationError && (
                         <p className="text-xs text-red-400 mb-3 text-left px-1">{validationError}</p>
                    )}
                    {selectedChannelIds.length > 0 && selectedChannelIds.length < 2 && (
                        <p className="text-xs text-yellow-400 mb-3 text-left px-1">Vui lòng chọn thêm ít nhất {2 - selectedChannelIds.length} kênh nữa.</p>
                    )}
                    <button 
                        onClick={handleStartAndClose}
                        disabled={selectedChannelIds.length < 2}
                        className={`w-full flex items-center justify-center bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                        Bắt đầu Phân tích & Chạy ngầm ({selectedChannelIds.length > 0 
                            ? `${selectedChannelIds.length} kênh / ${formatNumber(totalSelectedVideos)} video`
                            : selectedChannelIds.length
                        })
                    </button>
                </div>
            </>
        );
    };


    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 transition-opacity duration-300" onClick={onClose}>
            <div className="bg-[#24283b] rounded-lg shadow-2xl p-6 w-full max-w-2xl flex flex-col" style={{ height: '85vh' }} onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4 flex-shrink-0">
                    <h2 className="text-xl font-bold text-white">Báo cáo Phân tích Đối thủ</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white text-3xl leading-none">&times;</button>
                </div>
                {renderContent()}
            </div>
        </div>
    );
};