import React from 'react';
import { BookmarkIcon, LibraryIcon, KeyIcon, YouTubeIcon } from './Icons';
import { StoredConfig, Theme } from '../types';

interface HeaderProps {
    onApiClick: () => void;
    onLibraryClick: () => void;
    onSaveSession: () => void;
    isSessionSavable: boolean;
    saveStatus: 'idle' | 'saved' | 'saving' | 'error';
    theme: Theme;
    setAppConfig: React.Dispatch<React.SetStateAction<StoredConfig>>;
}

const themes: Theme[] = ['blue', 'green', 'orange', 'red', 'purple'];
const themeColors: Record<Theme, string> = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    orange: 'bg-orange-500',
    red: 'bg-red-500',
    purple: 'bg-purple-500',
};

export const Header: React.FC<HeaderProps> = ({ onApiClick, onLibraryClick, onSaveSession, isSessionSavable, saveStatus, theme, setAppConfig }) => {
    
    const saveButtonText = {
        'idle': 'Lưu phiên',
        'saving': 'Đang lưu...',
        'saved': 'Đã lưu!',
        'error': 'Lỗi!'
    };

    const handleThemeChange = (newTheme: Theme) => {
        setAppConfig(prevConfig => ({ ...prevConfig, theme: newTheme }));
    };
    
    return (
        <header className="flex items-center justify-between py-2">
            <div className="flex-1">
                <h1 className={`flex items-center text-3xl md:text-4xl font-bold text-${theme}-300`}>
                    <YouTubeIcon className="w-10 h-10 md:w-12 md:h-12 mr-3" />
                    Trình phân tích kênh YouTube
                </h1>
                <p className="text-gray-400 mt-1">
                    Nhận thông tin chi tiết và tóm tắt do AI tạo ra cho các video gần đây nhất.
                </p>
            </div>

            <div className="flex items-center justify-end space-x-4">
                 <div className="flex items-center space-x-2 bg-[#24283b] p-1.5 rounded-full">
                    {themes.map(t => (
                        <button
                            key={t}
                            onClick={() => handleThemeChange(t)}
                            className={`w-5 h-5 rounded-full transition-all ${themeColors[t]} ${theme === t ? 'ring-2 ring-offset-2 ring-offset-[#24283b] ring-white' : 'hover:opacity-80'}`}
                            aria-label={`Chọn giao diện màu ${t}`}
                            title={`Màu ${t.charAt(0).toUpperCase() + t.slice(1)}`}
                        />
                    ))}
                </div>
                 <button 
                    onClick={onSaveSession}
                    disabled={!isSessionSavable || saveStatus === 'saving' || saveStatus === 'saved'}
                    className={`flex items-center justify-center text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200 disabled:opacity-50 w-36
                        ${saveStatus === 'saved' ? 'bg-green-600' : `bg-${theme}-600 hover:bg-${theme}-700`}`
                    }
                >
                    <BookmarkIcon className="w-5 h-5 mr-2" />
                    {saveButtonText[saveStatus]}
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