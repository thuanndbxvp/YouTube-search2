import React from 'react';
import { SavedSession } from '../types';
import { TrashIcon } from './Icons';

interface LibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessions: SavedSession[];
  onLoad: (sessionId: string) => void;
  onDelete: (sessionId: string) => void;
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

export const LibraryModal: React.FC<LibraryModalProps> = ({ isOpen, onClose, sessions, onLoad, onDelete }) => {
  if (!isOpen) return null;

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

        <div className="mt-6 text-right">
           <button onClick={onClose} className="py-2 px-6 rounded-lg bg-gray-600 hover:bg-gray-700 text-white font-semibold transition-colors">Đóng</button>
        </div>
      </div>
    </div>
  );
};