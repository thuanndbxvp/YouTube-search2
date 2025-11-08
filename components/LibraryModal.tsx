import React, { useRef, useState, useMemo } from 'react';
import { SavedSession, Theme } from '../types';
import { TrashIcon, DownloadIcon, UploadIcon, TableCellsIcon, ArrowPathIcon, SpinnerIcon, SortAscIcon, SortDescIcon } from './Icons';
import { parseISO8601Duration, formatDate as formatDateForExcel } from '../utils/formatters';

declare const XLSX: any;

interface LibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessions: SavedSession[];
  onLoad: (sessionId: string) => void;
  onDelete: (sessionId: string) => void;
  onImport: (sessions: SavedSession[]) => void;
  onUpdate: (sessionId: string) => void;
  updatingSessionId: string | null;
  theme: Theme;
}

const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
};

type SortKey = 'savedAt' | 'videoCount' | 'subscriberCount';
type SortDirection = 'asc' | 'desc';

interface SortConfig {
    key: SortKey;
    direction: SortDirection;
}

export const LibraryModal: React.FC<LibraryModalProps> = ({ isOpen, onClose, sessions, onLoad, onDelete, onImport, onUpdate, updatingSessionId, theme }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'savedAt', direction: 'desc' });

  if (!isOpen) return null;

  const handleExport = () => {
    if (sessions.length === 0) return;
    const date = new Date().toISOString().split('T')[0];
    const fileName = `youtube_analyzer_sessions_${date}.json`;
    const dataStr = JSON.stringify(sessions, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const text = e.target?.result as string;
            const importedSessions = JSON.parse(text);
            
            if (Array.isArray(importedSessions)) {
                onImport(importedSessions);
            } else {
                alert('Tệp không hợp lệ. Vui lòng đảm bảo tệp chứa dữ liệu phiên đã xuất hợp lệ.');
            }
        } catch (error) {
            console.error("Lỗi khi phân tích cú pháp tệp nhập:", error);
            alert('Không thể đọc tệp. Vui lòng đảm bảo đó là tệp JSON hợp lệ.');
        } finally {
            if (event.target) {
                event.target.value = '';
            }
        }
    };
    reader.readAsText(file);
  };
  
  const handleExportAllToExcel = () => {
    if (sessions.length === 0) return;

    const workbook = XLSX.utils.book_new();

    sessions.forEach(session => {
      // Sanitize sheet name for Excel (max 31 chars, no special chars)
      const safeSheetName = session.channelInfo.title.replace(/[\\/*?:"<>|]/g, '').substring(0, 31);
      
      const videoData = session.videos.map(video => ({
        'Tiêu đề': video.snippet.title,
        'Mô tả': video.snippet.description,
        'Ngày đăng': formatDateForExcel(video.snippet.publishedAt),
        'Lượt xem': parseInt(video.statistics.viewCount, 10),
        'Lượt thích': parseInt(video.statistics.likeCount, 10),
        'Thời lượng': parseISO8601Duration(video.contentDetails.duration),
        'URL': `https://www.youtube.com/watch?v=${video.id}`
      }));

      const worksheet = XLSX.utils.json_to_sheet(videoData);
      worksheet['!cols'] = [
          { wch: 70 }, { wch: 100 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 12 }, { wch: 45 }
      ];

      XLSX.utils.book_append_sheet(workbook, worksheet, safeSheetName);
    });
    
    const date = new Date().toISOString().split('T')[0];
    const fileName = `youtube_analyzer_all_channels_data_${date}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

  const sortedSessions = useMemo(() => {
    // Filter out any sessions that are null/undefined or missing essential 'channelInfo' to prevent crashes.
    const validSessions = sessions.filter(s => s && s.channelInfo);

    return validSessions.sort((a, b) => {
        let aValue: number, bValue: number;

        switch(sortConfig.key) {
            case 'videoCount':
                aValue = parseInt(a.channelInfo.videoCount, 10) || 0;
                bValue = parseInt(b.channelInfo.videoCount, 10) || 0;
                break;
            case 'subscriberCount':
                aValue = parseInt(a.channelInfo.subscriberCount, 10) || 0;
                bValue = parseInt(b.channelInfo.subscriberCount, 10) || 0;
                break;
            case 'savedAt':
            default:
                aValue = new Date(a.savedAt).getTime();
                bValue = new Date(b.savedAt).getTime();
                break;
        }

        // Handle cases where parsing might result in NaN
        if (isNaN(aValue)) aValue = 0;
        if (isNaN(bValue)) bValue = 0;

        if (aValue < bValue) {
            return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
            return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
    });
  }, [sessions, sortConfig]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 transition-opacity duration-300" onClick={onClose}>
      <div className="bg-[#24283b] rounded-lg shadow-2xl p-6 w-full max-w-3xl flex flex-col" style={{ height: '80vh' }} onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-xl font-bold text-white">Thư viện phiên làm việc</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-3xl leading-none" title="Đóng cửa sổ">&times;</button>
        </div>

        <div className="flex items-center justify-end mb-4 text-sm">
            <label htmlFor="sort-key" className="text-gray-400 mr-2">Sắp xếp:</label>
            <select
                id="sort-key"
                value={sortConfig.key}
                onChange={e => setSortConfig(c => ({ ...c, key: e.target.value as SortKey }))}
                className="bg-[#2d303e] border border-gray-600 rounded-md px-2 py-1 text-white focus:ring-1 focus:ring-blue-500 outline-none"
            >
                <option value="savedAt">Ngày lưu</option>
                <option value="videoCount">Số video</option>
                <option value="subscriberCount">Lượt subscribers</option>
            </select>
            <button
                onClick={() => setSortConfig(c => ({ ...c, direction: c.direction === 'desc' ? 'asc' : 'desc' }))}
                className="p-1.5 ml-2 bg-gray-700 hover:bg-gray-600 rounded-md text-white"
                title={sortConfig.direction === 'desc' ? 'Sắp xếp tăng dần' : 'Sắp xếp giảm dần'}
            >
                {sortConfig.direction === 'desc' ? <SortDescIcon className="w-4 h-4" /> : <SortAscIcon className="w-4 h-4" />}
            </button>
        </div>

        <div className="flex-grow overflow-y-auto pr-2 space-y-3">
          {sortedSessions.length > 0 ? (
            sortedSessions.map(session => (
              <div key={session.id} className="flex items-center bg-[#2d303e] p-3 rounded-lg">
                <img src={session.channelInfo.thumbnail} alt={session.channelInfo.title} className="w-16 h-16 rounded-full mr-4" />
                <div className="flex-grow">
                    <h3 className={`font-bold text-${theme}-300`}>{session.channelInfo.title}</h3>
                    <p className="text-xs text-gray-400 mt-1">
                        {session.videos.length} video đã tải | Lần cuối lưu: {formatDate(session.savedAt)}
                    </p>
                </div>
                <div className="flex items-center space-x-2">
                    <button 
                        onClick={() => onUpdate(session.id)}
                        disabled={!!updatingSessionId}
                        className="flex items-center justify-center bg-cyan-600 hover:bg-cyan-700 text-white font-semibold text-sm py-2 px-4 rounded-md transition-colors disabled:opacity-50"
                        title="Làm mới dữ liệu cho kênh này từ YouTube"
                    >
                        {updatingSessionId === session.id ? (
                            <>
                                <SpinnerIcon className="w-4 h-4 mr-2 animate-spin" />
                                <span>Cập nhật...</span>
                            </>
                        ) : (
                            <>
                                <ArrowPathIcon className="w-4 h-4 mr-2" />
                                <span>Cập nhật</span>
                            </>
                        )}
                    </button>
                    <button 
                        onClick={() => onLoad(session.id)}
                        className={`bg-${theme}-600 hover:bg-${theme}-700 text-white font-semibold text-sm py-2 px-4 rounded-md transition-colors`}
                        title="Tải lại phiên làm việc này vào giao diện chính"
                    >
                        Tải lại
                    </button>
                    <button 
                        onClick={() => onDelete(session.id)}
                        className="bg-red-800 hover:bg-red-900 text-white p-2.5 rounded-md transition-colors"
                        title="Xóa vĩnh viễn phiên làm việc này"
                    >
                        <TrashIcon className="w-5 h-5" />
                    </button>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center text-gray-400 pt-16">
                <p className="text-lg">Thư viện của bạn trống.</p>
                <p className="text-sm mt-2">Phân tích một kênh và nhấn "Lưu phiên" để thêm vào đây.</p>
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".json"
              className="hidden"
            />
            <button
              onClick={handleImportClick}
              className="flex items-center justify-center bg-yellow-600 hover:bg-yellow-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200 text-sm"
              title="Nhập các phiên làm việc từ một tệp .json"
            >
              <UploadIcon className="w-4 h-4 mr-2" />
              Nhập
            </button>
            <button
              onClick={handleExport}
              disabled={sessions.length === 0}
              className="flex items-center justify-center bg-green-700 hover:bg-green-800 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200 text-sm disabled:opacity-50"
              title="Xuất tất cả các phiên trong thư viện ra tệp .json"
            >
              <DownloadIcon className="w-4 h-4 mr-2" />
              Xuất JSON
            </button>
             <button
              onClick={handleExportAllToExcel}
              disabled={sessions.length === 0}
              className="flex items-center justify-center bg-teal-600 hover:bg-teal-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200 text-sm disabled:opacity-50"
              title="Xuất dữ liệu video của tất cả các kênh ra tệp .xlsx"
            >
              <TableCellsIcon className="w-4 h-4 mr-2" />
              Xuất Excel
            </button>
          </div>
           <button onClick={onClose} className="py-2 px-6 rounded-lg bg-gray-600 hover:bg-gray-700 text-white font-semibold transition-colors" title="Đóng cửa sổ thư viện">Đóng</button>
        </div>
      </div>
    </div>
  );
};