import { GoogleGenAI } from "@google/genai";
import { ChatMessage } from '../types';

export const validateApiKey = async (apiKey: string): Promise<boolean> => {
  if (!apiKey) return false;
  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [{ parts: [{text: 'test'}]}],
    });
    // A successful response, even if empty, indicates a valid key.
    return !!response;
  } catch (error) {
    console.error("Gemini key validation failed:", error);
    return false;
  }
};


export const analyzeVideoContent = async (
  apiKey: string,
  videoTitle: string,
  videoDescription: string
): Promise<string> => {
  if (!apiKey) {
    throw new Error("Gemini API key is not provided.");
  }
  try {
    const ai = new GoogleGenAI({ apiKey });

    const prompt = `
      Please provide a concise summary in Vietnamese for the following YouTube video.
      The summary should be about 2-3 sentences long.
      
      Video Title: "${videoTitle}"
      
      Video Description:
      ---
      ${videoDescription || 'No description provided.'}
      ---
      
      Summary:
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{ parts: [{ text: prompt }] }],
    });

    return response.text;
  } catch (error) {
    console.error("Error analyzing video with Gemini:", error);
    if (error instanceof Error) {
        throw new Error(`Lỗi từ Gemini API: ${error.message}`);
    }
    throw new Error("Đã xảy ra lỗi không xác định khi phân tích video.");
  }
};

export const generateGeminiChatResponse = async (
  apiKey: string,
  model: string,
  history: ChatMessage[]
): Promise<string> => {
  if (!apiKey) throw new Error("Vui lòng cung cấp Gemini API key.");
  
  const ai = new GoogleGenAI({ apiKey });
  
  const contents = history.map(msg => ({
      role: msg.role,
      parts: [{ text: msg.content }]
  }));

  try {
    const response = await ai.models.generateContent({
      model,
      contents,
    });
    return response.text;
  } catch (error) {
    console.error("Error generating chat response with Gemini:", error);
    if (error instanceof Error) {
        throw new Error(`Lỗi từ Gemini API: ${error.message}`);
    }
    throw new Error("Đã xảy ra lỗi không xác định khi chat với Gemini.");
  }
};
