
import React, { useState, useRef, useEffect } from 'react';
import { BookmarkIcon, LibraryIcon, KeyIcon, YouTubeIcon } from './Icons';
import { UserProfile } from '../types';

interface HeaderProps {
    onApiClick: () => void;
    onLibraryClick: () => void;
    onSaveSession: () => void;
    isSessionSavable: boolean;
    saveStatus: 'idle' | 'saved' | 'saving' | 'error';
    user: UserProfile | null;
    onSignIn: () => void;
    onSignOut: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onApiClick, onLibraryClick, onSaveSession, isSessionSavable, saveStatus, user, onSignIn, onSignOut }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    const saveButtonText = {
        'idle': 'Lưu phiên',
        'saving': 'Đang lưu...',
        'saved': 'Đã lưu!',
        'error': 'Lỗi!'
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsMenuOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);
    
    return (
        <header className="relative flex items-center justify-between py-2">
            {/* Empty div for spacing to keep title centered */}
            <div></div>
            
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                <h1 className="flex items-center justify-center text-3xl md:text-4xl font-bold text-indigo-300">
                    <YouTubeIcon className="w-10 h-10 md:w-12 md:h-12 mr-3" />
                    Trình phân tích kênh YouTube
                </h1>
                <p className="text-gray-400 mt-1">
                    Nhận thông tin chi tiết và tóm tắt do AI tạo ra cho các video gần đây nhất.
                </p>
            </div>

            <div className="flex items-center justify-end space-x-2">
                 <button 
                    onClick={onSaveSession}
                    disabled={!isSessionSavable || saveStatus === 'saving' || saveStatus === 'saved'}
                    className={`flex items-center justify-center text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200 disabled:opacity-50 w-36
                        ${saveStatus === 'saved' ? 'bg-green-600' : 'bg-indigo-600 hover:bg-indigo-700'}`
                    }
                >
                    <BookmarkIcon className="w-5 h-5 mr-2" />
                    {saveButtonText[saveStatus]}
                </button>
                <button onClick={onLibraryClick} className="flex items-center justify-center bg-yellow-600 hover:bg-yellow-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200">
                    <LibraryIcon className="w-5 h-5 mr-2" />
                    Thư viện
                </button>
                {user ? (
                    <>
                        <button onClick={onApiClick} className="flex items-center justify-center bg-gray-700 hover:bg-gray-800 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200">
                            <KeyIcon className="w-5 h-5 mr-2" />
                            API
                        </button>
                        <div className="relative" ref={menuRef}>
                             <button onClick={() => setIsMenuOpen(prev => !prev)} className="rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#1a1b26] focus:ring-indigo-400">
                                <img src={user.picture} alt={user.name} className="w-10 h-10 rounded-full" />
                            </button>
                            {isMenuOpen && (
                                <div className="absolute right-0 mt-2 w-48 bg-[#24283b] rounded-md shadow-lg py-1 ring-1 ring-black ring-opacity-5 z-10">
                                    <div className="px-4 py-2 text-sm text-gray-300 border-b border-gray-600">
                                        <p className="font-semibold text-white truncate">{user.name}</p>
                                        <p className="text-xs truncate">{user.email}</p>
                                    </div>
                                    <button
                                        onClick={onSignOut}
                                        className="block w-full text-left px-4 py-2 text-sm text-red-300 hover:bg-red-800/50"
                                    >
                                        Đăng xuất
                                    </button>
                                </div>
                            )}
                        </div>
                    </>
                ) : (
                    <>
                         <button onClick={onApiClick} className="flex items-center justify-center bg-gray-700 hover:bg-gray-800 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200">
                            <KeyIcon className="w-5 h-5 mr-2" />
                            API
                        </button>
                    </>
                )}
            </div>
        </header>
    );
};
