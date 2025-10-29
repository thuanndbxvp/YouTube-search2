
import React, { useRef } from 'react';
import { SavedSession } from '../types';
import { TrashIcon, DownloadIcon, UploadIcon } from './Icons';

interface LibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessions: SavedSession[];
  onLoad: (sessionId: string) => void;
  onDelete: (sessionId: string) => void;
  onImport: (sessions: SavedSession[]) => void;
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

export const LibraryModal: React.FC<LibraryModalProps> = ({ isOpen, onClose, sessions, onLoad, onDelete, onImport }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 transition-opacity duration-300" onClick={onClose}>
      <div className="bg-[#24283b] rounded-lg shadow-2xl p-6 w-full max-w-2xl flex flex-col" style={{ height: '70vh' }} onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-white">Thư viện phiên làm việc</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-3xl leading-none">&times;</button>
        </div>

        <div className="flex-grow overflow-y-auto pr-2 space-y-3">
          {sessions.length > 0 ? (
            sessions
              .sort((a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime())
              .map(session => (
              <div key={session.id} className="flex items-center bg-[#2d303e] p-3 rounded-lg">
                <img src={session.channelInfo.thumbnail} alt={session.channelInfo.title} className="w-16 h-16 rounded-full mr-4" />
                <div className="flex-grow">
                    <h3 className="font-bold text-indigo-300">{session.channelInfo.title}</h3>
                    <p className="text-xs text-gray-400 mt-1">
                        {session.videos.length} video đã tải | Lần cuối lưu: {formatDate(session.savedAt)}
                    </p>
                </div>
                <div className="flex items-center space-x-2">
                    <button 
                        onClick={() => onLoad(session.id)}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm py-2 px-4 rounded-md transition-colors"
                    >
                        Tải lại
                    </button>
                    <button 
                        onClick={() => onDelete(session.id)}
                        className="bg-red-600 hover:bg-red-700 text-white p-2 rounded-md transition-colors"
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
            >
              <UploadIcon className="w-4 h-4 mr-2" />
              Nhập
            </button>
            <button
              onClick={handleExport}
              disabled={sessions.length === 0}
              className="flex items-center justify-center bg-green-700 hover:bg-green-800 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200 text-sm disabled:opacity-50"
            >
              <DownloadIcon className="w-4 h-4 mr-2" />
              Xuất tất cả
            </button>
          </div>
           <button onClick={onClose} className="py-2 px-6 rounded-lg bg-gray-600 hover:bg-gray-700 text-white font-semibold transition-colors">Đóng</button>
        </div>
      </div>
    </div>
  );
};
