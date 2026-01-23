import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  TouchableOpacity, 
  StyleSheet, 
  Alert, 
  Modal,
  ScrollView,
  RefreshControl,
  Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';

// --- COLOR SCHEME ---
const COLORS = {
  primary: '#D23F45',    // Deep Red
  gold: '#FEC94A',       // Gold/Yellow
  dark: '#1A1A1A',       // Text
  lightGrey: '#F8F8F8',  // Background
  white: '#FFFFFF',
  border: '#EEEEEE',
  success: '#4CAF50',
};

const { width } = Dimensions.get('window');

const AdminDashboard = ({ navigation }) => {
  const [stats, setStats] = useState({
    total_orders: 0,
    total_customers: 0,
    total_products: 0,
    total_categories: 0,
    total_sales: 0,
    today_sales: 0,
    total_drivers: 0
  });
  
  const [orders, setOrders] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  // Initial Load
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setRefreshing(true);
    await Promise.all([fetchStats(), fetchOrders()]);
    setRefreshing(false);
  };

  const fetchStats = async () => {
    try {
      const res = await api.get('/admin/stats');
      setStats(res.data);
    } catch (e) {
      console.log("Stats Error", e);
    }
  };

  const fetchOrders = async () => {
    try {
      const res = await api.get('/admin/orders');
      setOrders(res.data);
    } catch (e) {
      console.log("Orders Error", e);
    }
  };

  // --- STAT CARD COMPONENT ---
  const StatCard = ({ title, value, icon, color, onPress, isMoney }) => (
    <TouchableOpacity 
      style={[styles.statCard, { borderTopColor: color }]} 
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={[styles.iconBox, { backgroundColor: color + '20' }]}>
        <Ionicons name={icon} size={24} color={color} />
      </View>
      <View>
        <Text style={styles.statValue}>
          {isMoney ? '₹' : ''}{value}
        </Text>
        <Text style={styles.statTitle}>{title}</Text>
      </View>
    </TouchableOpacity>
  );

  // --- ORDER LIST ITEM ---
  const renderOrderItem = ({ item }) => (
    <View style={styles.orderItem}>
      <View style={styles.orderRow}>
        <Text style={styles.orderId}>#{item.id}</Text>
        <Text style={[styles.statusBadge, { color: item.status === 'pending' ? COLORS.primary : COLORS.success }]}>
          {item.status.toUpperCase()}
        </Text>
      </View>
      <Text style={styles.customerName}>{item.user ? item.user.name : "Guest"}</Text>
      <View style={styles.orderRow}>
        <Text style={styles.orderPrice}>₹{item.total_amount}</Text>
        <Text style={styles.orderTime}>{new Date(item.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hello, Chef! 👨‍🍳</Text>
          <Text style={styles.subGreeting}>Here is what's happening today.</Text>
        </View>
        <TouchableOpacity onPress={loadData} style={styles.refreshBtn}>
          <Ionicons name="reload" size={20} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadData} />}
      >
        
        {/* --- STATS GRID --- */}
        <View style={styles.gridContainer}>
          <StatCard 
            title="Total Orders" 
            value={stats.total_orders} 
            icon="receipt" 
            color={COLORS.primary} 
            // CHANGE THIS LINE:
            onPress={() => navigation.navigate('Orders')} 
          />
          <StatCard 
            title="Total Customers" 
            value={stats.total_customers} 
            icon="people" 
            color="#2196F3" 
            // CHANGE THIS LINE:
            onPress={() => navigation.navigate('Customers')} 
          />
          <StatCard 
            title="Total Revenue" 
            value={stats.total_sales} 
            icon="wallet" 
            color={COLORS.success} 
            isMoney 
            onPress={() => Alert.alert("Revenue", "View Detailed Analytics")} 
          />
          <StatCard 
            title="Today's Sale" 
            value={stats.today_sales} 
            icon="cash" 
            color={COLORS.gold} 
            isMoney 
            onPress={() => Alert.alert("Today", "View Today's Report")} 
          />
          <StatCard 
            title="Products" 
            value={stats.total_products} 
            icon="fast-food" 
            color="#FF9800" 
            onPress={() => Alert.alert("Catalog", "Manage Menu Items")} 
          />
          <StatCard 
            title="Drivers" 
            value={stats.total_drivers} 
            icon="bicycle" 
            color="#9C27B0" 
            onPress={() => Alert.alert("Fleet", "Manage Drivers")} 
          />
        </View>

        {/* --- RECENT ORDERS SECTION --- */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Orders</Text>
          <TouchableOpacity>
            <Text style={styles.seeAll}>See All</Text>
          </TouchableOpacity>
        </View>

        {/* Keeping the list inline here for quick access */}
        <FlatList 
          data={orders.slice(0, 5)} // Show only top 5 recent
          keyExtractor={item => item.id.toString()}
          renderItem={renderOrderItem}
          scrollEnabled={false} // Let parent ScrollView handle scrolling
          ListEmptyComponent={
            <Text style={styles.emptyText}>No active orders right now.</Text>
          }
        />

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.lightGrey },
  
  header: { 
    padding: 20, 
    backgroundColor: COLORS.white, 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border
  },
  greeting: { fontSize: 24, fontWeight: 'bold', color: COLORS.dark },
  subGreeting: { color: '#888', fontSize: 14, marginTop: 2 },
  refreshBtn: { 
    backgroundColor: COLORS.primary, 
    padding: 10, 
    borderRadius: 8,
    elevation: 2
  },

  scrollContent: { padding: 15 },

  // Grid
  gridContainer: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    justifyContent: 'space-between',
    marginBottom: 20
  },
  statCard: {
    width: (width / 2) - 22, // 2 columns with spacing
    backgroundColor: COLORS.white,
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
    elevation: 3,
    borderTopWidth: 4, // Colored top border
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    shadowOffset: {width:0, height:2}
  },
  iconBox: {
    width: 40, height: 40,
    borderRadius: 20,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 10
  },
  statValue: { fontSize: 22, fontWeight: 'bold', color: COLORS.dark },
  statTitle: { fontSize: 12, color: '#666', marginTop: 2 },

  // Recent Orders
  sectionHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 10,
    marginTop: 10
  },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.dark },
  seeAll: { color: COLORS.primary, fontWeight: '600' },

  orderItem: {
    backgroundColor: COLORS.white,
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.border
  },
  orderRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  orderId: { fontWeight: 'bold', fontSize: 16, color: COLORS.dark },
  statusBadge: { fontWeight: 'bold', fontSize: 12 },
  customerName: { color: '#555', fontSize: 14, marginBottom: 5 },
  orderPrice: { fontWeight: 'bold', color: COLORS.primary },
  orderTime: { color: '#999', fontSize: 12 },

  emptyText: { textAlign: 'center', color: '#999', marginTop: 20 }
});

export default AdminDashboard;