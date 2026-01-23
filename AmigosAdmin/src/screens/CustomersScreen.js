import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  Linking,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';

const COLORS = {
  primary: '#D23F45',
  dark: '#1A1A1A',
  white: '#FFFFFF',
  lightGrey: '#F8F8F8',
  border: '#EEEEEE',
  blue: '#2196F3'
};

const CustomersScreen = ({ navigation }) => {
  const [customers, setCustomers] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchCustomers();
  }, []);

  useEffect(() => {
    handleSearch(searchQuery);
  }, [searchQuery, customers]);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/customers');
      setCustomers(res.data);
      setFilteredCustomers(res.data);
    } catch (error) {
      console.log("Error fetching customers:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (text) => {
    setSearchQuery(text);
    if (!text) {
        setFilteredCustomers(customers);
        return;
    }
    
    const lowerText = text.toLowerCase();
    const filtered = customers.filter(user => 
        user.name.toLowerCase().includes(lowerText) || 
        user.mobile_no.includes(lowerText)
    );
    setFilteredCustomers(filtered);
  };

  const handleCall = (mobile) => {
      Linking.openURL(`tel:${mobile}`);
  };

  const renderCustomerCard = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.avatar}>
            <Text style={styles.avatarText}>{item.name.charAt(0).toUpperCase()}</Text>
        </View>
        <View style={styles.headerInfo}>
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.joined}>Joined: {new Date(item.created_at).toLocaleDateString()}</Text>
        </View>
        <TouchableOpacity style={styles.callBtn} onPress={() => handleCall(item.mobile_no)}>
            <Ionicons name="call" size={20} color="#FFF" />
        </TouchableOpacity>
      </View>

      <View style={styles.divider} />

      <View style={styles.details}>
          <View style={styles.detailRow}>
              <Ionicons name="phone-portrait-outline" size={16} color="#666" />
              <Text style={styles.detailText}>{item.mobile_no}</Text>
          </View>
          <View style={styles.detailRow}>
              <Ionicons name="location-outline" size={16} color="#666" />
              <Text style={styles.detailText} numberOfLines={1}>
                  {item.address || "No address provided"}
              </Text>
          </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={COLORS.dark} />
          </TouchableOpacity>
          <Text style={styles.title}>Customers</Text>
      </View>

      {/* SEARCH BAR */}
      <View style={styles.searchContainer}>
          <View style={styles.searchBox}>
              <Ionicons name="search" size={20} color="#666" />
              <TextInput 
                  style={styles.input}
                  placeholder="Search Name or Phone..."
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

      {/* LIST */}
      {loading ? (
          <ActivityIndicator size="large" color={COLORS.primary} style={{marginTop: 50}} />
      ) : (
          <FlatList 
              data={filteredCustomers}
              keyExtractor={item => item.id.toString()}
              renderItem={renderCustomerCard}
              contentContainerStyle={styles.listContent}
              ListEmptyComponent={
                  <Text style={styles.emptyText}>No customers found.</Text>
              }
          />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F2' },
  
  header: { 
      backgroundColor: COLORS.white, padding: 15, flexDirection: 'row', 
      alignItems: 'center', borderBottomWidth: 1, borderBottomColor: COLORS.border 
  },
  backBtn: { marginRight: 15 },
  title: { fontSize: 20, fontWeight: 'bold', color: COLORS.dark },

  searchContainer: { padding: 15, backgroundColor: COLORS.white },
  searchBox: { 
      flexDirection: 'row', alignItems: 'center', backgroundColor: '#F5F5F5', 
      borderRadius: 10, paddingHorizontal: 10, height: 45, borderWidth: 1, borderColor: COLORS.border
  },
  input: { flex: 1, marginLeft: 10, fontSize: 16 },

  listContent: { padding: 15 },

  card: { 
      backgroundColor: COLORS.white, borderRadius: 12, padding: 15, marginBottom: 15,
      shadowColor: "#000", shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.1, elevation: 3
  },
  
  cardHeader: { flexDirection: 'row', alignItems: 'center' },
  avatar: { 
      width: 50, height: 50, borderRadius: 25, backgroundColor: '#FFEBEE', 
      justifyContent: 'center', alignItems: 'center', marginRight: 15 
  },
  avatarText: { fontSize: 20, fontWeight: 'bold', color: COLORS.primary },
  headerInfo: { flex: 1 },
  name: { fontSize: 16, fontWeight: 'bold', color: COLORS.dark },
  joined: { fontSize: 12, color: '#999' },
  
  callBtn: { 
      backgroundColor: COLORS.success || '#4CAF50', width: 40, height: 40, 
      borderRadius: 20, justifyContent: 'center', alignItems: 'center' 
  },

  divider: { height: 1, backgroundColor: COLORS.border, marginVertical: 12 },

  details: { gap: 8 },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  detailText: { color: '#555', fontSize: 14, flex: 1 },

  emptyText: { textAlign: 'center', marginTop: 50, color: '#888' }
});

export default CustomersScreen;