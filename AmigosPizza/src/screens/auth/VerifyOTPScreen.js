import React, { useState, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../../utils/colors';
import { verifyOtp } from '../../services/api';
import Toast from 'react-native-toast-message';
import { useAuth } from '../../context/AuthContext'; // Import the new Auth Hook
import BackButton from '../../components/BackButton';

const VerifyOTPScreen = ({ route, navigation }) => {
  const { phoneNumber } = route.params; // No more setIsLoggedIn here
  const { login } = useAuth(); // Access the global login function

  const [otp, setOtp] = useState(['', '', '', '']);
  const [loading, setLoading] = useState(false);
  const inputs = useRef([]);

  const handleChange = (text, index) => {
    // Handle Auto-Fill / Paste of 4 digits
    if (text.length === 4) {
      setOtp(text.split(''));
      inputs.current[3].focus();
      return;
    }

    let newOtp = [...otp];
    // If user types a single char, just take the last char typed in case they typed quickly over it
    newOtp[index] = text.slice(-1);
    setOtp(newOtp);

    if (text && index < 3) {
      inputs.current[index + 1].focus();
    }
  };

  const handleVerify = async () => {
    const finalOtp = otp.join('');

    if (finalOtp.length < 4) {
      Toast.show({
        type: 'error',
        text1: 'Incomplete OTP',
        text2: 'Please enter the 4-digit code sent to you.',
      });
      return;
    }

    setLoading(true);

    try {
      const response = await verifyOtp(phoneNumber, finalOtp);

      if (response.data.success) {
        // Toast.show({
        //     type: 'success',
        //     text1: 'Success! 🍕',
        //     text2: 'Welcome to Amigos Pizza!',
        // });

        // This replaces setIsLoggedIn(true) and saves the token to storage
        await login(response.data.token);
      }
    } catch (error) {
      if (error.response) {
        const message = error.response.data.message || 'Invalid OTP ❌';
        Toast.show({
          type: 'error',
          text1: 'Verification Failed',
          text2: message,
        });
      } else {
        Toast.show({
          type: 'error',
          text1: 'Connection Error 🔌',
          text2: 'Could not reach the Amigos server.',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.container}>
        <View style={{ position: 'absolute', top: 10, left: 10, zIndex: 10 }}>
          <BackButton />
        </View>
        <Text style={styles.title}>Verify Details</Text>
        <Text style={styles.subtitle}>Enter the code sent to +91 {phoneNumber}</Text>

        <View style={styles.otpContainer}>
          {otp.map((digit, index) => (
            <TextInput
              key={index}
              style={styles.otpBox}
              keyboardType="number-pad"
              maxLength={4} // Allow up to 4 to catch SMS autofill on the first input
              textContentType="oneTimeCode"
              autoComplete="sms-otp"
              onChangeText={(text) => handleChange(text, index)}
              onKeyPress={({ nativeEvent }) => {
                if (nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
                  inputs.current[index - 1].focus();
                }
              }}
              value={digit}
              ref={(ref) => (inputs.current[index] = ref)}
            />
          ))}
        </View>

        <TouchableOpacity
          style={[styles.button, { opacity: loading ? 0.7 : 1 }]}
          onPress={handleVerify}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.buttonText}>Verify & Proceed</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginTop: 20 }}>
          <Text style={{ color: COLORS.primary, textAlign: 'center' }}>Edit Phone Number</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

// ... (styles stay the same as your previous code)
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF', padding: 25, justifyContent: 'center' },
  title: { fontSize: 28, fontWeight: 'bold', color: COLORS.dark },
  subtitle: { color: '#666', marginTop: 10, marginBottom: 40, fontSize: 16 },
  otpContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 30 },
  otpBox: {
    width: 65,
    height: 65,
    borderRadius: 15,
    backgroundColor: '#F5F5F5',
    textAlign: 'center',
    fontSize: 24,
    fontWeight: 'bold',
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
    color: COLORS.primary
  },
  button: {
    backgroundColor: COLORS.primary,
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5
  },
  buttonText: { color: '#FFF', fontWeight: 'bold', fontSize: 18 }
});

export default VerifyOTPScreen;