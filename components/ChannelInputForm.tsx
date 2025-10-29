import React, { useState } from 'react';
import { YouTubeIcon } from './Icons';
import { Theme } from '../types';

interface ChannelInputFormProps {
  onSubmit: (channelUrl: string) => void;
  isLoading: boolean;
  theme: Theme;
}

export const ChannelInputForm: React.FC<ChannelInputFormProps> = ({ onSubmit, isLoading, theme }) => {
  const [channelUrl, setChannelUrl] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (channelUrl.trim()) {
      onSubmit(channelUrl.trim());
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <form onSubmit={handleSubmit} className={`flex items-center bg-[#2d303e] border border-[#414868] rounded-lg p-2 shadow-lg focus-within:ring-2 focus-within:ring-${theme}-500`}>
        <YouTubeIcon className="w-6 h-6 mx-3 text-red-500" />
        <input
          type="text"
          value={channelUrl}
          onChange={(e) => setChannelUrl(e.target.value)}
          placeholder="Dán link kênh YouTube vào đây..."
          className="flex-grow bg-transparent text-white placeholder-gray-500 focus:outline-none"
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={isLoading || !channelUrl}
          className={`bg-${theme}-500 hover:bg-${theme}-600 text-white font-bold py-2 px-6 rounded-md transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {isLoading ? 'Đang tải...' : 'Phân tích'}
        </button>
      </form>
    </div>
  );
};