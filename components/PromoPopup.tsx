import React, { useState, useEffect } from 'react';
import { XIcon } from './Icons';

interface PromoPopupProps {
  theme?: string;
}

export const PromoPopup: React.FC<PromoPopupProps> = ({ theme = 'blue' }) => {
  const [showCenterPopup, setShowCenterPopup] = useState(true);
  const [showCornerPopup, setShowCornerPopup] = useState(false);

  // Initial center popup logic
  useEffect(() => {
    // Check if we've already shown the center popup this session to avoid annoyance on refresh?
    // The user didn't specify, but standard practice is usually once per session.
    // For now, I'll just let it show on mount as requested "Cài popup ở giữa màn hình".
    setShowCenterPopup(true);
  }, []);

  // Recurring corner popup logic (every 5 minutes)
  useEffect(() => {
    const interval = setInterval(() => {
      setShowCornerPopup(true);
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, []);

  const content = (
    <div className="text-gray-200">
      <h3 className="text-lg font-bold mb-2 text-white">Gợi ý công cụ hữu ích</h3>
      <p className="mb-3 text-sm leading-relaxed">
        Chúng tôi có tool ghép tạo video từ ảnh/video khớp lời thoại với Audio, Voice chạy tới đâu là Ảnh/video hiển thị tới đó.
      </p>
      <p className="text-sm">
        Mời các bạn tham khảo: <a href="https://www.ai86.pro/" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 underline font-semibold">AI86.Pro</a>
      </p>
    </div>
  );

  return (
    <>
      {/* Center Popup */}
      {showCenterPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
          <div className="bg-[#1f2937] border border-gray-700 rounded-xl shadow-2xl max-w-md w-full relative overflow-hidden">
            <div className={`h-1 w-full bg-${theme}-500 absolute top-0 left-0`}></div>
            <button 
              onClick={() => setShowCenterPopup(false)}
              className="absolute top-3 right-3 text-gray-400 hover:text-white transition-colors"
            >
              <XIcon className="w-5 h-5" />
            </button>
            <div className="p-6">
              {content}
            </div>
          </div>
        </div>
      )}

      {/* Bottom Right Notification */}
      {showCornerPopup && (
        <div className="fixed bottom-4 right-4 z-40 max-w-sm w-full animate-in slide-in-from-right duration-500">
          <div className="bg-[#1f2937] border border-gray-700 rounded-lg shadow-xl p-4 relative">
             <div className={`h-full w-1 bg-${theme}-500 absolute top-0 left-0 rounded-l-lg`}></div>
            <button 
              onClick={() => setShowCornerPopup(false)}
              className="absolute top-2 right-2 text-gray-400 hover:text-white transition-colors"
            >
              <XIcon className="w-4 h-4" />
            </button>
            <div className="pl-3">
              {content}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
