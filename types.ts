
export interface StoredConfig {
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