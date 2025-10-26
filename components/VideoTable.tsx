import React, { useState, useMemo } from 'react';
import { Video } from '../types';
import { EyeIcon, LikeIcon, PlayIcon, SortAscIcon, SortDescIcon } from './Icons';
import { parseISO8601Duration, formatNumber, formatDate } from '../utils/formatters';

interface VideoTableProps {
  videos: Video[];
}

type SortKey = 'publishedAt' | 'viewCount' | 'likeCount' | 'duration';
type SortDirection = 'asc' | 'desc';

interface SortConfig {
  key: SortKey | null;
  direction: SortDirection;
}

const SortableHeader: React.FC<{
  title: string;
  sortKey: SortKey;
  sortConfig: SortConfig;
  requestSort: (key: SortKey) => void;
  className?: string;
}> = ({ title, sortKey, sortConfig, requestSort, className }) => {
  const isSorted = sortConfig.key === sortKey;
  const Icon = isSorted ? (sortConfig.direction === 'asc' ? SortAscIcon : SortDescIcon) : null;

  return (
    <th className={`p-3 text-sm font-semibold tracking-wide text-left cursor-pointer ${className}`} onClick={() => requestSort(sortKey)}>
      <div className="flex items-center">
        {title}
        {Icon && <Icon className="w-3 h-3 ml-2" />}
      </div>
    </th>
  );
};

export const VideoTable: React.FC<VideoTableProps> = ({ videos }) => {
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'publishedAt', direction: 'desc' });

  const sortedVideos = useMemo(() => {
    let sortableItems = [...videos];
    if (sortConfig.key !== null) {
      sortableItems.sort((a, b) => {
        let aValue: string | number;
        let bValue: string | number;

        switch (sortConfig.key) {
          case 'viewCount':
          case 'likeCount':
            aValue = parseInt(a.statistics[sortConfig.key] || '0', 10);
            bValue = parseInt(b.statistics[sortConfig.key] || '0', 10);
            break;
          case 'publishedAt':
            aValue = new Date(a.snippet[sortConfig.key]).getTime();
            bValue = new Date(b.snippet[sortConfig.key]).getTime();
            break;
          case 'duration':
             const parseDuration = (iso: string) => {
                const regex = /PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/;
                const [, hours = 0, minutes = 0, seconds = 0] = (iso.match(regex) || []).map(v => parseInt(v || '0', 10));
                return hours * 3600 + minutes * 60 + seconds;
            };
            aValue = parseDuration(a.contentDetails.duration);
            bValue = parseDuration(b.contentDetails.duration);
            break;
          default:
            return 0;
        }

        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [videos, sortConfig]);

  const requestSort = (key: SortKey) => {
    let direction: SortDirection = 'desc';
    if (sortConfig.key === key && sortConfig.direction === 'desc') {
      direction = 'asc';
    }
    setSortConfig({ key, direction });
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full table-auto">
        <thead className="bg-[#1a1b26] text-gray-400 border-b-2 border-gray-600">
          <tr>
            <th className="p-3 text-sm font-semibold tracking-wide text-left w-12">#</th>
            <th className="p-3 text-sm font-semibold tracking-wide text-left w-2/5">TIÊU ĐỀ VIDEO</th>
            <th className="p-3 text-sm font-semibold tracking-wide text-left w-2/5">MÔ TẢ VIDEO</th>
            <SortableHeader title="NGÀY ĐĂNG" sortKey="publishedAt" sortConfig={sortConfig} requestSort={requestSort} />
            <SortableHeader title="LƯỢT XEM" sortKey="viewCount" sortConfig={sortConfig} requestSort={requestSort} />
            <SortableHeader title="LƯỢT THÍCH" sortKey="likeCount" sortConfig={sortConfig} requestSort={requestSort} />
            <SortableHeader title="THỜI LƯỢNG" sortKey="duration" sortConfig={sortConfig} requestSort={requestSort} />
            <th className="p-3 text-sm font-semibold tracking-wide text-center">HÀNH ĐỘNG</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-700">
          {sortedVideos.map((video, index) => (
            <tr key={video.id} className="bg-[#24283b] hover:bg-[#2d303e]">
              <td className="p-3 text-sm text-gray-300">{index + 1}</td>
              <td className="p-3 text-sm text-indigo-200 font-bold whitespace-nowrap max-w-xs truncate" title={video.snippet.title}>
                {video.snippet.title}
              </td>
              <td className="p-3 text-xs text-gray-400 max-w-xs whitespace-pre-wrap" title={video.snippet.description}>
                {video.snippet.description || 'Không có mô tả.'}
              </td>
              <td className="p-3 text-sm text-gray-300 whitespace-nowrap">{formatDate(video.snippet.publishedAt)}</td>
              <td className="p-3 text-sm text-gray-300 whitespace-nowrap">
                <div className="flex items-center">
                    <EyeIcon className="w-4 h-4 mr-1.5 text-blue-400"/>
                    {formatNumber(video.statistics.viewCount)}
                </div>
              </td>
              <td className="p-3 text-sm text-gray-300 whitespace-nowrap">
                <div className="flex items-center">
                    <LikeIcon className="w-4 h-4 mr-1.5 text-pink-400"/>
                    {formatNumber(video.statistics.likeCount)}
                </div>
              </td>
              <td className="p-3 text-sm text-gray-300 whitespace-nowrap">
                {parseISO8601Duration(video.contentDetails.duration)}
              </td>
              <td className="p-3 text-sm text-center">
                 <a 
                    href={`https://www.youtube.com/watch?v=${video.id}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center bg-red-600 hover:bg-red-700 text-white font-semibold py-1.5 px-3 rounded-md transition-colors duration-200 text-xs"
                >
                    <PlayIcon className="w-4 h-4 mr-1" />
                    Đi tới video
                 </a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};