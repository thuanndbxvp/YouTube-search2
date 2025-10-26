import React, { useMemo, useState } from 'react';
import { Video } from '../types';
import { ClipboardCopyIcon, DownloadIcon } from './Icons';

interface HashtagModalProps {
  isOpen: boolean;
  onClose: () => void;
  videos: Video[];
}

export const HashtagModal: React.FC<HashtagModalProps> = ({ isOpen, onClose, videos }) => {
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied'>('idle');

  const hashtagCounts = useMemo(() => {
    if (!isOpen) return [];
    const counts = new Map<string, number>();
    const hashtagRegex = /#([\w\u00C0-\u1EF9]+)/g; // Regex for hashtags including Vietnamese characters

    videos.forEach(video => {
      const description = video.snippet.description || '';
      const matches = description.match(hashtagRegex);
      if (matches) {
        matches.forEach(hashtag => {
          const cleanedHashtag = hashtag.toLowerCase();
          counts.set(cleanedHashtag, (counts.get(cleanedHashtag) || 0) + 1);
        });
      }
    });

    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1]);
  }, [videos, isOpen]);
  
  const handleCopy = () => {
    const allHashtags = hashtagCounts.map(([tag]) => tag).join('\n');
    navigator.clipboard.writeText(allHashtags).then(() => {
        setCopyStatus('copied');
        setTimeout(() => setCopyStatus('idle'), 2000);
    });
  };
  
  const handleDownload = () => {
    const allHashtags = hashtagCounts.map(([tag]) => tag).join('\n');
    const blob = new Blob([allHashtags], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'hashtags.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 transition-opacity duration-300" onClick={onClose}>
      <div className="bg-[#24283b] rounded-lg shadow-2xl p-6 w-full max-w-md flex flex-col" style={{ height: '70vh' }} onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-white"># Hashtag được sử dụng</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl">&times;</button>
        </div>

        <div className="flex-grow overflow-y-auto pr-2 space-y-2">
          {hashtagCounts.length > 0 ? (
            hashtagCounts.map(([hashtag, count]) => (
              <div key={hashtag} className="flex justify-between items-center bg-[#2d303e] p-2 rounded-md">
                <span className="text-indigo-300 text-sm font-medium">{hashtag}</span>
                <span className="bg-gray-700 text-gray-200 text-xs font-bold px-2 py-0.5 rounded-full">{count}</span>
              </div>
            ))
          ) : (
             <div className="text-center text-gray-400 pt-10">Không tìm thấy hashtag nào.</div>
          )}
        </div>

        <div className="mt-6 flex justify-between items-center space-x-2">
          <button onClick={handleCopy} className="flex-1 py-2 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold transition-colors flex items-center justify-center">
            <ClipboardCopyIcon className="w-5 h-5 mr-2"/>
            {copyStatus === 'copied' ? 'Đã sao chép!' : 'Sao chép tất cả'}
          </button>
          <button onClick={handleDownload} className="flex-1 py-2 px-4 rounded-lg bg-gray-600 hover:bg-gray-700 text-white font-semibold transition-colors flex items-center justify-center">
             <DownloadIcon className="w-5 h-5 mr-2"/>
             Tải về (.txt)
          </button>
           <button onClick={onClose} className="py-2 px-6 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold transition-colors">Đóng</button>
        </div>
      </div>
    </div>
  );
};