import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Your live backend URL
const API_URL = 'https://api.amigospizza.co/api';

export default function LoginScreen() {
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false); // Tracks if we should show the OTP box
  const [timer, setTimer] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [isBlocked, setIsBlocked] = useState(false);
  const [isCheckingToken, setIsCheckingToken] = useState(true);

  // --- AUTO LOGIN ON APP START ---
  useEffect(() => {
    const checkExistingToken = async () => {
        try {
            const token = await AsyncStorage.getItem('userToken');
            if (token) {
                // Instantly redirect to dashboard securely
                router.replace('/dashboard');
            } else {
                setIsCheckingToken(false);
            }
        } catch (e) {
            setIsCheckingToken(false);
        }
    };
    checkExistingToken();
  }, []);

  // Handle the countdown timer for resending OTP
  useEffect(() => {
    let interval;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prevTimer) => prevTimer - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const handleGetOTP = async () => {
    if (isBlocked) {
        Alert.alert("Blocked", "You have exceeded the maximum number of attempts.");
        return;
    }

    if (phone.length !== 10 || isNaN(phone)) {
        Alert.alert("Invalid Number", "Please enter a valid 10-digit mobile number.");
        return;
    }

    const currentAttempt = attempts + 1;
    setAttempts(currentAttempt);

    if (currentAttempt >= 3) {
        setIsBlocked(true);
        Alert.alert("Blocked", "Too many attempts. You have been blocked for security reasons.");
        return;
    }

    try {
        // 1. Hit your Laravel Backend to send the SMS
        const response = await axios.post(`${API_URL}/send-otp`, {
            phone: phone
        });

        if (response.data.success) {
            setTimer(10);
            setOtpSent(true); 
            // Optional: log OTP to console for testing without checking SMS
        } else {
            Alert.alert("Error", response.data.message || "Failed to send OTP.");
        }
    } catch (error) {
        Alert.alert("Network Error", error.message || "Could not connect to the server.");
    }
  };

 const handleVerifyOTP = async () => {
      // Assuming a 4-digit OTP for this example
      if (otp.length !== 4 || isNaN(otp)) {
          Alert.alert("Invalid OTP", "Please enter the 4-digit code sent to your phone.");
          return;
      }

      try {
          // 1. Verify with Laravel
          const response = await axios.post(`${API_URL}/verify-otp`, {
              phone: phone,
              otp: otp,
              is_driver_app: true 
          });

          if (response.data.success) {
              
              // --- 🛑 NEW: STRICT ROLE CHECK ---
              // Check if the user object exists and if the role is NOT 'driver'
              if (response.data.user && response.data.user.role !== 'driver') {
                  Alert.alert(
                      "Access Denied", 
                      "This application is restricted to authorized Amigos delivery drivers only."
                  );
                  return; // Stop the login process immediately
              }
              // ---------------------------------

              // 2. Save the Sanctum Token to the device!
              await AsyncStorage.setItem('userToken', response.data.token);
              
              // 3. Save the driver's name and ID if your API returns it
              if (response.data.user) {
                  if (response.data.user.name) {
                      await AsyncStorage.setItem('driverName', response.data.user.name);
                  }
                  if (response.data.user.id) {
                      await AsyncStorage.setItem('driverId', response.data.user.id.toString());
                  }
              }

              // 4. Go to Dashboard
              router.replace('/dashboard');
              
          } else {
              Alert.alert("Verification Failed", response.data.message || "Invalid OTP.");
          }
      } catch (error) {
          Alert.alert("Error", "Failed to verify OTP. Please try again." || error.message);
      }
  };

  if (isCheckingToken) {
      return (
          <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
              <Text>Loading Amigos...</Text>
          </SafeAreaView>
      );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"} 
        style={styles.content}
      >
        
        {/* Logo Integration */}
        <Image 
            source={require('../assets/images/logo.png')} 
            style={styles.logo} 
            resizeMode="contain" 
        />
        
        <Text style={styles.title}>Driver Login</Text>
        <Text style={styles.subtitle}>
            {otpSent ? `Enter the 4-digit code sent to ${phone}` : 'Enter your 10-digit mobile number'}
        </Text>

        {/* PHONE INPUT */}
        <TextInput
          style={[styles.input, otpSent && styles.inputDisabled]}
          placeholder="Mobile Number"
          keyboardType="number-pad"
          maxLength={10}
          value={phone}
          onChangeText={setPhone}
          editable={!otpSent && !isBlocked} // Lock it once OTP is sent
        />

        {/* OTP INPUT (Only visible if otpSent is true) */}
        {otpSent && (
            <TextInput
                style={styles.inputOtp}
                placeholder="• • • •"
                keyboardType="number-pad"
                maxLength={4}
                value={otp}
                onChangeText={setOtp}
                autoFocus={true} // Automatically open keyboard for OTP
            />
        )}

        {/* DYNAMIC MAIN BUTTON */}
        <TouchableOpacity 
            style={[
                styles.button, 
                isBlocked && styles.buttonDisabled 
            ]} 
            onPress={otpSent ? handleVerifyOTP : handleGetOTP}
            disabled={isBlocked}
        >
          <Text style={styles.buttonText}>
            {isBlocked ? "BLOCKED" : (otpSent ? "Verify & Login" : "Get OTP")}
          </Text>
        </TouchableOpacity>

        {/* RESEND OTP / CHANGE NUMBER ACTIONS */}
        {otpSent && !isBlocked && (
            <View style={styles.actionRow}>
                <TouchableOpacity 
                    onPress={() => {
                        setOtpSent(false);
                        setOtp('');
                        setTimer(0);
                    }}
                >
                    <Text style={styles.linkText}>Change Number</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                    onPress={handleGetOTP} 
                    disabled={timer > 0}
                >
                    <Text style={[styles.linkText, timer > 0 && styles.linkTextDisabled]}>
                        {timer > 0 ? `Resend in ${timer}s` : 'Resend OTP'}
                    </Text>
                </TouchableOpacity>
            </View>
        )}

        {/* WARNINGS */}
        {!otpSent && !isBlocked && attempts > 0 && (
            <Text style={styles.warningText}>Attempt {attempts} of 3</Text>
        )}
        
        {isBlocked && (
            <Text style={styles.blockedText}>
                Please contact the Restaurant Manager to unblock your account.
            </Text>
        )}

      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { flex: 1, padding: 24, justifyContent: 'center' },
  logo: { width: 100, height: 100, alignSelf: 'center', marginBottom: 20, borderRadius: 20 },
  title: { fontSize: 28, fontWeight: '900', color: '#111', textAlign: 'center', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#666', marginBottom: 30, textAlign: 'center' },
  
  input: { 
    borderWidth: 1, borderColor: '#ddd', borderRadius: 12, padding: 18, 
    fontSize: 20, marginBottom: 16, backgroundColor: '#f9f9f9',
    textAlign: 'center', letterSpacing: 2, fontWeight: 'bold'
  },
  inputDisabled: {
      backgroundColor: '#eaeaea', color: '#888' // Gray out phone number when OTP is sent
  },
  inputOtp: {
    borderWidth: 2, borderColor: '#e63946', borderRadius: 12, padding: 18, 
    fontSize: 28, marginBottom: 24, backgroundColor: '#fff',
    textAlign: 'center', letterSpacing: 10, fontWeight: '900', color: '#e63946'
  },

  button: { backgroundColor: '#e63946', padding: 18, borderRadius: 12, alignItems: 'center' },
  buttonDisabled: { backgroundColor: '#cccccc' },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  
  actionRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 24, paddingHorizontal: 10 },
  linkText: { color: '#007bff', fontSize: 16, fontWeight: 'bold' },
  linkTextDisabled: { color: '#aaa' },

  warningText: { color: '#e67e22', textAlign: 'center', marginTop: 16, fontWeight: 'bold' },
  blockedText: { color: '#e74c3c', textAlign: 'center', marginTop: 16, fontSize: 14, fontWeight: 'bold' }
});