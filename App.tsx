

import React, { useState, useCallback } from 'react';
import { Header } from './components/Header';
import { ApiModal } from './components/ApiModal';
import { LibraryModal } from './components/LibraryModal';
import { ChannelInputForm } from './components/ChannelInputForm';
import { useLocalStorage } from './hooks/useLocalStorage';
import { Video, ChannelInfo, StoredConfig, SavedSession, ChatMessage, Theme } from './types';
import { getChannelInfoByUrl, fetchVideosPage } from './services/youtubeService';
import { VideoTable } from './components/VideoTable';
import { KeywordAnalysis } from './components/KeywordAnalysis';
import { AnalysisTools } from './components/AnalysisTools';
import { calculateKeywordCounts, getTopKeywords } from './utils/keywords';
import { ChannelHeader } from './components/ChannelHeader';
import { CompetitiveAnalysisModal } from './components/CompetitiveAnalysisModal';
import { TrashIcon, SpinnerIcon } from './components/Icons';

const initialConfig: StoredConfig = {
  theme: 'blue',
  youtube: { key: '' },
  gemini: { key: '', model: 'gemini-2.5-pro' },
  openai: { key: '', model: 'gpt-5' },
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
                <VideoTable videos={videos} theme={appConfig.theme} />
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