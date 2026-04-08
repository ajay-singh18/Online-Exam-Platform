import { create } from 'zustand';
import { io } from 'socket.io-client';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5001';

interface Notification {
  _id: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  examId?: string;
  studentName?: string;
}

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  socket: any;

  initSocket: (instituteId: string) => void;
  fetchNotifications: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  loading: false,
  socket: null,

  initSocket: (instituteId: string) => {
    if (get().socket) return;

    const socket = io(SOCKET_URL);
    
    socket.on('connect', () => {
      console.log('Socket connected');
      socket.emit('join_institute', instituteId);
    });

    socket.on('new_notification', (data) => {
      set((state) => {
        const newNotif = {
           _id: Math.random().toString(), // Temp ID if server data isn't full notif
           message: data.message,
           isRead: false,
           createdAt: new Date().toISOString(),
           studentName: data.studentName
        } as Notification;
        
        return {
          notifications: [newNotif, ...state.notifications],
          unreadCount: state.unreadCount + 1
        };
      });
      
      // We could also trigger a Toast here if we want global access
      // But we'll handle UI specifically in the bell
    });

    set({ socket });
  },

  fetchNotifications: async () => {
    set({ loading: true });
    try {
      const { data } = await axios.get(`${API_URL}/notifications`, { withCredentials: true });
      if (data.success) {
        set({ 
          notifications: data.notifications,
          unreadCount: data.notifications.filter((n: any) => !n.isRead).length
        });
      }
    } catch (err) {
      console.error('Failed to fetch notifications', err);
    } finally {
      set({ loading: false });
    }
  },

  markAsRead: async (id: string) => {
    try {
      await axios.patch(`${API_URL}/notifications/${id}/read`, {}, { withCredentials: true });
      set((state) => ({
        notifications: state.notifications.map((n) => 
          n._id === id ? { ...n, isRead: true } : n
        ),
        unreadCount: Math.max(0, state.unreadCount - 1)
      }));
    } catch (err) {
      console.error('Failed to mark as read', err);
    }
  },

  markAllAsRead: async () => {
    try {
      await axios.patch(`${API_URL}/notifications/read-all`, {}, { withCredentials: true });
      set((state) => ({
        notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
        unreadCount: 0
      }));
    } catch (err) {
      console.error('Failed to mark all as read', err);
    }
  }
}));
