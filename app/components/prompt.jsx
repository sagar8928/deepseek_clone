'use client';

import { assets } from '@/assets/assets';
import Image from 'next/image';
import { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import toast from 'react-hot-toast';
import { useApi } from '@/app/lib/api'; //  import the hook

function PromptBox({ isLoading, setIsLoading }) {
  const [prompt, setPrompt] = useState('');
  const { user, chats, setChats, selectedChat, setSelectedChat } =
    useAppContext();

  const api = useApi(); //  token included automatically

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendPrompt(e);
    }
  };

  const sendPrompt = async (e) => {
    e.preventDefault();

    if (!user) return toast.error('Login to send message');
    if (isLoading) return toast.error('Wait for the previous prompt');

    setIsLoading(true);

    const promptCopy = prompt;
    setPrompt('');

    const userPrompt = {
      role: 'user',
      content: promptCopy,
      timestamp: Date.now(),
    };

    // Add to chats
    setChats((prevChats) =>
      prevChats.map((chat) =>
        chat.id === selectedChat.id
          ? { ...chat, messages: [...chat.messages, userPrompt] }
          : chat
      )
    );

    // Add to selected chat
    setSelectedChat((prev) => ({
      ...prev,
      messages: [...prev.messages, userPrompt],
    }));

    try {
      //  use api hook instead of raw axios
      const { data } = await api.post('/api/chat/ai', {
        chatId: selectedChat.id,
        prompt: promptCopy,
      });

      if (!data.success) throw new Error();

      const aiMessage = data.data;

      // Update chats
      setChats((prevChats) =>
        prevChats.map((chat) =>
          chat.id === selectedChat.id
            ? { ...chat, messages: [...chat.messages, aiMessage] }
            : chat
        )
      );

      // Typing animation
      const tokens = aiMessage.content.split(' ');

      let assistant = {
        role: 'assistant',
        content: '',
        timestamp: Date.now(),
      };

      setSelectedChat((prev) => ({
        ...prev,
        messages: [...prev.messages, assistant],
      }));

      tokens.forEach((_, i) => {
        setTimeout(() => {
          setSelectedChat((prev) => {
            const updated = [...prev.messages];
            updated[updated.length - 1].content = tokens
              .slice(0, i + 1)
              .join(' ');
            return { ...prev, messages: updated };
          });
        }, i * 70);
      });
    } catch (err) {
      toast.error('Something went wrong');
      console.error(err);
    }

    setIsLoading(false);
  };

  return (
    <form
      onSubmit={sendPrompt}
      className={`w-full ${
        selectedChat?.messages.length > 0 ? 'max-w-3xl' : 'max-w-2xl'
      } bg-[#404045] p-4 rounded-3xl mt-4 transition-all`}
    >
      <textarea
        onKeyDown={handleKeyDown}
        className="outline-none w-full resize-none bg-transparent"
        rows={2}
        placeholder="Message BrainBop"
        required
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
      />

      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          <p className="flex items-center gap-2 text-xs border px-2 py-1 rounded-full">
            <Image className="h-5" src={assets.deepthink_icon} alt="" />{' '}
            DeepThink
          </p>
          <p className="flex items-center gap-2 text-xs border px-2 py-1 rounded-full">
            <Image className="h-5" src={assets.search_icon} alt="" /> Search
          </p>
        </div>

        <button
          type="submit"
          className={`${
            prompt ? 'bg-primary' : 'bg-[#71717a]'
          } rounded-full p-2`}
        >
          <Image
            className="w-3.5"
            src={prompt ? assets.arrow_icon : assets.arrow_icon_dull}
            alt=""
          />
        </button>
      </div>
    </form>
  );
}

export default PromptBox;
