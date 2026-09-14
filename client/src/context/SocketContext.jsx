import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { api } from '../services/api';

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const { user, token } = useAuth();
  const [socket, setSocket] = useState(null);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);

  // Load initial notification count
  const loadNotificationCount = async () => {
    if (!token) return;
    try {
      const data = await api.getNotifications();
      setUnreadNotifications(data.unreadCount || 0);
    } catch {
      // ignore
    }
  };

  // Load initial message count
  const loadMessageCount = async () => {
    if (!token) return;
    try {
      const data = await api.getConversations();
      const totalUnread = (data.conversations || []).reduce(
        (sum, c) => sum + parseInt(c.unread_count || 0, 10),
        0
      );
      setUnreadMessages(totalUnread);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    if (!token || !user) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      setUnreadNotifications(0);
      setUnreadMessages(0);
      return;
    }

    loadNotificationCount();
    loadMessageCount();

    // Connect socket
    const socketInstance = io('/', {
      auth: { token },
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });

    socketInstance.on('connect', () => {
      // console.log('Socket connected:', socketInstance.id);
    });

    socketInstance.on('new_notification', () => {
      setUnreadNotifications((prev) => prev + 1);
    });

    socketInstance.on('message_notification', () => {
      setUnreadMessages((prev) => prev + 1);
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [token, user?.id]);

  return (
    <SocketContext.Provider
      value={{
        socket,
        unreadNotifications,
        unreadMessages,
        decrementNotifications: () => setUnreadNotifications((p) => Math.max(0, p - 1)),
        resetNotifications: () => setUnreadNotifications(0),
        decrementMessages: (count = 1) => setUnreadMessages((p) => Math.max(0, p - count)),
        refreshCounters: () => {
          loadNotificationCount();
          loadMessageCount();
        }
      }}
    >
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  return useContext(SocketContext) || {};
}
