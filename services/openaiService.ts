import { ChatMessage } from '../types';
const OPENAI_API_URL = 'https://api.openai.com/v1';

async function executeWithKeyRotation<T>(
    keysString: string,
    apiRequest: (key: string) => Promise<T>
): Promise<T> {
    const keys = keysString.split(/[\n,]+/).map(k => k.trim()).filter(Boolean);
    if (keys.length === 0) {
        throw new Error("Không có OpenAI API key nào được cung cấp.");
    }
    let lastError: any = null;

    for (const key of keys) {
        try {
            const result = await apiRequest(key);
            return result;
        } catch (error: any) {
            lastError = error;
            console.warn(`OpenAI API key ...${key.slice(-4)} thất bại. Thử key tiếp theo. Lỗi: ${error.message}`);
            continue;
        }
    }
    throw new Error(`Tất cả API key của OpenAI đều không hợp lệ. Lỗi cuối cùng: ${lastError.message}`);
}

export const validateApiKey = async (apiKeys: string): Promise<boolean> => {
  const keys = apiKeys.split(/[\n,]+/).map(k => k.trim()).filter(Boolean);
  if (keys.length === 0) return false;

  for (const key of keys) {
      if (!key) continue;
      try {
        const response = await fetch(`${OPENAI_API_URL}/models`, {
          headers: { 'Authorization': `Bearer ${key}` },
        });
        if (response.ok) return true;
      } catch (error) {
        console.error(`OpenAI key validation failed for ...${key.slice(-4)}:`, error);
      }
  }
  return false;
};

export const analyzeVideoContentWithOpenAI = async (
  apiKeys: string,
  videoTitle: string,
  videoDescription: string
): Promise<string> => {
  return executeWithKeyRotation(apiKeys, async (apiKey) => {
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
  });
};

export const generateOpenAIChatResponse = async (
  apiKeys: string,
  model: string,
  history: ChatMessage[]
): Promise<string> => {
  return executeWithKeyRotation(apiKeys, async (apiKey) => {
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
  });
};