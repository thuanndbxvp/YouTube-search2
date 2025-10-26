import React, { useState } from 'react';
import { ChannelInfo, StoredConfig, ChatMessage, AiProvider, Video } from '../types';
import { BrainstormModal } from './BrainstormModal';
import { SparklesIcon, UsersIcon } from './Icons';
import { generateGeminiChatResponse } from '../services/geminiService';
import { generateOpenAIChatResponse } from '../services/openaiService';
import { formatDate, formatNumber, parseISO8601Duration } from '../utils/formatters';


interface AnalysisToolsProps {
    videos: Video[];
    channelInfo: ChannelInfo;
    appConfig: StoredConfig;
    brainstormMessages: ChatMessage[];
    setBrainstormMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
}

const ANALYSIS_PROMPT_IDENTIFIER = "Với tư cách là một chuyên gia phân tích kênh YouTube";

export const AnalysisTools: React.FC<AnalysisToolsProps> = ({ videos, channelInfo, appConfig, brainstormMessages, setBrainstormMessages }) => {
    const [isBrainstormModalOpen, setIsBrainstormModalOpen] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    const isBrainstormDisabled = (!appConfig.gemini.key || appConfig.gemini.key.trim() === '') && 
                                 (!appConfig.openai.key || appConfig.openai.key.trim() === '');

    const handleAudienceAnalysis = async () => {
        const hasExistingAnalysis = brainstormMessages.some(
            msg => msg.role === 'user' && msg.content.startsWith(ANALYSIS_PROMPT_IDENTIFIER)
        );

        if (hasExistingAnalysis) {
            setIsBrainstormModalOpen(true);
            return;
        }

        setIsAnalyzing(true);
        setIsBrainstormModalOpen(true);

        const provider: AiProvider = appConfig.gemini.key && appConfig.gemini.key.trim() !== '' ? 'gemini' : 'openai';
        
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
        
        const initialMessages = brainstormMessages.length > 1 ? brainstormMessages : [];
        const newMessagesWithUserPrompt: ChatMessage[] = [...initialMessages, userMessage];

        setBrainstormMessages(newMessagesWithUserPrompt);

        try {
            let response: string;
            if (provider === 'gemini') {
                response = await generateGeminiChatResponse(appConfig.gemini.key, appConfig.gemini.model, newMessagesWithUserPrompt);
            } else {
                response = await generateOpenAIChatResponse(appConfig.openai.key, appConfig.openai.model, newMessagesWithUserPrompt);
            }
            const finalAiMessage: ChatMessage = { role: 'model', content: response };
            setBrainstormMessages([...newMessagesWithUserPrompt, finalAiMessage]);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Đã có lỗi xảy ra.";
            const errorAiMessage: ChatMessage = { role: 'model', content: `Lỗi: ${errorMessage}` };
            setBrainstormMessages([...newMessagesWithUserPrompt, errorAiMessage]);
        } finally {
            setIsAnalyzing(false);
        }
    };

    return (
        <>
            <BrainstormModal
                isOpen={isBrainstormModalOpen}
                onClose={() => setIsBrainstormModalOpen(false)}
                channelInfo={channelInfo}
                appConfig={appConfig}
                messages={brainstormMessages}
                setMessages={setBrainstormMessages}
            />
            <div>
                <h2 className="text-xl font-bold text-indigo-300 mb-2">
                    Công cụ Phân tích & Sáng tạo
                </h2>
                <p className="text-gray-400 mb-4 text-sm">
                    Sử dụng các công cụ để hiểu sâu hơn về kênh và tìm kiếm ý tưởng mới.
                </p>
                <div className="flex flex-col space-y-3">
                    <button 
                        onClick={() => setIsBrainstormModalOpen(true)}
                        disabled={isBrainstormDisabled}
                        title={isBrainstormDisabled ? "Vui lòng thêm API key của Gemini hoặc OpenAI để sử dụng tính năng này" : "Bắt đầu phiên brainstorm ý tưởng với AI"}
                        className="w-full flex items-center justify-center bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2.5 px-4 rounded-lg transition-colors duration-200 disabled:opacity-60 disabled:cursor-not-allowed">
                        <SparklesIcon className="h-5 w-5 mr-2" />
                        Brainstorm Ý tưởng
                    </button>
                     <button 
                        onClick={handleAudienceAnalysis}
                        disabled={isBrainstormDisabled || isAnalyzing}
                        title={isBrainstormDisabled ? "Vui lòng thêm API key để sử dụng" : "Phân tích kênh"}
                        className="w-full flex items-center justify-center bg-sky-600 hover:bg-sky-700 text-white font-semibold py-2.5 px-4 rounded-lg transition-colors duration-200 disabled:opacity-60 disabled:cursor-not-allowed">
                        <UsersIcon className="h-5 w-5 mr-2" />
                        {isAnalyzing ? 'Đang phân tích...' : 'Phân tích kênh'}
                    </button>
                </div>
            </div>
        </>
    );
};