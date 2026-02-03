import React, { useState, useEffect } from 'react';
import { 
  View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet, 
  Switch, Image, ActivityIndicator, Alert, Platform 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker'; 
import api from '../services/api';

const COLORS = {
  primary: '#D23F45',    
  secondary: '#FEC94A',  
  dark: '#1F2937', 
  light: '#F3F4F6', 
  white: '#FFFFFF', 
  border: '#E5E7EB',
  danger: '#EF4444',
  success: '#10B981'
};

export default function ContentScreen() {
  const [activeTab, setActiveTab] = useState('menu'); 
  const [loading, setLoading] = useState(false);

  // --- MENU STATE ---
  const [products, setProducts] = useState([]); // Stores the flattened list
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  // --- BANNER STATE ---
  const [banners, setBanners] = useState([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (activeTab === 'menu') fetchProducts();
    else fetchBanners();
  }, [activeTab]);

  // ==========================
  //      MENU MANAGER
  // ==========================
  const fetchProducts = async () => {
    setLoading(true);
    try {
      // 1. Get Nested Data from /api/menu
      const res = await api.get('/menu'); 
      
      if (res.data.success) {
        const categories = res.data.data;
        let flatList = [];

        // 2. Flatten the structure (Category -> Products) into one list
        categories.forEach(cat => {
            if(cat.products && cat.products.length > 0) {
                cat.products.forEach(prod => {
                    flatList.push({
                        ...prod, 
                        category_name: cat.category_name // Attach category name to product
                    });
                });
            }
        });

        setProducts(flatList);
        setFilteredProducts(flatList);
      }
    } catch (err) {
      console.log("Error fetching menu:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (text) => {
    setSearchQuery(text);
    if (text) {
      const lower = text.toLowerCase();
      // Search by Product Name OR Category Name
      const results = products.filter(p => 
        p.name.toLowerCase().includes(lower) || 
        p.category_name.toLowerCase().includes(lower)
      );
      setFilteredProducts(results);
    } else {
      setFilteredProducts(products);
    }
  };

  const toggleProduct = async (id, currentStatus) => {
    // Note: API returns 'is_available' (1 or 0)
    const newStatus = currentStatus === 1 ? 0 : 1;

    // 1. Optimistic Update (Update UI immediately)
    const updatedList = products.map(p => 
        p.id === id ? { ...p, is_available: newStatus } : p
    );
    setProducts(updatedList);
    
    // Update filtered list too so search results don't revert
    setFilteredProducts(prev => prev.map(p => 
        p.id === id ? { ...p, is_available: newStatus } : p
    ));

    try {
      // 2. Send to Server
      await api.post(`/admin/products/${id}/toggle`);
    } catch (err) {
      Alert.alert("Error", "Failed to update status. Check connection.");
      fetchProducts(); // Revert on fail
    }
  };

  // ==========================
  //     BANNER MANAGER
  // ==========================
  const fetchBanners = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/sliders');
      setBanners(res.data);
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

 const pickImage = async () => {
    try {
      console.log("Requesting permission...");
      
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (permissionResult.granted === false) {
        Alert.alert("Permission Required", "You need to allow photo access to upload banners.");
        return;
      }

      console.log("Opening gallery...");

      // ✅ SAFE FIX: Check which property exists before using it
      const mediaTypesSetting = ImagePicker.MediaTypeOptions 
          ? ImagePicker.MediaTypeOptions.Images  // Old/Stable way
          : ImagePicker.MediaType 
              ? ImagePicker.MediaType.Images     // New way
              : 'Images';                        // Fallback string

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: mediaTypesSetting,
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
      });

      console.log("Gallery Result:", result.canceled ? "Cancelled" : "Image Picked");

      if (!result.canceled) {
        uploadBanner(result.assets[0]);
      }

    } catch (error) {
      console.log("Error opening image picker:", error);
      Alert.alert("Error", "Could not open gallery.");
    }
  };
  const uploadBanner = async (asset) => {
    setUploading(true);
    
    const formData = new FormData();
    formData.append('image', {
      uri: Platform.OS === 'ios' ? asset.uri.replace('file://', '') : asset.uri,
      name: 'banner_upload.jpg',
      type: 'image/jpeg',
    });

    try {
        await api.post('/admin/sliders', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        Alert.alert("Success", "Banner uploaded!");
        fetchBanners(); 
    } catch (err) {
        Alert.alert("Error", "Failed to upload image.");
    } finally {
        setUploading(false);
    }
  };

  const deleteBanner = async (id) => {
    Alert.alert("Delete", "Remove this banner?", [
        { text: "Cancel" },
        { text: "Delete", style: 'destructive', onPress: async () => {
            try {
                await api.delete(`/admin/sliders/${id}`);
                fetchBanners();
            } catch(e) { Alert.alert("Error", "Could not delete"); }
        }}
    ]);
  };

  // ==========================
  //       RENDER UI
  // ==========================
  
  const renderProductItem = ({ item }) => (
    <View style={styles.productCard}>
        {/* Image */}
        <Image 
            source={{ uri: item.image_url || 'https://via.placeholder.com/100' }} 
            style={[styles.prodImage, { opacity: item.is_available ? 1 : 0.5 }]} 
        />
        
        {/* Info */}
        <View style={{ flex: 1, marginLeft: 12 }}>
            <View style={styles.catBadge}>
                <Text style={styles.catText}>{item.category_name}</Text>
            </View>
            <Text style={[styles.prodName, { color: item.is_available ? COLORS.dark : '#999' }]}>
                {item.name}
            </Text>
            <Text style={styles.prodPrice}>₹{item.price}</Text>
        </View>

        {/* Toggle */}
        <View style={{ alignItems: 'center' }}>
            <Switch 
                trackColor={{ false: "#E5E7EB", true: COLORS.secondary }}
                thumbColor={item.is_available ? COLORS.primary : "#F3F4F6"}
                onValueChange={() => toggleProduct(item.id, item.is_available)}
                value={item.is_available === 1} 
            />
            <Text style={[styles.statusLabel, { color: item.is_available ? COLORS.success : '#999' }]}>
                {item.is_available ? 'IN STOCK' : 'SOLD OUT'}
            </Text>
        </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.screenTitle}>Content Manager</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity 
            style={[styles.tab, activeTab === 'menu' && styles.activeTab]} 
            onPress={() => setActiveTab('menu')}
        >
            <Text style={[styles.tabText, activeTab === 'menu' && styles.activeTabText]}>🍔 Menu Items</Text>
        </TouchableOpacity>
        <TouchableOpacity 
            style={[styles.tab, activeTab === 'banners' && styles.activeTab]} 
            onPress={() => setActiveTab('banners')}
        >
            <Text style={[styles.tabText, activeTab === 'banners' && styles.activeTabText]}>🖼️ App Banners</Text>
        </TouchableOpacity>
      </View>

      {/* --- MENU TAB --- */}
      {activeTab === 'menu' && (
        <View style={{ flex: 1 }}>
            <View style={styles.searchBox}>
                <Ionicons name="search" size={20} color="#9CA3AF" />
                <TextInput 
                    style={styles.input}
                    placeholder="Search by Item or Category..."
                    value={searchQuery}
                    onChangeText={handleSearch}
                />
            </View>

            {loading ? <ActivityIndicator size="large" color={COLORS.primary} style={{marginTop:20}} /> : (
                <FlatList 
                    data={filteredProducts}
                    keyExtractor={item => item.id.toString()}
                    contentContainerStyle={{ padding: 15, paddingBottom: 50 }}
                    renderItem={renderProductItem}
                    initialNumToRender={10}
                />
            )}
        </View>
      )}

      {/* --- BANNERS TAB --- */}
      {activeTab === 'banners' && (
        <View style={{ flex: 1, padding: 15 }}>
            <TouchableOpacity style={styles.uploadBtn} onPress={pickImage} disabled={uploading}>
                {uploading ? <ActivityIndicator color="#FFF" /> : (
                    <>
                        <Ionicons name="cloud-upload-outline" size={24} color="#FFF" />
                        <Text style={styles.uploadText}>Upload New Banner</Text>
                    </>
                )}
            </TouchableOpacity>

            <FlatList 
                data={banners}
                keyExtractor={item => item.id.toString()}
                renderItem={({ item }) => (
                    <View style={styles.bannerCard}>
                        <Image source={{ uri: item.image }} style={styles.bannerImage} />
                        <TouchableOpacity style={styles.deleteBtn} onPress={() => deleteBanner(item.id)}>
                            <Ionicons name="trash" size={18} color="#FFF" />
                        </TouchableOpacity>
                    </View>
                )}
                ListEmptyComponent={<Text style={styles.emptyText}>No banners uploaded yet.</Text>}
            />
        </View>
      )}

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.light },
  
  header: { padding: 15, backgroundColor: COLORS.white, borderBottomWidth: 1, borderColor: COLORS.border },
  screenTitle: { fontSize: 22, fontWeight: 'bold', color: COLORS.dark },

  tabContainer: { flexDirection: 'row', padding: 5, backgroundColor: COLORS.white },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center', borderBottomWidth: 3, borderColor: 'transparent' },
  activeTab: { borderColor: COLORS.primary },
  tabText: { fontWeight: '600', color: '#6B7280', fontSize: 13 },
  activeTabText: { color: COLORS.primary, fontWeight: 'bold' },

  // Menu Styles
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white, margin: 15, borderRadius: 10, paddingHorizontal: 10, height: 45, borderWidth: 1, borderColor: COLORS.border },
  input: { flex: 1, marginLeft: 10, fontSize: 16 },
  
  productCard: { 
    flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white, 
    borderRadius: 12, padding: 12, marginBottom: 12, 
    shadowColor: "#000", shadowOffset: {width:0, height:1}, shadowOpacity: 0.05, elevation: 2 
  },
  prodImage: { width: 60, height: 60, borderRadius: 8, backgroundColor: '#f0f0f0' },
  
  catBadge: { backgroundColor: '#FFF7ED', alignSelf: 'flex-start', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginBottom: 4 },
  catText: { fontSize: 10, color: '#EA580C', fontWeight: 'bold', textTransform: 'uppercase' },
  
  prodName: { fontSize: 15, fontWeight: '600', color: COLORS.dark, marginBottom: 2 },
  prodPrice: { fontSize: 14, color: '#6B7280', fontWeight: '500' },
  statusLabel: { fontSize: 9, fontWeight: 'bold', marginTop: 4 },

  // Banner Styles
  uploadBtn: { 
    flexDirection: 'row', backgroundColor: COLORS.dark, padding: 15, 
    borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 20 
  },
  uploadText: { color: '#FFF', fontWeight: 'bold', marginLeft: 10 },
  
  bannerCard: { marginBottom: 15, borderRadius: 12, overflow: 'hidden', elevation: 3, backgroundColor: '#fff' },
  bannerImage: { width: '100%', height: 160, resizeMode: 'cover' },
  deleteBtn: { 
    position: 'absolute', top: 10, right: 10, backgroundColor: 'rgba(239, 68, 68, 0.9)', 
    padding: 8, borderRadius: 20 
  },
  emptyText: { textAlign: 'center', color: '#999', marginTop: 20 }
});