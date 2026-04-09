import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../../utils/colors';
import { loginUser } from '../../services/api';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
// import { sendLocalNotification, registerForPushNotificationsAsync } from '../../utils/notifications';


const LoginScreen = ({ navigation }) => {
  const { colors, isDark } = useTheme();
  const { continueAsGuest } = useAuth();
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);

  // Inside useEffect or on component mount
  // useEffect(() => {
  // registerForPushNotificationsAsync();
  // }, []);

  const handleSendOTP = async () => {
    if (phone.length !== 10) return alert("Enter a valid 10-digit number");

    setLoading(true);
    try {
      //console.log("Sending OTP to:", phone);
      // Connect to Laravel API: POST /api/send-otp
      const response = await loginUser(phone);
      // console.log("OTP Sent Response:", response.data);
      // alert(response.data.message);
      if (response.data.success) {
        navigation.navigate('VerifyOTP', { phoneNumber: phone });
      }
    } catch (error) {
      console.error("Login Failed:", error);
      alert("Unable to connect. Please check your network or try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.inner}>
          {/* LOGO AREA */}
          <Image
            source={require('../../../assets/logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />

          <Text style={[styles.tagline, { color: colors.gold }]}>A Multi Cuisine Fiesta</Text>

          <View style={styles.inputWrapper}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Enter Mobile Number</Text>
            <View style={[styles.inputContainer, { backgroundColor: colors.inputBackground, borderColor: colors.border }]}>
              <Text style={[styles.prefix, { color: colors.text, borderRightColor: colors.border }]}>+91</Text>
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="00000 00000"
                keyboardType="phone-pad"
                maxLength={10}
                value={phone}
                onChangeText={setPhone}
                placeholderTextColor={isDark ? "#666" : "#999"}
              />
            </View>
          </View>

          <TouchableOpacity
            style={[styles.button, { backgroundColor: phone.length === 10 ? COLORS.primary : '#CCC' }]}
            onPress={handleSendOTP}
            disabled={phone.length !== 10 || loading}
          >
            {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.buttonText}>Continue</Text>}
          </TouchableOpacity>

          <TouchableOpacity
            style={{ marginTop: 20 }}
            onPress={() => continueAsGuest()}
          >
            <Text style={{ color: colors.textSecondary || '#666', fontSize: 16, fontWeight: '600' }}>Skip / Continue as Guest</Text>
          </TouchableOpacity>



        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white },
  inner: { flex: 1, padding: 30, justifyContent: 'center', alignItems: 'center' },
  logo: { width: 220, height: 120, marginBottom: 10 },
  title: { fontSize: 26, fontWeight: 'bold', color: COLORS.primary },
  tagline: { fontSize: 14, color: COLORS.gold, marginBottom: 40, fontStyle: 'italic' },
  inputWrapper: { width: '100%', marginBottom: 25 },
  label: { fontSize: 14, color: '#666', marginBottom: 8, marginLeft: 4 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.lightGrey, borderRadius: 15, paddingHorizontal: 20, height: 60, borderWidth: 1, borderColor: COLORS.border },
  prefix: { fontSize: 18, fontWeight: 'bold', color: COLORS.dark, marginRight: 15, borderRightWidth: 1, borderRightColor: '#DDD', paddingRight: 15 },
  input: { flex: 1, fontSize: 18, color: COLORS.dark, fontWeight: '500' },
  button: { width: '100%', height: 60, borderRadius: 15, justifyContent: 'center', alignItems: 'center', elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
  buttonText: { color: COLORS.white, fontSize: 18, fontWeight: 'bold' },
  dividerContainer: { flexDirection: 'row', alignItems: 'center', marginVertical: 20, width: '100%' },
  line: { flex: 1, height: 1 },
  orText: { marginHorizontal: 10, fontSize: 14 },
  socialButton: { width: '100%', height: 50, borderRadius: 12, justifyContent: 'center', alignItems: 'center', borderWidth: 1, marginBottom: 12, flexDirection: 'row' },
  socialButtonText: { fontSize: 16, fontWeight: '600' }
});

export default LoginScreen;