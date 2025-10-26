import { ChatMessage } from '../types';
const OPENAI_API_URL = 'https://api.openai.com/v1';

export const validateApiKey = async (apiKey: string): Promise<boolean> => {
  if (!apiKey) return false;
  try {
    const response = await fetch(`${OPENAI_API_URL}/models`, {
      headers: { 'Authorization': `Bearer ${apiKey}` },
    });
    return response.ok;
  } catch (error) {
    console.error("OpenAI key validation failed:", error);
    return false;
  }
};

export const analyzeVideoContentWithOpenAI = async (
  apiKey: string,
  videoTitle: string,
  videoDescription: string
): Promise<string> => {
  if (!apiKey) {
    throw new Error("OpenAI API key is not provided.");
  }

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

  try {
    const response = await fetch(`${OPENAI_API_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.5,
        max_tokens: 150,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      const errorMessage = data.error?.message || 'Unknown OpenAI API error';
      throw new Error(`Lỗi từ OpenAI API: ${errorMessage}`);
    }

    return data.choices[0]?.message?.content?.trim() || 'Không thể tạo tóm tắt.';
  } catch (error) {
    console.error("Error analyzing video with OpenAI:", error);
    if (error instanceof Error) {
        throw new Error(error.message);
    }
    throw new Error("Đã xảy ra lỗi không xác định khi phân tích video với OpenAI.");
  }
};

export const generateOpenAIChatResponse = async (
  apiKey: string,
  model: string,
  history: ChatMessage[]
): Promise<string> => {
  if (!apiKey) throw new Error("Vui lòng cung cấp OpenAI API key.");

  const messages = history.map(msg => ({
      role: msg.role === 'model' ? 'assistant' : 'user',
      content: msg.content
  }));

  try {
    const response = await fetch(`${OPENAI_API_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.7,
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      const errorMessage = data.error?.message || 'Unknown OpenAI API error';
      throw new Error(`Lỗi từ OpenAI API: ${errorMessage}`);
    }

    return data.choices[0]?.message?.content?.trim() || 'Không thể nhận phản hồi.';
  } catch (error) {
    console.error("Error generating chat response with OpenAI:", error);
    if (error instanceof Error) {
        throw new Error(error.message);
    }
    throw new Error("Đã xảy ra lỗi không xác định khi chat với OpenAI.");
  }
};
