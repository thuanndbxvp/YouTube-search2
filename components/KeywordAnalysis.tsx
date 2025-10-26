import React, { useMemo } from 'react';
import { Video, ChannelInfo } from '../types';
import { DownloadIcon } from './Icons';
import { formatDate, parseISO8601Duration } from '../utils/formatters';

// Make XLSX globally available from the script tag in index.html
declare const XLSX: any;

interface KeywordAnalysisProps {
  videos: Video[];
  channelInfo: ChannelInfo | null;
}

const vietnameseStopWords = new Set([
    'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín', 'mười', 'bị', 'bởi', 'cả',
    'cần', 'càng', 'chắc', 'chắn', 'chỉ', 'chiếc', 'cho', 'chứ', 'chưa', 'có', 'có thể',
    'cứ', 'của', 'cùng', 'cũng', 'đã', 'đang', 'đây', 'để', 'đến', 'đều', 'điều', 'do',
    'đó', 'được', 'gì', 'hơn', 'hết', 'khi', 'không', 'là', 'làm', 'lại', 'lên', 'lúc',
    'mà', 'mỗi', 'một cách', 'này', 'nên', 'nếu', 'ngay', 'nhiều', 'như', 'nhưng',
    'những', 'nơi', 'nữa', 'phải', 'qua', 'ra', 'rằng', 'rất', 'rồi', 'sau', 'sẽ',
    'so', 'sự', 'tại', 'theo', 'thì', 'trên', 'trước', 'từ', 'từng', 'và', 'vào', 'vẫn',
    'về', 'vì', 'với', 'vừa', 'thứ', 'anh', 'em', 'chị', 'bạn', 'tôi', 'cách', 'để có', 'làm sao',
    // English common words
    'a','an','the','and','or','but','for','in','on','at','to','of','i','you','he','she','it','we','they','is','are','was','were','be','been','being','have','has','had','do','does','did','will','would','should','can','could','not','no','this','that','these','those','my','your','his','her','its','our','their', 'with', 'from', 'by', 'as', 'into', 'through', 'during', 'before', 'after', 'above', 'below', 'how', 'what', 'when', 'where', 'why',
    // Common YouTube title filler
    'new', 'hot', 'top', 'best', 'official', 'video', 'music', 'live', 'full', 'hd', 'mv', 'ep', 'part', 'series', 'episode'
]);

export const KeywordAnalysis: React.FC<KeywordAnalysisProps> = ({ videos, channelInfo }) => {
  const keywordCounts = useMemo(() => {
    const counts = new Map<string, number>();
    
    videos.forEach(video => {
      const title = video.snippet.title.toLowerCase();
      
      const originalWords = title.split(/\s+/).filter(Boolean);

      // Generate N-grams (phrases of 1, 2, and 3 words)
      for (let n = 1; n <= 3; n++) {
        if(originalWords.length < n) continue;
        for (let i = 0; i <= originalWords.length - n; i++) {
          const ngramWords = originalWords.slice(i, i + n);
          
          // Filter out phrases that start or end with a stop word, or are just a single stop word
          if (vietnameseStopWords.has(ngramWords[0]) || vietnameseStopWords.has(ngramWords[n - 1])) {
              continue;
          }

          const phrase = ngramWords.join(' ').replace(/[/,.\-()|[\]"“”:?!]+/g, '').trim();
          
          if (phrase && phrase.length > 2 && isNaN(parseInt(phrase))) {
             counts.set(phrase, (counts.get(phrase) || 0) + 1);
          }
        }
      }
    });

    const filteredCounts = new Map<string, number>();
    for(const [key, value] of counts.entries()) {
        if(value > 1) { // Only include keywords/phrases that appear more than once
            filteredCounts.set(key, value);
        }
    }
    
    return new Map([...filteredCounts.entries()].sort((a, b) => b[1] - a[1]));
  }, [videos]);


  const topKeywords = Array.from(keywordCounts.entries()).slice(0, 20);

  const handleDownloadKeywords = () => {
    if (!channelInfo) return;
    const data = Array.from(keywordCounts.entries()).map(([key, count], index) => ({
      'STT': index + 1,
      'Key': key,
      'Số lượt hiển thị': count,
    }));
    
    const worksheet = XLSX.utils.json_to_sheet(data);
    worksheet['!cols'] = [{ wch: 5 }, { wch: 35 }, { wch: 20 }];
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Keywords');
    const safeChannelName = channelInfo.title.replace(/[^\w\s]/gi, '').replace(/\s+/g, '_');
    XLSX.writeFile(workbook, `Tukhoa-${safeChannelName}.xlsx`);
  };

  const handleDownloadVideos = () => {
    if (!channelInfo) return;
    
    const data = videos.map(video => ({
        'Tiêu đề': video.snippet.title,
        'Mô tả': video.snippet.description,
        'Ngày đăng': formatDate(video.snippet.publishedAt),
        'Lượt xem': parseInt(video.statistics.viewCount, 10),
        'Lượt thích': parseInt(video.statistics.likeCount, 10),
        'Thời lượng': parseISO8601Duration(video.contentDetails.duration),
        'URL': `https://www.youtube.com/watch?v=${video.id}`
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    worksheet['!cols'] = [
        { wch: 70 }, // Title
        { wch: 100 }, // Description
        { wch: 15 }, // Date
        { wch: 15 }, // Views
        { wch: 15 }, // Likes
        { wch: 12 }, // Duration
        { wch: 45 }  // URL
    ];
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Videos');
    const safeChannelName = channelInfo.title.replace(/[^\w\s]/gi, '').replace(/\s+/g, '_');
    XLSX.writeFile(workbook, `Videos-${safeChannelName}.xlsx`);
  };

  return (
    <div>
        <h2 className="text-xl font-bold text-indigo-300 mb-4 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" />
                <path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" />
            </svg>
            Từ khóa & Cụm từ nổi bật
        </h2>
      <div className="flex flex-wrap gap-2 mb-4">
        {topKeywords.map(([keyword, count]) => (
          <span key={keyword} className="bg-gray-700 text-gray-200 text-sm font-medium px-3 py-1 rounded-full">
            {keyword} <span className="text-xs opacity-75 ml-1">({count})</span>
          </span>
        ))}
      </div>
      <div className="flex items-center space-x-3">
        <button onClick={handleDownloadKeywords} disabled={!channelInfo} className="flex items-center justify-center bg-green-700 hover:bg-green-800 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200 text-sm disabled:opacity-50">
            <DownloadIcon className="w-4 h-4 mr-2" />
            Tải về Từ khóa (.xlsx)
        </button>
        <button onClick={handleDownloadVideos} disabled={!channelInfo} className="flex items-center justify-center bg-green-700 hover:bg-green-800 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200 text-sm disabled:opacity-50">
            <DownloadIcon className="w-4 h-4 mr-2" />
            Tải về Dữ liệu Video (.xlsx)
        </button>
      </div>
    </div>
  );
};