import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  LayoutAnimation,
  Platform,
  UIManager
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';

// --- CUSTOM IMPORTS ---
import { useCart } from '../../context/CartContext';
import { useSettings } from '../../context/SettingsContext';
import { getMenu } from '../../services/api';
import { COLORS } from '../../utils/colors';
import BackButton from '../../components/BackButton';
import UpsellModal from '../../components/UpsellModal';

// --- CONSTANTS ---
const CACHE_KEY = '@menu_data_cache';
// ⚠️ IMPORTANT: Check if your DB images include "storage/" in the path.
// If they are just "products/pizza.jpg", use this:
const IMAGE_BASE_URL = "https://amigospizza.co/storage/";

const PRIMARY_RED = '#D23F45';

// --- ASSETS ---
const ICON_VEG = require('../../../assets/icons/veg.png');
const ICON_NONVEG = require('../../../assets/icons/nonveg.png');
const ICON_SEARCH = require('../../../assets/icons/search.png');
const ICON_CLOSE = require('../../../assets/icons/close.png');
const PLACEHOLDER_IMG = require('../../../assets/icon.png');

// Enable LayoutAnimation for Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const FullMenuScreen = ({ navigation }) => {
  // --- STATE ---
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [displayProducts, setDisplayProducts] = useState([]);

  // Filters
  const [searchText, setSearchText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [filterType, setFilterType] = useState('all'); // 'all', 'veg', 'non-veg'

  const { addToCart, cartItems, cartTotal } = useCart();
  const { isStoreOnline } = useSettings();
  const insets = useSafeAreaInsets();

  // Upsell Modal State
  const [upsellVisible, setUpsellVisible] = useState(false);
  const [targetProduct, setTargetProduct] = useState(null);

  // --- 1. INITIAL LOAD (CACHE + API) ---
  useEffect(() => {
    loadMenuData();
  }, []);

  const loadMenuData = async () => {
    try {
      // A. Try loading from Cache first (Instant UI)
      const cachedData = await AsyncStorage.getItem(CACHE_KEY);
      if (cachedData) {
        const parsed = JSON.parse(cachedData);
        processMenuData(parsed, false);
      }

      // B. Fetch Fresh Data from API
      const response = await getMenu();
      if (response.data.success) {
        processMenuData(response.data.data, true);
        await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(response.data.data));
      }
    } catch (error) {
      console.error("Menu Load Error:", error);
      // Toast.show({ type: 'error', text1: 'Network Error', text2: 'Showing cached menu.' });
    } finally {
      setLoading(false);
    }
  };

  const processMenuData = (data, stopLoading) => {
    setCategories(data);
    const flatList = [];
    data.forEach(cat => {
      if (cat.products && Array.isArray(cat.products)) {
        cat.products.forEach(prod => {
          flatList.push({ ...prod, category_name: cat.category_name });
        });
      }
    });
    setAllProducts(flatList);
    if (stopLoading) setLoading(false);
  };

  // --- 2. FILTER LOGIC ---
  const flatListRef = React.useRef(null);

  useEffect(() => {
    filterData();
  }, [searchText, selectedCategory, filterType, allProducts]);

  const filterData = useCallback(() => {
    let result = allProducts;

    // 1. Category Filter
    if (selectedCategory !== 'All') {
      result = result.filter(item =>
        item.category_name && item.category_name === selectedCategory
      );
    }

    // 2. Type Filter (Veg/Non-Veg)
    if (filterType === 'veg') {
      result = result.filter(item => parseInt(item.is_veg || 0) === 1);
    } else if (filterType === 'non-veg') {
      result = result.filter(item => parseInt(item.is_veg || 0) === 0);
    }

    // 3. Search Filter (Name + Description)
    if (searchText) {
      const lowerText = searchText.toLowerCase().trim();
      result = result.filter(item =>
        (item.name && item.name.toLowerCase().includes(lowerText)) ||
        (item.description && item.description.toLowerCase().includes(lowerText))
      );
    }

    // LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut); // Removed for smoother performance
    setDisplayProducts(result);

    // Scroll to top when filters change
    if (flatListRef.current && result.length > 0) {
      flatListRef.current.scrollToOffset({ offset: 0, animated: false });
    }
  }, [searchText, selectedCategory, filterType, allProducts]);

  // --- 3. ROBUST IMAGE HELPER ---
  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;
    // If full URL, return as is
    if (imagePath.startsWith('http')) return imagePath;

    // Fix backslashes (Windows paths)
    let cleanPath = imagePath.replace(/\\/g, '/');

    // Remove leading slash
    if (cleanPath.startsWith('/')) cleanPath = cleanPath.substring(1);

    // Encode spaces (e.g. "Veg Pizza.jpg" -> "Veg%20Pizza.jpg")
    // We split by '/' to avoid encoding the directory separators
    cleanPath = cleanPath.split('/').map(segment => encodeURIComponent(segment)).join('/');

    return `${IMAGE_BASE_URL}${cleanPath}`;
  };

  // --- 4. RENDER ITEMS ---
  const renderProduct = ({ item }) => {
    // 1. Try to use the full URL provided by API (like HomeScreen does)
    // 2. Fallback to constructing it from 'image' path
    const finalImageUrl = item.image_url
      ? item.image_url
      : getImageUrl(item.image);

    const isVeg = parseInt(item.is_veg) === 1;

    return (
      <View style={styles.card}>
        <Image
          source={{ uri: finalImageUrl }}
          style={styles.image}
          defaultSource={PLACEHOLDER_IMG}
          resizeMode="cover"
        />

        <View style={styles.info}>
          <View style={styles.titleRow}>
            <Image
              source={isVeg ? ICON_VEG : ICON_NONVEG}
              style={styles.vegIcon}
            />
            <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
          </View>

          <Text style={styles.description} numberOfLines={2}>
            {item.description || 'Freshly prepared for you.'}
          </Text>

          <View style={styles.row}>
            <Text style={styles.price}>₹{item.price}</Text>
            <TouchableOpacity
              style={[styles.addBtn, !isStoreOnline && { borderColor: '#ccc', backgroundColor: '#f0f0f0' }]}
              disabled={!isStoreOnline}
              activeOpacity={0.7}
              onPress={() => {
                const hasVariants = item.variants && item.variants.length > 0;
                
                if (hasVariants) {
                  setTargetProduct(item);
                  setUpsellVisible(true);
                } else {
                  addToCart(item);
                  Toast.show({ type: 'success', text1: 'Added', text2: `${item.name} in cart` });
                }
              }}
            >
              <Text style={[styles.addBtnText, !isStoreOnline && { color: '#888' }]}>
                {item.variants && item.variants.length > 0 ? 'OPTIONS' : 'ADD +'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>

      {/* HEADER */}
      <View style={styles.header}>
        <BackButton />
        <Text style={styles.headerTitle}>Our Menu</Text>
        <View style={{ width: 30 }} />
      </View>

      {/* SEARCH & FILTER BAR */}
      <View style={styles.filterSection}>
        <View style={styles.searchBar}>
          <Image source={ICON_SEARCH} style={styles.searchIcon} />
          <TextInput
            style={styles.input}
            placeholder="Search dishes..."
            placeholderTextColor="#999"
            value={searchText}
            onChangeText={setSearchText}
          />
          {searchText.length > 0 && (
            <TouchableOpacity onPress={() => setSearchText('')}>
              <Image source={ICON_CLOSE} style={styles.closeIcon} />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.chipRow}>
          <TouchableOpacity
            style={[styles.chip, filterType === 'veg' && styles.chipActiveVeg]}
            onPress={() => setFilterType(filterType === 'veg' ? 'all' : 'veg')}
          >
            <Image source={ICON_VEG} style={styles.chipIcon} />
            <Text style={[styles.chipText, filterType === 'veg' && styles.chipTextActive]}>Pure Veg</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.chip, filterType === 'non-veg' && styles.chipActiveNonVeg]}
            onPress={() => setFilterType(filterType === 'non-veg' ? 'all' : 'non-veg')}
          >
            <Image source={ICON_NONVEG} style={styles.chipIcon} />
            <Text style={[styles.chipText, filterType === 'non-veg' && styles.chipTextActive]}>Non-Veg</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* CATEGORY TABS */}
      <View style={styles.tabContainer}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={['All', ...categories.map(c => c.category_name)]}
          keyExtractor={(item, index) => index.toString()}
          contentContainerStyle={{ paddingHorizontal: 15 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.tab, selectedCategory === item && styles.tabActive]}
              onPress={() => setSelectedCategory(item)}
            >
              <Text style={[styles.tabText, selectedCategory === item && styles.tabTextActive]}>
                {item}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* PRODUCT LIST */}
      <FlatList
        ref={flatListRef}
        data={displayProducts}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderProduct}
        contentContainerStyle={{ padding: 15, paddingBottom: 100 }}
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={5}
        ListEmptyComponent={
          !loading && (
            <View style={styles.center}>
              <Text style={styles.emptyText}>No items found matching your filters.</Text>
            </View>
          )
        }
      />

      {/* CART STRIP */}
      {cartItems.length > 0 && (
        <View style={[styles.cartWrapper, { bottom: 20 + insets.bottom }]}>
          <TouchableOpacity style={styles.cartStrip} onPress={() => navigation.navigate('Cart')}>
            <View>
              <Text style={styles.cartQty}>{cartItems.length} ITEM{cartItems.length > 1 ? 'S' : ''}</Text>
              <Text style={styles.cartPrice}>₹{cartTotal} + taxes</Text>
            </View>
            <View style={styles.viewCartBtn}>
              <Text style={styles.viewCartText}>View Cart ›</Text>
            </View>
          </TouchableOpacity>
        </View>
      )}

      {/* UPSELL MODAL */}
      <UpsellModal 
        isVisible={upsellVisible} 
        onClose={() => setUpsellVisible(false)} 
        currentProduct={targetProduct} 
      />

    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  center: { alignItems: 'center', justifyContent: 'center', marginTop: 50 },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 15, backgroundColor: '#fff', elevation: 2
  },
  backBtn: { padding: 5 },
  backArrow: { fontSize: 24, color: '#333', fontWeight: 'bold' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#333' },

  filterSection: { backgroundColor: '#fff', padding: 15, paddingTop: 10, paddingBottom: 10 },
  searchBar: {
    flexDirection: 'row', backgroundColor: '#F0F2F5', borderRadius: 10,
    paddingHorizontal: 12, height: 45, alignItems: 'center', marginBottom: 12
  },
  searchIcon: { width: 18, height: 18, tintColor: '#888' },
  closeIcon: { width: 18, height: 18, tintColor: '#888' },
  input: { flex: 1, marginLeft: 10, fontSize: 15, color: '#333' },

  chipRow: { flexDirection: 'row' },
  chip: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: 20, borderWidth: 1, borderColor: '#EEE', marginRight: 10, backgroundColor: '#fff'
  },
  chipActiveVeg: { backgroundColor: '#E8F5E9', borderColor: 'green' },
  chipActiveNonVeg: { backgroundColor: '#FFEBEE', borderColor: '#D32F2F' },
  chipIcon: { width: 14, height: 14, marginRight: 6 },
  chipText: { fontSize: 13, color: '#666', fontWeight: '600' },
  chipTextActive: { color: '#333' },

  tabContainer: { backgroundColor: '#fff', paddingBottom: 10 },
  tab: {
    marginRight: 10, paddingVertical: 8, paddingHorizontal: 16,
    borderRadius: 20, backgroundColor: '#F5F5F5'
  },
  tabActive: { backgroundColor: PRIMARY_RED },
  tabText: { fontSize: 14, fontWeight: '600', color: '#666' },
  tabTextActive: { color: '#fff' },

  card: {
    flexDirection: 'row', backgroundColor: '#fff', borderRadius: 12, marginBottom: 16,
    padding: 12, elevation: 2, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4
  },
  image: { width: 100, height: 100, borderRadius: 12, backgroundColor: '#EEE' },
  info: { flex: 1, marginLeft: 15, justifyContent: 'space-between' },
  titleRow: { flexDirection: 'row', alignItems: 'center' },
  vegIcon: { width: 15, height: 15, marginRight: 6 },
  name: { fontSize: 16, fontWeight: 'bold', color: '#222', flex: 1 },
  description: { fontSize: 12, color: '#777', marginTop: 4, lineHeight: 16 },

  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  price: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  addBtn: {
    backgroundColor: '#FFF5F5', paddingHorizontal: 20, paddingVertical: 8,
    borderRadius: 8, borderWidth: 1, borderColor: PRIMARY_RED
  },
  addBtnText: { color: PRIMARY_RED, fontWeight: 'bold', fontSize: 12 },

  cartWrapper: { position: 'absolute', bottom: 20, left: 15, right: 15 },
  cartStrip: {
    backgroundColor: PRIMARY_RED, borderRadius: 12, padding: 15,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    elevation: 5, shadowColor: PRIMARY_RED, shadowOpacity: 0.4, shadowRadius: 8
  },
  cartQty: { color: '#fff', fontWeight: 'bold', fontSize: 12 },
  cartPrice: { color: '#fff', fontSize: 12, marginTop: 2 },
  viewCartBtn: { flexDirection: 'row', alignItems: 'center' },
  viewCartText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },

  emptyText: { color: '#999', fontSize: 16 }
});

export default FullMenuScreen;