'use client';

import { useAuth, useUser } from '@clerk/nextjs';
import axios from 'axios';
import { createContext, useContext, useEffect, useState } from 'react';
import toast from 'react-hot-toast';

export const AppContext = createContext();
export const useAppContext = () => useContext(AppContext);

export const AppContextProvider = ({ children }) => {
  const { user } = useUser();
  const { getToken } = useAuth();

  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [loaded, setLoaded] = useState(false);

  // CREATE CHAT
  const createNewChat = async () => {
    try {
      const token = await getToken({ template: 'backend' }); //  FIXED
      if (!token) return;

      const res = await axios.post(
        '/api/chat/create',
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data.success) {
        await fetchUsersChats(false);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  // FETCH CHATS
  const fetchUsersChats = async (createIfEmpty = true) => {
    try {
      const token = await getToken({ template: 'backend' }); //  FIXED
      if (!token) return;

      const { data } = await axios.get('/api/chat/get', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!data.success) {
        toast.error(data.message);
        return;
      }

      const allChats = data.chats || [];

      // Auto-create if none exist
      if (createIfEmpty && allChats.length === 0) {
        await createNewChat();
        return;
      }

      setChats(allChats);

      // Selected chat logic
      if (!selectedChat) {
        setSelectedChat(allChats[0] || null);
      } else {
        const exists = allChats.some((c) => c.id === selectedChat.id);
        if (!exists) {
          setSelectedChat(allChats[0] || null);
        }
      }

      setLoaded(true);
    } catch (error) {
      toast.error(error.message);
    }
  };

  // Load on login
  useEffect(() => {
    if (user && !loaded) fetchUsersChats();
  }, [user, loaded]);

  const value = {
    user,
    chats,
    selectedChat,
    setSelectedChat,
    fetchUsersChats,
    createNewChat,
    setChats,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
