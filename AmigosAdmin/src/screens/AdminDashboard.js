import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  TouchableOpacity, 
  StyleSheet, 
  Alert, 
  Modal
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
// import { COLORS } from '../utils/colors'; // Copy your colors file here
// import api from '../services/api'; // Copy your api.js here

// MOCK DATA (Replace with API call)
const MOCK_ORDERS = [
    { id: 1, order_id: '#ORD-9921', status: 'pending', total: '₹450', customer: 'Shoaib', items: ['Pepperoni Pizza x1', 'Coke x2'] },
    { id: 2, order_id: '#ORD-9922', status: 'cooking', total: '₹1200', customer: 'Rahul', items: ['Veg Farmhouse x2', 'Garlic Bread x1'] },
    { id: 3, order_id: '#ORD-9923', status: 'ready', total: '₹850', customer: 'Priya', items: ['Chicken Supreme x1'] },
];

const MOCK_DRIVERS = [
    { id: 101, name: 'Amir Hussain', status: 'Available' },
    { id: 102, name: 'John Doe', status: 'Busy' },
];

const AdminDashboard = () => {
  const [orders, setOrders] = useState(MOCK_ORDERS);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [driverModalVisible, setDriverModalVisible] = useState(false);

  // Poll for new orders every 15 seconds
  useEffect(() => {
    const interval = setInterval(() => {
        fetchOrders(); 
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  const fetchOrders = async () => {
    // const res = await api.get('/admin/orders');
    // setOrders(res.data);
    console.log("Refreshed Orders...");
  };

  const updateStatus = (orderId, newStatus) => {
    // 1. Update API
    // await api.post('/admin/order/update-status', { order_id: orderId, status: newStatus });
    
    // 2. Update Local State
    setOrders(orders.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
  };

  const assignDriver = (driver) => {
     // await api.post('/admin/order/assign', { order_id: selectedOrder.id, driver_id: driver.id });
     Alert.alert("Success", `Order assigned to ${driver.name}`);
     setDriverModalVisible(false);
     updateStatus(selectedOrder.id, 'out_for_delivery');
  };

  const renderOrderCard = ({ item }) => {
    const isPending = item.status === 'pending';

    return (
      <View style={[styles.card, isPending && styles.pendingCard]}>
        <View style={styles.cardHeader}>
            <Text style={styles.orderId}>{item.order_id}</Text>
            <Text style={styles.timeAgo}>2 mins ago</Text>
        </View>
        
        <Text style={styles.customerName}>{item.customer}</Text>
        <Text style={styles.itemsText}>{item.items.join(', ')}</Text>
        <Text style={styles.totalText}>Total: {item.total}</Text>

        {/* STATUS BUTTONS */}
        <View style={styles.actionRow}>
            {item.status === 'pending' && (
                <>
                    <TouchableOpacity style={styles.rejectBtn} onPress={() => Alert.alert('Rejecting...')}>
                        <Text style={styles.btnText}>Reject</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.acceptBtn} onPress={() => updateStatus(item.id, 'cooking')}>
                        <Text style={styles.btnText}>Accept & Cook</Text>
                    </TouchableOpacity>
                </>
            )}

            {item.status === 'cooking' && (
                 <TouchableOpacity style={styles.readyBtn} onPress={() => updateStatus(item.id, 'ready')}>
                    <Text style={styles.btnText}>Mark Ready</Text>
                </TouchableOpacity>
            )}

            {item.status === 'ready' && (
                 <TouchableOpacity 
                    style={styles.assignBtn} 
                    onPress={() => { setSelectedOrder(item); setDriverModalVisible(true); }}
                >
                    <Text style={styles.btnText}>Assign Driver 🛵</Text>
                </TouchableOpacity>
            )}
            
            {item.status === 'out_for_delivery' && (
                <Text style={{color: 'green', fontWeight: 'bold'}}>On the way 🛵</Text>
            )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Kitchen Dashboard</Text>
        <View style={styles.badge}>
            <Text style={{color: '#fff'}}>Active: {orders.length}</Text>
        </View>
      </View>

      <FlatList 
        data={orders}
        keyExtractor={item => item.id.toString()}
        renderItem={renderOrderCard}
        contentContainerStyle={{ padding: 15 }}
      />

      {/* DRIVER SELECTION MODAL */}
      <Modal visible={driverModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Select Delivery Partner</Text>
                {MOCK_DRIVERS.map(driver => (
                    <TouchableOpacity 
                        key={driver.id} 
                        style={styles.driverRow} 
                        onPress={() => assignDriver(driver)}
                    >
                        <Text style={styles.driverName}>{driver.name}</Text>
                        <Text style={{color: driver.status === 'Available' ? 'green' : 'red'}}>
                            {driver.status}
                        </Text>
                    </TouchableOpacity>
                ))}
                <TouchableOpacity 
                    style={styles.cancelBtn} 
                    onPress={() => setDriverModalVisible(false)}
                >
                    <Text>Cancel</Text>
                </TouchableOpacity>
            </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f4f4' },
  header: { 
    padding: 20, backgroundColor: '#fff', flexDirection: 'row', 
    justifyContent: 'space-between', alignItems: 'center', elevation: 2 
  },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#333' },
  badge: { backgroundColor: 'red', padding: 8, borderRadius: 10 },
  
  card: { backgroundColor: '#fff', padding: 15, borderRadius: 10, marginBottom: 15, elevation: 3 },
  pendingCard: { borderLeftWidth: 5, borderLeftColor: 'orange' }, // Highlight new orders
  
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  orderId: { fontWeight: 'bold', fontSize: 16 },
  timeAgo: { color: '#888', fontSize: 12 },
  
  customerName: { fontSize: 18, fontWeight: 'bold', color: '#000' },
  itemsText: { color: '#555', marginVertical: 5 },
  totalText: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 10 },

  actionRow: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10 },
  
  rejectBtn: { backgroundColor: '#eee', padding: 10, borderRadius: 5 },
  acceptBtn: { backgroundColor: 'orange', padding: 10, borderRadius: 5 },
  readyBtn: { backgroundColor: '#2196F3', padding: 10, borderRadius: 5 },
  assignBtn: { backgroundColor: '#4CAF50', padding: 10, borderRadius: 5 },
  
  btnText: { color: '#fff', fontWeight: 'bold' },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#fff', padding: 20, borderRadius: 10 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15, textAlign: 'center' },
  driverRow: { 
    flexDirection: 'row', justifyContent: 'space-between', 
    padding: 15, borderBottomWidth: 1, borderBottomColor: '#eee' 
  },
  driverName: { fontSize: 16 },
  cancelBtn: { marginTop: 15, alignItems: 'center', padding: 10 }
});

export default AdminDashboard;