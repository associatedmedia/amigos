import React, { createContext, useState, useEffect } from "react";
import { Alert, View } from "react-native"; 
import AsyncStorage from "@react-native-async-storage/async-storage";
import api from "../services/api";
import NotificationToast from "../components/NotificationToast"; 

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [userToken, setUserToken] = useState(null);
  const [userInfo, setUserInfo] = useState(null);

  // Notification State
  const [notifVisible, setNotifVisible] = useState(false);
  const [notifData, setNotifData] = useState({ title: '', message: '' });

  // 1. Check Login Status on App Start
  const isLoggedIn = async () => {
    try {
      setIsLoading(true);
      let token = await AsyncStorage.getItem("userToken");
      let info = await AsyncStorage.getItem("userInfo");
      
      if (token) {
        setUserToken(token);
        setUserInfo(JSON.parse(info));
        // ✅ Set API Header so requests work immediately
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      }
      setIsLoading(false);
    } catch (e) {
      console.log("Login Check Error:", e);
      setIsLoading(false);
    }
  };

  useEffect(() => { isLoggedIn(); }, []);

  // --- 2. SEND OTP ---
  const sendOtp = async (phone) => {
    try {
      const response = await api.post('/send-otp', { phone });
      
      if (response.data.success) {
        const otpCode = response.data.message; 

        setNotifData({
            title: "🔐 Admin Login Code",
            message: `Your OTP is ${otpCode}. Use this to login.`
        });
        setNotifVisible(true); // Show the Toast
        return true; 
      } else {
        Alert.alert("Error", response.data.message || "Failed to send OTP");
        return false;
      }
    } catch (e) {
      console.log("Send OTP Error:", e);
      Alert.alert("Error", "Could not send OTP. Check connection.");
      return false;
    }
  };

  // --- 3. VERIFY OTP (LOGIN) ---
  const verifyOtp = async (phone, otp) => {
    setIsLoading(true);
    try {
      const response = await api.post('/verify-otp', { phone, otp });

      // 1. Check Role
      if (response.data.user.role !== "admin") {
        Alert.alert("⛔ ACCESS DENIED", "You are not an Admin.");
        setIsLoading(false);
        return false;
      }

      // 2. Save Session
      const token = response.data.token;
      const user = response.data.user;

      setUserInfo(user);
      setUserToken(token);

      // ✅ Set API Header for future requests
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      await AsyncStorage.setItem("userInfo", JSON.stringify(user));
      await AsyncStorage.setItem("userToken", token);
      
      setIsLoading(false);
      return true;

    } catch (e) {
      console.log("Verify Error:", e);
      Alert.alert("Login Failed", "Invalid OTP or Server Error");
      setIsLoading(false);
      return false;
    }
  };

  // --- 4. LOGOUT ---
  const logout = async () => {
    setIsLoading(true);
    
    // 1. Reset State
    setUserToken(null);
    setUserInfo(null);
    
    // 2. Clear API Header (Critical security step)
    delete api.defaults.headers.common['Authorization'];

    // 3. Clear Storage
    await AsyncStorage.removeItem("userInfo");
    await AsyncStorage.removeItem("userToken");
    
    setIsLoading(false);
  };

  return (
    <AuthContext.Provider
      value={{ sendOtp, verifyOtp, logout, isLoading, userToken, userInfo }}
    >
      {/* ✅ WRAPPER VIEW: Ensures Toast is strictly on top of Children */}
      <View style={{ flex: 1 }}>
          {children}
          
          <NotificationToast 
            visible={notifVisible}
            title={notifData.title}
            message={notifData.message}
            onHide={() => setNotifVisible(false)}
          />
      </View>
    </AuthContext.Provider>
  );
};