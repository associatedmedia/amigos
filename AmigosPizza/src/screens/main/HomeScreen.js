import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  FlatList,
  Linking,
  StatusBar
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { useSettings } from '../../context/SettingsContext';
import { getMenu, getUserProfile, getOfferBanner } from '../../services/api';
import { COLORS } from '../../utils/colors';
import { useTheme } from '../../context/ThemeContext';
import Toast from 'react-native-toast-message';
import PromoSlider from '../../components/PromoSlider';
// 1. Import the new BestSellerSlider component
import BestSellerSlider from '../../components/BestSellerSlider';
import PreviouslyOrdered from '../../components/PreviouslyOrdered';
// --- CONFIG & DATA ---
const PRIMARY_RED = COLORS.primary;
const DEFAULT_LOGO = 'https://api.amigospizza.co/icon.png';

const STORES = [
  {
    id: '0',
    name: 'AMIGOS SRINAGAR',
    address: 'opp. Amar Singh College, Gogji Bagh, Main Gate, Srinagar, Jammu and Kashmir 190008',
    distance: '1.2 km',
    openTime: '11:00 AM to 11:00 PM',
    status: 'Open'
  },
  {
    id: '1',
    name: 'AMIGOS ANANTNAG',
    address: 'KP Rd, Qazi Bagh, Anantnag, Jammu and Kashmir 192101',
    distance: '45.0 km',
    openTime: '10:30 AM to 10:30 PM',
    status: 'Open'
  },
  {
    id: '2',
    name: 'AMIGOS HAZRATBAL',
    address: 'University Main Road, opposite Sir Syed Gate University of Kashmir, Hazaratbal, Srinagar, Jammu and Kashmir 190006',
    distance: '12.0 km',
    openTime: '10:30 AM to 10:30 PM',
    status: 'Open'
  }
];

const HomeScreen = ({ navigation }) => {
  const { colors, isDark } = useTheme();
  const { isGuest } = useAuth();
  const { isStoreOnline, isLoadingSettings } = useSettings();
  const [menuData, setMenuData] = useState([]);
  const [offerBannerUri, setOfferBannerUri] = useState(null);
  const [loading, setLoading] = useState(true);
  const { cartItems, cartTotal, addToCart } = useCart();
  const insets = useSafeAreaInsets();

  const [address, setAddress] = useState('');
  const [avName, setAvName] = useState('AP');
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [orderType, setOrderType] = useState('delivery');
  const [showOffers, setShowOffers] = useState(false);

  // --- CACHE KEYS ---
  const MENU_CACHE_KEY = 'amigos_menu_cache';
  const MENU_CACHE_TIME_KEY = 'amigos_menu_cache_time';
  const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  useEffect(() => {
    loadMenuWithCache();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      fetchUserProfile();
    }, [])
  );

  // 1. Show cached menu instantly, then silently refresh + load secondary data
  const loadMenuWithCache = async () => {
    try {
      // Try to load cached menu for instant display
      const cachedMenu = await AsyncStorage.getItem(MENU_CACHE_KEY);
      const cachedTime = await AsyncStorage.getItem(MENU_CACHE_TIME_KEY);

      if (cachedMenu) {
        setMenuData(JSON.parse(cachedMenu));
        setLoading(false); // Show UI immediately with cached data

        // If cache is still fresh, only fetch secondary data
        if (cachedTime && (Date.now() - parseInt(cachedTime)) < CACHE_TTL) {
          fetchOfferBanner();
          return;
        }
      }

      // Fetch fresh menu (either no cache, or cache expired)
      await fetchMenu();
    } catch (error) {
      // If cache read fails, just fetch fresh
      await fetchMenu();
    }

    // After menu is loaded, fetch secondary data
    fetchOfferBanner();
  };

  const fetchMenu = async () => {
    try {
      const response = await getMenu();
      if (response.data.success) {
        setMenuData(response.data.data);
        // Save to cache
        await AsyncStorage.setItem(MENU_CACHE_KEY, JSON.stringify(response.data.data));
        await AsyncStorage.setItem(MENU_CACHE_TIME_KEY, Date.now().toString());
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchOfferBanner = async () => {
    try {
      const response = await getOfferBanner();
      if (response.data.success && response.data.data && response.data.data.image_url) {
        setOfferBannerUri(response.data.data.image_url);
      } else {
        setOfferBannerUri(null);
      }
    } catch (error) {
      console.warn("Could not fetch offer banner", error);
    }
  };

  const fetchUserProfile = async () => {
    if (isGuest) return;
    try {
      const userResponse = await getUserProfile();
      if (userResponse.data.success) {
        const user = userResponse.data.user;
        setAddress(user.address || '');
        setAvName(user.name ? user.name.substring(0, 2).toUpperCase() : 'AP');
        if (!user.address) setShowAddressModal(true);
        else setShowAddressModal(false);
      }
    } catch (error) {
      console.error('Profile fetch error', error);
    }
  };

  const handleCategorySelect = (categoryName) => {
    const selectedSection = menuData.find(section => section.category_name === categoryName);
    if (selectedSection) {
      navigation.navigate('CategoryDetail', {
        categoryName: selectedSection.category_name,
        products: selectedSection.products
      });
    } else {
      Toast.show({ type: 'info', text1: 'Coming Soon', text2: 'Category not available yet' });
    }
  };

  const renderGridItem = (item) => {
    const categoryImage = item.image_url
      ? item.image_url
      : (item.products && item.products.length > 0 ? item.products[0].image_url : DEFAULT_LOGO);

    return (
      <TouchableOpacity
        key={item.category_name}
        style={[styles.gridItem, !isStoreOnline && { opacity: 0.4 }]}
        disabled={!isStoreOnline}
        onPress={() => handleCategorySelect(item.category_name)}
      >
        <View style={[styles.circleImageContainer, { backgroundColor: colors.card }, !isStoreOnline && { tintColor: 'gray' }]}>
          <Image
            source={{ uri: categoryImage }}
            style={[styles.gridImage, !isStoreOnline && { tintColor: 'gray' }]}
          />
          {item.isNew && (
            <View style={styles.newBadge}>
              <Text style={styles.newBadgeText}>NEW</Text>
            </View>
          )}
        </View>
        <Text style={[styles.gridText, { color: colors.textSecondary }]}>{item.category_name}</Text>
      </TouchableOpacity>
    );
  };

  const renderContent = () => {
    if (orderType === 'takeaway') {
      return (
        <SafeAreaView style={styles.storeListContainer} edges={['top', 'left', 'right', 'bottom']}>
          <View style={styles.storeListContainer}>
            <Text style={styles.storeHeaderTitle}>Restaurant(s) Near You</Text>
            {STORES.map((store) => (
              <View key={store.id} style={[styles.storeCard, { backgroundColor: colors.card }]}>
                <View style={styles.storeHeaderRow}>
                  <View style={[styles.storeIcon, { backgroundColor: isDark ? '#333' : '#FFF0F0' }]}>
                    <Text style={{ fontSize: 20 }}>🍕</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.storeName, { color: colors.text }]}>{store.name}</Text>
                    <Text style={[styles.storeAddress, { color: colors.textSecondary }]}>{store.address}</Text>
                  </View>
                </View>
                <View style={[styles.storeInfoRow, { borderBottomColor: colors.border }]}>
                  <View>
                    <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Open:</Text>
                    <Text style={[styles.infoValue, { color: colors.text }]}>{store.openTime}</Text>
                  </View>
                  <View>
                    <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Distance:</Text>
                    <Text style={[styles.infoValue, { color: colors.text }]}>{store.distance}</Text>
                  </View>
                </View>
                <View style={styles.storeActionRow}>
                  <TouchableOpacity onPress={() => Linking.openURL(`google.navigation:q=${store.address}`)}>
                    <Text style={styles.viewMapText}>View on Map</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        </SafeAreaView>
      );
    }

    return (
      <>
        <PromoSlider />
        {!isLoadingSettings && !isStoreOnline && (
          <View style={styles.offlineBanner}>
            <Text style={styles.offlineBannerText}>⚠️ Store is offline. We will be back online soon.</Text>
          </View>
        )}

        <Text style={[styles.sectionTitle, { color: colors.text }, !isStoreOnline && { opacity: 0.4 }]}>What are you craving for?</Text>
        {loading ? (
          <ActivityIndicator size="large" color={PRIMARY_RED} style={{ marginTop: 20 }} />
        ) : (
          <View style={styles.gridContainer}>
            {menuData.map((item) => renderGridItem(item))}
          </View>
        )}
        <BestSellerSlider />
        <PreviouslyOrdered />
      </>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="light-content" backgroundColor={PRIMARY_RED} />
      <View style={[styles.container, { backgroundColor: isDark ? '#121212' : '#f2f2f2' }]}>
        <View style={styles.headerContainer}>
          <View style={styles.topBar}>
            <View style={{ flex: 1 }}>
              <TouchableOpacity style={styles.locationBtn} onPress={() => navigation.navigate('Profile')}>
                <Text style={styles.locationLabel}>📍 Delivery ▼</Text>
              </TouchableOpacity>
              <Text style={styles.locationSubText} numberOfLines={1}>
                {address || 'Set your location'}
              </Text>
            </View>
            <View style={styles.headerRight}>
              <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
                <View style={styles.profileCircle}>
                  <Text style={styles.profileText}>{avName}</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.toggleContainer}>
            <TouchableOpacity
              style={[styles.toggleBtn, orderType === 'delivery' && styles.activeToggle]}
              onPress={() => setOrderType('delivery')}
            >
              <Text style={[styles.toggleText, orderType === 'delivery' && styles.activeToggleText]}>Delivery</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleBtn, orderType === 'takeaway' && styles.activeToggle]}
              onPress={() => setOrderType('takeaway')}
            >
              <Text style={[styles.toggleText, orderType === 'takeaway' && styles.activeToggleText]}>Takeaway</Text>
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 + insets.bottom }}>
          {renderContent()}
        </ScrollView>

        {cartItems.length > 0 && (
          <TouchableOpacity
            style={[styles.cartStrip, { bottom: 65 + insets.bottom }]}
            onPress={() => navigation.navigate('Cart')}
          >
            <View>
              <Text style={styles.cartQty}>{cartItems.length} ITEM{cartItems.length > 1 ? 'S' : ''}</Text>
              <Text style={styles.cartPrice}>₹{cartTotal}</Text>
            </View>
            <Text style={styles.cartViewText}>View Cart 🛒</Text>
          </TouchableOpacity>
        )}

        {/* --- BOTTOM NAV MENU --- */}
        <SafeAreaView edges={['top', 'left', 'right', 'bottom']}>

          <View style={[styles.bottomFooter, { bottom: insets.bottom, height: 60 + (insets.bottom > 0 ? 0 : 5) }]}>
            <TouchableOpacity
              style={styles.menuFooterItem}
              onPress={() => navigation.navigate('FullMenu')}
            >
              <View style={styles.hamburgerIcon}>
                <View style={styles.line} />
                <View style={styles.line} />
                <View style={styles.line} />
              </View>
              <Text style={styles.footerMenuText}>Menu</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.footerLogoContainer}
              onPress={() => {
                if (offerBannerUri) {
                  setShowOffers(true);
                } else {
                  Toast.show({ type: 'info', text1: 'Check Back Later', text2: 'No active offers strictly right now.' });
                }
              }}
            >
              <Text style={styles.footerLogoText}>Amigos Offers</Text>
            </TouchableOpacity>
          </View>

        </SafeAreaView >


        {/* --- OFFERS FULL SCREEN MODAL --- */}
        <SafeAreaView style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.85)' }} edges={['top', 'left', 'right', 'bottom']}>
          <Modal
            visible={showOffers}
            transparent={true}
            animationType="slide"
            onRequestClose={() => setShowOffers(false)}
          >
            <View style={styles.modalBackground}>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowOffers(false)}
                hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
              <View style={styles.offerContainer}>
                {offerBannerUri && (
                  <Image
                    source={{ uri: offerBannerUri }}
                    style={styles.offerImage}
                    resizeMode="cover"
                  />
                )}
              </View>
            </View>
          </Modal>
        </SafeAreaView>

        <Modal visible={showAddressModal} transparent={true} animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={{ fontSize: 40, marginBottom: 10 }}>📍</Text>
              <Text style={styles.modalTitle}>Location Required</Text>
              <Text style={styles.modalSub}>Please set your delivery address to see accurate menu.</Text>
              <TouchableOpacity style={styles.modalBtn} onPress={() => { setShowAddressModal(false); navigation.navigate('EditProfile'); }}>
                <Text style={styles.modalBtnText}>ADD ADDRESS</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View >
    </SafeAreaView >
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: PRIMARY_RED },
  container: { flex: 1, backgroundColor: '#f2f2f2' },
  headerContainer: { backgroundColor: PRIMARY_RED, paddingBottom: 15, paddingTop: 10 },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 15, alignItems: 'center' },
  locationBtn: { flexDirection: 'row', alignItems: 'center' },
  locationLabel: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  locationSubText: { color: '#FFEBEE', fontSize: 12, marginTop: 2, fontWeight: '500' },
  headerRight: { flexDirection: 'row', alignItems: 'center' },
  profileCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFD700'
  },
  profileText: { color: PRIMARY_RED, fontWeight: 'bold', fontSize: 12 },
  toggleContainer: { flexDirection: 'row', marginTop: 15, backgroundColor: '#B93237', marginHorizontal: 15, borderRadius: 8, padding: 3 },
  toggleBtn: { flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: 6 },
  activeToggle: { backgroundColor: '#fff' },
  toggleText: { color: '#ffcccc', fontWeight: 'bold', fontSize: 13 },
  activeToggleText: { color: PRIMARY_RED },
  storeListContainer: { padding: 14, flex: 1 },
  storeHeaderTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 15, color: '#333' },
  storeCard: { backgroundColor: '#fff', borderRadius: 8, padding: 15, marginBottom: 15, elevation: 3 },
  storeHeaderRow: { flexDirection: 'row', marginBottom: 15 },
  storeIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#FFF0F0', justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  storeName: { fontSize: 14, fontWeight: 'bold', color: '#333' },
  storeAddress: { fontSize: 12, color: '#666', marginTop: 2, lineHeight: 16 },
  storeInfoRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15, borderBottomWidth: 1, borderBottomColor: '#eee', paddingBottom: 10 },
  infoLabel: { fontSize: 11, color: '#999' },
  infoValue: { fontSize: 12, color: '#333', fontWeight: '600' },
  storeActionRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  viewMapText: { color: 'blue', fontSize: 14, fontWeight: '600', padding: 5 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginHorizontal: 15, marginTop: 20, marginBottom: 15, color: '#222' },
  gridContainer: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 5 },
  gridItem: { width: '33.33%', alignItems: 'center', marginBottom: 20 },
  circleImageContainer: { width: 100, height: 100, borderRadius: 50, overflow: 'hidden', marginBottom: 8, elevation: 3, backgroundColor: '#fff' },
  gridImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  gridText: { fontSize: 12, fontWeight: '600', color: '#444', textAlign: 'center' },
  newBadge: { position: 'absolute', top: 0, left: 10, backgroundColor: '#FFD700', paddingHorizontal: 5, paddingVertical: 2 },
  newBadgeText: { fontSize: 8, fontWeight: 'bold' },
  recentSection: { backgroundColor: '#F9F9F9', paddingVertical: 15, marginBottom: 20 },
  recentCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', width: 250, padding: 10, borderRadius: 10, marginRight: 15, elevation: 2 },
  recentImg: { width: 50, height: 50, borderRadius: 8 },
  recentName: { fontSize: 14, fontWeight: 'bold', color: '#333' },
  recentPrice: { fontSize: 12, color: '#666' },
  reorderBtn: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#ccc', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 5 },
  reorderText: { fontSize: 10, fontWeight: 'bold', color: '#555' },
  offlineBanner: { backgroundColor: '#FEF0F0', padding: 12, marginHorizontal: 15, borderRadius: 8, borderWidth: 1, borderColor: '#F5C6CB', marginTop: 15 },
  offlineBannerText: { color: '#721C24', fontWeight: 'bold', textAlign: 'center', fontSize: 13 },
  cartStrip: { position: 'absolute', bottom: 60, left: 0, right: 0, backgroundColor: COLORS.primary, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12, paddingHorizontal: 20 },
  cartQty: { color: '#fff', fontWeight: 'bold', fontSize: 12 },
  cartPrice: { color: '#fff', fontSize: 11 },
  cartViewText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  bottomFooter: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 60, backgroundColor: '#fff', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, borderTopWidth: 1, borderColor: '#eee', elevation: 10 },
  menuFooterItem: { flexDirection: 'row', alignItems: 'center' },
  hamburgerIcon: { marginRight: 10 },
  line: { width: 18, height: 2, backgroundColor: '#333', marginBottom: 3 },
  footerMenuText: { fontWeight: 'bold', color: '#333', fontSize: 14 },
  footerLogoText: { fontWeight: '900', color: COLORS.gold, fontSize: 18, fontStyle: 'italic' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '85%', backgroundColor: '#fff', padding: 25, borderRadius: 15, alignItems: 'center', elevation: 10 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 10 },
  modalSub: { textAlign: 'center', color: '#666', marginBottom: 20 },
  modalBtn: { backgroundColor: PRIMARY_RED, paddingHorizontal: 30, paddingVertical: 12, borderRadius: 25, width: '100%', alignItems: 'center' },
  modalBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  modalBackground: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
    paddingHorizontal: 20,
  },
  offerContainer: {
    width: '100%',
    height: '100%',
    backgroundColor: '#fff',
    borderRadius: 24,
    overflow: 'hidden',
    elevation: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
  },
  offerImage: {
    width: '100%',
    height: '100%',
  },
  closeButton: {
    position: 'absolute',
    top: 50, // Pushed down past the dynamic island notch on iOS globally
    right: 20, // Padded inwards
    zIndex: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
  },
});

export default HomeScreen;