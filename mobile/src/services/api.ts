// src/services/api.ts
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:5000/api';

const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(async (config) => {
  try {
    const stored = await AsyncStorage.getItem('lifelink-auth');
    if (stored) {
      const { state } = JSON.parse(stored);
      if (state?.token) config.headers.Authorization = `Bearer ${state.token}`;
    }
  } catch {}
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    if (error.response?.status === 401 && !error.config._retry) {
      error.config._retry = true;
      try {
        const stored = await AsyncStorage.getItem('lifelink-auth');
        if (stored) {
          const { state } = JSON.parse(stored);
          if (state?.refreshToken) {
            const { data } = await axios.post(`${API_URL}/auth/refresh`, { refreshToken: state.refreshToken });
            const updated = JSON.parse(await AsyncStorage.getItem('lifelink-auth') || '{}');
            updated.state.token = data.accessToken;
            updated.state.refreshToken = data.refreshToken;
            await AsyncStorage.setItem('lifelink-auth', JSON.stringify(updated));
            error.config.headers.Authorization = `Bearer ${data.accessToken}`;
            return api(error.config);
          }
        }
      } catch {
        await AsyncStorage.removeItem('lifelink-auth');
      }
    }
    return Promise.reject(error);
  }
);

export default api;
