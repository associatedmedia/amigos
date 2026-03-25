import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'https://api.amigospizza.co/api';

export default function ProfileScreen() {
  const [driverName, setDriverName] = useState('Driver');
  const [analytics, setAnalytics] = useState({ total_deliveries: 0, cash_to_collect: 0 });

  useEffect(() => {
    const loadProfile = async () => {
      const name = await AsyncStorage.getItem('driverName');
      if (name) setDriverName(name);

      try {
        const token = await AsyncStorage.getItem('userToken');
        if (token) {
          const response = await axios.get(`${API_URL}/driver/analytics`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (response.data.success) {
            setAnalytics(response.data);
          }
        }
      } catch (e) {
        console.log("Failed to load analytics");
      }
    };
    loadProfile();
  }, []);

  const handleLogout = async () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: 'cancel' },
      { text: "Logout", style: 'destructive', onPress: async () => {
          await AsyncStorage.removeItem('userToken');
          router.replace('/');
      }}
    ]);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#111" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Profile</Text>
        <View style={{width: 24}} />
      </View>

      <View style={styles.avatarContainer}>
          <Ionicons name="person-circle-outline" size={100} color="#e63946" />
          <Text style={styles.driverName}>{driverName}</Text>
          <Text style={styles.roleText}>Delivery Partner</Text>
      </View>

      <View style={styles.statsCard}>
          <View style={styles.statBox}>
              <Text style={styles.statLabel}>Deliveries Today</Text>
              <Text style={styles.statValue}>{analytics.total_deliveries}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
              <Text style={styles.statLabel}>Cash to Remit</Text>
              <Text style={styles.statValue}>₹{analytics.cash_to_collect}</Text>
          </View>
      </View>

      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={24} color="#fff" />
          <Text style={styles.logoutBtnText}>Logout</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f5f7' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#111' },
  avatarContainer: { alignItems: 'center', marginVertical: 40 },
  driverName: { fontSize: 24, fontWeight: '900', color: '#111', marginTop: 10 },
  roleText: { fontSize: 16, color: '#666', marginTop: 4 },
  statsCard: { flexDirection: 'row', backgroundColor: '#fff', marginHorizontal: 20, padding: 20, borderRadius: 16, elevation: 2 },
  statBox: { flex: 1, alignItems: 'center' },
  statDivider: { width: 1, backgroundColor: '#ddd', marginHorizontal: 10 },
  statLabel: { fontSize: 13, color: '#888', fontWeight: 'bold', marginBottom: 8 },
  statValue: { fontSize: 24, fontWeight: '900', color: '#111' },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#e63946', marginHorizontal: 20, marginTop: 40, paddingVertical: 16, borderRadius: 12 },
  logoutBtnText: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginLeft: 8 }
});
