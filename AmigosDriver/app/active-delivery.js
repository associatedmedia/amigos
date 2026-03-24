import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, Linking, Platform } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context'; 

import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';

const API_URL = 'https://api.amigospizza.co/api';

export default function ActiveDeliveryScreen() {
  const { orderId } = useLocalSearchParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (orderId) {
        fetchOrderDetails();
    } else {
        Alert.alert("Error", "No Order ID provided.");
        router.back();
    }
  }, [orderId]);

  const fetchOrderDetails = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const response = await axios.get(`${API_URL}/driver/orders`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
         const foundOrder = response.data.orders.find(o => o.id.toString() === orderId.toString());
         if (foundOrder) {
             setOrder(foundOrder);
         } else {
             Alert.alert("Error", "Order not found or already completed.");
             router.back();
         }
      }
    } catch (error) {
      Alert.alert("Network Error", "Could not fetch order details.");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async () => {
      if (!order) return;
      
      const nextStatus = order.status === 'assigned' ? 'picked_up' : 'delivered';

      // Proof of Delivery logic
      if (nextStatus === 'delivered') {
          const { status } = await ImagePicker.requestCameraPermissionsAsync();
          if (status !== 'granted') {
              Alert.alert("Permission Denied", "Camera access is required for Proof of Delivery.");
              return;
          }

          let result = await ImagePicker.launchCameraAsync({
              mediaTypes: ImagePicker.MediaTypeOptions.Images,
              quality: 0.5,
          });

          if (result.canceled) {
              return; // Driver canceled taking photo
          }
      }

      setUpdating(true);

      const token = await AsyncStorage.getItem('userToken');
      try {
          const response = await axios.post(`${API_URL}/driver/orders/${order.id}/status`, {
              status: nextStatus
          }, { headers: { Authorization: `Bearer ${token}` }});

          if (response.data.success) {
              if (nextStatus === 'delivered') {
                  Alert.alert("Success", "Order delivered successfully!");
                  router.replace('/dashboard');
              } else {
                  setOrder({ ...order, status: nextStatus });
              }
          }
      } catch (error) {
          Alert.alert("Network Issue", "Status saved offline. Will sync when online.");
          try {
              const queueStr = await AsyncStorage.getItem('offlineStatusQueue');
              const queue = queueStr ? JSON.parse(queueStr) : [];
              queue.push({ orderId: order.id, status: nextStatus, timestamp: Date.now() });
              await AsyncStorage.setItem('offlineStatusQueue', JSON.stringify(queue));
          } catch(e) {}
          
          if (nextStatus === 'delivered') {
              router.replace('/dashboard');
          } else {
              setOrder({ ...order, status: nextStatus });
          }
      } finally {
          setUpdating(false);
      }
  };

  const handleCallCustomer = () => {
      if (order?.user?.mobile_no) {
          Linking.openURL(`tel:${order.user.mobile_no}`);
      } else {
          Alert.alert("Error", "Customer phone number not available.");
      }
  };

  // --------------------------------------------------------
  // NEW: OPEN TURN-BY-TURN NAVIGATION
  // --------------------------------------------------------
  const handleNavigate = () => {
      // TODO: Replace these with order.restaurant_lat or order.customer_lat from your DB
      const lat = order.latitude;  //34.0837; 
      const lng = order.longitude; //74.7973;
      const label = isPickedUp ? "Customer Dropoff" : "Amigos Pizza";

      // Creates the correct URL scheme based on whether they have an iPhone or Android
      const url = Platform.select({
          ios: `maps:0,0?q=${label}@${lat},${lng}`,
          android: `geo:0,0?q=${lat},${lng}(${label})`
      });

      Linking.openURL(url).catch(err => {
          Alert.alert("Error", "Could not open maps application.");
      });
  };

  if (loading) {
      return (
          <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
              <ActivityIndicator size="large" color="#e63946" />
              <Text style={{marginTop: 10, color: '#666'}}>Loading Order Route...</Text>
          </SafeAreaView>
      );
  }

  if (!order) return null;

  const isPickedUp = order.status === 'picked_up';
  const totalItems = order.items ? order.items.reduce((sum, item) => sum + item.quantity, 0) : 0;

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.backButtonContainer}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#111" />
        </TouchableOpacity>
      </SafeAreaView>

      <MapView 
        style={styles.map} 
        initialRegion={{
          latitude: 34.0837, 
          longitude: 74.7973,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
      >
        <Marker coordinate={{ latitude: 34.0837, longitude: 74.7973 }} title="Destination" />
      </MapView>

      <View style={styles.bottomSheet}>
        <View style={styles.pill} />
        
        <Text style={styles.sheetTitle}>
            {isPickedUp ? 'Deliver to Customer' : 'Pickup from Restaurant'}
        </Text>
        
        <View style={styles.detailCard}>
            <View style={styles.detailRow}>
                <View style={styles.iconCircle}>
                    <Ionicons name={isPickedUp ? "person" : "restaurant"} size={24} color="#e63946" />
                </View>
                <View style={{ marginLeft: 12, flex: 1 }}>
                    <Text style={styles.shopName} numberOfLines={1}>
                        {isPickedUp ? (order.user?.name || 'Customer') : 'Amigos Pizza (Main)'}
                    </Text>
                    <Text style={styles.addressText} numberOfLines={2}>
                        Order #{order.order_number ?? order.id} • {totalItems} Items
                        {isPickedUp ? `\n${order.address_line_1 || ''}` : ''}
                    </Text>
                </View>
                
                {/* NEW: Map / Navigation Button */}
                <TouchableOpacity style={[styles.actionIconButton, { backgroundColor: '#0984e3', marginRight: 10 }]} onPress={handleNavigate}>
                    <Ionicons name="navigate" size={20} color="#fff" />
                </TouchableOpacity>

                {/* Call Button */}
                <TouchableOpacity style={[styles.actionIconButton, { backgroundColor: '#4cd137' }]} onPress={handleCallCustomer}>
                    <Ionicons name="call" size={20} color="#fff" />
                </TouchableOpacity>
            </View>
        </View>

        <View style={styles.paymentRow}>
            <Text style={styles.paymentLabel}>
                {order.payment_method === 'cash' ? 'To Collect (Cash)' : 'Paid Online'}
            </Text>
            <Text style={[styles.paymentValue, order.payment_method !== 'cash' && { color: '#4cd137' }]}>
                ₹{order.total_amount}
            </Text>
        </View>

        <TouchableOpacity 
            style={[styles.swipeButton, isPickedUp && { backgroundColor: '#4cd137' }]} 
            onPress={handleUpdateStatus}
            disabled={updating}
        >
            {updating ? (
                <ActivityIndicator color="#fff" />
            ) : (
                <Text style={styles.swipeText}>
                    {isPickedUp ? 'MARK AS DELIVERED' : 'MARK AS PICKED UP'}
                </Text>
            )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  backButtonContainer: { position: 'absolute', top: 0, left: 0, zIndex: 10, padding: 16 },
  backButton: { backgroundColor: '#fff', padding: 10, borderRadius: 50, elevation: 5 },
  map: { flex: 1 },
  bottomSheet: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingTop: 12, position: 'absolute', bottom: 0, width: '100%', elevation: 20 },
  pill: { width: 40, height: 5, backgroundColor: '#ddd', borderRadius: 5, alignSelf: 'center', marginBottom: 16 },
  sheetTitle: { fontSize: 22, fontWeight: '900', marginBottom: 20, color: '#111' },
  detailCard: { backgroundColor: '#f9f9f9', padding: 16, borderRadius: 16, marginBottom: 20 },
  detailRow: { flexDirection: 'row', alignItems: 'center' },
  iconCircle: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#fee', alignItems: 'center', justifyContent: 'center' },
  shopName: { fontSize: 18, fontWeight: 'bold', color: '#111' },
  addressText: { fontSize: 14, color: '#666', marginTop: 2, lineHeight: 20 },
  
  // Updated button styles so they match
  actionIconButton: { width: 45, height: 45, borderRadius: 25, alignItems: 'center', justifyContent: 'center', elevation: 3 },
  
  paymentRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, paddingHorizontal: 8 },
  paymentLabel: { fontSize: 16, fontWeight: 'bold', color: '#555' },
  paymentValue: { fontSize: 24, fontWeight: '900', color: '#111' },
  swipeButton: { backgroundColor: '#e63946', padding: 20, borderRadius: 16, alignItems: 'center' },
  swipeText: { color: '#fff', fontSize: 18, fontWeight: '900', letterSpacing: 1 }
});