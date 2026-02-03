import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  Linking,
  ActivityIndicator,
  Platform,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context'; // ✅ FIXED: Safe Area Import
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';

const COLORS = {
  primary: '#D23F45',
  secondary: '#FEC94A',
  dark: '#1F2937',
  light: '#F9FAFB',
  white: '#FFFFFF',
  border: '#E5E7EB',
  green: '#10B981', // Call Color
  whatsapp: '#25D366' // Official WhatsApp Color
};

export default function CustomersScreen() {
  const [customers, setCustomers] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const response = await api.get('/admin/customers');
      setCustomers(response.data);
      setFilteredCustomers(response.data);
    } catch (error) {
      console.log("Error fetching customers:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (text) => {
    setSearch(text);
    if (text) {
      const newData = customers.filter(item => {
        const itemData = item.name ? item.name.toUpperCase() : ''.toUpperCase();
        const phoneData = item.mobile_no ? item.mobile_no : '';
        const textData = text.toUpperCase();
        return itemData.indexOf(textData) > -1 || phoneData.indexOf(textData) > -1;
      });
      setFilteredCustomers(newData);
    } else {
      setFilteredCustomers(customers);
    }
  };

  // --- ACTION: MAKE CALL ---
  const makeCall = (phoneNumber) => {
    if (!phoneNumber) return;
    Linking.openURL(`tel:${phoneNumber}`);
  };

  // --- ACTION: OPEN WHATSAPP ---
  const openWhatsApp = async (phoneNumber) => {
    if (!phoneNumber) {
      Alert.alert("Error", "No phone number available");
      return;
    }

    // 1. Clean the number (remove spaces, dashes, + signs)
    let cleanNumber = phoneNumber.replace(/[^\d]/g, '');

    // 2. Add Country Code (91) if it's just 10 digits
    if (cleanNumber.length === 10) {
        cleanNumber = '91' + cleanNumber;
    }

    // 3. The URL
    const url = `whatsapp://send?phone=${cleanNumber}`;

    // 4. Open Directly (Bypassing canOpenURL check)
    try {
        await Linking.openURL(url);
    } catch (err) {
        // If this block runs, it means WhatsApp is truly not installed
        Alert.alert("Error", "Could not open WhatsApp. Please ensure it is installed.");
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        {/* Avatar */}
        <View style={styles.avatarContainer}>
          <Text style={styles.avatarText}>{item.name?.charAt(0).toUpperCase() || 'U'}</Text>
        </View>
        
        {/* Info */}
        <View style={styles.infoContainer}>
          <Text style={styles.name}>{item.name || 'Guest User'}</Text>
          <Text style={styles.phone}>{item.mobile_no || 'No Phone'}</Text>
          <Text style={styles.email}>{item.email}</Text>
        </View>

        {/* --- ACTION BUTTONS ROW --- */}
        <View style={styles.actionsRow}>
            
            {/* Call Button */}
            <TouchableOpacity 
                style={[styles.actionBtn, { backgroundColor: COLORS.green }]} 
                onPress={() => makeCall(item.mobile_no)}
            >
                <Ionicons name="call" size={18} color="#fff" />
            </TouchableOpacity>

            {/* WhatsApp Button */}
            <TouchableOpacity 
                style={[styles.actionBtn, { backgroundColor: COLORS.whatsapp, marginLeft: 10 }]} 
                onPress={() => openWhatsApp(item.mobile_no)}
            >
                <Ionicons name="logo-whatsapp" size={18} color="#fff" />
            </TouchableOpacity>

        </View>
      </View>

      <View style={styles.divider} />

      {/* Stats Footer */}
      <View style={styles.statsRow}>
        <View style={styles.stat}>
            <Text style={styles.statLabel}>Total Orders</Text>
            <Text style={styles.statValue}>{item.orders_count || 0}</Text>
        </View>
        <View style={styles.stat}>
            <Text style={styles.statLabel}>Loyalty Status</Text>
            {item.orders_count > 5 ? (
                <Text style={[styles.badge, { color: COLORS.secondary }]}>👑 VIP Member</Text>
            ) : (
                <Text style={[styles.badge, { color: '#6B7280' }]}>New Customer</Text>
            )}
        </View>
      </View>
    </View>
  );

  return (
    // ✅ FIXED: Using SafeAreaView for Android/iOS Notch support
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      
      {/* Title Header */}
      <View style={styles.screenHeader}>
          <Text style={styles.screenTitle}>Customer Database</Text>
          <Text style={styles.screenSubtitle}>{filteredCustomers.length} Active Clients</Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#9CA3AF" style={{ marginRight: 10 }} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by Name or Phone..."
          placeholderTextColor="#9CA3AF"
          value={search}
          onChangeText={handleSearch}
        />
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={filteredCustomers}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 15, paddingBottom: 50 }}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No customers found.</Text>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.light },

  screenHeader: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 5 },
  screenTitle: { fontSize: 24, fontWeight: 'bold', color: COLORS.dark },
  screenSubtitle: { fontSize: 14, color: '#6B7280' },
  
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    margin: 15,
    paddingHorizontal: 15,
    borderRadius: 12,
    height: 50,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5, elevation: 2
  },
  searchInput: { flex: 1, fontSize: 16, color: COLORS.dark },

  card: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 3
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center' },
  
  avatarContainer: {
    width: 50, height: 50,
    borderRadius: 25,
    backgroundColor: '#FFE4E6', // Light Red
    justifyContent: 'center', alignItems: 'center',
    marginRight: 15
  },
  avatarText: { fontSize: 22, fontWeight: 'bold', color: COLORS.primary },
  
  infoContainer: { flex: 1 },
  name: { fontSize: 16, fontWeight: 'bold', color: COLORS.dark },
  phone: { fontSize: 14, color: '#6B7280', marginTop: 2 },
  email: { fontSize: 12, color: '#9CA3AF' },

  actionsRow: { flexDirection: 'row' },
  actionBtn: {
    width: 38, height: 38,
    borderRadius: 19,
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#000', shadowOpacity: 0.2, shadowOffset: {width:0,height:2}, elevation: 3
  },

  divider: { height: 1, backgroundColor: COLORS.border, marginVertical: 12 },

  statsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  statLabel: { fontSize: 12, color: '#9CA3AF' },
  statValue: { fontSize: 16, fontWeight: 'bold', color: COLORS.dark },
  badge: { fontSize: 14, fontWeight: 'bold' },

  emptyText: { textAlign: 'center', marginTop: 50, color: '#9CA3AF', fontSize: 16 }
});