import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Alert,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context'; // 1. Safe Area Import
import { useFocusEffect } from '@react-navigation/native';
import Constants from 'expo-constants';
import { COLORS } from '../../utils/colors';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useSettings } from '../../context/SettingsContext';
import api from '../../services/api';
import Toast from 'react-native-toast-message';
import BackButton from '../../components/BackButton';

// 2. Local Asset Import
// Make sure FSSAI_logo.png is inside your assets folder
const FSSAI_LOGO = require('../../../assets/icons/FSSAI_logo.png');

const ProfileScreen = ({ navigation }) => {
  const { logout, isGuest } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const { isStoreOnline, isCodEnabled, updateSetting } = useSettings();
  const [loading, setLoading] = useState(true);
  const [orderCount, setOrderCount] = useState(0);
  const [userData, setUserData] = useState({
    name: '',
    email: '',
    phone: '',
    address: ''
  });

  useFocusEffect(
    useCallback(() => {
      getProfile();
    }, [])
  );

  const getProfile = async () => {
    if (isGuest) {
      setLoading(false);
      return;
    }
    try {
      const response = await api.get('/user');
      if (response.data.success) {
        setUserData(response.data.user);
      }

      const orderRes = await api.get('/orders');
      if (orderRes.data.success) {
        setOrderCount(orderRes.data.data.length);
      }
    } catch (error) {
      console.error("Profile Fetch Error:", error);
      if (error.response?.status === 401) {
        logout();
      } else {
        Toast.show({
          type: 'error',
          text1: 'Connection Error',
          text2: 'Could not sync with Amigos server.'
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to logout from Amigos Pizza?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Logout", onPress: () => logout(), style: 'destructive' }
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      "Delete Account",
      "Are you sure you want to completely delete your account and all associated data? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          onPress: async () => {
            try {
              setLoading(true);
              const response = await api.delete('/user/delete');
              if (response.data.success) {
                Toast.show({
                  type: 'success',
                  text1: 'Account Deleted',
                  text2: 'Your account has been deleted successfully.'
                });
                logout(); // Logout and clear tokens
              } else {
                Toast.show({
                  type: 'error',
                  text1: 'Deletion Failed',
                  text2: response.data.message || 'Could not delete account.'
                });
                setLoading(false);
              }
            } catch (error) {
              console.error("Account Deletion Error:", error);
              Toast.show({
                type: 'error',
                text1: 'Deletion Error',
                text2: 'An error occurred while deleting your account.'
              });
              setLoading(false);
            }
          },
          style: 'destructive'
        }
      ]
    );
  };

  const ProfileOption = ({ icon, title, subtitle, onPress, color = COLORS.dark }) => (
    <TouchableOpacity style={styles.optionRow} onPress={onPress}>
      <View style={styles.iconContainer}><Text style={{ fontSize: 18 }}>{icon}</Text></View>
      <View style={styles.textContainer}>
        <Text style={[styles.optionTitle, { color: color }]}>{title}</Text>
        {subtitle && <Text style={styles.optionSubtitle} numberOfLines={1}>{subtitle}</Text>}
      </View>
      <Text style={styles.arrow}>❯</Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={{ marginTop: 10, color: '#888' }}>Loading profile...</Text>
      </View>
    );
  }

  const appVersion = Constants.expoConfig?.version || Constants.manifest?.version || '1.0.0';

  return (
    // 3. Updated Safe Area Wrapper
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header - Padding removed, handled by SafeAreaView */}
        <View style={styles.header}>
          <BackButton />
          <Text style={styles.headerText}>My Account</Text>
        </View>

        {/* User Info Card */}
        {isGuest ? (
          <View style={[styles.userCard, { flexDirection: 'column', justifyContent: 'center', alignItems: 'center', paddingVertical: 40 }]}>
            <Text style={{ fontSize: 20, fontWeight: 'bold', color: COLORS.dark }}>Welcome to Amigos!</Text>
            <Text style={{ fontSize: 14, color: '#666', marginTop: 8, textAlign: 'center' }}>Login to view your full profile and track orders.</Text>
            <TouchableOpacity
              style={{ marginTop: 20, backgroundColor: COLORS.primary, paddingHorizontal: 30, paddingVertical: 12, borderRadius: 25 }}
              onPress={() => logout()}
            >
              <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: 16 }}>Log In / Register</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View style={styles.userCard}>
              <Image
                source={{ uri: `https://ui-avatars.com/api/?name=${userData.name}&background=c52e31&color=FFFFFF&bold=true` }}
                style={styles.avatar}
              />
              <View style={{ marginLeft: 15, flex: 1 }}>
                <Text style={styles.userName}>{userData.name || 'Amigo User'}</Text>
                <Text style={styles.userPhone}>{userData.email}</Text>
              </View>
              <TouchableOpacity
                onPress={() => navigation.navigate('EditProfile', { user: userData })}
                style={styles.editBadge}
              >
                <Text style={styles.editBadgeText}>Edit</Text>
              </TouchableOpacity>
            </View>

            {/* Statistics Row */}
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{orderCount}</Text>
                <Text style={styles.statLabel}>Orders</Text>
              </View>
              <View style={[styles.statItem, { borderLeftWidth: 1, borderRightWidth: 1, borderColor: '#EEE' }]}>
                <Text style={styles.statNumber}>₹0</Text>
                <Text style={styles.statLabel}>Saved</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>Basic</Text>
                <Text style={styles.statLabel}>Member</Text>
              </View>
            </View>
          </>
        )}

        {/* Options List */}
        <View style={styles.optionsContainer}>
          <Text style={styles.menuLabel}>PREFERENCES</Text>
          <ProfileOption
            icon="📦"
            title="Your Orders"
            subtitle="Check status of current and past orders"
            onPress={() => isGuest ? logout() : navigation.navigate('OrderHistory')}
          />
          <ProfileOption
            icon="📍"
            title="Address Book"
            subtitle={userData.address ? userData.address : "Add your delivery address"}
            onPress={() => isGuest ? logout() : navigation.navigate('EditProfile', { user: userData })}
          />

          <Text style={styles.menuLabel}>APP SETTINGS</Text>
          <ProfileOption
            icon={isDark ? "🌙" : "☀️"}
            title="Dark Mode"
            subtitle={isDark ? "On" : "Off"}
            onPress={toggleTheme}
          />

          {userData.role === 'admin' && (
            <>
              <Text style={styles.menuLabel}>STORE SETTINGS (ADMIN)</Text>
              <View style={styles.optionRow}>
                <View style={styles.iconContainer}><Text style={{ fontSize: 18 }}>🏪</Text></View>
                <View style={styles.textContainer}>
                  <Text style={styles.optionTitle}>Store Online Status</Text>
                  <Text style={styles.optionSubtitle}>{isStoreOnline ? "Customers can place orders" : "Store is closed"}</Text>
                </View>
                <TouchableOpacity
                  onPress={() => updateSetting('is_store_online', isStoreOnline ? '0' : '1')}
                  style={[styles.toggleBase, isStoreOnline ? styles.toggleOn : styles.toggleOff]}
                >
                  <View style={[styles.toggleHandle, isStoreOnline ? styles.handleOn : styles.handleOff]} />
                </TouchableOpacity>
              </View>

              <View style={styles.optionRow}>
                <View style={styles.iconContainer}><Text style={{ fontSize: 18 }}>💵</Text></View>
                <View style={styles.textContainer}>
                  <Text style={styles.optionTitle}>Cash on Delivery</Text>
                  <Text style={styles.optionSubtitle}>{isCodEnabled ? "Enabled" : "Disabled"}</Text>
                </View>
                <TouchableOpacity
                  onPress={() => updateSetting('cod_enabled', isCodEnabled ? '0' : '1')}
                  style={[styles.toggleBase, isCodEnabled ? styles.toggleOn : styles.toggleOff]}
                >
                  <View style={[styles.toggleHandle, isCodEnabled ? styles.handleOn : styles.handleOff]} />
                </TouchableOpacity>
              </View>
            </>
          )}

          <Text style={styles.menuLabel}>SUPPORT</Text>
          <ProfileOption
            icon="💬"
            title="Help & Support"
            subtitle="Contact us via WhatsApp or Email"
            onPress={() => navigation.navigate('HelpSupport')}
          />
          <ProfileOption
            icon="📄"
            title="Privacy Policy"
            subtitle="Data usage & terms"
            onPress={() => navigation.navigate('PrivacyPolicy')}
          />
        </View>

        {/* Logout / Delete Account Buttons */}
        {!isGuest && (
          <>
            <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
              <Text style={styles.logoutText}>Logout Account</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.logoutBtn, { marginTop: 0, borderColor: '#FFEEEE', backgroundColor: '#FFF0F0' }]} onPress={handleDeleteAccount}>
              <Text style={[styles.logoutText, { color: '#D32F2F' }]}>Delete Account</Text>
            </TouchableOpacity>
          </>
        )}

        {/* Footer with Local FSSAI Image */}
        <View style={styles.footerContainer}>
          <View style={styles.fssaiWrapper}>
            <Image
              source={FSSAI_LOGO}
              style={styles.fssaiIcon}
              resizeMode="contain"
            />
            <Text style={styles.fssaiText}>Lic. No. 11021430000139</Text>
          </View>

          <Text style={styles.version}>Amigos Pizza v{appVersion}</Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFF' }, // White background for safe area
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFF' },

  // Header Updated: Removed top padding as SafeArea handles it
  header: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0'
  },
  backBtn: { marginRight: 15 },
  headerText: { fontSize: 20, fontWeight: 'bold', color: COLORS.dark },

  userCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', padding: 20, marginTop: 10 },
  avatar: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#F0F0F0' },
  userName: { fontSize: 18, fontWeight: 'bold', color: COLORS.dark },
  userPhone: { fontSize: 13, color: '#666', marginTop: 2 },
  editBadge: { backgroundColor: '#F0F9FF', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20 },
  editBadgeText: { color: COLORS.primary, fontSize: 12, fontWeight: 'bold' },
  statsRow: { flexDirection: 'row', backgroundColor: '#FFF', paddingVertical: 15, borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#F0F0F0' },
  statItem: { flex: 1, alignItems: 'center' },
  statNumber: { fontSize: 16, fontWeight: 'bold', color: COLORS.dark },
  statLabel: { fontSize: 11, color: '#888', marginTop: 2 },
  optionsContainer: { marginTop: 10 },
  menuLabel: { marginLeft: 20, marginTop: 20, marginBottom: 10, fontSize: 12, fontWeight: 'bold', color: '#AAA', letterSpacing: 1 },
  optionRow: { flexDirection: 'row', alignItems: 'center', padding: 18, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#F8F8F8' },
  iconContainer: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#F5F5F5', justifyContent: 'center', alignItems: 'center' },
  textContainer: { flex: 1, marginLeft: 15 },
  optionTitle: { fontSize: 15, fontWeight: '600' },
  optionSubtitle: { fontSize: 12, color: '#888', marginTop: 2 },
  arrow: { color: '#DDD', fontSize: 14 },
  logoutBtn: { margin: 20, padding: 16, borderRadius: 12, backgroundColor: '#FFF', alignItems: 'center', borderWidth: 1, borderColor: '#FFEBEB' },
  logoutText: { color: '#FF4444', fontWeight: 'bold', fontSize: 15 },

  // Footer Styles
  footerContainer: { alignItems: 'center', paddingBottom: 40, paddingTop: 10 },
  fssaiWrapper: {
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
    width: '90%'
  },
  fssaiIcon: { width: 100, height: 50, marginBottom: 5 }, // Adjusted size for local asset
  fssaiText: { color: '#888', fontSize: 12, letterSpacing: 1 },
  version: { color: '#CCC', fontSize: 11 },

  // Toggle Styles
  toggleBase: {
    width: 44,
    height: 24,
    borderRadius: 12,
    padding: 2,
    justifyContent: 'center',
  },
  toggleOn: {
    backgroundColor: '#4CAF50',
  },
  toggleOff: {
    backgroundColor: '#E0E0E0',
  },
  toggleHandle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FFF',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  handleOn: {
    alignSelf: 'flex-end',
  },
  handleOff: {
    alignSelf: 'flex-start',
  },
});

export default ProfileScreen;