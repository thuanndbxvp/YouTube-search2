import { ChannelInfo, Video } from '../types';

const API_BASE_URL = 'https://www.googleapis.com/youtube/v3';

const extractChannelIdentifier = (url: string): string | null => {
    try {
        const urlObj = new URL(url);
        const pathParts = urlObj.pathname.split('/').filter(part => part);

        if (pathParts[0] === 'channel' && pathParts[1]) {
            return pathParts[1]; // e.g., /channel/UC...
        }
        if (pathParts[0] && pathParts[0].startsWith('@')) {
            return pathParts[0]; // e.g., /@handle
        }
        if (pathParts[0] === 'c' && pathParts[1]){
            return pathParts[1]; // e.g., /c/customUrl
        }
        if (pathParts[0] === 'user' && pathParts[1]){
            return pathParts[1]; // e.g., /user/username
        }
        return null;
    } catch(e) {
        return null; // Invalid URL
    }
};

async function handleApiResponse<T,>(response: Response): Promise<T> {
    const data = await response.json();
    if (!response.ok) {
        const message = data.error?.message || 'An unknown API error occurred.';
        throw new Error(message);
    }
    return data;
}

export const getChannelInfoByUrl = async (channelUrl: string, apiKey: string): Promise<ChannelInfo> => {
    const identifier = extractChannelIdentifier(channelUrl);
    if (!identifier) {
        throw new Error('Định dạng URL kênh YouTube không hợp lệ.');
    }

    let channelId: string | undefined;

    // Case 1: The identifier is a standard channel ID. We can fetch details directly.
    if (identifier.startsWith('UC') || identifier.startsWith('HC')) {
        channelId = identifier;
    } 
    // Case 2: The identifier is a handle, custom URL, or legacy username.
    // We must use the search endpoint to find the channel's ID.
    else {
        const searchParams = new URLSearchParams({
            part: 'id',
            q: identifier,
            type: 'channel',
            maxResults: '1',
            key: apiKey
        });

        const searchResponse = await fetch(`${API_BASE_URL}/search?${searchParams.toString()}`);
        const searchData = await handleApiResponse<{ items: any[] }>(searchResponse);

        if (searchData.items && searchData.items.length > 0) {
            channelId = searchData.items[0].id.channelId;
        }
    }

    if (!channelId) {
         throw new Error('Không tìm thấy kênh. Vui lòng kiểm tra lại URL.');
    }

    // Now that we have a channelId, fetch the full channel details to get the uploads playlist.
    const channelDetailsParams = new URLSearchParams({
        part: 'snippet,contentDetails,statistics',
        id: channelId,
        key: apiKey
    });
    
    const response = await fetch(`${API_BASE_URL}/channels?${channelDetailsParams.toString()}`);
    const data = await handleApiResponse<{ items: any[] }>(response);
    
    if (!data.items || data.items.length === 0) {
        // This should be rare if the search worked, but it's a good safeguard.
        throw new Error('Không tìm thấy kênh. Vui lòng kiểm tra lại URL.');
    }

    const channelData = data.items[0];
    
    if (!channelData.contentDetails?.relatedPlaylists?.uploads) {
        throw new Error('Không thể tìm thấy danh sách video tải lên của kênh này.');
    }

    return {
        id: channelData.id,
        title: channelData.snippet.title,
        description: channelData.snippet.description,
        customUrl: channelData.snippet.customUrl,
        publishedAt: channelData.snippet.publishedAt,
        thumbnail: channelData.snippet.thumbnails.default.url,
        uploadsPlaylistId: channelData.contentDetails.relatedPlaylists.uploads,
        country: channelData.snippet.country,
        subscriberCount: channelData.statistics.subscriberCount,
        videoCount: channelData.statistics.videoCount,
    };
};

export const fetchVideosPage = async (
    playlistId: string, 
    apiKey: string, 
    pageToken?: string
): Promise<{ videos: Video[], nextPageToken?: string }> => {
    
    const playlistItemsParams = new URLSearchParams({
        part: 'snippet',
        playlistId: playlistId,
        maxResults: '50',
        key: apiKey,
    });
    if (pageToken) {
        playlistItemsParams.set('pageToken', pageToken);
    }

    const playlistResponse = await fetch(`${API_BASE_URL}/playlistItems?${playlistItemsParams.toString()}`);
    const playlistData = await handleApiResponse<{ items: any[], nextPageToken?: string }>(playlistResponse);
    
    if (!playlistData.items || playlistData.items.length === 0) {
        return { videos: [], nextPageToken: undefined };
    }

    const videoIds = playlistData.items
        .map(item => item.snippet?.resourceId?.videoId)
        .filter(Boolean)
        .join(',');

    const videoDetailsParams = new URLSearchParams({
        part: 'snippet,statistics,contentDetails',
        id: videoIds,
        key: apiKey,
    });

    const videosResponse = await fetch(`${API_BASE_URL}/videos?${videoDetailsParams.toString()}`);
    const videosData = await handleApiResponse<{ items: Video[] }>(videosResponse);

    const videosWithStats = videosData.items.map(video => ({
        ...video,
        statistics: video.statistics || { viewCount: '0', likeCount: '0', commentCount: '0' },
        contentDetails: video.contentDetails || { duration: 'PT0S' },
    }));

    return {
        videos: videosWithStats,
        nextPageToken: playlistData.nextPageToken,
    };
};

export const validateApiKey = async (apiKey: string): Promise<boolean> => {
    if (!apiKey) return false;
    // We make a simple, low-cost API call to check for authentication errors.
    // Fetching details for the official YouTube channel is a reliable way to do this.
    const validationUrl = `${API_BASE_URL}/channels?part=snippet&id=UC_x5XG1OV2P6uZZ5FSM9Ttw&key=${apiKey}`;
    try {
        const response = await fetch(validationUrl);
        return response.ok;
    } catch (error) {
        console.error("YouTube key validation failed:", error);
        return false;
    }
};