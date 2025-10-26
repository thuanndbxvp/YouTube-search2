import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { Header } from './components/Header';
import { ApiModal } from './components/ApiModal';
import { LibraryModal } from './components/LibraryModal';
import { ChannelInputForm } from './components/ChannelInputForm';
import { useLocalStorage } from './hooks/useLocalStorage';
import { Video, ChannelInfo, StoredConfig, SavedSession, ChatMessage } from './types';
import { getChannelInfoByUrl, fetchVideosPage } from './services/youtubeService';
import { VideoTable } from './components/VideoTable';
import { KeywordAnalysis } from './components/KeywordAnalysis';
import { AnalysisTools } from './components/AnalysisTools';
import { calculateKeywordCounts, getTopKeywords } from './utils/keywords';

const initialConfig: StoredConfig = {
  youtube: { key: '' },
  gemini: { key: '', model: 'gemini-2.5-pro' },
  openai: { key: '', model: 'gpt-5' },
};

export default function App() {
  const [appConfig, setAppConfig] = useLocalStorage<StoredConfig>('yt-analyzer-config-v2', initialConfig);
  const [savedSessions, setSavedSessions] = useLocalStorage<SavedSession[]>('yt-analyzer-sessions-v1', []);
  
  const [isApiModalOpen, setIsApiModalOpen] = useState(false);
  const [isLibraryModalOpen, setIsLibraryModalOpen] = useState(false);

  const [videos, setVideos] = useState<Video[]>([]);
  const [channelInfo, setChannelInfo] = useState<ChannelInfo | null>(null);
  const [nextPageToken, setNextPageToken] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved'>('idle');
  const [brainstormMessages, setBrainstormMessages] = useState<ChatMessage[]>([]);


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

    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Đã xảy ra lỗi không xác định.');
    } finally {
      setIsLoading(false);
    }
  }, [appConfig, createInitialBrainstormMessage]);

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

  const handleSaveSession = () => {
    if (!channelInfo || videos.length === 0) return;

    const newSession: SavedSession = {
      id: channelInfo.id,
      savedAt: new Date().toISOString(),
      channelInfo,
      videos,
      nextPageToken,
      brainstormMessages,
    };
    
    setSavedSessions(prev => {
        const existingIndex = prev.findIndex(s => s.id === newSession.id);
        if (existingIndex > -1) {
            const updatedSessions = [...prev];
            updatedSessions[existingIndex] = newSession;
            return updatedSessions;
        }
        return [...prev, newSession];
    });

    setSaveStatus('saved');
    setTimeout(() => setSaveStatus('idle'), 2000);
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

  const handleDeleteSession = (sessionId: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa phiên này không?')) {
        setSavedSessions(prev => prev.filter(s => s.id !== sessionId));
    }
  };
  

  return (
    <div className="min-h-screen bg-[#1a1b26] text-[#a9b1d6] font-sans">
      <ApiModal 
        isOpen={isApiModalOpen} 
        onClose={() => setIsApiModalOpen(false)}
        config={appConfig}
        setConfig={setAppConfig}
      />
      <LibraryModal
        isOpen={isLibraryModalOpen}
        onClose={() => setIsLibraryModalOpen(false)}
        sessions={savedSessions}
        onLoad={handleLoadSession}
        onDelete={handleDeleteSession}
      />
      <div className="container mx-auto px-4 py-8">
        <Header 
            onApiClick={() => setIsApiModalOpen(true)}
            onLibraryClick={() => setIsLibraryModalOpen(true)}
            onSaveSession={handleSaveSession}
            isSessionSavable={videos.length > 0 && !isLoading}
            saveStatus={saveStatus}
        />
        <main className="mt-12">
          <ChannelInputForm onSubmit={handleFetchVideos} isLoading={isLoading} />
          {error && <div className="mt-4 text-center text-red-400 bg-red-900/50 p-3 rounded-lg">{error}</div>}
          
          {videos.length > 0 && channelInfo && !isLoading && (
            <div className="mt-8 p-6 bg-[#24283b] rounded-lg">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-6">
                    <div className="lg:col-span-2">
                        <KeywordAnalysis videos={videos} channelInfo={channelInfo} />
                    </div>
                    <div>
                        <AnalysisTools 
                          videos={videos}
                          channelInfo={channelInfo} 
                          appConfig={appConfig} 
                          brainstormMessages={brainstormMessages}
                          setBrainstormMessages={setBrainstormMessages}
                        />
                    </div>
                </div>
                <VideoTable videos={videos} />
                 {nextPageToken && (
                    <div className="text-center mt-8">
                      <button
                        onClick={handleLoadMore}
                        disabled={isLoadingMore}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-8 rounded-lg transition-colors duration-200 disabled:opacity-50"
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