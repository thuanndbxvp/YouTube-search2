import React from 'react';

export const AnalysisTools: React.FC = () => {
    return (
        <div>
            <h2 className="text-xl font-bold text-indigo-300 mb-2">
                Công cụ Phân tích & Sáng tạo
            </h2>
            <p className="text-gray-400 mb-4 text-sm">
                Sử dụng các công cụ để hiểu sâu hơn về kênh và tìm kiếm ý tưởng mới.
            </p>
            <div className="flex flex-col space-y-3">
                <button 
                    disabled
                    className="w-full flex items-center justify-center bg-purple-600 text-white font-semibold py-2.5 px-4 rounded-lg transition-colors duration-200 disabled:opacity-60 disabled:cursor-not-allowed">
                    Brainstorm Ý tưởng
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                </button>
                <div className="flex space-x-3">
                    <button 
                        disabled
                        className="w-full flex items-center justify-center bg-blue-600 text-white font-semibold py-2.5 px-4 rounded-lg transition-colors duration-200 disabled:opacity-60 disabled:cursor-not-allowed">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                           <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                        Thống kê
                    </button>
                    <button 
                        disabled
                        className="w-full flex items-center justify-center bg-teal-600 text-white font-semibold py-2.5 px-4 rounded-lg transition-colors duration-200 disabled:opacity-60 disabled:cursor-not-allowed">
                        <span className="font-bold text-lg mr-2">#</span> Thẻ tag
                    </button>
                </div>
            </div>
        </div>
    );
};
