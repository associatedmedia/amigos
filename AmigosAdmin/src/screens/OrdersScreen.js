import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  Modal,
  ActivityIndicator,
  RefreshControl,
  Platform,
  Alert,
  Linking
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import api from '../services/api';
import PrinterHelper from '../services/PrinterHelper';

// --- BRAND COLORS ---
const COLORS = {
  primary: '#D23F45',    // Red
  secondary: '#FEC94A',  // Gold
  pending: '#F59E0B',    // Orange
  cooking: '#3B82F6',    // Blue
  ready: '#10B981',      // Green
  out: '#8B5CF6',        // Purple (Delivery)
  dark: '#1F2937',
  light: '#F3F4F6',
  white: '#FFFFFF',
  border: '#E5E7EB'
};

export default function OrdersScreen() {
  // --- STATE ---
  const [orders, setOrders] = useState([]);
  const [drivers, setDrivers] = useState([]); // ✅ New: Store Drivers
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  // Modals
  const [selectedOrder, setSelectedOrder] = useState(null); // Details Modal
  const [modalVisible, setModalVisible] = useState(false); // Details Modal Visible
  
  // ✅ New: Driver Modal State
  const [driverModalVisible, setDriverModalVisible] = useState(false);
  const [selectedOrderForDelivery, setSelectedOrderForDelivery] = useState(null);

  // --- 1. FETCH DATA (ORDERS + DRIVERS) ---
  const loadData = async () => {
    try {
      // Fetch both Orders and Drivers in parallel
      const [ordersRes, driversRes] = await Promise.all([
        api.get('/admin/orders'),
        api.get('/admin/drivers')
      ]);
      
      setOrders(ordersRes.data);
      setDrivers(driversRes.data);
      
    } catch (error) {
      console.log("Error fetching data:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handlePrint = (order) => {
    Alert.alert("Print KOT?", "Send this order to the kitchen printer?", [
        { text: "Cancel" },
        { text: "Print", onPress: () => PrinterHelper.printOrder(order) }
    ]);
  };

  // --- 2. APPLY FILTERS ---
  useEffect(() => {
    let result = orders;

    // Filter by Tab
    if (statusFilter !== 'All') {
        let dbStatus = statusFilter.toLowerCase();
        if(statusFilter === 'Ready') dbStatus = 'ready_for_pickup';
        if(statusFilter === 'Out') dbStatus = 'out_for_delivery';
        
        result = result.filter(o => o.status === dbStatus);
    }

    // Filter by Search
    if (searchQuery) {
        const lowerQuery = searchQuery.toLowerCase();
        result = result.filter(item => 
            item.id.toString().includes(lowerQuery) ||
            (item.user && item.user.name.toLowerCase().includes(lowerQuery)) ||
            (item.mobile_no && item.mobile_no.includes(lowerQuery))
        );
    }

    setFilteredOrders(result);
  }, [orders, searchQuery, statusFilter]);

  // --- 3. STATUS LOGIC ---
  
  // A. Handle Button Click
  const handleStatusAction = (item) => {
    if (item.status === 'pending') {
        updateStatus(item.id, 'cooking');
    } else if (item.status === 'cooking') {
        updateStatus(item.id, 'ready_for_pickup');
    } else if (item.status === 'ready_for_pickup') {
        // ✅ Open Driver Modal instead of updating immediately
        setSelectedOrderForDelivery(item.id);
        setDriverModalVisible(true);
    } else if (item.status === 'out_for_delivery') {
        updateStatus(item.id, 'delivered');
    }
  };

  // B. Assign Driver (Called from Modal)
  const assignDriver = (driverId) => {
      if(!selectedOrderForDelivery) return;
      // Update status to 'out_for_delivery' AND assign driver
      updateStatus(selectedOrderForDelivery, 'out_for_delivery', driverId);
  };

  // C. API Call
  const updateStatus = async (orderId, newStatus, driverId = null) => {
    setUpdatingId(orderId);
    try {
      await api.post(`/admin/orders/${orderId}/status`, { 
          status: newStatus,
          driver_id: driverId // ✅ Send Driver ID
      });
      loadData(); // Reload data
    } catch (error) {
      Alert.alert("Error", "Could not update order status.");
    } finally {
      setUpdatingId(null);
      setDriverModalVisible(false); // Close modal
    }
  };

  // --- 4. RENDER HELPERS ---

  const makeCall = (phoneNumber) => {
      if(phoneNumber) Linking.openURL(`tel:${phoneNumber}`);
  };

  const renderFilterTab = (tabName) => (
      <TouchableOpacity 
        key={tabName}
        style={[styles.filterTab, statusFilter === tabName && styles.activeFilterTab]}
        onPress={() => setStatusFilter(tabName)}
      >
          <Text style={[styles.filterText, statusFilter === tabName && styles.activeFilterText]}>
              {tabName}
          </Text>
      </TouchableOpacity>
  );

  const renderStatusBadge = (status) => {
    let color = COLORS.dark;
    let icon = 'ellipse';
    let text = status.toUpperCase().replace(/_/g, " ");

    switch(status) {
        case 'pending': color = COLORS.pending; icon='time'; break;
        case 'cooking': color = COLORS.cooking; icon='flame'; break;
        case 'ready_for_pickup': color = COLORS.ready; icon='checkmark-circle'; break;
        case 'out_for_delivery': color = COLORS.out; icon='bicycle'; text="ON WAY"; break;
        case 'delivered': color = COLORS.dark; icon='home'; break;
    }

    return (
        <View style={[styles.badge, { backgroundColor: color + '20' }]}> 
            <Ionicons name={icon} size={12} color={color} style={{marginRight: 4}} />
            <Text style={[styles.badgeText, { color: color }]}>{text}</Text>
        </View>
    );
  };

  const renderActionButton = (item) => {
    if (updatingId === item.id) return <ActivityIndicator color={COLORS.primary} />;

    let btnText = "";
    let btnColor = COLORS.dark;

    if (item.status === 'pending') {
        btnText = "👨‍🍳 Accept & Cook";
        btnColor = COLORS.cooking;
    } else if (item.status === 'cooking') {
        btnText = "✅ Mark Ready";
        btnColor = COLORS.ready;
    } else if (item.status === 'ready_for_pickup') {
        btnText = "🛵 Assign Driver"; // ✅ Triggers Modal
        btnColor = COLORS.out;
    } else if (item.status === 'out_for_delivery') {
        btnText = "🏁 Mark Delivered";
        btnColor = COLORS.dark;
    } else {
        return null; 
    }

    return (
        <TouchableOpacity 
            style={[styles.actionBtn, { backgroundColor: btnColor }]}
            onPress={() => handleStatusAction(item)}
        >
            <Text style={styles.actionBtnText}>{btnText}</Text>
        </TouchableOpacity>
    );
  };

  // --- 5. RENDER ITEM ---
  const renderItem = ({ item }) => (
    <TouchableOpacity 
        style={styles.card} 
        activeOpacity={0.9} 
        onPress={() => { setSelectedOrder(item); setModalVisible(true); }}
    >
      <View style={styles.cardHeader}>
        <View style={{flexDirection:'row', alignItems:'center'}}>
            <Text style={styles.orderId}>#{item.id}</Text>
            <Text style={styles.timeAgo}> • {new Date(item.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</Text>
        </View>
        {renderStatusBadge(item.status)}
      </View>

      <View style={styles.customerRow}>
          <Text style={styles.customerName}>👤 {item.user ? item.user.name : "Guest"}</Text>
          <Text style={styles.customerPhone}>📱 {item.mobile_no}</Text>
      </View>

      {/* ✅ Show Assigned Driver */}
      {item.driver_id && (
          <Text style={styles.driverText}>🛵 Driver ID: {item.driver_id}</Text>
      )}

      <View style={styles.divider} />

      {item.items && item.items.map((orderItem, index) => (
        <View key={index} style={styles.itemRow}>
            <Text style={styles.qtyBox}>{orderItem.quantity}x</Text>
            <Text style={styles.itemName}>
                {orderItem.product ? orderItem.product.name : 'Unknown Item'}
            </Text>
            <Text style={styles.itemPrice}>₹{orderItem.price}</Text>
        </View>
      ))}

      <View style={styles.footer}>
        <View>
            <Text style={styles.totalLabel}>Total Bill</Text>
            <Text style={styles.totalAmount}>₹{item.total_amount}</Text>
        </View>
        {/* 🖨️ PRINT BUTTON */}
            <TouchableOpacity 
                style={{marginRight: 10, padding: 8, backgroundColor:'#F3F4F6', borderRadius:8}}
                onPress={() => handlePrint(item)}
            >
                <Ionicons name="print" size={20} color={COLORS.dark} />
            </TouchableOpacity>
        <View onStartShouldSetResponder={() => true}>
            {renderActionButton(item)}
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      
      {/* Header */}
      <View style={styles.headerContainer}>
          <Text style={styles.screenTitle}>Kitchen Display</Text>
          <View style={styles.searchBox}>
              <Ionicons name="search" size={20} color="#9CA3AF" />
              <TextInput 
                  style={styles.input}
                  placeholder="Search ID, Name..."
                  value={searchQuery}
                  onChangeText={setSearchQuery}
              />
              {searchQuery.length > 0 && (
                  <TouchableOpacity onPress={() => setSearchQuery('')}>
                      <Ionicons name="close-circle" size={20} color="#9CA3AF" />
                  </TouchableOpacity>
              )}
          </View>
          <View style={styles.tabsContainer}>
            <FlatList 
                horizontal
                showsHorizontalScrollIndicator={false}
                data={['All', 'pending', 'cooking', 'Ready', 'Out', 'delivered']}
                keyExtractor={item => item}
                renderItem={({ item }) => renderFilterTab(item)}
            />
          </View>
      </View>

      {/* List */}
      {loading ? (
        <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={filteredOrders}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 15, paddingBottom: 50 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
                <Ionicons name="documents-outline" size={50} color="#ccc" />
                <Text style={styles.emptyText}>No orders found.</Text>
            </View>
          }
        />
      )}

      {/* --- MODAL 1: ORDER DETAILS --- */}
      <Modal visible={modalVisible} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                  <View style={styles.modalHeader}>
                      <Text style={styles.modalTitle}>Order Details #{selectedOrder?.id}</Text>
                      <TouchableOpacity onPress={() => setModalVisible(false)} style={{padding:5}}>
                          <Ionicons name="close" size={24} color="#000" />
                      </TouchableOpacity>
                  </View>
                  {selectedOrder && (
                      <View>
                          <Text style={styles.sectionHeader}>Customer Info</Text>
                          <View style={styles.infoBox}>
                              <Text style={styles.infoText}>Name: {selectedOrder.user?.name}</Text>
                              <View style={{flexDirection:'row', alignItems:'center', justifyContent:'space-between', marginTop:5}}>
                                  <Text style={styles.infoText}>Phone: {selectedOrder.mobile_no}</Text>
                                  <TouchableOpacity onPress={() => makeCall(selectedOrder.mobile_no)}>
                                      <Ionicons name="call" size={20} color={COLORS.primary} />
                                  </TouchableOpacity>
                              </View>
                              <Text style={[styles.infoText, {marginTop:5}]}>
                                  Address: {selectedOrder.address || "No address provided"}
                              </Text>
                          </View>
                          <Text style={styles.sectionHeader}>Payment & Status</Text>
                          <View style={styles.infoBox}>
                              <View style={{flexDirection:'row', justifyContent:'space-between'}}>
                                  <Text style={styles.infoText}>Total Amount:</Text>
                                  <Text style={[styles.infoText, {fontWeight:'bold', color: COLORS.primary}]}>
                                      ₹{selectedOrder.total_amount}
                                  </Text>
                              </View>
                              <Text style={[styles.infoText, {marginTop:5}]}>
                                  Status: {selectedOrder.status.toUpperCase()}
                              </Text>
                          </View>
                      </View>
                  )}
                  <TouchableOpacity style={styles.closeBtn} onPress={() => setModalVisible(false)}>
                      <Text style={styles.closeBtnText}>Close Details</Text>
                  </TouchableOpacity>
              </View>
          </View>
      </Modal>

      {/* --- MODAL 2: SELECT DRIVER --- */}
      <Modal visible={driverModalVisible} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
              <View style={[styles.modalContent, {maxHeight: '60%'}]}>
                  <View style={styles.modalHeader}>
                      <Text style={styles.modalTitle}>Select Delivery Partner</Text>
                      <TouchableOpacity onPress={() => setDriverModalVisible(false)}>
                          <Ionicons name="close" size={24} color="#000" />
                      </TouchableOpacity>
                  </View>

                  <FlatList 
                    data={drivers}
                    keyExtractor={item => item.id.toString()}
                    renderItem={({item}) => (
                        <TouchableOpacity style={styles.driverRow} onPress={() => assignDriver(item.id)}>
                            <View style={styles.driverAvatar}>
                                <Text style={{fontWeight:'bold', color: COLORS.primary}}>{item.name[0]}</Text>
                            </View>
                            <View>
                                <Text style={styles.driverName}>{item.name}</Text>
                                <Text style={styles.driverPhone}>{item.mobile_no}</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color="#CCC" style={{marginLeft:'auto'}} />
                        </TouchableOpacity>
                    )}
                    ListEmptyComponent={<Text style={{textAlign:'center', padding: 20, color:'#999'}}>No drivers found. Add them in the Drivers Tab.</Text>}
                  />
              </View>
          </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.light },

  // Header
  headerContainer: { backgroundColor: COLORS.white, padding: 15, paddingBottom: 10, borderBottomWidth: 1, borderColor: COLORS.border },
  screenTitle: { fontSize: 22, fontWeight: 'bold', color: COLORS.dark, marginBottom: 10 },
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F3F4F6', borderRadius: 10, paddingHorizontal: 12, height: 45, marginBottom: 15 },
  input: { flex: 1, marginLeft: 10, fontSize: 16, color: COLORS.dark },
  
  // Tabs
  tabsContainer: { flexDirection: 'row' },
  filterTab: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#F3F4F6', marginRight: 8, borderWidth: 1, borderColor: 'transparent' },
  activeFilterTab: { backgroundColor: COLORS.dark },
  filterText: { fontWeight: '600', color: '#6B7280', fontSize: 13, textTransform:'capitalize' },
  activeFilterText: { color: COLORS.white },

  // Card
  card: { backgroundColor: COLORS.white, borderRadius: 12, padding: 15, marginBottom: 15, elevation: 2, shadowColor: '#000', shadowOffset: {width:0, height:1}, shadowOpacity: 0.08 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  orderId: { fontSize: 17, fontWeight: 'bold', color: COLORS.dark },
  timeAgo: { fontSize: 13, color: '#9CA3AF' },
  badge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  badgeText: { fontSize: 10, fontWeight: 'bold' },

  customerRow: { marginBottom: 5 },
  customerName: { fontSize: 15, color: '#4B5563', fontWeight: '500' },
  customerPhone: { fontSize: 13, color: '#9CA3AF', marginTop: 2 },
  driverText: { fontSize: 12, color: COLORS.out, fontWeight: 'bold', marginTop: 2, marginBottom: 5 },

  divider: { height: 1, backgroundColor: COLORS.border, marginBottom: 10 },

  itemRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  qtyBox: { backgroundColor: '#F3F4F6', color: COLORS.dark, fontWeight: 'bold', fontSize: 13, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4, marginRight: 10 },
  itemName: { flex: 1, fontSize: 15, color: COLORS.dark },
  itemPrice: { fontSize: 14, color: '#6B7280' },

  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: COLORS.border },
  totalLabel: { fontSize: 12, color: '#6B7280' },
  totalAmount: { fontSize: 18, fontWeight: 'bold', color: COLORS.primary },

  actionBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8 },
  actionBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 13 },

  emptyContainer: { alignItems: 'center', marginTop: 50 },
  emptyText: { color: '#9CA3AF', marginTop: 10, fontSize: 16 },

  // Modals
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#FFF', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: 'bold' },
  sectionHeader: { fontSize: 12, color: '#9CA3AF', fontWeight: 'bold', textTransform: 'uppercase', marginTop: 15, marginBottom: 5 },
  infoBox: { backgroundColor: '#F9FAFB', padding: 12, borderRadius: 8 },
  infoText: { fontSize: 15, color: '#374151' },
  closeBtn: { backgroundColor: COLORS.dark, padding: 15, borderRadius: 10, alignItems: 'center', marginTop: 25 },
  closeBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },

  // Driver Row Styles
  driverRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderColor: '#F3F4F6' },
  driverAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#FEE2E2', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  driverName: { fontWeight: 'bold', fontSize: 16, color: COLORS.dark },
  driverPhone: { fontSize: 12, color: '#9CA3AF' }
});