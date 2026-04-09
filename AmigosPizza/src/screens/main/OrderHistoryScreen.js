import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import api from '../../services/api';
import { COLORS } from '../../utils/colors';
import { useAuth } from '../../context/AuthContext';
import BackButton from '../../components/BackButton';

const OrderHistoryScreen = ({ navigation }) => {
  const { isGuest, logout } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      fetchOrders();
    }, [])
  );

  const fetchOrders = async () => {
    if (isGuest) {
      setLoading(false);
      setRefreshing(false);
      return;
    }
    try {
      if (!api) return;
      const response = await api.get('/orders');
      if (response.data && response.data.success) {
        setOrders(response.data.data || []);
      }
    } catch (error) {
      console.error("Orders Fetch Error:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchOrders();
  };

  const handleBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate('Home');
    }
  };

  const getStatusStyle = (status) => {
    const statusText = status ? status.toLowerCase() : 'pending';
    switch (statusText) {
      case 'delivered': return { color: '#2ecc71', bg: '#e8f8f0' };
      case 'cooking': return { color: '#f39c12', bg: '#fef5e7' };
      case 'cancelled': return { color: '#999', bg: '#eee' };
      default: return { color: '#e74c3c', bg: '#fdedec' };
    }
  };

  const renderOrderItem = ({ item }) => {
    const status = getStatusStyle(item.status);
    const isLive = ['cooking', 'pending', 'confirmed', 'ready_for_pickup', 'out_for_delivery'].includes(item.status?.toLowerCase());

    return (
      <View style={styles.orderCard}>
        <View style={styles.orderHeader}>
          <Text style={styles.orderId}>Order #{item.order_number}</Text>
          <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
            <Text style={[styles.statusText, { color: status.color }]}>
              {item.status ? item.status.toUpperCase() : 'UNKNOWN'}
            </Text>
          </View>
        </View>

        <Text style={styles.orderDate}>
          {item.created_at ? new Date(item.created_at).toLocaleDateString() : ''} {' '}
          {item.created_at ? new Date(item.created_at).toLocaleTimeString() : ''}
        </Text>

        <Text style={styles.orderDate}>
          Payment: {item.payment_method ? item.payment_method.toUpperCase() : 'N/A'}
        </Text>

        <View style={styles.itemsList}>
          {item.items && item.items.length > 0 ? (
            item.items.map((subItem, index) => (
              <Text key={index} style={styles.itemText}>
                • {subItem.product ? subItem.product.name : 'Item'} x {subItem.quantity}
              </Text>
            ))
          ) : (
            <Text style={{ color: '#999', fontSize: 12 }}>No details available</Text>
          )}
        </View>

        <View style={styles.footer}>
          <Text style={styles.totalText}>Total: ₹{item.total_amount}</Text>

          {/* TRACK BUTTON (Only show if order is active) */}
          {isLive && (
            <TouchableOpacity
              style={styles.trackBtn}
              onPress={() => navigation.navigate('LiveTracking', { order: item })}
            >
              <Text style={styles.trackBtnText}>Track Order 🛵</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  if (loading) return <ActivityIndicator size="large" color={COLORS.primary} style={{ flex: 1 }} />;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right', 'bottom']}>

      <View style={styles.header}>
        <BackButton onPress={handleBack} style={{ marginRight: 10 }} />
        <Text style={styles.headerTitle}>Order History</Text>
      </View>

      <FlatList
        data={orders}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderOrderItem}
        contentContainerStyle={{ padding: 20, paddingBottom: 50 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
        }
        ListEmptyComponent={
          isGuest ? (
            <View style={styles.emptyContainer}>
              <Text style={{ fontSize: 40 }}>🔒</Text>
              <Text style={styles.emptyText}>Please log in to view your orders.</Text>
              <TouchableOpacity style={[styles.trackBtn, { marginTop: 20 }]} onPress={() => logout()}>
                <Text style={styles.trackBtnText}>Log In or Register</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={{ fontSize: 40 }}>🍕</Text>
              <Text style={styles.emptyText}>No orders placed yet.</Text>
            </View>
          )
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0'
  },
  headerTitle: { fontSize: 20, fontWeight: 'bold', marginLeft: 20 },

  orderCard: { backgroundColor: '#F9F9F9', borderRadius: 15, padding: 15, marginBottom: 15, borderWidth: 1, borderColor: '#eee' },

  orderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  orderId: { fontSize: 16, fontWeight: 'bold' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusText: { fontSize: 10, fontWeight: 'bold' },
  orderDate: { color: '#888', fontSize: 12, marginVertical: 5 },
  itemsList: { borderTopWidth: 1, borderTopColor: '#EEE', paddingTop: 10, marginTop: 5 },
  itemText: { fontSize: 14, color: '#444', marginBottom: 2 },

  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 15 },
  totalText: { fontSize: 16, fontWeight: 'bold', color: COLORS.primary },

  // Track Button
  trackBtn: { backgroundColor: COLORS.primary, paddingVertical: 8, paddingHorizontal: 15, borderRadius: 20 },
  trackBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 12 },

  emptyContainer: { alignItems: 'center', marginTop: 80 },
  emptyText: { marginTop: 10, color: '#888', fontSize: 16 },
});

export default OrderHistoryScreen;