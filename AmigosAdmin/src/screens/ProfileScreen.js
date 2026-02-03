import React, { useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { AuthContext } from '../context/AuthContext';

const APP_VERSION = Constants.expoConfig?.version || "1.0.0";

const COLORS = {
  primary: '#D23F45',
  secondary: '#FEC94A',
  dark: '#1F2937',
  light: '#F9FAFB',
  white: '#FFFFFF',
  border: '#E5E7EB'
};

export default function ProfileScreen() {
  const { logout, userInfo } = useContext(AuthContext);

  const handleLogout = () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to exit?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Logout", style: 'destructive', onPress: logout }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      
      {/* 1. Header Section */}
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
            <Text style={styles.avatarText}>
                {userInfo?.name?.charAt(0).toUpperCase() || 'A'}
            </Text>
        </View>
        <Text style={styles.name}>{userInfo?.name || 'Admin User'}</Text>
        <Text style={styles.role}>Manager Access</Text>
      </View>

      {/* 2. Menu Options */}
      <View style={styles.menuContainer}>
        
        {/* Account Info */}
        <View style={styles.menuItem}>
            <View style={[styles.iconBox, { backgroundColor: '#EEF2FF' }]}>
                <Ionicons name="person" size={20} color="#4F46E5" />
            </View>
            <View style={styles.menuTextContainer}>
                <Text style={styles.menuTitle}>Mobile Number</Text>
                <Text style={styles.menuSub}>{userInfo?.mobile_no || userInfo?.phone || 'Not available'}</Text>
            </View>
        </View>
        
        <View style={styles.divider} />

        {/* Security */}
        <View style={styles.menuItem}>
            <View style={[styles.iconBox, { backgroundColor: '#ECFDF5' }]}>
                <Ionicons name="shield-checkmark" size={20} color="#10B981" />
            </View>
            <View style={styles.menuTextContainer}>
                <Text style={styles.menuTitle}>Security Status</Text>
                <Text style={styles.menuSub}>PIN Authentication Active</Text>
            </View>
        </View>

      </View>

  

      {/* 3. Logout Button */}
      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={20} color="#FFF" style={{ marginRight: 10 }} />
        <Text style={styles.logoutText}>Logout of System</Text>
      </TouchableOpacity>

      <Text style={styles.versionText}>Amigos Admin App v{APP_VERSION}</Text>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.light, alignItems: 'center' },
  
  header: { alignItems: 'center', marginTop: 30, marginBottom: 30 },
  avatarContainer: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: COLORS.secondary,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 15,
    borderWidth: 3, borderColor: '#FFF',
    shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 5, elevation: 5
  },
  avatarText: { fontSize: 32, fontWeight: 'bold', color: COLORS.dark },
  name: { fontSize: 22, fontWeight: 'bold', color: COLORS.dark },
  role: { fontSize: 14, color: '#6B7280', marginTop: 2 },

  menuContainer: { width: '90%', backgroundColor: '#FFF', borderRadius: 16, padding: 20, elevation: 2 },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
  iconBox: { width: 40, height: 40, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  menuTextContainer: { flex: 1 },
  menuTitle: { fontSize: 16, fontWeight: '600', color: COLORS.dark },
  menuSub: { fontSize: 13, color: '#9CA3AF' },
  divider: { height: 1, backgroundColor: COLORS.border, marginVertical: 10 },

  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: COLORS.primary, width: '90%', padding: 15, borderRadius: 12, marginTop: 40,
    shadowColor: COLORS.primary, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4
  },
  logoutText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },

  versionText: { color: '#D1D5DB', marginTop: 20, fontSize: 12 }
});