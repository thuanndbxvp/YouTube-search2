export type Theme = 'blue' | 'green' | 'orange' | 'red' | 'purple';

export interface StoredConfig {
  theme: Theme;
  youtube: {
    key: string;
  };
  gemini: {
    key: string;
    model: string;
  };
  openai: {
    key: string;
    model: string;
  };
}

export type AiProvider = 'gemini' | 'openai';

export interface VideoSnippet {
  publishedAt: string;
  title: string;
  description:string;
  thumbnails: {
    default: { url: string; };
    medium: { url: string; };
    high: { url: string; };
  };
  channelTitle: string;
  resourceId: {
    videoId: string;
  }
}

export interface VideoStatistics {
  viewCount: string;
  likeCount: string;
  commentCount: string;
}

export interface VideoContentDetails {
  duration: string;
}

export interface Video {
  id: string;
  snippet: VideoSnippet;
  statistics: VideoStatistics;
  contentDetails: VideoContentDetails;
  aiSummary?: string;
}

export interface ChannelInfo {
    id: string;
    title: string;
    description: string;
    customUrl: string;
    publishedAt: string;
    thumbnail: string;
    uploadsPlaylistId: string;
    country?: string;
    subscriberCount: string;
    videoCount: string;
}

export interface SavedSession {
  id: string; // Will be the channel ID
  savedAt: string; // ISO date string
  channelInfo: ChannelInfo;
  videos: Video[];
  nextPageToken?: string;
  brainstormMessages?: ChatMessage[];
}

export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
}
// FIX: Add UserProfile interface to fix import error in googleAuthService.ts
export interface UserProfile {
  name: string;
  email: string;
  picture: string;
}