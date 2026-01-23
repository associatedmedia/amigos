import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  Modal,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';

// Reuse your colors
const COLORS = {
  primary: '#D23F45',
  gold: '#FEC94A',
  dark: '#1A1A1A',
  white: '#FFFFFF',
  lightGrey: '#F8F8F8',
  border: '#EEEEEE',
  success: '#4CAF50',
  blue: '#2196F3'
};

const OrdersScreen = () => {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Status Filter State ('All', 'pending', 'cooking', 'ready', 'delivered')
  const [statusFilter, setStatusFilter] = useState('All');

  // Modal State
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [searchQuery, statusFilter, orders]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/orders');
      console.log("Fetched Orders:", res.data);
      setOrders(res.data);
      setFilteredOrders(res.data); // Initial full list
    } catch (error) {
      console.log("Error fetching orders:", error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let result = orders;

    // 1. Filter by Status
    if (statusFilter !== 'All') {
        result = result.filter(o => o.status === statusFilter);
    }

    // 2. Filter by Search Text (ID, Name, Mobile)
    if (searchQuery) {
        const lowerQuery = searchQuery.toLowerCase();
        result = result.filter(item => 
            item.id.toString().includes(lowerQuery) ||
            (item.user && item.user.name.toLowerCase().includes(lowerQuery)) ||
            item.mobile_no.includes(lowerQuery)
        );
    }

    setFilteredOrders(result);
  };

  const openOrderDetails = (order) => {
      setSelectedOrder(order);
      setModalVisible(true);
  };

  // --- RENDER COMPONENTS ---

  const renderFilterTab = (tabName) => (
      <TouchableOpacity 
        style={[styles.filterTab, statusFilter === tabName && styles.activeFilterTab]}
        onPress={() => setStatusFilter(tabName)}
      >
          <Text style={[styles.filterText, statusFilter === tabName && styles.activeFilterText]}>
              {tabName.toUpperCase()}
          </Text>
      </TouchableOpacity>
  );

  const renderOrderCard = ({ item }) => {
    const isPending = item.status === 'pending';
    return (
      <TouchableOpacity style={styles.card} onPress={() => openOrderDetails(item)}>
        <View style={styles.cardHeader}>
            <View style={styles.row}>
                <Text style={styles.orderId}>#{item.id}</Text>
                <Text style={styles.dateText}>
                    {new Date(item.created_at).toLocaleDateString()} • {new Date(item.created_at).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                </Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
                <Text style={styles.statusText}>{item.status}</Text>
            </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.detailsRow}>
            <View style={styles.detailItem}>
                <Text style={styles.label}>Customer</Text>
                <Text style={styles.value}>{item.user ? item.user.name : "Guest"}</Text>
            </View>
            <View style={styles.detailItem}>
                <Text style={styles.label}>Mobile</Text>
                <Text style={styles.value}>{item.mobile_no}</Text>
            </View>
            <View style={styles.detailItem}>
                <Text style={styles.label}>Total</Text>
                <Text style={styles.priceValue}>₹{item.total_amount}</Text>
            </View>
        </View>
      </TouchableOpacity>
    );
  };

  const getStatusColor = (status) => {
    switch(status) {
        case 'pending': return 'orange';
        case 'cooking': return COLORS.blue;
        case 'ready': return COLORS.success;
        case 'out_for_delivery': return '#9C27B0';
        case 'delivered': return COLORS.dark;
        default: return '#999';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* 1. HEADER & SEARCH */}
      <View style={styles.header}>
          <Text style={styles.title}>All Orders</Text>
          <View style={styles.searchBox}>
              <Ionicons name="search" size={20} color="#666" />
              <TextInput 
                  style={styles.input}
                  placeholder="Search ID, Name, or Mobile..."
                  value={searchQuery}
                  onChangeText={setSearchQuery}
              />
              {searchQuery.length > 0 && (
                  <TouchableOpacity onPress={() => setSearchQuery('')}>
                      <Ionicons name="close-circle" size={20} color="#999" />
                  </TouchableOpacity>
              )}
          </View>
      </View>

      {/* 2. STATUS FILTER TABS */}
      <View style={{ height: 50 }}>
        <FlatList 
            horizontal
            showsHorizontalScrollIndicator={false}
            data={['All', 'pending', 'cooking', 'ready', 'out_for_delivery', 'delivered']}
            keyExtractor={item => item}
            renderItem={({ item }) => renderFilterTab(item)}
            contentContainerStyle={styles.filterList}
        />
      </View>

      {/* 3. ORDERS LIST */}
      {loading ? (
          <ActivityIndicator size="large" color={COLORS.primary} style={{marginTop: 50}} />
      ) : (
          <FlatList 
              data={filteredOrders}
              keyExtractor={item => item.id.toString()}
              renderItem={renderOrderCard}
              contentContainerStyle={styles.listContent}
              ListEmptyComponent={
                  <Text style={styles.emptyText}>No orders found.</Text>
              }
          />
      )}

      {/* 4. DETAILS MODAL */}
      <Modal visible={modalVisible} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                  <View style={styles.modalHeader}>
                      <Text style={styles.modalTitle}>Order Details #{selectedOrder?.id}</Text>
                      <TouchableOpacity onPress={() => setModalVisible(false)}>
                          <Ionicons name="close" size={24} color="#000" />
                      </TouchableOpacity>
                  </View>
                  
                  {selectedOrder && (
                      <View style={styles.modalBody}>
                          <Text style={styles.modalLabel}>Customer Info:</Text>
                          <Text style={styles.modalText}>Name: {selectedOrder.user?.name}</Text>
                          <Text style={styles.modalText}>Phone: {selectedOrder.mobile_no}</Text>
                          <Text style={styles.modalText}>Address: {selectedOrder.address}</Text>
                          
                          <View style={styles.divider} />
                          
                          <Text style={styles.modalLabel}>Payment:</Text>
                          <Text style={[styles.modalText, {fontSize: 20, fontWeight:'bold', color: COLORS.primary}]}>
                              Total: ₹{selectedOrder.total_amount}
                          </Text>

                          <View style={styles.divider} />

                          <Text style={styles.modalLabel}>Delivery Info:</Text>
                          <Text style={styles.modalText}>
                              Status: <Text style={{fontWeight:'bold'}}>{selectedOrder.status.toUpperCase()}</Text>
                          </Text>
                          {selectedOrder.driver_id && (
                             <Text style={styles.modalText}>Driver ID: {selectedOrder.driver_id}</Text> 
                          )}
                      </View>
                  )}
                  
                  <TouchableOpacity 
                    style={styles.closeBtn} 
                    onPress={() => setModalVisible(false)}
                  >
                      <Text style={styles.closeBtnText}>Close</Text>
                  </TouchableOpacity>
              </View>
          </View>
      </Modal>

    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F2' },
  
  header: { backgroundColor: COLORS.white, padding: 15, paddingBottom: 10 },
  title: { fontSize: 24, fontWeight: 'bold', color: COLORS.dark, marginBottom: 15 },
  
  searchBox: { 
      flexDirection: 'row', alignItems: 'center', backgroundColor: '#F5F5F5', 
      borderRadius: 10, paddingHorizontal: 10, height: 45, borderWidth: 1, borderColor: COLORS.border
  },
  input: { flex: 1, marginLeft: 10, fontSize: 16 },

  filterList: { paddingHorizontal: 15, alignItems: 'center' },
  filterTab: { 
      paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, 
      backgroundColor: COLORS.white, marginRight: 10, borderWidth: 1, borderColor: '#DDD'
  },
  activeFilterTab: { backgroundColor: COLORS.dark, borderColor: COLORS.dark },
  filterText: { fontWeight: '600', color: '#666', fontSize: 12 },
  activeFilterText: { color: COLORS.white },

  listContent: { padding: 15 },
  
  card: { 
      backgroundColor: COLORS.white, borderRadius: 12, padding: 15, marginBottom: 15,
      shadowColor: "#000", shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.1, elevation: 3
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  orderId: { fontSize: 18, fontWeight: 'bold', color: COLORS.dark },
  dateText: { fontSize: 12, color: '#999', marginTop: 2 },
  
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 5 },
  statusText: { color: '#FFF', fontWeight: 'bold', fontSize: 10, textTransform: 'uppercase' },

  divider: { height: 1, backgroundColor: COLORS.border, marginVertical: 12 },

  detailsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  detailItem: { flex: 1 },
  label: { fontSize: 10, color: '#999', textTransform: 'uppercase', marginBottom: 2 },
  value: { fontSize: 14, color: COLORS.dark, fontWeight: '500' },
  priceValue: { fontSize: 16, color: COLORS.primary, fontWeight: 'bold' },

  emptyText: { textAlign: 'center', marginTop: 50, color: '#888' },

  // MODAL
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#FFF', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: 'bold' },
  modalBody: { marginBottom: 20 },
  modalLabel: { fontSize: 14, color: '#888', marginTop: 15, marginBottom: 5, fontWeight: 'bold' },
  modalText: { fontSize: 16, color: '#333', marginBottom: 5 },
  
  closeBtn: { backgroundColor: COLORS.dark, padding: 15, borderRadius: 10, alignItems: 'center' },
  closeBtnText: { color: '#FFF', fontWeight: 'bold' }
});

export default OrdersScreen;