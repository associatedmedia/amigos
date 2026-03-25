import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'https://api.amigospizza.co/api';

export default function OrdersListScreen() {
  const [orders, setOrders] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchHistory = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) return;

      const response = await axios.get(`${API_URL}/driver/order-history`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setOrders(response.data.orders);
      }
    } catch (error) {
      console.error("Error fetching history:", error);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchHistory();
    setRefreshing(false);
  }, []);

  const getStatusColor = (status) => {
      switch(status) {
          case 'delivered': return '#4cd137';
          case 'assigned': return '#e1b12c';
          case 'picked_up': return '#0984e3';
          case 'cancelled': return '#e84118';
          default: return '#555';
      }
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.orderId}>Order #{item.order_number ?? item.id}</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
            <Text style={styles.statusText}>{item.status.replace('_', ' ').toUpperCase()}</Text>
        </View>
      </View>

      <Text style={styles.dateText}>
          {new Date(item.created_at).toLocaleString('en-US', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
      </Text>

      <View style={styles.divider} />

      <View style={styles.cardFooter}>
         <Text style={styles.paymentMethod}>{item.payment_method?.toUpperCase() || 'ONLINE'}</Text>
         <Text style={styles.amount}>₹{item.total_amount}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#111" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Order History</Text>
        <View style={{width: 24}} />
      </View>

      <FlatList
        data={orders}
        keyExtractor={item => item.id.toString()}
        renderItem={renderItem}
        contentContainerStyle={styles.listContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#e63946']} />}
        ListEmptyComponent={<Text style={styles.emptyText}>No orders found.</Text>}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f5f7' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#111' },
  listContainer: { padding: 16 },
  card: { backgroundColor: '#fff', padding: 16, borderRadius: 12, marginBottom: 16, elevation: 1 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  orderId: { fontSize: 16, fontWeight: 'bold', color: '#222' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  statusText: { color: '#fff', fontSize: 11, fontWeight: 'bold', textTransform: 'uppercase' },
  dateText: { fontSize: 13, color: '#888', marginBottom: 12 },
  divider: { height: 1, backgroundColor: '#eee', marginBottom: 12 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  paymentMethod: { fontSize: 13, color: '#555', fontWeight: '600' },
  amount: { fontSize: 16, fontWeight: 'bold', color: '#111' },
  emptyText: { textAlign: 'center', marginTop: 40, color: '#888', fontSize: 16 }
});
