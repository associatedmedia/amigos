// src/services/api.js
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { API_BASE_URL } from '../config/env';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 8000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// This interceptor runs BEFORE every request
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await SecureStore.getItemAsync('userToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error fetching token for API request:', error);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Retry interceptor: auto-retry once on network/timeout errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config;

    // Only retry once, and only on network errors or timeouts (not 4xx/5xx)
    if (
      !config._retried &&
      (!error.response || error.code === 'ECONNABORTED' || error.message === 'Network Error')
    ) {
      config._retried = true;
      config.timeout = 12000; // Give retry a longer timeout
      return api(config);
    }

    return Promise.reject(error);
  }
);

// Common API Functions
export const loginUser = (phone) => api.post('/send-otp', { phone });
export const verifyOtp = (phone, otp) => api.post('/verify-otp', { phone, otp });
export const getMenu = () => api.get('/menu');
export const placeOrder = (orderData) => api.post('/orders', orderData);
export const updateUserProfile = (profileData) => api.post('/user/update', profileData);
export const getUserProfile = () => api.get('/user');
export const getOfferBanner = () => api.get('/offer-banner');

export default api;