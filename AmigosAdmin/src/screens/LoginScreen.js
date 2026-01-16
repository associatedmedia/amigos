import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  Image, 
  KeyboardAvoidingView, 
  Platform,
  Alert,
  ActivityIndicator
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';

// STATIC CONFIG
const ADMIN_PIN = "9866"; 

const LoginScreen = ({ navigation }) => {
  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  // 1. Check if already logged in
  useEffect(() => {
    checkLoginStatus();
  }, []);

  const checkLoginStatus = async () => {
    const isLoggedIn = await AsyncStorage.getItem('admin_session');
    if (isLoggedIn === 'true') {
      navigation.replace('AdminDashboard');
    }
    setCheckingSession(false);
  };

  // 2. Handle Login Logic
  const handleLogin = async () => {
    if (phone.length < 10) {
      Alert.alert("Invalid Phone", "Please enter a valid mobile number.");
      return;
    }

    setLoading(true);

    // Simulate API delay
    setTimeout(async () => {
      if (pin === ADMIN_PIN) {
        // SUCCESS
        await AsyncStorage.setItem('admin_session', 'true'); // Save session
        navigation.replace('AdminDashboard');
      } else {
        // FAIL
        Alert.alert("Access Denied", "Incorrect PIN. Please try again.");
      }
      setLoading(false);
    }, 1000);
  };

  if (checkingSession) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#005b96" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        
        {/* LOGO & TITLE */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Text style={{fontSize: 40}}>👨‍🍳</Text>
          </View>
          <Text style={styles.title}>Amigos Kitchen Admin</Text>
          <Text style={styles.subtitle}>Manager Access Portal</Text>
        </View>

        {/* LOGIN FORM */}
        <View style={styles.form}>
          
          <Text style={styles.label}>Mobile Number</Text>
          <View style={styles.inputContainer}>
            <Text style={styles.prefix}>+91</Text>
            <View style={styles.divider} />
            <TextInput 
              style={styles.input}
              placeholder="Enter mobile number"
              keyboardType="phone-pad"
              maxLength={10}
              value={phone}
              onChangeText={setPhone}
            />
          </View>

          <Text style={styles.label}>Security PIN</Text>
          <View style={styles.inputContainer}>
            <TextInput 
              style={[styles.input, { letterSpacing: 5, fontWeight: 'bold' }]}
              placeholder="••••"
              keyboardType="number-pad"
              secureTextEntry
              maxLength={4}
              value={pin}
              onChangeText={setPin}
            />
          </View>

          <TouchableOpacity style={styles.loginBtn} onPress={handleLogin} disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.loginBtnText}>ACCESS DASHBOARD</Text>
            )}
          </TouchableOpacity>

          <Text style={styles.footerText}>
            Authorized personnel only. {'\n'}IP address logged for security.
          </Text>

        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' }, // Dark slate background for professional look
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f172a' },
  keyboardView: { flex: 1, justifyContent: 'center' },
  
  header: { alignItems: 'center', marginBottom: 40 },
  logoContainer: { 
    width: 80, height: 80, backgroundColor: '#1e293b', 
    borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginBottom: 15,
    borderWidth: 1, borderColor: '#334155'
  },
  title: { fontSize: 28, fontWeight: 'bold', color: '#fff', letterSpacing: 1 },
  subtitle: { fontSize: 14, color: '#94a3b8', marginTop: 5 },

  form: { paddingHorizontal: 30 },
  
  label: { color: '#cbd5e1', fontSize: 14, marginBottom: 8, fontWeight: '600' },
  
  inputContainer: { 
    flexDirection: 'row', alignItems: 'center', 
    backgroundColor: '#1e293b', borderRadius: 10, 
    borderWidth: 1, borderColor: '#334155', 
    height: 55, paddingHorizontal: 15, marginBottom: 20 
  },
  prefix: { color: '#64748b', fontSize: 16, fontWeight: 'bold' },
  divider: { width: 1, height: 20, backgroundColor: '#334155', marginHorizontal: 10 },
  input: { flex: 1, color: '#fff', fontSize: 16 },

  loginBtn: { 
    backgroundColor: '#3b82f6', height: 55, borderRadius: 10, 
    justifyContent: 'center', alignItems: 'center', marginTop: 10,
    shadowColor: '#3b82f6', shadowOpacity: 0.3, shadowRadius: 10, elevation: 5
  },
  loginBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16, letterSpacing: 1 },

  footerText: { textAlign: 'center', color: '#475569', fontSize: 12, marginTop: 30, lineHeight: 18 }
});

export default LoginScreen;