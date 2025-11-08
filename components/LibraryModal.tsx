import React, { useMemo } from 'react';
import { SavedSession, Theme } from '../types';
import { TrashIcon, UsersIcon, VideoCameraIcon, ClockIcon, ArrowPathIcon, SpinnerIcon } from './Icons';
import { formatNumber } from '../utils/formatters';

interface LibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessions: SavedSession[];
  onLoad: (sessionId: string) => void;
  onDelete: (sessionId: string) => void;
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

export const LibraryModal: React.FC<LibraryModalProps> = ({ isOpen, onClose, sessions, onLoad, onDelete, onUpdate, updatingSessionId, theme }) => {

  if (!isOpen) return null;

  const sortedSessions = useMemo(() => {
    if (!Array.isArray(sessions)) {
        console.error("LibraryModal received a non-array value for sessions:", sessions);
        return [];
    }

    const validSessions = sessions.filter(s => 
      s && 
      typeof s.id === 'string' &&
      s.channelInfo &&
      typeof s.channelInfo === 'object' && s.channelInfo !== null &&
      typeof s.channelInfo.title === 'string' &&
      typeof s.channelInfo.thumbnail === 'string' &&
      Array.isArray(s.videos) &&
      typeof s.savedAt === 'string'
    );

    return validSessions.sort((a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime());
  }, [sessions]);


  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 transition-opacity duration-300" onClick={onClose}>
      <div className="bg-[#24283b] rounded-lg shadow-2xl p-6 w-full max-w-4xl flex flex-col" style={{ height: '80vh' }} onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-white">Thư viện phiên làm việc</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-3xl leading-none" title="Đóng cửa sổ">&times;</button>
        </div>

        <div className="flex-grow overflow-y-auto pr-2 space-y-3">
          {sortedSessions.length > 0 ? (
            sortedSessions.map(session => (
              <div key={session.id} className="flex items-center bg-[#2d303e] p-3 rounded-lg">
                <img src={session.channelInfo.thumbnail} alt={session.channelInfo.title} className="w-16 h-16 rounded-full mr-4" />
                <div className="flex-grow">
                    <h3 className={`font-bold text-${theme}-300`}>{session.channelInfo.title}</h3>
                    <div className="flex items-center flex-wrap gap-x-4 gap-y-1 text-xs text-gray-400 mt-2">
                        <div className="flex items-center" title="Người đăng ký">
                            <UsersIcon className="w-4 h-4 mr-1.5" />
                            <span>{formatNumber(session.channelInfo.subscriberCount)} subs</span>
                        </div>
                        <div className="flex items-center" title="Số lượng video">
                            <VideoCameraIcon className="w-4 h-4 mr-1.5" />
                            <span>{formatNumber(session.channelInfo.videoCount)} videos</span>
                        </div>
                        <div className="flex items-center" title="Ngày lưu">
                            <ClockIcon className="w-4 h-4 mr-1.5" />
                            <span>Lưu: {formatDate(session.savedAt)}</span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center space-x-2">
                    <button
                        onClick={() => onUpdate(session.id)}
                        disabled={!!updatingSessionId}
                        className={`bg-cyan-600 hover:bg-cyan-700 text-white font-semibold text-sm py-2 px-4 rounded-md transition-colors flex items-center justify-center w-28
                                  disabled:opacity-50 disabled:cursor-not-allowed`}
                        title="Cập nhật dữ liệu mới nhất cho kênh này"
                    >
                        {updatingSessionId === session.id ? (
                            <>
                                <SpinnerIcon className="w-4 h-4 mr-2 animate-spin" />
                                Đang...
                            </>
                        ) : (
                            'Cập nhật'
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
                <p className="text-sm mt-2">Phân tích một kênh và dữ liệu sẽ được tự động lưu vào đây.</p>
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-end items-center">
           <button onClick={onClose} className="py-2 px-6 rounded-lg bg-gray-600 hover:bg-gray-700 text-white font-semibold transition-colors" title="Đóng cửa sổ thư viện">Đóng</button>
        </div>
      </div>
    </div>
  );
};