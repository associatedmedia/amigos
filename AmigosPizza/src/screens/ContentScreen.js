import React, { useState } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  Image, 
  StyleSheet, 
  TextInput, 
  RefreshControl, 
  ActivityIndicator,
  TouchableOpacity 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useMenuData } from '../hooks/useMenuData'; 

export default function ContentScreen() {
  const { categories, products, loading, isOffline, refresh } = useMenuData();
  const [searchText, setSearchText] = useState('');

  const filteredProducts = products.filter(item => 
    item.name.toLowerCase().includes(searchText.toLowerCase()) ||
    (item.category && item.category.toLowerCase().includes(searchText.toLowerCase()))
  );

  // ✅ FIX: Changed from implicit return (...) to explicit return { ... return (...) }
  const renderProduct = ({ item }) => {
    
    // 1. SAFETY CHECK: Ensure we never pass an empty string to Image
    const hasValidImage = item.image_url && item.image_url !== "" && item.image_url !== null;
    
    // 2. Decide which image to show
    const imageSource = hasValidImage 
      ? { uri: item.image_url } 
      : { uri: 'https://placehold.co/150x150/png?text=No+Image' }; 

    return (
      <View style={styles.card}>
        <Image 
          source={imageSource} 
          style={styles.image} 
          resizeMode="cover"
        />
        
        <View style={styles.details}>
          <View style={styles.row}>
            <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
            <View style={[styles.dot, { borderColor: item.is_veg ? 'green' : 'red' }]}>
               <View style={[styles.innerDot, { backgroundColor: item.is_veg ? 'green' : 'red' }]} />
            </View>
          </View>
          
          <Text style={styles.category}>{item.category || 'General'}</Text>
          
          <View style={styles.priceRow}>
            <Text style={styles.price}>₹{item.price}</Text>
            <TouchableOpacity style={styles.editBtn}>
               <Ionicons name="create-outline" size={18} color="#4F46E5" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      
      <View style={styles.header}>
        <Text style={styles.title}>Menu Manager</Text>
        <Text style={styles.subtitle}>{products.length} Items Loaded</Text>
      </View>

      {isOffline && (
        <View style={styles.offlineBanner}>
          <Ionicons name="cloud-offline" size={16} color="#B91C1C" />
          <Text style={styles.offlineText}> You are Offline. Showing cached menu.</Text>
        </View>
      )}

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#9CA3AF" />
        <TextInput 
          style={styles.searchInput}
          placeholder="Search pizza, burger, etc..."
          value={searchText}
          onChangeText={setSearchText}
        />
        {searchText.length > 0 && (
          <TouchableOpacity onPress={() => setSearchText('')}>
             <Ionicons name="close-circle" size={20} color="#9CA3AF" />
          </TouchableOpacity>
        )}
      </View>

      {loading && products.length === 0 ? (
        <View style={styles.center}>
            <ActivityIndicator size="large" color="#D23F45" />
            <Text style={{ marginTop: 10, color: '#666' }}>Loading Menu...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredProducts}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderProduct}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={loading} onRefresh={refresh} tintColor="#D23F45" />
          }
          ListEmptyComponent={
            <View style={styles.center}>
                <Text style={{ color: '#999', marginTop: 50 }}>No items found</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: { paddingHorizontal: 20, paddingVertical: 15 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#1F2937' },
  subtitle: { fontSize: 14, color: '#6B7280' },
  offlineBanner: { 
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#FEE2E2', padding: 8, marginHorizontal: 20, borderRadius: 8, marginBottom: 10 
  },
  offlineText: { color: '#B91C1C', fontWeight: '600', fontSize: 12 },
  searchContainer: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FFF', marginHorizontal: 20, paddingHorizontal: 15, paddingVertical: 12,
    borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB', marginBottom: 15,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5, elevation: 2
  },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 16, color: '#374151' },
  listContent: { paddingHorizontal: 20, paddingBottom: 20 },
  card: {
    flexDirection: 'row', backgroundColor: '#FFF', borderRadius: 16, marginBottom: 12,
    padding: 10, alignItems: 'center',
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5, elevation: 2
  },
  image: { width: 70, height: 70, borderRadius: 12, backgroundColor: '#F3F4F6' },
  details: { flex: 1, marginLeft: 15 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  name: { fontSize: 16, fontWeight: '700', color: '#1F2937', flex: 1, marginRight: 5 },
  category: { fontSize: 12, color: '#9CA3AF', marginVertical: 2 },
  priceRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 },
  price: { fontSize: 15, fontWeight: 'bold', color: '#059669' },
  editBtn: { padding: 5, backgroundColor: '#EEF2FF', borderRadius: 8 },
  dot: { width: 14, height: 14, borderWidth: 1, justifyContent: 'center', alignItems: 'center', borderRadius: 2 },
  innerDot: { width: 8, height: 8, borderRadius: 4 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' }
});