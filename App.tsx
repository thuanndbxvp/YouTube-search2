import React, { useState, useCallback } from 'react';
import { Header } from './components/Header';
import { ApiModal } from './components/ApiModal';
import { ChannelInputForm } from './components/ChannelInputForm';
import { useLocalStorage } from './hooks/useLocalStorage';
import { Video, ChannelInfo, StoredConfig } from './types';
import { getChannelInfoByUrl, fetchVideosPage } from './services/youtubeService';
import { VideoTable } from './components/VideoTable';
import { KeywordAnalysis } from './components/KeywordAnalysis';
import { AnalysisTools } from './components/AnalysisTools';

const initialConfig: StoredConfig = {
  youtube: { keys: [], activeKeyId: null },
  gemini: { keys: [], activeKeyId: null, model: 'gemini-2.5-flash' },
  openai: { keys: [], activeKeyId: null, model: 'gpt-3.5-turbo' },
};

export default function App() {
  const [appConfig, setAppConfig] = useLocalStorage<StoredConfig>('yt-analyzer-config', initialConfig);
  const [isApiModalOpen, setIsApiModalOpen] = useState(false);
  const [videos, setVideos] = useState<Video[]>([]);
  const [channelInfo, setChannelInfo] = useState<ChannelInfo | null>(null);
  const [nextPageToken, setNextPageToken] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getActiveApiKey = (service: 'youtube' | 'gemini' | 'openai') => {
    const config = appConfig[service];
    if (!config.activeKeyId) return null;
    return config.keys.find(k => k.id === config.activeKeyId)?.key || null;
  };

  const handleFetchVideos = useCallback(async (channelUrl: string) => {
    const youtubeApiKey = getActiveApiKey('youtube');
    if (!youtubeApiKey) {
      setError('Vui lòng thêm và chọn một YouTube API Key đang hoạt động.');
      setIsApiModalOpen(true);
      return;
    }
    setIsLoading(true);
    setError(null);
    setVideos([]);
    setChannelInfo(null);
    setNextPageToken(undefined);

    try {
      const info = await getChannelInfoByUrl(channelUrl, youtubeApiKey);
      setChannelInfo(info);

      const videoData = await fetchVideosPage(info.uploadsPlaylistId, youtubeApiKey);
      setVideos(videoData.videos);
      setNextPageToken(videoData.nextPageToken);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Đã xảy ra lỗi không xác định.');
    } finally {
      setIsLoading(false);
    }
  }, [appConfig]);

  const handleLoadMore = useCallback(async () => {
    const youtubeApiKey = getActiveApiKey('youtube');
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
  

  return (
    <div className="min-h-screen bg-[#1a1b26] text-[#a9b1d6] font-sans">
      <ApiModal 
        isOpen={isApiModalOpen} 
        onClose={() => setIsApiModalOpen(false)}
        config={appConfig}
        setConfig={setAppConfig}
      />
      <div className="container mx-auto px-4 py-8">
        <Header onApiClick={() => setIsApiModalOpen(true)} />
        <main className="mt-12">
          <ChannelInputForm onSubmit={handleFetchVideos} isLoading={isLoading} />
          {error && <div className="mt-4 text-center text-red-400 bg-red-900/50 p-3 rounded-lg">{error}</div>}
          
          {videos.length > 0 && !isLoading && (
            <div className="mt-8 p-6 bg-[#24283b] rounded-lg">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-6">
                    <div className="lg:col-span-2">
                        <KeywordAnalysis videos={videos} />
                    </div>
                    <div>
                        <AnalysisTools />
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