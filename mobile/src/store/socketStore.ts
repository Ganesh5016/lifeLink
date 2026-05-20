// src/store/socketStore.ts
import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';
import { Alert } from 'react-native';
import * as Notifications from 'expo-notifications';

const SOCKET_URL = process.env.EXPO_PUBLIC_SOCKET_URL || 'http://localhost:5000';

interface SocketState {
  socket: Socket | null;
  isConnected: boolean;
  activeRequests: any[];
  donorLocations: Record<string, any>;
  connect: (token?: string) => void;
  disconnect: () => void;
  updateLocation: (lat: number, lng: number) => void;
}

export const useSocketStore = create<SocketState>((set, get) => ({
  socket: null,
  isConnected: false,
  activeRequests: [],
  donorLocations: {},

  connect: (token) => {
    if (get().socket?.connected) return;

    const socket = io(SOCKET_URL, {
      auth: { token },
      reconnection: true,
      reconnectionDelay: 2000,
    });

    socket.on('connect', () => set({ isConnected: true }));
    socket.on('disconnect', () => set({ isConnected: false }));

    socket.on('new_emergency_request', async (data) => {
      const { request } = data;
      set(state => ({ activeRequests: [request, ...state.activeRequests.slice(0, 49)] }));

      // Show local notification
      await Notifications.scheduleNotificationAsync({
        content: {
          title: `🚨 Emergency: ${request.bloodGroup} Blood Needed`,
          body: `${request.unitsRequired} units at ${request.hospitalName}`,
          data: { requestId: request._id, type: 'emergency' },
          sound: true,
          priority: Notifications.AndroidNotificationPriority.MAX,
        },
        trigger: null,
      });
    });

    socket.on('request_feed_update', (data) => {
      if (data.type === 'new') {
        set(state => ({ activeRequests: [data.request, ...state.activeRequests.slice(0, 49)] }));
      }
    });

    socket.on('donor_location_update', (data) => {
      set(state => ({
        donorLocations: { ...state.donorLocations, [data.donorId]: data },
      }));
    });

    socket.on('request_accepted', () => {
      Alert.alert('✅ Donor Found', 'A donor has accepted your blood request!');
    });

    set({ socket });
  },

  disconnect: () => {
    get().socket?.disconnect();
    set({ socket: null, isConnected: false });
  },

  updateLocation: (lat, lng) => {
    get().socket?.emit('update_location', { lat, lng });
  },
}));
