import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';

const ProfileScreen = ({ navigation }) => {

  const handleLogout = async () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to exit?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Logout", 
          style: 'destructive',
          onPress: async () => {
            // 1. Clear Session
            await AsyncStorage.removeItem('admin_session');
            // 2. Reset Navigation to Login
            navigation.reset({
              index: 0,
              routes: [{ name: 'Login' }],
            });
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Image 
          source={{ uri: 'https://cdn-icons-png.flaticon.com/512/2922/2922510.png' }} 
          style={styles.avatar} 
        />
        <Text style={styles.name}>Manager Chef</Text>
        <Text style={styles.role}>Kitchen Administrator</Text>
      </View>

      <View style={styles.menu}>
        <View style={styles.menuItem}>
          <Text style={styles.menuText}>📍 Branch: Jaipur HQ</Text>
        </View>
        <View style={styles.menuItem}>
          <Text style={styles.menuText}>📞 Support: +91-9999999999</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Text style={styles.logoutText}>LOGOUT</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f4f4', padding: 20 },
  header: { alignItems: 'center', marginBottom: 40, marginTop: 20 },
  avatar: { width: 100, height: 100, borderRadius: 50, marginBottom: 15 },
  name: { fontSize: 22, fontWeight: 'bold', color: '#333' },
  role: { fontSize: 16, color: '#666' },
  
  menu: { backgroundColor: '#fff', borderRadius: 10, padding: 10, marginBottom: 30 },
  menuItem: { padding: 15, borderBottomWidth: 1, borderBottomColor: '#eee' },
  menuText: { fontSize: 16, color: '#333' },

  logoutBtn: { backgroundColor: '#ff4444', padding: 15, borderRadius: 10, alignItems: 'center' },
  logoutText: { color: '#fff', fontWeight: 'bold', fontSize: 16 }
});

export default ProfileScreen;