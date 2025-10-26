export interface ApiKeyEntry {
  id: string;
  key: string;
  label: string;
}

export interface ServiceConfig {
  keys: ApiKeyEntry[];
  activeKeyId: string | null;
}

export interface AiServiceConfig extends ServiceConfig {
  model: string;
}

export interface StoredConfig {
  youtube: ServiceConfig;
  gemini: AiServiceConfig;
  openai: AiServiceConfig;
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
    thumbnail: string;
    uploadsPlaylistId: string;
}