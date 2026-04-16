import React, { createContext, useState, useContext, useEffect } from 'react';


import * as SecureStore from 'expo-secure-store';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isGuest, setIsGuest] = useState(false);
  const [loading, setLoading] = useState(true);

  // Check if user is already logged in when app starts
  useEffect(() => {
    const checkLoginStatus = async () => {
      try {
        const token = await SecureStore.getItemAsync('userToken');
        if (token) {
          setIsLoggedIn(true);
        } else {
          const guestMode = await SecureStore.getItemAsync('guestMode');
          if (guestMode === 'true') {
            setIsGuest(true);
          }
        }
      } catch (error) {
        console.error('Error checking login status:', error);
      } finally {
        setLoading(false);
      }
    };
    checkLoginStatus();
  }, []);

  const login = async (token) => {
    try {
      await SecureStore.setItemAsync('userToken', token);
      await SecureStore.deleteItemAsync('guestMode');
      setIsLoggedIn(true);
      setIsGuest(false);
      
      // Attempt to register and upload push token
      try {
        const { registerForPushNotificationsAsync } = require('../services/notificationService');
        const { updateUserToken } = require('../services/api');
        const pushToken = await registerForPushNotificationsAsync();
        if (pushToken) {
          await updateUserToken(pushToken);
          console.log('Push token uploaded successfully');
        }
      } catch (pushErr) {
        console.log('Error registering push token on login:', pushErr);
      }
      
    } catch (error) {
      console.error('Error saving token:', error);
    }
  };

  const continueAsGuest = async () => {
    try {
      await SecureStore.setItemAsync('guestMode', 'true');
      setIsGuest(true);
    } catch (error) {
      console.error('Error setting guest mode:', error);
    }
  };

  const logout = async () => {
    try {
      await SecureStore.deleteItemAsync('userToken');
      await SecureStore.deleteItemAsync('guestMode');
      setIsLoggedIn(false);
      setIsGuest(false);
    } catch (error) {
      console.error('Error deleting token:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ isLoggedIn, isGuest, login, logout, continueAsGuest, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);