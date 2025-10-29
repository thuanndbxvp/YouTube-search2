
import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { Header } from './components/Header';
import { ApiModal } from './components/ApiModal';
import { LibraryModal } from './components/LibraryModal';
import { ChannelInputForm } from './components/ChannelInputForm';
import { useLocalStorage } from './hooks/useLocalStorage';
import { Video, ChannelInfo, StoredConfig, SavedSession, ChatMessage, UserProfile } from './types';
import { getChannelInfoByUrl, fetchVideosPage } from './services/youtubeService';
import { VideoTable } from './components/VideoTable';
import { KeywordAnalysis } from './components/KeywordAnalysis';
import { AnalysisTools } from './components/AnalysisTools';
import { calculateKeywordCounts, getTopKeywords } from './utils/keywords';
import * as GoogleAuth from './services/googleAuthService';
import { ChannelHeader } from './components/ChannelHeader';

const initialConfig: StoredConfig = {
  youtube: { key: '' },
  gemini: { key: '', model: 'gemini-2.5-pro' },
  openai: { key: '', model: 'gpt-5' },
  googleClientId: '',
};

export default function App() {
  const [appConfig, setAppConfig] = useLocalStorage<StoredConfig>('yt-analyzer-config-v2', initialConfig);
  const [localSessions, setLocalSessions] = useLocalStorage<SavedSession[]>('yt-analyzer-sessions-v1', []);
  const [savedSessions, setSavedSessions] = useState<SavedSession[]>([]);
  
  const [isApiModalOpen, setIsApiModalOpen] = useState(false);
  const [isLibraryModalOpen, setIsLibraryModalOpen] = useState(false);

  const [videos, setVideos] = useState<Video[]>([]);
  const [channelInfo, setChannelInfo] = useState<ChannelInfo | null>(null);
  const [nextPageToken, setNextPageToken] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved' | 'saving' | 'error'>('idle');
  const [brainstormMessages, setBrainstormMessages] = useState<ChatMessage[]>([]);

  // Auth state
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isGapiReady, setIsGapiReady] = useState(false);
  const [isGisReady, setIsGisReady] = useState(false);
  const isAuthReady = useMemo(() => isGapiReady && isGisReady, [isGapiReady, isGisReady]);

  // Effect to initialize Google APIs
  useEffect(() => {
    const handleGapiLoaded = () => GoogleAuth.initGapiClient(() => setIsGapiReady(true));
    const handleGisLoaded = () => {
      if (appConfig.googleClientId) {
        GoogleAuth.initGisClient(appConfig.googleClientId, () => setIsGisReady(true));
      }
    };

    window.addEventListener('gapi-loaded', handleGapiLoaded);
    window.addEventListener('gis-loaded', handleGisLoaded);
    if ((window as any).gapi?.client) handleGapiLoaded();
    if ((window as any).google?.accounts) handleGisLoaded();

    return () => {
      window.removeEventListener('gapi-loaded', handleGapiLoaded);
      window.removeEventListener('gis-loaded', handleGisLoaded);
    };
  }, [appConfig.googleClientId]);

  // Effect to set initial sessions from localStorage
  useEffect(() => {
    if (!user) {
      setSavedSessions(localSessions);
    }
  }, [user, localSessions]);

  // Handler for Sign In
  const handleSignIn = useCallback(async () => {
      if (!appConfig.googleClientId) {
          setError("Vui lòng đặt ID khách của Google trong cài đặt API.");
          setIsApiModalOpen(true);
          return;
      }
      if (!isAuthReady) {
          setError("Xác thực của Google chưa sẵn sàng. Vui lòng đợi một lát và thử lại.");
          return;
      }
      try {
          await GoogleAuth.signIn();
          const profile = await GoogleAuth.getUserProfile();
          setUser(profile);
          const sessions = await GoogleAuth.loadSessions();
          setSavedSessions(sessions);
      } catch (error) {
          console.error(error);
          setError("Không thể đăng nhập bằng Google. Vui lòng kiểm tra Client ID và cấu hình của bạn.");
      }
  }, [isAuthReady, appConfig.googleClientId]);

  // Handler for Sign Out
  const handleSignOut = useCallback(() => {
      GoogleAuth.signOut();
      setUser(null);
      setSavedSessions(localSessions); // Revert to local sessions
      setVideos([]);
      setChannelInfo(null);
      setBrainstormMessages([]);
      setError(null);
  }, [localSessions]);

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
        if (user) { // Logged in: save to Google Drive
            await GoogleAuth.saveSessions(newSessionsList);
        } else { // Logged out: save to Local Storage
            setLocalSessions(newSessionsList);
        }
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
            if (user) { // Logged in: update Google Drive
                await GoogleAuth.saveSessions(newSessionsList);
            } else { // Logged out: update Local Storage
                setLocalSessions(newSessionsList);
            }
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
      if (user) {
        await GoogleAuth.saveSessions(newSessionsList);
      } else {
        setLocalSessions(newSessionsList);
      }
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
        user={user}
        onSignIn={handleSignIn}
        onSignOut={() => {
            handleSignOut();
            setIsApiModalOpen(false);
        }}
      />
      <LibraryModal
        isOpen={isLibraryModalOpen}
        onClose={() => setIsLibraryModalOpen(false)}
        sessions={savedSessions}
        onLoad={handleLoadSession}
        onDelete={handleDeleteSession}
        onImport={handleImportSessions}
      />
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Header 
            onApiClick={() => setIsApiModalOpen(true)}
            onLibraryClick={() => setIsLibraryModalOpen(true)}
            onSaveSession={handleSaveSession}
            isSessionSavable={videos.length > 0 && !isLoading}
            saveStatus={saveStatus}
            user={user}
            onSignIn={handleSignIn}
            onSignOut={handleSignOut}
        />
        <main className="mt-12">
          <ChannelInputForm onSubmit={handleFetchVideos} isLoading={isLoading} />
          {error && <div className="mt-4 text-center text-red-400 bg-red-900/50 p-3 rounded-lg">{error}</div>}
          
          {videos.length > 0 && channelInfo && !isLoading && (
            <div className="mt-8 p-6 bg-[#24283b] rounded-lg">
                <ChannelHeader channelInfo={channelInfo} />
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-6 mb-6">
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
