import React, { useState, useEffect } from 'react';
import { SavedSession, StoredConfig, Theme } from '../types';
import { performCompetitiveAnalysis } from '../services/geminiService';
import { SpinnerIcon, ChartBarIcon, DownloadIcon, ClipboardCopyIcon } from './Icons';

interface CompetitiveAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessions: SavedSession[];
  appConfig: StoredConfig;
  theme: Theme;
}

const analysisInstructions = `{
  "task": "YouTube Channel Competitive Analysis",
  "language": "Vietnamese",
  "input": {
    "file_type": "CSV data from app",
    "file_description": "Each row represents one video from a competitor channel. Columns include Channel name, Video title, Publish date, View count, Duration, Likes, etc."
  },
  "objectives": [
    "1. Clean and normalize data fields.",
    "2. Compute derived metrics: Views per Day (VPD), duration buckets.",
    "3. Identify top-performing videos by absolute views and by Views per Day across all channels.",
    "4. Detect recurring successful title patterns (numbers, exclamations, 'Top X', questions, etc.).",
    "5. Extract high-lift keywords and bigrams from video titles.",
    "6. Determine the most effective posting hours and weekdays.",
    "7. Summarize per-channel performance metrics (median VPD, Shorts share, median duration).",
    "8. Provide actionable insights: what makes high-performing videos stand out and how to replicate success."
  ],
  "expected_outputs": {
    "text_summary": [
      "Top performing channels (by total views, median VPD).",
      "Optimal video duration group.",
      "Best posting time windows.",
      "Title/keyword patterns with the highest lift.",
      "Insights explaining why high-performing videos work.",
      "Strategic recommendations for future content themes and structure."
    ]
  },
  "key_metrics": [
    "views_per_day", "median_views", "median_vpd", "shorts_share", "median_duration_sec", "pattern_lift", "keyword_lift"
  ],
  "analysis_notes": [
    "Use lift ratio (top 20% vs rest) for detecting patterns.",
    "Perform keyword extraction in Vietnamese."
  ],
  "expected_style_of_summary": {
    "tone": "Professional, analytical, data-driven, similar to consulting report, in Vietnamese.",
    "sections": [
      "1. Tóm tắt cho Lãnh đạo (Executive Summary)",
      "2. Tổng quan Hiệu suất các Kênh (Channel Performance Overview)",
      "3. Phân tích Nội dung & Tiêu đề (Content & Title Analysis)",
      "4. Phân tích Thời gian & Thời lượng (Time & Duration Analysis)",
      "5. Các insight chính (Key Insights)",
      "6. Đề xuất Chiến lược (Xây dựng Kênh Mới): Dựa trên tất cả phân tích, hãy đề xuất một kế hoạch chi tiết để xây dựng một kênh mới thành công trong cùng ngách này. Tập trung vào các yếu tố khác biệt, lịch trình đăng bài, định dạng video và chiến lược tăng trưởng ban đầu."
    ]
  },
  "output_format": {
    "type": "text",
    "parts": [
      "C. Written summary in Markdown format (in Vietnamese)"
    ]
  }
}`;


export const CompetitiveAnalysisModal: React.FC<CompetitiveAnalysisModalProps> = ({ isOpen, onClose, sessions, appConfig, theme }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [analysisResult, setAnalysisResult] = useState<string>('');
    const [copyStatus, setCopyStatus] = useState<'idle' | 'copied'>('idle');
    const [selectedChannelIds, setSelectedChannelIds] = useState<string[]>([]);

    useEffect(() => {
        if (isOpen) {
            setSelectedChannelIds([]);
            setAnalysisResult('');
            setError(null);
            setIsLoading(false);
        }
    }, [isOpen]);


    const handleChannelSelection = (channelId: string) => {
        setSelectedChannelIds(prev =>
            prev.includes(channelId)
                ? prev.filter(id => id !== channelId)
                : [...prev, channelId]
        );
    };

    const handleStartAnalysis = async () => {
        if (selectedChannelIds.length < 2) {
            setError("Vui lòng chọn ít nhất 2 kênh để phân tích.");
            return;
        }

        setIsLoading(true);
        setError(null);
        setAnalysisResult('');

        if (appConfig.aiProvider !== 'gemini') {
            setError('Tính năng này yêu cầu chọn một model của Gemini trong cài đặt API.');
            setIsLoading(false);
            return;
        }

        try {
            const selectedSessions = sessions.filter(s => selectedChannelIds.includes(s.id));

            const headers = ["Channel Name", "Video Title", "Publish Date", "View Count", "Likes", "Duration (ISO 8601)"];
            const rows = selectedSessions.flatMap(session => 
                session.videos.map(video => [
                    `"${session.channelInfo.title.replace(/"/g, '""')}"`,
                    `"${video.snippet.title.replace(/"/g, '""')}"`,
                    video.snippet.publishedAt,
                    video.statistics.viewCount || '0',
                    video.statistics.likeCount || '0',
                    video.contentDetails.duration || 'PT0S'
                ].join(','))
            );
            const csvData = [headers.join(','), ...rows].join('\n');

            const result = await performCompetitiveAnalysis(
                appConfig.gemini.key,
                appConfig.aiModel,
                csvData,
                analysisInstructions
            );
            setAnalysisResult(result);

        } catch (err) {
            setError(err instanceof Error ? err.message : 'Đã xảy ra lỗi không xác định.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(analysisResult).then(() => {
            setCopyStatus('copied');
            setTimeout(() => setCopyStatus('idle'), 2000);
        });
    };

    const handleDownload = () => {
        const htmlHeader = "<html xmlns:o='urn:schemas-microsoft-com:office:office' "+
            "xmlns:w='urn:schemas-microsoft-com:office:word' "+
            "xmlns='http://www.w3.org/TR/REC-html40'>"+
            "<head><meta charset='utf-8'><title>Báo cáo Phân tích</title></head><body>";
        const htmlFooter = "</body></html>";
        const htmlContent = htmlHeader + '<pre style="white-space: pre-wrap; font-family: sans-serif;">' + analysisResult + '</pre>' + htmlFooter;
        
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

    const isInitialView = !isLoading && !error && !analysisResult;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 transition-opacity duration-300" onClick={onClose}>
            <div className="bg-[#24283b] rounded-lg shadow-2xl p-6 w-full max-w-2xl flex flex-col" style={{ height: '85vh' }} onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4 flex-shrink-0">
                    <h2 className="text-xl font-bold text-white">Báo cáo Phân tích Đối thủ</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white text-3xl leading-none">&times;</button>
                </div>
                
                {isInitialView ? (
                    <>
                        <div className="flex-grow flex flex-col min-h-0">
                             <div className="text-center flex-shrink-0">
                                <ChartBarIcon className="w-16 h-16 mx-auto text-indigo-400" />
                                <h3 className="mt-4 text-lg font-semibold">Phân tích Đối thủ Cạnh tranh</h3>
                                <p className="mt-2 text-sm text-gray-400">
                                    Chọn ít nhất 2 kênh từ thư viện của bạn để AI tạo ra một báo cáo phân tích so sánh chi tiết.
                                </p>
                            </div>
                            <div className="mt-6 bg-[#1a1b26] p-4 rounded-lg flex-grow flex flex-col min-h-0">
                                <h4 className="font-semibold text-left mb-3 flex-shrink-0">Chọn các kênh để phân tích:</h4>
                                <div className="space-y-2 overflow-y-auto pr-2 flex-grow">
                                    {sessions.map(s => (
                                        <label key={s.id} className="flex items-center space-x-3 p-2 rounded-md hover:bg-[#2d303e] transition-colors duration-200 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={selectedChannelIds.includes(s.id)}
                                                onChange={() => handleChannelSelection(s.id)}
                                                className={`h-5 w-5 rounded bg-gray-700 border-gray-600 text-indigo-500 focus:ring-indigo-500 focus:ring-2 ring-offset-2 ring-offset-[#1a1b26]`}
                                            />
                                            <span className="text-sm text-gray-300">{s.channelInfo.title}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="pt-4 flex-shrink-0">
                            {selectedChannelIds.length > 0 && selectedChannelIds.length < 2 && (
                                <p className="text-xs text-yellow-400 mb-3 text-left px-1">Vui lòng chọn thêm ít nhất {2 - selectedChannelIds.length} kênh nữa.</p>
                            )}
                            <button 
                                onClick={handleStartAnalysis}
                                disabled={isLoading || selectedChannelIds.length < 2}
                                className={`w-full flex items-center justify-center bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
                            >
                                Bắt đầu Phân tích ({selectedChannelIds.length})
                            </button>
                        </div>
                    </>
                ) : (
                    <div className="flex-grow overflow-y-auto pr-2">
                        {isLoading && (
                            <div className="text-center py-16">
                                <SpinnerIcon className="w-12 h-12 text-indigo-400 animate-spin mx-auto" />
                                <p className="mt-4 text-lg">AI đang phân tích dữ liệu...</p>
                                <p className="text-sm text-gray-400">Quá trình này có thể mất vài phút tùy thuộc vào lượng dữ liệu.</p>
                            </div>
                        )}
                        {error && (
                            <div className="text-center py-16">
                                <p className="text-red-400">Đã xảy ra lỗi:</p>
                                <p className="mt-2 text-sm bg-red-900/50 p-3 rounded-md">{error}</p>
                            </div>
                        )}
                        {analysisResult && (
                            <div className="relative">
                                <div className="absolute top-0 right-0 flex space-x-2">
                                    <button onClick={handleCopy} className="p-1.5 bg-gray-600 hover:bg-gray-500 rounded-md text-white" title="Sao chép">
                                        <ClipboardCopyIcon className="w-5 h-5"/>
                                        {copyStatus === 'copied' && <span className="absolute -top-6 -right-2 bg-green-600 text-white text-xs px-2 py-0.5 rounded-md">Đã chép!</span>}
                                    </button>
                                    <button onClick={handleDownload} className="p-1.5 bg-gray-600 hover:bg-gray-500 rounded-md text-white" title="Tải về (.doc)">
                                        <DownloadIcon className="w-5 h-5" />
                                    </button>
                                </div>
                                <div className="text-sm text-gray-200 bg-[#1a1b26] p-4 rounded-lg whitespace-pre-wrap leading-relaxed">
                                    {analysisResult}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};