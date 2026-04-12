import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, Image, TouchableOpacity, ScrollView,
  ActivityIndicator, Alert, TextInput
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCart } from '../../context/CartContext';
import { getUserProfile } from '../../services/api';
import { COLORS } from '../../utils/colors';

import { useAuth } from '../../context/AuthContext';
import { useSettings } from '../../context/SettingsContext';
import api from '../../services/api';
// ✅ Import the Upsell Component
import UpsellItems from '../../components/UpsellItems';
import BackButton from '../../components/BackButton';

// Config
const PRIMARY_RED = '#D23F45';
const GOLD_COLOR = '#FFD700';
const GREEN_SAVINGS = '#E8F5E9';
const GREEN_TEXT = '#2E7D32';

const CartScreen = ({ navigation }) => {
  const { cartItems, addToCart, removeFromCart, cartTotal, chefNote, setChefNote, appliedCoupon, setAppliedCoupon } = useCart();
  const { isGuest, logout, user } = useAuth();
  const { isStoreOnline } = useSettings();
  const insets = useSafeAreaInsets();
  const [address, setAddress] = useState('Loading location...');
  const [loadingAddr, setLoadingAddr] = useState(true);

  const [couponInput, setCouponInput] = useState('');
  const [validatingCoupon, setValidatingCoupon] = useState(false);
  const [userId, setUserId] = useState(null);

  // Fetch Address on Mount
  useEffect(() => {
    fetchAddress();
  }, []);

  const fetchAddress = async () => {
    if (isGuest) {
      setAddress('Login to view addresses');
      setLoadingAddr(false);
      return;
    }
    try {
      const response = await getUserProfile();
      if (response.data.success) {
        setAddress(response.data.user.address || 'Please add an address');
        setUserId(response.data.user.id);
      }
    } catch (error) {
      setAddress('Set Location');
    } finally {
      setLoadingAddr(false);
    }
  };

  const renderCartItem = ({ item }) => (
    <View style={styles.cartCard}>
      <View style={styles.cardHeader}>
        <Image
          source={{
            uri: item.is_veg == 0
              ? 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/ba/Non_veg_symbol.svg/2048px-Non_veg_symbol.svg.png'
              : 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b2/Veg_symbol.svg/1200px-Veg_symbol.svg.png'
          }}
          style={styles.vegIcon}
        />
        <Text style={styles.itemName}>{item.name}</Text>
      </View>

      <Text style={styles.itemDesc}>Standard Serving</Text>

      <View style={styles.cardFooter}>
        <View style={styles.priceContainer}>
          <Text style={styles.itemPrice}>₹{item.price}</Text>
        </View>
        <View style={styles.qtyContainer}>
          <TouchableOpacity onPress={() => {
            removeFromCart(item.cartItemId || item.id);
            // Clear coupon if cart empties
            if (cartItems.length === 1 && item.quantity === 1) setAppliedCoupon(null);
          }} style={styles.qtyBtn}>
            <Text style={styles.qtyBtnText}>-</Text>
          </TouchableOpacity>
          <Text style={styles.qtyText}>{item.quantity}</Text>
          <TouchableOpacity onPress={() => addToCart(item)} style={styles.qtyBtn}>
            <Text style={styles.qtyBtnText}>+</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  // Empty State
  if (cartItems.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={{ fontSize: 50 }}>🍕</Text>
        <Text style={styles.emptyText}>Your cart is lonely. Add some food!</Text>
        <TouchableOpacity style={styles.goBackBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.goBackText}>Browse Menu</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right']}>

        {/* HEADER */}
        <View style={styles.header}>
          <BackButton />
          <Text style={styles.headerTitle}>Cart</Text>
        </View>

        <ScrollView contentContainerStyle={{ paddingBottom: 150 }} showsVerticalScrollIndicator={false}>

          {/* LOCATION STRIP */}
          <View style={styles.locationStrip}>
            <View style={{ flex: 1 }}>
              <Text style={styles.locTitle}>DELIVERY TO</Text>
              <Text style={styles.locAddress} numberOfLines={1}>
                HOME | <Text style={styles.locTitle}>{loadingAddr ? 'Fetching...' : address} </Text>
              </Text>
            </View>
            <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
              <Text style={styles.locChange}>CHANGE</Text>
            </TouchableOpacity>
          </View>

          {/* PROMO BANNER */}
          <View style={styles.promoBanner}>
            <Text style={styles.promoText}>🛵 Free Delivery Unlocked!</Text>
          </View>

          {/* CART ITEMS */}
          <FlatList
            data={cartItems}
            keyExtractor={(item) => (item.cartItemId || item.id).toString()}
            renderItem={renderCartItem}
            scrollEnabled={false}
            contentContainerStyle={{ padding: 15, marginTop: -14 }}
          />

          {/* CHEF NOTE SECTION */}
          <View style={styles.chefNoteContainer}>
            <View style={styles.chefNoteHeader}>
              <Text style={{ fontSize: 20 }}>👨‍🍳</Text>
              <Text style={styles.chefNoteTitle}>Note for Chef</Text>
            </View>
            <TextInput
              style={styles.chefNoteInput}
              placeholder="Any special instructions? (e.g. Extra spicy, Extra Cheese , No onions)"
              placeholderTextColor="#999"
              multiline
              numberOfLines={3}
              value={chefNote}
              onChangeText={setChefNote}
              maxLength={200}
            />
          </View>

          {/* COUPON SECTION */}
          <View style={styles.couponContainer}>
            <Text style={styles.couponTitle}>% Promos & Coupons</Text>
            {appliedCoupon ? (
              <View style={styles.appliedCouponBox}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.appliedCouponCode}>{appliedCoupon.code}</Text>
                  <Text style={styles.appliedCouponSave}>Saved ₹{appliedCoupon.discount_amount} on this order!</Text>
                </View>
                <TouchableOpacity onPress={() => setAppliedCoupon(null)}>
                  <Text style={styles.removeCouponText}>REMOVE</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.couponInputRow}>
                <TextInput
                  style={styles.couponInput}
                  placeholder="Enter a coupon code"
                  placeholderTextColor="#999"
                  value={couponInput}
                  onChangeText={setCouponInput}
                  autoCapitalize="characters"
                />
                <TouchableOpacity
                  style={styles.applyBtn}
                  onPress={async () => {
                    if (!couponInput.trim()) return;
                    if (isGuest || !userId) {
                      Alert.alert("Login Required", "Please login to apply coupons.");
                      return;
                    }
                    setValidatingCoupon(true);
                    try {
                      const res = await api.post('/validate-coupon', {
                        code: couponInput.trim(),
                        cart_total: cartTotal,
                        user_id: userId
                      });
                      if (res.data.success) {
                        setAppliedCoupon(res.data.coupon);
                        setCouponInput('');
                      } else {
                        Alert.alert("Invalid Coupon", res.data.message);
                      }
                    } catch (e) {
                      Alert.alert("Error", "Could not apply coupon.");
                    }
                    setValidatingCoupon(false);
                  }}
                  disabled={validatingCoupon}
                >
                  {validatingCoupon ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.applyBtnText}>APPLY</Text>}
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* UPSELL SECTION */}
          <UpsellItems />



        </ScrollView>

        {/* BOTTOM FOOTER */}
        <View style={[styles.footerContainer, { paddingBottom: insets.bottom + 10 }]}>
          <View style={styles.paymentRow}>
            <View style={styles.paymentInfo}>
              <Text style={styles.totalLabel}>Total to Pay</Text>
              <View style={{ flexDirection: 'row', alignItems: 'flex-end' }}>
                <Text style={styles.finalTotal}>₹{appliedCoupon ? (cartTotal - appliedCoupon.discount_amount).toFixed(2) : cartTotal}</Text>
                {appliedCoupon && (
                  <Text style={styles.strikethroughTotal}>₹{cartTotal}</Text>
                )}
              </View>
            </View>

            {/* ✅ NAVIGATE TO CHECKOUT SCREEN */}
            <TouchableOpacity
              style={[styles.payBtn, !isStoreOnline && { backgroundColor: '#ccc' }]}
              disabled={!isStoreOnline}
              onPress={() => {
                if (!isStoreOnline) return;

                if (isGuest) {
                  logout();
                } else {
                  navigation.navigate('Checkout');
                }
              }}
            >
              <Text style={[styles.payBtnText, !isStoreOnline && { color: '#666' }]}>
                {isStoreOnline ? 'Proceed to Pay >' : 'Store Offline'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

      </SafeAreaView>
    </View >
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F5F7' },
  header: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 15, elevation: 2 },
  backBtn: { paddingRight: 15 },
  backIcon: { fontSize: 24, color: '#000' },
  headerTitle: { fontSize: 18, fontWeight: 'bold' },

  locationStrip: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', margin: 15, padding: 15, borderRadius: 10, elevation: 2 },
  locTitle: { fontSize: 10, color: '#888', fontWeight: 'bold', marginBottom: 2 },
  locAddress: { fontSize: 13, fontWeight: 'bold', color: '#333' },
  locChange: { fontSize: 12, color: PRIMARY_RED, fontWeight: 'bold' },

  chefNoteContainer: {
    margin: 15, padding: 15, backgroundColor: '#fff', borderRadius: 10, elevation: 1,
    borderWidth: 1, borderColor: '#eee'
  },
  chefNoteHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  chefNoteTitle: { fontSize: 14, fontWeight: 'bold', marginLeft: 8, color: '#333' },
  chefNoteInput: {
    backgroundColor: '#F9F9F9', borderRadius: 8, padding: 12, fontSize: 13,
    color: '#333', textAlignVertical: 'top', minHeight: 80, borderWidth: 1, borderColor: '#EEE'
  },

  promoBanner: { backgroundColor: GOLD_COLOR, marginHorizontal: 15, padding: 10, borderTopLeftRadius: 10, borderTopRightRadius: 10, marginBottom: 0 },
  promoText: { color: '#000', fontSize: 12, fontWeight: 'bold', textAlign: 'center' },

  cartCard: { backgroundColor: '#fff', padding: 15, marginBottom: 1, borderRadius: 0 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 5 },
  vegIcon: { width: 14, height: 14, marginRight: 8 },
  itemName: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  itemDesc: { fontSize: 12, color: '#888', marginLeft: 22, marginBottom: 10 },

  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginLeft: 22 },
  priceContainer: { flexDirection: 'row', alignItems: 'center' },
  itemPrice: { fontSize: 16, fontWeight: 'bold', color: '#333' },

  qtyContainer: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#ddd', borderRadius: 5, backgroundColor: '#fff' },
  qtyBtn: { paddingHorizontal: 10, paddingVertical: 5 },
  qtyBtnText: { fontSize: 16, fontWeight: 'bold', color: PRIMARY_RED },
  qtyText: { fontSize: 14, fontWeight: 'bold', marginHorizontal: 5 },

  footerContainer: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#fff', elevation: 20, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10 },

  paymentRow: { flexDirection: 'row', alignItems: 'center', padding: 20, justifyContent: 'space-between' },
  paymentInfo: { flex: 1 },
  totalLabel: { fontSize: 12, color: '#888' },
  finalTotal: { fontSize: 22, fontWeight: 'bold', color: '#000' },

  payBtn: { backgroundColor: PRIMARY_RED, paddingVertical: 12, paddingHorizontal: 25, borderRadius: 8, alignItems: 'center' },
  payBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },

  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  emptyText: { marginVertical: 20, color: '#888', fontSize: 16 },
  goBackBtn: { backgroundColor: PRIMARY_RED, padding: 12, borderRadius: 8 },
  goBackText: { color: '#fff', fontWeight: 'bold' },

  couponContainer: { margin: 15, padding: 15, backgroundColor: '#fff', borderRadius: 10, elevation: 1, borderWidth: 1, borderColor: '#eee' },
  couponTitle: { fontSize: 14, fontWeight: 'bold', color: '#333', marginBottom: 10 },
  couponInputRow: { flexDirection: 'row', alignItems: 'center' },
  couponInput: { flex: 1, backgroundColor: '#F9F9F9', borderWidth: 1, borderColor: '#ddd', borderRadius: 8, paddingHorizontal: 12, height: 45, textTransform: 'uppercase' },
  applyBtn: { backgroundColor: '#333', borderRadius: 8, height: 45, paddingHorizontal: 20, justifyContent: 'center', alignItems: 'center', marginLeft: 10 },
  applyBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  appliedCouponBox: { flexDirection: 'row', backgroundColor: '#E8F5E9', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#A5D6A7', alignItems: 'center' },
  appliedCouponCode: { fontWeight: 'bold', color: '#2E7D32', fontSize: 15 },
  appliedCouponSave: { fontSize: 12, color: '#2E7D32', marginTop: 2 },
  removeCouponText: { color: PRIMARY_RED, fontWeight: 'bold', fontSize: 13, padding: 5 },
  strikethroughTotal: { textDecorationLine: 'line-through', color: '#999', fontSize: 14, marginLeft: 5, marginBottom: 2 }
});

export default CartScreen;