'use client';

import { assets } from '@/assets/assets';
import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import Sidebar from './components/sidebar';
import PromptBox from './components/prompt';
import Message from './components/Message';
import { useAppContext } from './context/AppContext';

export default function Home() {
  const [expand, setExpand] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { selectedChat } = useAppContext();
  const containerRef = useRef(null);

  // Scroll to bottom whenever messages change
  useEffect(() => {
    if (containerRef.current && selectedChat) {
      containerRef.current.scrollTo({
        top: containerRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [selectedChat?.messages]);

  return (
    <div className="flex h-screen">
      <Sidebar expand={expand} setExpand={setExpand} />
      <div className="flex-1 flex flex-col items-center justify-center px-4 pb-8 bg-[#292a2d] text-white relative">
        {/* Mobile Header */}
        <div className="md:hidden absolute px-4 top-6 flex items-center justify-between w-full">
          <Image
            onClick={() => setExpand(!expand)}
            className="rotate-180 cursor-pointer"
            src={assets.menu_icon}
            alt="Menu icon"
            width={32}
            height={32}
          />
          <Image
            className="opacity-70"
            src={assets.chat_icon}
            alt="Chat icon"
            width={32}
            height={32}
            loading="eager"
            priority
          />
        </div>

        {/* Initial screen when no chat is selected */}
        {!selectedChat || selectedChat.messages.length === 0 ? (
          <div className="flex flex-col items-center gap-3 mt-20">
            <Image src={assets.logo_icon} alt="" className="h-16 w-16" />
            <p className="text-2xl font-medium">Hi, I am BrainBop.</p>
            <p className="text-sm mt-2 text-gray-300">How can I help you?</p>
          </div>
        ) : (
          <div
            className="flex-1 w-full max-w-3xl mt-20 overflow-y-auto"
            ref={containerRef}
          >
            {/* Chat Header */}
            <p className="fixed top-8 left-1/2 -translate-x-1/2 border border-transparent hover:border-gray-500/50 py-1 px-2 rounded-lg font-semibold">
              {selectedChat.name}
            </p>

            {/* Messages */}
            <div className="flex flex-col gap-3 mt-12">
              {selectedChat.messages.map((msg, index) => (
                <Message key={index} role={msg.role} content={msg.content} />
              ))}

              {isLoading && (
                <div className="flex gap-4 py-3 items-center">
                  <Image
                    className="h-9 w-9 p-1 border border-white/15 rounded-full"
                    src={assets.logo_icon}
                    alt="Logo"
                  />
                  <div className="flex gap-1">
                    <div className="w-2 h-2 rounded-full bg-white animate-bounce"></div>
                    <div className="w-2 h-2 rounded-full bg-white animate-bounce delay-150"></div>
                    <div className="w-2 h-2 rounded-full bg-white animate-bounce delay-300"></div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Prompt input */}
        <PromptBox isLoading={isLoading} setIsLoading={setIsLoading} />

        {/* Footer */}
        <p className="text-xs absolute bottom-1 text-gray-500">
          AI-generated, for reference only
        </p>
      </div>
    </div>
  );
}
