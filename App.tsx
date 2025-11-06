import React, { useState, useCallback, useEffect } from 'react';
import { Header } from './components/Header';
import { ApiModal } from './components/ApiModal';
import { LibraryModal } from './components/LibraryModal';
import { ChannelInputForm } from './components/ChannelInputForm';
import { useLocalStorage } from './hooks/useLocalStorage';
import { Video, ChannelInfo, StoredConfig, SavedSession, ChatMessage, Theme, AiProvider } from './types';
import { getChannelInfoByUrl, fetchVideosPage } from './services/youtubeService';
import { VideoTable } from './components/VideoTable';
import { KeywordAnalysis } from './components/KeywordAnalysis';
import { AnalysisTools } from './components/AnalysisTools';
import { calculateKeywordCounts, getTopKeywords } from './utils/keywords';
import { ChannelHeader } from './components/ChannelHeader';
import { CompetitiveAnalysisModal } from './components/CompetitiveAnalysisModal';
import { TrashIcon, SpinnerIcon, ClipboardCopyIcon } from './components/Icons';

const initialConfig: StoredConfig = {
  theme: 'blue',
  aiProvider: 'gemini',
  aiModel: 'gemini-2.5-pro',
  youtube: { key: '' },
  gemini: { key: '' },
  openai: { key: '' },
  transcript: { key: '' },
};

interface ChannelQueueListProps {
  queue: string[];
  onAnalyze: (url: string) => void;
  onRemove: (url: string) => void;
  currentlyAnalyzingUrl: string | null;
  theme: Theme;
}

const ChannelQueueList: React.FC<ChannelQueueListProps> = ({
  queue,
  onAnalyze,
  onRemove,
  currentlyAnalyzingUrl,
  theme,
}) => {
  if (queue.length === 0) {
    return null;
  }

  return (
    <div className="max-w-3xl mx-auto mt-6">
      <h3 className="text-lg font-semibold text-gray-300 mb-3">Danh sách chờ phân tích ({queue.length})</h3>
      <div className="bg-[#24283b] p-4 rounded-lg space-y-3 max-h-60 overflow-y-auto">
        {queue.map((url, index) => {
          const isAnalyzing = currentlyAnalyzingUrl === url;
          const isAnotherAnalyzing = currentlyAnalyzingUrl !== null && !isAnalyzing;
          return (
            <div key={`${url}-${index}`} className="flex items-center justify-between bg-[#2d303e] p-3 rounded-md">
              <span className="text-sm text-gray-400 truncate flex-1 pr-4">{url}</span>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => onAnalyze(url)}
                  disabled={isAnalyzing || isAnotherAnalyzing}
                  className={`flex items-center justify-center text-sm font-semibold py-2 px-4 rounded-md transition-colors duration-200 disabled:opacity-50
                    bg-${theme}-600 hover:bg-${theme}-700 text-white`
                  }
                >
                  {isAnalyzing ? (
                    <>
                      <SpinnerIcon className="w-4 h-4 mr-2 animate-spin" />
                      Đang xử lý...
                    </>
                  ) : (
                    'Phân tích'
                  )}
                </button>
                <button
                  onClick={() => onRemove(url)}
                  disabled={isAnalyzing}
                  className="bg-red-800 hover:bg-red-900 text-white p-2.5 rounded-md transition-colors disabled:opacity-50"
                  title="Xóa khỏi danh sách"
                >
                  <TrashIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};


// --- START: Transcript Modal Component ---
interface TranscriptModalProps {
    isOpen: boolean;
    onClose: () => void;
    video: Video | null;
    transcript: string;
    isLoading: boolean;
    error: string | null;
    theme: Theme;
}

const TranscriptModal: React.FC<TranscriptModalProps> = ({ isOpen, onClose, video, transcript, isLoading, error, theme }) => {
    const [copyStatus, setCopyStatus] = useState<'idle' | 'copied'>('idle');

    useEffect(() => {
        if (isOpen) {
            setCopyStatus('idle'); // Reset on open
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleCopy = () => {
        if (!transcript) return;
        navigator.clipboard.writeText(transcript).then(() => {
            setCopyStatus('copied');
            setTimeout(() => setCopyStatus('idle'), 2000);
        });
    };

    const renderContent = () => {
        if (isLoading) {
            return (
                <div className="text-center py-12">
                    <SpinnerIcon className="w-10 h-10 mx-auto animate-spin text-gray-400" />
                    <p className="mt-4 text-gray-300">Đang lấy transcript...</p>
                </div>
            );
        }
        if (error) {
            return (
                <div className="text-center py-12">
                    <p className="text-red-400">Lỗi:</p>
                    <p className="mt-2 text-sm bg-red-900/50 p-3 rounded-md">{error}</p>
                </div>
            );
        }
        return (
            <div className="bg-[#1a1b26] p-4 rounded-md h-full overflow-y-auto">
                <p className="text-gray-300 text-sm whitespace-pre-wrap">{transcript}</p>
            </div>
        );
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 transition-opacity duration-300" onClick={onClose}>
            <div className="bg-[#24283b] rounded-lg shadow-2xl p-6 w-full max-w-2xl flex flex-col" style={{ height: '70vh' }} onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-white truncate pr-4">Transcript cho: {video?.snippet.title}</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white text-3xl leading-none">&times;</button>
                </div>

                <div className="flex-grow min-h-0">
                    {renderContent()}
                </div>

                <div className="mt-6 flex justify-end items-center space-x-4">
                    <button 
                        onClick={handleCopy} 
                        disabled={isLoading || !!error || !transcript}
                        className="flex items-center justify-center bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200 text-sm disabled:opacity-50"
                    >
                        <ClipboardCopyIcon className="w-5 h-5 mr-2" />
                        {copyStatus === 'copied' ? 'Đã sao chép!' : 'Sao chép'}
                    </button>
                    <button onClick={onClose} className={`py-2 px-6 rounded-lg bg-${theme}-600 hover:bg-${theme}-700 text-white font-semibold transition-colors`}>Đóng</button>
                </div>
            </div>
        </div>
    );
};
// --- END: Transcript Modal Component ---

// --- START: Transcript Service Logic ---
async function executeTranscriptKeyRotation<T>(
    keysString: string,
    apiRequest: (key: string) => Promise<T>
): Promise<T> {
    const keys = keysString.split(/[\n,]+/).map(k => k.trim()).filter(Boolean);
    if (keys.length === 0) {
        throw new Error("Không có Transcript API key nào được cung cấp.");
    }

    let lastError: any = null;

    for (const key of keys) {
        try {
            const result = await apiRequest(key);
            return result;
        } catch (error: any) {
            lastError = error;
            console.warn(`Transcript API key ...${key.slice(-4)} thất bại. Thử key tiếp theo. Lỗi: ${error.message}`);
            continue;
        }
    }
    
    throw new Error(`Tất cả API key của Transcript đều không hợp lệ. Lỗi cuối cùng: ${lastError.message}`);
}

const getTranscriptInternal = async (videoId: string, apiKey: string): Promise<string> => {
    const response = await fetch(`https://transcriptapi.com/mcp`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
            url: `https://www.youtube.com/watch?v=${videoId}`
        })
    });

    if (!response.ok) {
        let errorData;
        try {
            errorData = await response.json();
        } catch (e) {
            errorData = { message: `Yêu cầu API thất bại với mã trạng thái ${response.status}` };
        }
        throw new Error(errorData.message || `Yêu cầu API thất bại với mã trạng thái ${response.status}`);
    }

    const data = await response.json();
    return data.transcript || 'Không tìm thấy transcript hoặc video không hỗ trợ.';
};

const getTranscript = async (videoId: string, apiKeys: string): Promise<string> => {
    return executeTranscriptKeyRotation(apiKeys, (key) => getTranscriptInternal(videoId, key));
};
// --- END: Transcript Service Logic ---

export default function App() {
  const [appConfig, setAppConfig] = useLocalStorage<StoredConfig>('yt-analyzer-config-v2', initialConfig);
  const [savedSessions, setSavedSessions] = useLocalStorage<SavedSession[]>('yt-analyzer-sessions-v1', []);
  
  const [isApiModalOpen, setIsApiModalOpen] = useState(false);
  const [isLibraryModalOpen, setIsLibraryModalOpen] = useState(false);
  const [isCompetitiveAnalysisModalOpen, setIsCompetitiveAnalysisModalOpen] = useState(false);

  const [videos, setVideos] = useState<Video[]>([]);
  const [channelInfo, setChannelInfo] = useState<ChannelInfo | null>(null);
  const [nextPageToken, setNextPageToken] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved' | 'saving' | 'error'>('idle');
  const [brainstormMessages, setBrainstormMessages] = useState<ChatMessage[]>([]);
  
  const [channelQueue, setChannelQueue] = useState<string[]>([]);
  const [currentlyAnalyzingUrl, setCurrentlyAnalyzingUrl] = useState<string | null>(null);

  const [transcriptModalState, setTranscriptModalState] = useState({
      isOpen: false,
      video: null as Video | null,
      transcript: '',
      isLoading: false,
      error: null as string | null,
  });
  
  useEffect(() => {
      const oldConfig = appConfig as any;
      if(oldConfig && !oldConfig.aiProvider && (oldConfig.gemini?.model || oldConfig.openai?.model)) {
          console.log("Migrating config to new AI model structure.");
          setAppConfig(prev => {
              const currentOldConfig = prev as any;
              const provider: AiProvider = currentOldConfig.gemini?.model ? 'gemini' : 'openai';
              const model = currentOldConfig.gemini?.model || currentOldConfig.openai?.model;

              const newConfig: StoredConfig = {
                  theme: currentOldConfig.theme,
                  youtube: { key: currentOldConfig.youtube.key },
                  gemini: { key: currentOldConfig.gemini.key },
                  openai: { key: currentOldConfig.openai.key },
                  transcript: { key: currentOldConfig.transcript?.key || '' },
                  aiProvider: provider,
                  aiModel: model || (provider === 'openai' ? 'gpt-4o' : 'gemini-2.5-pro'),
              };
              return newConfig;
          });
      }
  }, []);

  const createInitialBrainstormMessage = useCallback((chInfo: ChannelInfo, keywords: string[]): ChatMessage[] => {
      if (!chInfo || keywords.length === 0) return [];
      const systemPrompt = `Xin chào! Tôi là trợ lý AI sáng tạo của bạn. Tôi đã xem qua kênh "${chInfo.title}" và nhận thấy các chủ đề nổi bật gần đây là: **${keywords.join(', ')}**.
      
Làm thế nào để tôi có thể giúp bạn brainstorm ý tưởng video mới hôm nay? Bạn có thể hỏi tôi về:
- 5 ý tưởng video mới dựa trên từ khóa "abc".
- Gợi ý một tiêu đề hấp dẫn cho video về "xyz".
- Phân tích đối tượng khán giả của kênh.`;
      
      return [{ role: 'model', content: systemPrompt }];
  }, []);

  const handleFetchVideos = useCallback(async (channelUrl: string) => {
    const youtubeApiKey = appConfig.youtube.key;
    if (!youtubeApiKey) {
      setError('Vui lòng thêm YouTube API Key của bạn trong cài đặt API.');
      setIsApiModalOpen(true);
      return;
    }
    setIsLoading(true);
    setError(null);
    setVideos([]);
    setChannelInfo(null);
    setNextPageToken(undefined);
    setBrainstormMessages([]);

    try {
      const info = await getChannelInfoByUrl(channelUrl, youtubeApiKey);
      setChannelInfo(info);

      const videoData = await fetchVideosPage(info.uploadsPlaylistId, youtubeApiKey);
      setVideos(videoData.videos);
      setNextPageToken(videoData.nextPageToken);

      const keywordCounts = calculateKeywordCounts(videoData.videos);
      const topKeywords = getTopKeywords(keywordCounts, 10);
      setBrainstormMessages(createInitialBrainstormMessage(info, topKeywords));
      
      // On success, remove from queue
      setChannelQueue(prev => prev.filter(url => url !== channelUrl));

    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Đã xảy ra lỗi không xác định.');
    } finally {
      setIsLoading(false);
      setCurrentlyAnalyzingUrl(null);
    }
  }, [appConfig, createInitialBrainstormMessage]);

  const handleQueueSubmit = (urlsText: string) => {
    const urls = urlsText
      .split('\n')
      .map(url => url.trim())
      .filter(url => url.length > 0 && (url.includes('youtube.com/') || url.includes('youtu.be/')));
    
    if (urls.length > 0) {
      setChannelQueue(prev => {
        const newUrls = urls.filter(url => !prev.includes(url));
        return [...prev, ...newUrls];
      });
    }
  };

  const handleRemoveFromQueue = (urlToRemove: string) => {
    setChannelQueue(prev => prev.filter(url => url !== urlToRemove));
  };

  const handleAnalyzeFromQueue = async (url: string) => {
    if (currentlyAnalyzingUrl) return;
    setCurrentlyAnalyzingUrl(url);
    await handleFetchVideos(url);
  };


  const handleLoadMore = useCallback(async () => {
    const youtubeApiKey = appConfig.youtube.key;
    if (!nextPageToken || !channelInfo || !youtubeApiKey) return;

    setIsLoadingMore(true);
    setError(null);
    try {
      const videoData = await fetchVideosPage(channelInfo.uploadsPlaylistId, youtubeApiKey, nextPageToken);
      setVideos(prev => [...prev, ...videoData.videos]);
      setNextPageToken(videoData.nextPageToken);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Không thể tải thêm video.');
    } finally {
      setIsLoadingMore(false);
    }
  }, [nextPageToken, channelInfo, appConfig]);

  const handleSaveSession = async () => {
    if (!channelInfo || videos.length === 0) return;
    setSaveStatus('saving');

    const newSession: SavedSession = {
      id: channelInfo.id,
      savedAt: new Date().toISOString(),
      channelInfo,
      videos,
      nextPageToken,
      brainstormMessages,
    };
    
    const newSessionsList = [...savedSessions];
    const existingIndex = newSessionsList.findIndex(s => s.id === newSession.id);
    if (existingIndex > -1) {
        newSessionsList[existingIndex] = newSession;
    } else {
        newSessionsList.push(newSession);
    }

    try {
        setSavedSessions(newSessionsList);
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
    } catch(e) {
        const errorMsg = e instanceof Error ? e.message : "Không thể lưu phiên.";
        setError(errorMsg);
        setSaveStatus('error');
        setTimeout(() => setSaveStatus('idle'), 3000);
    }
  };

  const handleLoadSession = (sessionId: string) => {
    const session = savedSessions.find(s => s.id === sessionId);
    if (session) {
      setChannelInfo(session.channelInfo);
      setVideos(session.videos);
      setNextPageToken(session.nextPageToken);
      
      if (session.brainstormMessages && session.brainstormMessages.length > 0) {
        setBrainstormMessages(session.brainstormMessages);
      } else {
        const keywordCounts = calculateKeywordCounts(session.videos);
        const topKeywords = getTopKeywords(keywordCounts, 10);
        setBrainstormMessages(createInitialBrainstormMessage(session.channelInfo, topKeywords));
      }

      setIsLibraryModalOpen(false);
      setError(null);
    }
  };

  const handleDeleteSession = async (sessionId: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa phiên này không?')) {
        const newSessionsList = savedSessions.filter(s => s.id !== sessionId);
        try {
            setSavedSessions(newSessionsList);
        } catch(e) {
            setError(e instanceof Error ? e.message : "Không thể xóa phiên.");
        }
    }
  };

  const handleImportSessions = async (importedSessions: SavedSession[]) => {
    if (!Array.isArray(importedSessions)) {
      setError('Tệp nhập không hợp lệ.');
      alert('Tệp nhập không hợp lệ.');
      return;
    }

    if (importedSessions.length > 0) {
        const firstItem = importedSessions[0];
        if (typeof firstItem.id !== 'string' || typeof firstItem.channelInfo?.id !== 'string' || !Array.isArray(firstItem.videos)) {
            const msg = 'Định dạng dữ liệu trong tệp nhập không chính xác.';
            setError(msg);
            alert(msg);
            return;
        }
    }

    const mergedSessionsMap = new Map<string, SavedSession>();
    savedSessions.forEach(session => mergedSessionsMap.set(session.id, session));
    importedSessions.forEach(session => mergedSessionsMap.set(session.id, session));
    
    const newSessionsList = Array.from(mergedSessionsMap.values());

    try {
      setSavedSessions(newSessionsList);
      setIsLibraryModalOpen(false);
      alert(`Đã nhập và hợp nhất thành công ${importedSessions.length} phiên. Tổng số phiên hiện tại: ${newSessionsList.length}.`);
    } catch(e) {
      const errorMsg = e instanceof Error ? e.message : "Không thể lưu các phiên đã nhập.";
      setError(errorMsg);
      alert(`Lỗi: ${errorMsg}`);
    }
  };

  const handleGetTranscript = async (video: Video) => {
    setTranscriptModalState({ isOpen: true, video, transcript: '', isLoading: true, error: null });

    const transcriptApiKey = appConfig.transcript?.key;
    if (!transcriptApiKey) {
        setTranscriptModalState(s => ({ ...s, isLoading: false, error: 'Vui lòng thêm Transcript API Key trong phần cài đặt API.' }));
        return;
    }

    try {
        const transcriptText = await getTranscript(video.id, transcriptApiKey);
        setTranscriptModalState(s => ({ ...s, isLoading: false, transcript: transcriptText }));
    } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Đã xảy ra lỗi không xác định.';
        setTranscriptModalState(s => ({ ...s, isLoading: false, error: errorMsg }));
    }
  };

  return (
    <div className="min-h-screen bg-[#1a1b26] text-[#a9b1d6] font-sans">
      <ApiModal 
        isOpen={isApiModalOpen} 
        onClose={() => setIsApiModalOpen(false)}
        config={appConfig}
        setConfig={setAppConfig}
        theme={appConfig.theme}
      />
      <LibraryModal
        isOpen={isLibraryModalOpen}
        onClose={() => setIsLibraryModalOpen(false)}
        sessions={savedSessions}
        onLoad={handleLoadSession}
        onDelete={handleDeleteSession}
        onImport={handleImportSessions}
        theme={appConfig.theme}
      />
      <CompetitiveAnalysisModal
        isOpen={isCompetitiveAnalysisModalOpen}
        onClose={() => setIsCompetitiveAnalysisModalOpen(false)}
        sessions={savedSessions}
        appConfig={appConfig}
        theme={appConfig.theme}
      />
      <TranscriptModal 
        isOpen={transcriptModalState.isOpen}
        onClose={() => setTranscriptModalState(s => ({ ...s, isOpen: false }))}
        video={transcriptModalState.video}
        transcript={transcriptModalState.transcript}
        isLoading={transcriptModalState.isLoading}
        error={transcriptModalState.error}
        theme={appConfig.theme}
      />
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Header 
            onApiClick={() => setIsApiModalOpen(true)}
            onLibraryClick={() => setIsLibraryModalOpen(true)}
            onSaveSession={handleSaveSession}
            isSessionSavable={videos.length > 0 && !isLoading}
            saveStatus={saveStatus}
            theme={appConfig.theme}
            setAppConfig={setAppConfig}
            onCompetitiveAnalysisClick={() => setIsCompetitiveAnalysisModalOpen(true)}
            isCompetitiveAnalysisAvailable={savedSessions.length >= 2}
        />
        <main className="mt-8">
          <ChannelInputForm onSubmit={handleQueueSubmit} isLoading={!!currentlyAnalyzingUrl} theme={appConfig.theme} />
          
          <ChannelQueueList
            queue={channelQueue}
            onAnalyze={handleAnalyzeFromQueue}
            onRemove={handleRemoveFromQueue}
            currentlyAnalyzingUrl={currentlyAnalyzingUrl}
            theme={appConfig.theme}
          />
          
          {error && <div className="mt-4 text-center text-red-400 bg-red-900/50 p-3 rounded-lg">{error}</div>}
          
          {videos.length > 0 && channelInfo && (
            <div className="mt-8 p-6 bg-[#24283b] rounded-lg">
                <ChannelHeader channelInfo={channelInfo} />
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-6 mb-6">
                    <div className="lg:col-span-2">
                        <KeywordAnalysis videos={videos} channelInfo={channelInfo} theme={appConfig.theme} />
                    </div>
                    <div>
                        <AnalysisTools 
                          videos={videos}
                          channelInfo={channelInfo} 
                          appConfig={appConfig} 
                          brainstormMessages={brainstormMessages}
                          setBrainstormMessages={setBrainstormMessages}
                          theme={appConfig.theme}
                        />
                    </div>
                </div>
                <VideoTable videos={videos} theme={appConfig.theme} onGetTranscript={handleGetTranscript} />
                 {nextPageToken && (
                    <div className="text-center mt-8">
                      <button
                        onClick={handleLoadMore}
                        disabled={isLoadingMore}
                        className={`bg-${appConfig.theme}-600 hover:bg-${appConfig.theme}-700 text-white font-bold py-3 px-8 rounded-lg transition-colors duration-200 disabled:opacity-50`}
                      >
                        {isLoadingMore ? 'Đang tải...' : 'Tải thêm 50 video'}
                      </button>
                    </div>
                  )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}