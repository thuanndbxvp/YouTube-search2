
import React, { useState, useRef, useEffect } from 'react';
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

const PaintBrushIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="m15.232 5.232 3.536 3.536m-2.036-5.036a2.5 2.5 0 1 1 3.536 3.536L6.5 21.036H3v-3.572L16.732 3.732Z" />
    </svg>
);


export const Header: React.FC<HeaderProps> = ({ onApiClick, onLibraryClick, onSaveSession, isSessionSavable, saveStatus, theme, setAppConfig }) => {
    const [isThemeDropdownOpen, setIsThemeDropdownOpen] = useState(false);
    const themeDropdownRef = useRef<HTMLDivElement>(null);
    
    const saveButtonText = {
        'idle': 'Lưu phiên',
        'saving': 'Đang lưu...',
        'saved': 'Đã lưu!',
        'error': 'Lỗi!'
    };

    const handleThemeChange = (newTheme: Theme) => {
        setAppConfig(prevConfig => ({ ...prevConfig, theme: newTheme }));
        setIsThemeDropdownOpen(false);
    };

     useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (themeDropdownRef.current && !themeDropdownRef.current.contains(event.target as Node)) {
                setIsThemeDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);
    
    return (
        <header className="flex flex-col items-center text-center py-2">
            <div>
                <h1 className={`flex items-center justify-center text-3xl md:text-4xl font-bold text-${theme}-300`}>
                    <YouTubeIcon className="w-10 h-10 md:w-12 md:h-12 mr-3" />
                    Trình phân tích kênh YouTube
                </h1>
                <p className="text-gray-400 mt-1">
                    Nhận thông tin chi tiết và tóm tắt do AI tạo ra cho các video gần đây nhất.
                </p>
            </div>

            <div className="flex items-center justify-center space-x-2 mt-6">
                 <div className="relative" ref={themeDropdownRef}>
                    <button
                        onClick={() => setIsThemeDropdownOpen(!isThemeDropdownOpen)}
                        className="flex items-center justify-center bg-gray-700 hover:bg-gray-800 text-white font-semibold p-1.5 rounded-md transition-colors duration-200"
                        aria-label="Chọn giao diện"
                        title="Chọn màu giao diện"
                    >
                        <PaintBrushIcon className="w-4 h-4" />
                    </button>

                    {isThemeDropdownOpen && (
                        <div className="absolute right-0 top-full mt-2 w-auto bg-[#2d303e] border border-[#414868] rounded-lg shadow-xl z-10 p-2">
                             <div className="flex items-center space-x-2">
                                {themes.map(t => (
                                    <button
                                        key={t}
                                        onClick={() => handleThemeChange(t)}
                                        className={`w-6 h-6 rounded-full transition-all ${themeColors[t]} ${theme === t ? 'ring-2 ring-offset-2 ring-offset-[#2d303e] ring-white' : 'hover:opacity-80'}`}
                                        aria-label={`Chọn giao diện màu ${t}`}
                                        title={`Màu ${t.charAt(0).toUpperCase() + t.slice(1)}`}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                 </div>
                 <button 
                    onClick={onSaveSession}
                    disabled={!isSessionSavable || saveStatus === 'saving' || saveStatus === 'saved'}
                    className={`flex items-center justify-center text-white text-sm font-semibold py-1.5 px-3 rounded-md transition-colors duration-200 disabled:opacity-50
                        ${saveStatus === 'saved' ? 'bg-green-600' : `bg-${theme}-600 hover:bg-${theme}-700`}`
                    }
                >
                    <BookmarkIcon className="w-4 h-4 mr-1.5" />
                    {saveButtonText[saveStatus]}
                </button>
                <button onClick={onLibraryClick} className="flex items-center justify-center bg-yellow-600 hover:bg-yellow-700 text-white text-sm font-semibold py-1.5 px-3 rounded-md transition-colors duration-200">
                    <LibraryIcon className="w-4 h-4 mr-1.5" />
                    Thư viện
                </button>
                <button onClick={onApiClick} className="flex items-center justify-center bg-gray-700 hover:bg-gray-800 text-white text-sm font-semibold py-1.5 px-3 rounded-md transition-colors duration-200">
                    <KeyIcon className="w-4 h-4 mr-1.5" />
                    API
                </button>
            </div>
        </header>
    );
};
