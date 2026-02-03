import React, { useState, useContext } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  Image, 
  KeyboardAvoidingView, 
  Platform,
  ActivityIndicator,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Constants from 'expo-constants'; 
import { AuthContext } from '../context/AuthContext'; 

// 1. GET VERSION DYNAMICALLY
const APP_VERSION = Constants.expoConfig?.version || "1.0.0";

// --- AMIGOS BRAND COLORS ---
const COLORS = {
  primary: '#D23F45',    // Red
  secondary: '#FEC94A',  // Gold
  background: '#F9FAFB', 
  card: '#FFFFFF',       
  text: '#1F2937',       
  placeholder: '#9CA3AF',
  border: '#E5E7EB'
};

const LoginScreen = ({ navigation }) => {
  // Use the new functions from AuthContext
  const { sendOtp, verifyOtp, isLoading } = useContext(AuthContext);

  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState(1); // 1 = Phone Input, 2 = OTP Input

  // --- STEP 1: REQUEST OTP ---
  const handleSendOtp = async () => {
    if (phone.length < 10) {
      Alert.alert("Invalid Phone", "Please enter a valid 10-digit mobile number.");
      return;
    }

    // Call Context Function
    const success = await sendOtp(phone);
    
    if (success) {
      setStep(2); // Move to next screen
    }
  };

  // --- STEP 2: VERIFY OTP & REDIRECT ---
  const handleVerify = async () => {
    if (otp.length < 4) {
      Alert.alert("Invalid OTP", "Please enter the 4-digit code.");
      return;
    }

    // ✅ 1. Wait for verification result
    const success = await verifyOtp(phone, otp);

    // ✅ 2. If successful, REDIRECT to Dashboard
    // if (success) {
    //     navigation.replace('AdminDashboard');
    // }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        
        {/* HEADER & LOGO */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Image 
                source={{ uri: 'https://amigospizza.co/wp-content/uploads/2024/08/amigoslogo.png' }} 
                style={styles.logoImage}
                resizeMode="contain"
            />
          </View>
          <Text style={styles.subtitle}>Manager Access Only</Text>
        </View>

        {/* LOGIN FORM */}
        <View style={styles.form}>
          
          {step === 1 ? (
            // --- VIEW 1: PHONE NUMBER ---
            <>
              <Text style={styles.label}>Mobile Number</Text>
              <View style={styles.inputContainer}>
                <Text style={styles.prefix}>+91</Text>
                <View style={styles.divider} />
                <TextInput 
                  style={styles.input}
                  placeholder="Enter mobile number"
                  placeholderTextColor={COLORS.placeholder}
                  keyboardType="phone-pad"
                  maxLength={10}
                  value={phone}
                  onChangeText={setPhone}
                  autoFocus={true}
                />
              </View>

              <TouchableOpacity style={styles.loginBtn} onPress={handleSendOtp} disabled={isLoading}>
                {isLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.loginBtnText}>GET OTP</Text>
                )}
              </TouchableOpacity>
            </>
          ) : (
            // --- VIEW 2: OTP INPUT ---
            <>
              <Text style={styles.label}>Enter Verification Code</Text>
              <View style={styles.inputContainer}>
                <TextInput 
                  style={[styles.input, { letterSpacing: 10, fontWeight: 'bold', textAlign: 'center' }]}
                  placeholder="••••"
                  placeholderTextColor={COLORS.placeholder}
                  keyboardType="number-pad"
                  maxLength={4}
                  value={otp}
                  onChangeText={setOtp}
                  autoFocus={true}
                />
              </View>

              <TouchableOpacity style={styles.loginBtn} onPress={handleVerify} disabled={isLoading}>
                {isLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.loginBtnText}>VERIFY & LOGIN</Text>
                )}
              </TouchableOpacity>

              {/* Back Button */}
              <TouchableOpacity onPress={() => setStep(1)} style={{marginTop: 20}}>
                <Text style={{textAlign: 'center', color: COLORS.primary, fontWeight: 'bold'}}>
                  Change Number
                </Text>
              </TouchableOpacity>
            </>
          )}

          <Text style={styles.footerText}>
            Protected System. v{APP_VERSION} {'\n'}Amigos Multi Cuisine Fiesta.
          </Text>

        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  keyboardView: { flex: 1, justifyContent: 'center' },
  
  header: { alignItems: 'center', marginBottom: 30 },
  logoContainer: { 
    height: 120, 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginBottom: 5,
  },
  logoImage: { width: 280, height: 100 }, 
  
  subtitle: { fontSize: 14, color: '#6B7280', marginTop: 5 },

  form: { paddingHorizontal: 30 },
  
  label: { color: '#374151', fontSize: 14, marginBottom: 8, fontWeight: '600' },
  
  inputContainer: { 
    flexDirection: 'row', alignItems: 'center', 
    backgroundColor: COLORS.card, 
    borderRadius: 12, 
    borderWidth: 1.5, borderColor: COLORS.border, 
    height: 55, paddingHorizontal: 15, marginBottom: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2
  },
  prefix: { color: COLORS.text, fontSize: 16, fontWeight: 'bold' },
  divider: { width: 1, height: 20, backgroundColor: COLORS.border, marginHorizontal: 10 },
  input: { flex: 1, color: COLORS.text, fontSize: 16 },

  loginBtn: { 
    backgroundColor: COLORS.primary, 
    height: 55, 
    borderRadius: 12, 
    justifyContent: 'center', alignItems: 'center', marginTop: 10,
    shadowColor: COLORS.primary, shadowOpacity: 0.4, shadowRadius: 10, elevation: 5
  },
  loginBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16, letterSpacing: 1 },

  footerText: { textAlign: 'center', color: '#9CA3AF', fontSize: 12, marginTop: 30, lineHeight: 18 }
});

export default LoginScreen;