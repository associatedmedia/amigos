import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Switch, FlatList, TouchableOpacity, RefreshControl, Modal, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context'; 
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location'; // 1. IMPORT LOCATION

const API_URL = 'https://api.amigospizza.co/api';

export default function DashboardScreen() {
  const [isOnline, setIsOnline] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [orders, setOrders] = useState([]);
  const [driverName, setDriverName] = useState('Driver');
  const [analytics, setAnalytics] = useState({ total_deliveries: 0, cash_to_collect: 0 });

  useEffect(() => {
    const loadProfile = async () => {
        const name = await AsyncStorage.getItem('driverName');
        if (name) setDriverName(name);
    };
    loadProfile();
    fetchOrders();
    fetchAnalytics();
    syncOfflineQueue();
  }, []);

  // Live Location Tracking Effect
  useEffect(() => {
    let locationSubscription;

    const startTracking = async () => {
      if (isOnline) {
         locationSubscription = await Location.watchPositionAsync(
           {
             accuracy: Location.Accuracy.Balanced,
             timeInterval: 10000,
             distanceInterval: 10,
           },
           async (loc) => {
              try {
                  const driverId = await AsyncStorage.getItem('driverId');
                  if (driverId) {
                      await axios.post(`${API_URL}/driver/location`, {
                          driver_id: driverId,
                          lat: loc.coords.latitude,
                          lng: loc.coords.longitude
                      });
                  }
              } catch (err) {
                  // handle silently
              }
           }
         );
      } else {
         if (locationSubscription) {
             locationSubscription.remove();
         }
      }
    };

    startTracking();

    return () => {
       if (locationSubscription) {
           locationSubscription.remove();
       }
    };
  }, [isOnline]);

  const fetchOrders = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) return;

      const response = await axios.get(`${API_URL}/driver/orders`, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 5000
      });

      if (response.data.success) {
        setOrders(response.data.orders);
        await AsyncStorage.setItem('offlineOrders', JSON.stringify(response.data.orders));
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
      const offlineOrders = await AsyncStorage.getItem('offlineOrders');
      if (offlineOrders) {
         setOrders(JSON.parse(offlineOrders));
      }
    }
  };

  const fetchAnalytics = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) return;

      const response = await axios.get(`${API_URL}/driver/analytics`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setAnalytics(response.data);
      }
    } catch (error) {
      console.log("Analytics failed", error);
    }
  };

  const syncOfflineQueue = async () => {
     try {
         const queueStr = await AsyncStorage.getItem('offlineStatusQueue');
         if (queueStr) {
             const queue = JSON.parse(queueStr);
             const token = await AsyncStorage.getItem('userToken');
             
             for (let item of queue) {
                 try {
                     await axios.post(`${API_URL}/driver/orders/${item.orderId}/status`, {
                         status: item.status
                     }, { headers: { Authorization: `Bearer ${token}` }});
                 } catch (err) {
                 }
             }
             await AsyncStorage.removeItem('offlineStatusQueue');
         }
     } catch (err) {
         console.log("Queue sync error", err);
     }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await syncOfflineQueue();
    await fetchOrders();
    await fetchAnalytics();
    setRefreshing(false);
  }, []);

  // ------------------------------------------------------------------
  // 2. NEW: STRICT GPS & PERMISSION CHECK BEFORE GOING ONLINE
  // ------------------------------------------------------------------
  const handleToggleOnline = async (value) => {
      if (value === true) {
          // Driver is trying to go ONLINE

          // Step A: Check if the physical GPS is turned on
          let servicesEnabled = await Location.hasServicesEnabledAsync();
          if (!servicesEnabled) {
              Alert.alert(
                  "GPS is Disabled", 
                  "Please turn on your device's Location Services (GPS) to go online.",
                  [{ text: "OK" }]
              );
              return; // Stop here. Do not set isOnline to true.
          }

          // Step B: Check if the app has permission to use the GPS
          let { status } = await Location.requestForegroundPermissionsAsync();
          if (status !== 'granted') {
              Alert.alert(
                  "Permission Denied", 
                  "You must allow Amigos to access your location to receive deliveries.",
                  [{ text: "OK" }]
              );
              return; // Stop here. Do not set isOnline to true.
          }

          // If GPS is on AND Permissions are granted:
          setIsOnline(true);
          
          // Note: Here is where you would call startBackgroundTracking() if you implement it later.

      } else {
          // Driver is going OFFLINE
          setIsOnline(false);
          
          // Note: Here is where you would call stopBackgroundTracking() if you implement it later.
      }
  };

  const handleLogout = async () => {
      setMenuVisible(false);
      await AsyncStorage.removeItem('userToken');
      router.replace('/');
  };

  const renderOrderCard = ({ item }) => (
    <TouchableOpacity 
      style={styles.card} 
      activeOpacity={0.9}
      onPress={() => router.push({ pathname: '/active-delivery', params: { orderId: item.id } })}
    >
      <View style={styles.cardHeader}>
        <View style={styles.badge}>
            <Text style={styles.badgeText}>NEW</Text>
        </View>
        <Text style={styles.orderId}>Order #{item.order_number ?? item.id}</Text>
      </View>

      <View style={styles.locationContainer}>
          <View style={styles.locationRow}>
            <View style={styles.dotPickup} />
            <Text style={styles.locationText} numberOfLines={1}>Amigos Pizza (Main)</Text>
          </View>
          <View style={styles.lineConnection} />
          <View style={styles.locationRow}>
            <View style={styles.dotDropoff} />
            <Text style={styles.locationText} numberOfLines={1}>{item.address || 'Customer Address'}</Text>
          </View>
      </View>

      <View style={styles.cardFooter}>
        <Text style={styles.distance}><Ionicons name="cash-outline" size={16} /> ₹{item.total_amount}</Text>
        <View style={styles.actionBtn}>
          <Text style={styles.actionBtnText}>View Details</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      
      <View style={[styles.header, isOnline ? styles.headerOnline : styles.headerOffline]}>
        <View style={styles.navBar}>
            <TouchableOpacity onPress={() => setMenuVisible(true)} style={styles.iconBtn}>
                <Ionicons name="menu" size={28} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity onPress={onRefresh} style={styles.iconBtn}>
                <Ionicons name="refresh" size={24} color="#fff" />
            </TouchableOpacity>
        </View>

        <View style={styles.statusRow}>
            <View>
            <Text style={styles.statusText}>{isOnline ? 'YOU ARE ONLINE' : 'YOU ARE OFFLINE'}</Text>
            <Text style={styles.subStatusText}>{isOnline ? 'Searching for orders...' : 'Go online to receive orders'}</Text>
            </View>
            
            {/* 3. UPDATED: Call handleToggleOnline instead of setIsOnline directly */}
            <Switch 
                value={isOnline} 
                onValueChange={handleToggleOnline} 
                trackColor={{ false: '#ccc', true: '#fff' }} 
                thumbColor={isOnline ? '#4cd137' : '#f4f3f4'} 
                style={{ transform: [{ scaleX: 1.3 }, { scaleY: 1.3 }] }} 
            />
        </View>
      </View>

      <View style={styles.statsContainer}>
        <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
            <View style={[styles.singleStatBox, {flex: 1, marginRight: 8, padding: 16, flexDirection: 'column', alignItems: 'flex-start'}]}>
              <Ionicons name="checkmark-done-circle" size={28} color="#4cd137" style={{marginBottom: 8}} />
              <View>
                  <Text style={[styles.statLabel, {fontSize: 11}]}>Completed</Text>
                  <Text style={styles.statValue}>{analytics.total_deliveries}</Text> 
              </View>
            </View>
            <View style={[styles.singleStatBox, {flex: 1, marginLeft: 8, padding: 16, flexDirection: 'column', alignItems: 'flex-start'}]}>
              <Ionicons name="cash-outline" size={28} color="#e67e22" style={{marginBottom: 8}} />
              <View>
                  <Text style={[styles.statLabel, {fontSize: 11}]}>Cash to Collect</Text>
                  <Text style={styles.statValue}>₹{analytics.cash_to_collect}</Text> 
              </View>
            </View>
        </View>
      </View>

      <View style={styles.listContainer}>
        <Text style={styles.listTitle}>Assigned Orders</Text> 
        {isOnline ? (
          <FlatList 
            data={orders} 
            keyExtractor={item => item.id.toString()} 
            renderItem={renderOrderCard} 
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 20 }}
            refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#e63946']} />
            }
            ListEmptyComponent={
                <Text style={styles.offlineMessage}>Pull down to refresh. No active orders.</Text>
            }
          />
        ) : (
          <View style={styles.offlineState}>
              <Ionicons name="moon" size={60} color="#ccc" />
              <Text style={styles.offlineMessage}>You won't receive orders while offline.</Text>
          </View>
        )}
      </View>

      {/* BOTTOM SHEET MENU */}
      <Modal animationType="slide" transparent={true} visible={menuVisible} onRequestClose={() => setMenuVisible(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setMenuVisible(false)}>
            <TouchableOpacity style={styles.menuSheet} activeOpacity={1}>
                <View style={styles.menuHeader}>
                    <View>
                        <Text style={styles.menuDriverName}>{driverName} (Rider)</Text>
                    </View>
                    <TouchableOpacity onPress={() => setMenuVisible(false)}>
                        <Ionicons name="close-circle" size={32} color="#ddd" />
                    </TouchableOpacity>
                </View>

                <TouchableOpacity style={styles.menuItem}>
                    <Ionicons name="person-outline" size={24} color="#555" />
                    <Text style={styles.menuItemText}>My Profile</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.menuItem} onPress={() => Alert.alert("Contact", "Support: +91 9999999999")}>
                    <Ionicons name="headset-outline" size={24} color="#555" />
                    <Text style={styles.menuItemText}>Contact Support</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.menuItem} onPress={handleLogout}>
                    <Ionicons name="log-out-outline" size={24} color="#e63946" />
                    <Text style={[styles.menuItemText, { color: '#e63946' }]}>Logout</Text>
                </TouchableOpacity>

                <Text style={styles.appVersion}>Amigos Driver v1.0.0</Text>
            </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f5f7' },
  header: { padding: 20, paddingBottom: 40, borderBottomLeftRadius: 24, borderBottomRightRadius: 24, elevation: 5 },
  headerOffline: { backgroundColor: '#333' },
  headerOnline: { backgroundColor: '#4cd137' },
  navBar: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  iconBtn: { padding: 4 },
  statusRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  statusText: { fontSize: 22, fontWeight: '900', color: '#fff' },
  subStatusText: { fontSize: 14, color: '#rgba(255,255,255,0.8)', marginTop: 4 },
  statsContainer: { paddingHorizontal: 20, marginTop: -25 },
  singleStatBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 20, borderRadius: 16, elevation: 4 },
  statLabel: { fontSize: 13, color: '#666', fontWeight: 'bold', textTransform: 'uppercase' },
  statValue: { fontSize: 28, fontWeight: '900', color: '#111', marginTop: 2 },
  listContainer: { flex: 1, padding: 20 },
  listTitle: { fontSize: 18, fontWeight: '900', marginBottom: 16, color: '#222' },
  offlineState: { alignItems: 'center', justifyContent: 'center', marginTop: 40 },
  offlineMessage: { textAlign: 'center', color: '#888', marginTop: 16, fontSize: 16, fontWeight: '500' },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 16, elevation: 2, borderWidth: 1, borderColor: '#f0f0f0' },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  badge: { backgroundColor: '#ffeaa7', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, marginRight: 8 },
  badgeText: { fontSize: 10, fontWeight: 'bold', color: '#d63031' },
  orderId: { fontSize: 16, fontWeight: 'bold', color: '#555' },
  locationContainer: { backgroundColor: '#f9f9f9', padding: 12, borderRadius: 12, marginBottom: 16 },
  locationRow: { flexDirection: 'row', alignItems: 'center' },
  dotPickup: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#0984e3', marginRight: 12 },
  dotDropoff: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#e63946', marginRight: 12 },
  lineConnection: { width: 2, height: 16, backgroundColor: '#ddd', marginLeft: 4, marginVertical: 2 },
  locationText: { fontSize: 15, color: '#333', fontWeight: '600', flex: 1 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12, borderTopWidth: 1, borderTopColor: '#eee' },
  distance: { fontSize: 15, color: '#111', fontWeight: '900' },
  actionBtn: { backgroundColor: '#111', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12 },
  actionBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  menuSheet: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  menuHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#eee', paddingBottom: 20, marginBottom: 10 },
  menuDriverName: { fontSize: 20, fontWeight: '900', color: '#111' },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16 },
  menuItemText: { fontSize: 18, fontWeight: '600', marginLeft: 16, color: '#333' },
  appVersion: { textAlign: 'center', color: '#aaa', marginTop: 30, fontSize: 12, fontWeight: 'bold' }
});