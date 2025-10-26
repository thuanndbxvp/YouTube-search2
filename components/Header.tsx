import React from 'react';
import { BookmarkIcon, LibraryIcon, KeyIcon } from './Icons';

interface HeaderProps {
    onApiClick: () => void;
    onLibraryClick: () => void;
    onSaveSession: () => void;
    isSessionSavable: boolean;
    saveStatus: 'idle' | 'saved';
}

export const Header: React.FC<HeaderProps> = ({ onApiClick, onLibraryClick, onSaveSession, isSessionSavable, saveStatus }) => {
    return (
        <header className="relative py-2">
            <div className="text-center">
                <h1 className="text-3xl md:text-4xl font-bold text-indigo-300">
                    Trình phân tích kênh YouTube
                </h1>
                <p className="text-gray-400 mt-1">
                    Nhận thông tin chi tiết và tóm tắt do AI tạo ra cho các video gần đây nhất.
                </p>
            </div>
            <div className="mt-4 flex items-center justify-center space-x-2 md:absolute md:right-0 md:top-1/2 md:-translate-y-1/2 md:mt-0">
                <button 
                    onClick={onSaveSession}
                    disabled={!isSessionSavable || saveStatus === 'saved'}
                    className="flex items-center justify-center bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200 disabled:opacity-50 w-36"
                >
                    <BookmarkIcon className="w-5 h-5 mr-2" />
                    {saveStatus === 'saved' ? 'Đã lưu!' : 'Lưu phiên'}
                </button>
                <button onClick={onLibraryClick} className="flex items-center justify-center bg-yellow-600 hover:bg-yellow-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200">
                    <LibraryIcon className="w-5 h-5 mr-2" />
                    Thư viện
                </button>
                <button onClick={onApiClick} className="flex items-center justify-center bg-gray-700 hover:bg-gray-800 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200">
                    <KeyIcon className="w-5 h-5 mr-2" />
                    API
                </button>
            </div>
        </header>
    );
};