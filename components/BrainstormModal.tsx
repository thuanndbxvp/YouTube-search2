import React, { useState, useEffect, useRef } from 'react';
import { ChannelInfo, StoredConfig, AiProvider, ChatMessage, Video } from '../types';
import { generateGeminiChatResponse } from '../services/geminiService';
import { generateOpenAIChatResponse } from '../services/openaiService';
import { PaperAirplaneIcon, UsersIcon } from './Icons';
import { formatDate, formatNumber, parseISO8601Duration } from '../utils/formatters';

interface BrainstormModalProps {
  isOpen: boolean;
  onClose: () => void;
  channelInfo: ChannelInfo;
  appConfig: StoredConfig;
  messages: ChatMessage[];
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  videos: Video[];
}

const AiProviderSelector: React.FC<{
    selected: AiProvider;
    onSelect: (provider: AiProvider) => void;
    config: StoredConfig;
}> = ({ selected, onSelect, config }) => {
    const hasGemini = !!config.gemini.key;
    const hasOpenAI = !!config.openai.key;

    const buttonClass = (provider: AiProvider) => 
        `px-4 py-2 text-sm font-semibold rounded-md transition-colors ${
            selected === provider 
            ? 'bg-indigo-600 text-white' 
            : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
        }`;

    return (
        <div className="flex justify-center space-x-2 mb-4">
            {hasGemini && <button onClick={() => onSelect('gemini')} className={buttonClass('gemini')}>Gemini</button>}
            {hasOpenAI && <button onClick={() => onSelect('openai')} className={buttonClass('openai')}>ChatGPT</button>}
        </div>
    )
};

const ANALYSIS_PROMPT_IDENTIFIER = "Với tư cách là một chuyên gia phân tích kênh YouTube";

export const BrainstormModal: React.FC<BrainstormModalProps> = ({ isOpen, onClose, channelInfo, appConfig, messages, setMessages, videos }) => {
  const [selectedAi, setSelectedAi] = useState<AiProvider>('gemini');
  const [currentMessage, setCurrentMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    // Set default AI provider based on available keys
    if (appConfig.gemini.key) {
        setSelectedAi('gemini');
    } else if (appConfig.openai.key) {
        setSelectedAi('openai');
    }
  }, [isOpen, appConfig.gemini.key, appConfig.openai.key]);

  useEffect(() => {
    // Auto-scroll to the bottom of the chat
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const handleAudienceAnalysis = async () => {
    const hasExistingAnalysis = messages.some(
        msg => msg.role === 'user' && msg.content.startsWith(ANALYSIS_PROMPT_IDENTIFIER)
    );

    if (hasExistingAnalysis || isAnalyzing || isLoading) {
        return;
    }

    setIsLoading(true);
    setIsAnalyzing(true);
    
    const videoDataSummary = videos.slice(0, 50).map((video, index) => {
        return `
---
Video ${index + 1}:
- Tiêu đề: ${video.snippet.title}
- Ngày đăng: ${formatDate(video.snippet.publishedAt)}
- Lượt xem: ${formatNumber(video.statistics.viewCount)}
- Lượt thích: ${formatNumber(video.statistics.likeCount)}
- Thời lượng: ${parseISO8601Duration(video.contentDetails.duration)}
- Mô tả: ${(video.snippet.description || 'Không có').substring(0, 250)}...
---
`.trim();
    }).join('\n\n');

    const audienceAnalysisPrompt = `${ANALYSIS_PROMPT_IDENTIFIER}, hãy thực hiện một bài phân tích sâu về đối tượng khán giả của kênh "${channelInfo.title}", dựa trên dữ liệu từ các video gần đây.

Dưới đây là dữ liệu thô từ ${videos.length} video gần đây nhất để bạn tham khảo:

${videoDataSummary}

Vui lòng sử dụng dữ liệu trên để thực hiện phân tích và tuân thủ cấu trúc sau:

1. **Xác định mục tiêu phân tích**
   - 📈 **Chiến lược nội dung:** Các chủ đề, tần suất, phong cách chính của kênh là gì?
   - 🎯 **Đối tượng khán giả mục tiêu:** Mô tả chân dung khán giả (độ tuổi, sở thích, hành vi xem).
   - 💰 **Hiệu quả hoạt động:** Đánh giá sơ bộ về lượt xem, tương tác, và tốc độ tăng trưởng.
   - 🧠 **Điểm khác biệt:** Yếu tố nào làm nên thương hiệu riêng cho kênh?

2. **Phân loại nội dung & Chủ đề**
   - Dựa trên danh sách các video đã cung cấp, hãy nhóm chúng vào các chủ đề chính.

3. **Phân tích định lượng (Quantitative Analysis)**
   - Lượt xem trung bình/video là bao nhiêu?
   - Tỷ lệ tương tác (like/view) ước tính.
   - Tần suất đăng tải video (ví dụ: hàng tuần, hàng tháng).
   - Thời lượng video trung bình.
   - Có xu hướng chủ đề nào đang tăng trưởng về lượt xem không?

4. **Phân tích định tính (Qualitative Analysis)**
   - **Cấu trúc nội dung:** Mô tả cấu trúc kể chuyện điển hình (Mở đầu – Phát triển – Kết luận).
   - **Phong cách kể chuyện:** Kênh theo phong cách nào (Tài liệu, bí ẩn, tâm lý, điện ảnh, v.v.)?
   - **Tone thương hiệu:** Tông giọng của kênh là gì (Nghiêm túc, bí ẩn, học thuật, hoài cổ)?
   - **Hình ảnh & Âm nhạc:** Nhận xét về tone màu, nhịp độ dựng phim, và cách sử dụng nhạc nền.
   - **Tổng kết:** Kênh mang lại trải nghiệm cảm xúc gì cho người xem?

Hãy trình bày phân tích của bạn một cách chi tiết và chuyên nghiệp, sử dụng dữ liệu đã cung cấp làm cơ sở.`;

    const userMessage: ChatMessage = { role: 'user', content: audienceAnalysisPrompt };
    
    const initialMessages = messages.length > 1 ? messages : [];
    const historyForApi = [...initialMessages, userMessage];

    setMessages(historyForApi);

    try {
        let response: string;
        if (selectedAi === 'gemini') {
            response = await generateGeminiChatResponse(appConfig.gemini.key, appConfig.gemini.model, historyForApi);
        } else {
            response = await generateOpenAIChatResponse(appConfig.openai.key, appConfig.openai.model, historyForApi);
        }
        const finalAiMessage: ChatMessage = { role: 'model', content: response };
        setMessages(prev => [...prev, finalAiMessage]);
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Đã có lỗi xảy ra.";
        const errorAiMessage: ChatMessage = { role: 'model', content: `Lỗi: ${errorMessage}` };
        setMessages(prev => [...prev, errorAiMessage]);
    } finally {
        setIsLoading(false);
        setIsAnalyzing(false);
    }
  };


  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedMessage = currentMessage.trim();
    if (!trimmedMessage || isLoading) return;

    const userMessage: ChatMessage = { role: 'user', content: trimmedMessage };
    setMessages(prev => [...prev, userMessage]);
    const historyForApi = [...messages, userMessage];
    
    setCurrentMessage('');
    setIsLoading(true);

    try {
        let response: string;
        if (selectedAi === 'gemini') {
            response = await generateGeminiChatResponse(appConfig.gemini.key, appConfig.gemini.model, historyForApi);
        } else {
            response = await generateOpenAIChatResponse(appConfig.openai.key, appConfig.openai.model, historyForApi);
        }
        setMessages(prev => [...prev, { role: 'model', content: response }]);
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Đã có lỗi xảy ra.";
        setMessages(prev => [...prev, { role: 'model', content: `Lỗi: ${errorMessage}` }]);
    } finally {
        setIsLoading(false);
    }
  };

  const hasExistingAnalysis = messages.some(
    msg => msg.role === 'user' && msg.content.startsWith(ANALYSIS_PROMPT_IDENTIFIER)
  );


  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 transition-opacity" onClick={onClose}>
      <div className="bg-[#24283b] rounded-lg shadow-2xl w-full max-w-2xl flex flex-col" style={{ height: '80vh' }} onClick={(e) => e.stopPropagation()}>
        <div className="p-4 border-b border-gray-700">
          <div className="flex justify-between items-center">
             <h2 className="text-xl font-bold text-white">Brainstorm & Phân tích với AI</h2>
             <button onClick={onClose} className="text-gray-400 hover:text-white text-3xl leading-none">&times;</button>
          </div>
          <p className="text-sm text-gray-400">Kênh đang phân tích: {channelInfo.title}</p>
        </div>

        <AiProviderSelector selected={selectedAi} onSelect={setSelectedAi} config={appConfig} />

        <div ref={chatContainerRef} className="flex-grow p-4 overflow-y-auto space-y-4">
            {messages.map((msg, index) => (
                <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-lg p-3 rounded-lg ${msg.role === 'user' ? 'bg-indigo-700 text-white' : 'bg-gray-700 text-gray-200'}`}>
                        <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                    </div>
                </div>
            ))}
            {isLoading && (
                 <div className="flex justify-start">
                    <div className="max-w-lg p-3 rounded-lg bg-gray-700 text-gray-200">
                        <div className="flex items-center space-x-2">
                           <div className="w-2 h-2 bg-indigo-300 rounded-full animate-pulse"></div>
                           <div className="w-2 h-2 bg-indigo-300 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                           <div className="w-2 h-2 bg-indigo-300 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                        </div>
                    </div>
                </div>
            )}
        </div>

        <div className="p-4 border-t border-gray-700">
          <div className="mb-2">
                <button
                    onClick={handleAudienceAnalysis}
                    disabled={isLoading || hasExistingAnalysis}
                    className="w-full flex items-center justify-center text-sm bg-sky-600 hover:bg-sky-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                    <UsersIcon className="h-5 w-5 mr-2" />
                    {isAnalyzing ? 'Đang phân tích...' : (hasExistingAnalysis ? 'Đã phân tích kênh' : 'Phân tích đối tượng khán giả')}
                </button>
          </div>
          <form onSubmit={handleSendMessage} className="flex items-center space-x-2">
            <input
              type="text"
              value={currentMessage}
              onChange={(e) => setCurrentMessage(e.target.value)}
              placeholder="Nhập câu hỏi hoặc ý tưởng của bạn..."
              className="w-full bg-[#1a1b26] border border-[#414868] rounded-lg px-4 py-2 text-sm text-white focus:ring-1 focus:ring-indigo-500 outline-none"
              disabled={isLoading}
            />
            <button type="submit" disabled={isLoading || !currentMessage.trim()} className="bg-indigo-600 hover:bg-indigo-700 text-white p-2.5 rounded-lg disabled:opacity-50 transition-colors">
              <PaperAirplaneIcon className="w-5 h-5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};