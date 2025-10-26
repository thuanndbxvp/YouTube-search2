import React, { useMemo } from 'react';
import { Video } from '../types';
import { DownloadIcon } from './Icons';

interface KeywordAnalysisProps {
  videos: Video[];
}

// Simple English stop words. A more comprehensive list would be better for production.
const stopWords = new Set(['a','an','the','and','or','but','for','in','on','at','to','of','i','you','he','she','it','we','they','is','are','was','were','be','been','being','have','has','had','do','does','did','will','would','should','can','could','not','no','this','that','these','those','my','your','his','her','its','our','their', 'with', 'from', 'by', 'as', 'into', 'through', 'during', 'before', 'after', 'above', 'below']);

export const KeywordAnalysis: React.FC<KeywordAnalysisProps> = ({ videos }) => {
  const keywordCounts = useMemo(() => {
    const counts = new Map<string, number>();
    videos.forEach(video => {
      const titleWords = video.snippet.title.toLowerCase().match(/\b(\w+)\b/g) || [];
      titleWords.forEach(word => {
        if (!stopWords.has(word) && isNaN(parseInt(word))) { // Exclude stop words and numbers
          counts.set(word, (counts.get(word) || 0) + 1);
        }
      });
    });
    return new Map([...counts.entries()].sort((a, b) => b[1] - a[1]));
  }, [videos]);

  const topKeywords = Array.from(keywordCounts.entries()).slice(0, 20);

  const downloadCSV = (data: string, filename: string) => {
    const blob = new Blob([data], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadKeywords = () => {
    let csvContent = 'Keyword,Count\r\n';
    keywordCounts.forEach((count, keyword) => {
      csvContent += `${keyword},${count}\r\n`;
    });
    downloadCSV(csvContent, 'youtube_keywords.csv');
  };

  const handleDownloadVideos = () => {
    let csvContent = 'Title,Publication Date,Views,Likes,Duration (ISO8601),URL\r\n';
    videos.forEach(video => {
      const row = [
        `"${video.snippet.title.replace(/"/g, '""')}"`,
        video.snippet.publishedAt,
        video.statistics.viewCount,
        video.statistics.likeCount,
        video.contentDetails.duration,
        `https://www.youtube.com/watch?v=${video.id}`
      ].join(',');
      csvContent += row + '\r\n';
    });
    downloadCSV(csvContent, 'youtube_videos.csv');
  };

  return (
    <div>
        <h2 className="text-xl font-bold text-indigo-300 mb-4 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            Từ khóa nổi bật nhất trong Tiêu đề
        </h2>
      <div className="flex flex-wrap gap-2 mb-4">
        {topKeywords.map(([keyword, count]) => (
          <span key={keyword} className="bg-gray-700 text-gray-200 text-sm font-medium px-3 py-1 rounded-full">
            {count}x {keyword}
          </span>
        ))}
      </div>
      <div className="flex items-center space-x-3">
        <button onClick={handleDownloadKeywords} className="flex items-center justify-center bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200 text-sm">
            <DownloadIcon className="w-4 h-4 mr-2" />
            Tải về Từ khóa (.csv)
        </button>
        <button onClick={handleDownloadVideos} className="flex items-center justify-center bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200 text-sm">
            <DownloadIcon className="w-4 h-4 mr-2" />
            Tải về Video (.csv)
        </button>
      </div>
    </div>
  );
};
