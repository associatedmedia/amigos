import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  StyleSheet, 
  RefreshControl,
  ActivityIndicator,
  Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import api from '../services/api'; // Ensure this path is correct

// --- BRAND COLORS ---
const COLORS = {
  primary: '#D23F45',    // Amigos Red
  secondary: '#FEC94A',  // Amigos Gold
  dark: '#1F2937',       // Dark Text
  light: '#F9FAFB',      // Background
  white: '#FFFFFF',
  success: '#10B981',    // Green for Money
  blue: '#3B82F6',       // Blue for People
  border: '#E5E7EB'
};

const { width } = Dimensions.get('window');

const AdminDashboard = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Default State (matches your Laravel JSON structure)
  const [stats, setStats] = useState({
    total_orders: 0,
    total_customers: 0,
    total_products: 0,
    total_sales: 0,
    today_sales: 0,
    total_drivers: 0
  });

  // 1. Fetch Data Function
  const fetchStats = async () => {
    try {
      const response = await api.get('/admin/stats');
      setStats(response.data);
    } catch (error) {
      console.log("Error fetching stats:", error);
      // Optional: Alert.alert("Error", "Could not load dashboard data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // 2. Refresh when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchStats();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchStats();
  };

  // --- REUSABLE STAT CARD COMPONENT ---
  const StatCard = ({ title, value, icon, color, onPress, isMoney }) => (
    <TouchableOpacity 
      style={[styles.card, { borderTopColor: color }]} 
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.iconContainer, { backgroundColor: color + '15' }]}> 
        {/* '15' adds transparency to the hex color */}
        <Ionicons name={icon} size={22} color={color} />
      </View>
      <View>
        <Text style={styles.cardValue}>
          {isMoney ? '₹' : ''}{Number(value).toLocaleString()}
        </Text>
        <Text style={styles.cardTitle}>{title}</Text>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      
      {/* HEADER */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Overview</Text>
          <Text style={styles.headerSubtitle}>Amigos Kitchen Manager</Text>
        </View>
        <TouchableOpacity style={styles.profileBtn} onPress={() => navigation.navigate('Profile')}>
           <Ionicons name="person-circle" size={40} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />}
      >
        
        {/* --- SECTION 1: TODAY'S HIGHLIGHTS --- */}
        <Text style={styles.sectionTitle}>Today's Performance 🚀</Text>
        <View style={styles.highlightCard}>
          <View style={styles.highlightRow}>
            <View>
              <Text style={styles.highlightLabel}>Today's Sales</Text>
              <Text style={styles.highlightValue}>₹{Number(stats.today_sales).toLocaleString()}</Text>
            </View>
            <View style={styles.highlightIconBox}>
              <Ionicons name="trending-up" size={28} color="#fff" />
            </View>
          </View>
          <Text style={styles.highlightFooter}>Updated just now</Text>
        </View>

        {/* --- SECTION 2: QUICK ACTIONS GRID --- */}
        <Text style={styles.sectionTitle}>Management Grid</Text>
        <View style={styles.gridContainer}>
          
          {/* 1. ORDERS -> Goes to Kitchen Display */}
          <StatCard 
            title="Active Orders" 
            value={stats.total_orders} 
            icon="restaurant" 
            color={COLORS.primary} 
            onPress={() => navigation.navigate('Orders')} 
          />

          {/* 2. CUSTOMERS -> Goes to Customer List */}
          <StatCard 
            title="Total Customers" 
            value={stats.total_customers} 
            icon="people" 
            color={COLORS.blue} 
            onPress={() => navigation.navigate('Customers')} 
          />

          {/* 3. REVENUE (Non-clickable or goes to detailed report) */}
          <StatCard 
            title="Total Revenue" 
            value={stats.total_sales} 
            icon="wallet" 
            color={COLORS.success} 
            isMoney
            onPress={() => alert("Detailed Report Coming Soon!")} 
          />

          {/* 4. PRODUCTS (Future: Edit Menu) */}
          <StatCard 
            title="Menu Items" 
            value={stats.total_products} 
            icon="fast-food" 
            color={COLORS.secondary} 
            onPress={() => navigation.navigate('Content')} 
          />

        </View>

        {/* --- SECTION 3: QUICK LINKS --- */}
        <View style={styles.quickLinksContainer}>
            <TouchableOpacity style={styles.linkButton} onPress={() => navigation.navigate('Orders')}>
                <Ionicons name="receipt-outline" size={20} color="#fff" />
                <Text style={styles.linkText}>View Live Kitchen</Text>
            </TouchableOpacity>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.light },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  
  // Header
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: 20, 
    paddingVertical: 15,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border
  },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: COLORS.dark },
  headerSubtitle: { fontSize: 14, color: '#6B7280' },

  scrollContent: { padding: 20 },

  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.dark, marginBottom: 15, marginTop: 10 },

  // Today's Highlight Card (Big Red Card)
  highlightCard: {
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    padding: 20,
    marginBottom: 25,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5
  },
  highlightRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  highlightLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 14, fontWeight: '600' },
  highlightValue: { color: '#fff', fontSize: 32, fontWeight: 'bold', marginTop: 5 },
  highlightIconBox: { backgroundColor: 'rgba(255,255,255,0.2)', padding: 10, borderRadius: 12 },
  highlightFooter: { color: 'rgba(255,255,255,0.6)', fontSize: 12, marginTop: 15 },

  // Grid System
  gridContainer: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    justifyContent: 'space-between'
  },
  card: {
    width: (width / 2) - 25, // 2 columns
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    borderTopWidth: 4, // Colored Top Border
    // Shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2
  },
  iconContainer: { 
    width: 38, height: 38, 
    borderRadius: 10, 
    justifyContent: 'center', alignItems: 'center', 
    marginBottom: 12 
  },
  cardValue: { fontSize: 20, fontWeight: 'bold', color: COLORS.dark },
  cardTitle: { fontSize: 12, color: '#6B7280', marginTop: 2, fontWeight: '500' },

  // Quick Links
  quickLinksContainer: { marginTop: 10 },
  linkButton: { 
    backgroundColor: COLORS.dark, 
    flexDirection: 'row', 
    justifyContent: 'center', 
    alignItems: 'center', 
    padding: 15, 
    borderRadius: 12 
  },
  linkText: { color: '#fff', fontWeight: 'bold', marginLeft: 10 }
});

export default AdminDashboard;