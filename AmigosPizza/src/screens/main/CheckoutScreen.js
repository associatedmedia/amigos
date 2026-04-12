import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Image,
  Platform,
  Alert
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import RazorpayCheckout from 'react-native-razorpay';
import axios from 'axios'; // Required for Google API calls
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { useSettings } from '../../context/SettingsContext';
import { COLORS } from '../../utils/colors';
import api from '../../services/api';
import BackButton from '../../components/BackButton';
import Constants from 'expo-constants';

// Configuration
const RAZORPAY_KEY_ID = Constants.expoConfig?.extra?.razorpayKeyId || 'rzp_test_cGaBr3RC6a520W';
const GOOGLE_MAPS_API_KEY = Constants.expoConfig?.extra?.googleMapsApiKey || Constants.expoConfig?.android?.config?.googleMaps?.apiKey || Constants.expoConfig?.ios?.config?.googleMapsApiKey || 'YOUR_ACTUAL_API_KEY_HERE';
const GOLD_COLOR = '#FFD700';
const PRIMARY_RED = '#D23F45';

// Main Store Coordinates (Srinagar Branch)
const MAIN_STORE_LAT = 34.0706;
const MAIN_STORE_LONG = 74.8033;

const CheckoutScreen = ({ navigation }) => {
  const { cartItems, cartTotal, clearCart, chefNote, appliedCoupon } = useCart();
  const { isGuest, logout } = useAuth();
  const { isCodEnabled, minOrderCriteria, firstOrderDiscount } = useSettings();
  const insets = useSafeAreaInsets();

  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('razorpay');
  const [isFirstOrder, setIsFirstOrder] = useState(false);

  const STORES = {
    '0': { name: 'Srinagar Branch', address: 'Gogji Bagh, Srinagar' },
    '1': { name: 'Anantnag Branch', address: 'KP Road, Anantnag' }
  };

  const [orderData, setOrderData] = useState({
    user_id: '',
    customer_name: '',
    email: '',
    mobile_no: '',
    address: '',
    latitude: '',
    longitude: '',
    store_id: '0'
  });

  useFocusEffect(
    useCallback(() => {
      fetchUserData();
    }, [])
  );

  // Distance Calculation via Google ONLY

  // --- NEW: Google Distance Matrix Logic ---
  const getRoadDistance = async (userLat, userLong) => {
    try {
      const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${userLat},${userLong}&destinations=${MAIN_STORE_LAT},${MAIN_STORE_LONG}&key=${GOOGLE_MAPS_API_KEY}`;
      const response = await axios.get(url);

      // Check for specific Google error messages
      if (response.data.error_message) {
        console.warn("Google API Error Message:", response.data.error_message);
      }

      if (response.data.status === 'OK' && response.data.rows[0].elements[0].status === 'OK') {
        return response.data.rows[0].elements[0].distance.value / 1000;
      }
      throw new Error(`Google API status: ${response.data.status}`);
    } catch (error) {
      console.warn("Road distance failed:", error);
      throw error; // Throw error directly instead of falling back
    }
  };

  const determineStore = async (userLat, userLong) => {
    if (!userLat || !userLong) return '0';
    try {
      const distance = await getRoadDistance(userLat, userLong);
      return distance <= 20 ? '0' : '1';
    } catch (e) {
      return '0'; // Default to Srinagar branch if verification fails on load
    }
  };

  const fetchUserData = async () => {
    if (isGuest) {
      setLoading(false);
      Alert.alert("Login Required", "Please login to place an order.", [
        { text: "OK", onPress: () => logout() }
      ]);
      return;
    }
    try {
      const response = await api.get('/user');
      if (response.data.success) {
        const user = response.data.user;
        const detectedStoreId = await determineStore(user.latitude, user.longitude);

        setIsFirstOrder(response.data.is_first_order || false);

        setOrderData({
          user_id: user.id.toString(),
          customer_name: user.name,
          email: user.email || '',
          mobile_no: user.mobile_no || '',
          address: user.address || '',
          latitude: user.latitude || '',
          longitude: user.longitude || '',
          store_id: detectedStoreId
        });
      }
    } catch (error) {
      console.error("Fetch Error", error);
      setOrderData(prev => ({ ...prev, customer_name: 'Guest' }));
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmOrder = async () => {
    if (cartItems.length === 0) return Alert.alert("Error", "Your cart is empty");

    if (paymentMethod !== 'pickup' && !orderData.address) {
      return Alert.alert("Required", "Please add a delivery address first.");
    }

    setProcessing(true);

    let originalBasePrice = cartTotal / 1.05;
    let discountBase = 0;
    let isFirstOrderDiscountApplied = false;
    
    if (appliedCoupon) {
      discountBase = appliedCoupon.discount_amount / 1.05;
    } else if (firstOrderDiscount?.enabled && isFirstOrder && cartTotal >= firstOrderDiscount.minAmount) {
      if (firstOrderDiscount.type === 'percent') {
        discountBase = originalBasePrice * (firstOrderDiscount.value / 100);
      } else {
        discountBase = firstOrderDiscount.value / 1.05;
      }
      isFirstOrderDiscountApplied = true;
    }
    
    if (discountBase > originalBasePrice) discountBase = originalBasePrice;
    
    let discountedBasePrice = originalBasePrice - discountBase;
    let finalGst = discountedBasePrice * 0.05;
    let finalTotal = discountedBasePrice + finalGst;
    let displayDiscount = discountBase * 1.05;

    // --- MINIMUM ORDER CRITERIA BY ROAD DISTANCE ---
    if (paymentMethod !== 'pickup' && orderData.latitude && orderData.longitude && minOrderCriteria?.length > 0) {
      try {
        const roadDistance = await getRoadDistance(orderData.latitude, orderData.longitude);
        let minOrderVal = 0;

        const sortedCriteria = [...minOrderCriteria].sort((a, b) => a.distance - b.distance);
        const fallback = sortedCriteria.find(c => c.distance === 'fallback') || { min_value: 2500 };
        minOrderVal = fallback.min_value;

        for (const criterion of sortedCriteria) {
          if (criterion.distance !== 'fallback' && roadDistance <= criterion.distance) {
            minOrderVal = criterion.min_value;
            break;
          }
        }

        if (finalTotal < minOrderVal) {
          setProcessing(false);
          return Alert.alert(
            "Minimum Order Not Met",
            `The travel distance is ${roadDistance.toFixed(1)} km. For this distance, the minimum order value is ₹${minOrderVal}.\n\nCurrent Total: ₹${finalTotal.toFixed(2)}`
          );
        }
      } catch (err) {
        console.error("Criteria check error", err);
        setProcessing(false);
        return Alert.alert("Distance Verification Failed", "Order criteria not working because we couldn't verify the delivery distance via Maps. Please try again or contact support.");
      }
    }

    // Format Items
    const formattedItems = cartItems.map(item => ({
      id: item.id,
      name: item.name,
      price: parseFloat(item.price),
      quantity: item.quantity
    }));

    const payload = {
      user_id: orderData.user_id,
      customer_name: orderData.customer_name,
      email: orderData.email,
      mobile_no: orderData.mobile_no,
      address: orderData.address,
      store_id: orderData.store_id,
      payment_method: paymentMethod,
      items: formattedItems,
      total_amount: finalTotal,
      first_order_discount: isFirstOrderDiscountApplied ? displayDiscount : 0,
      is_first_order_discount: isFirstOrderDiscountApplied && displayDiscount > 0,
      coupon_code: appliedCoupon ? appliedCoupon.code : null,
      coupon_discount: appliedCoupon ? displayDiscount : 0,
      comment: chefNote,
      platform: Platform.OS,
      status: 'pending'
    };

    try {
      if (paymentMethod === 'razorpay') {
        const tempOrderId = `TEMP_${Date.now()}`;
        startRazorpayPayment(tempOrderId, finalTotal, orderData, payload);
      } else {
        const response = await api.post('/place-order', payload);
        if (response.status === 201 || response.data.success) {
          finishOrder();
        } else {
          Alert.alert("Order Failed", response.data.message || "Unknown error");
          setProcessing(false);
        }
      }
    } catch (error) {
      Alert.alert("Error", "Could not place order. Server error.");
      setProcessing(false);
    }
  };

  const startRazorpayPayment = (orderId, amount, userDetails, fullPayload) => {
    const logoSource = require('../../../assets/logo.png');
    const logoUri = Image.resolveAssetSource(logoSource).uri;

    var options = {
      description: 'Order Payment',
      image: logoUri,
      currency: 'INR',
      key: RAZORPAY_KEY_ID,
      amount: Math.round(amount * 100),
      name: 'Amigos Pizza',
      prefill: {
        email: userDetails.email || '',
        contact: userDetails.mobile_no || '',
        name: userDetails.customer_name || ''
      },
      notes: { temp_order_id: orderId },
      theme: { color: COLORS.primary }
    };

    RazorpayCheckout.open(options)
      .then(async (data) => {
        try {
          const finalPayload = {
            ...fullPayload,
            payment_id: data.razorpay_payment_id,
            status: 'processing'
          };

          const response = await api.post('/place-order', finalPayload);
          if (response.status === 201 || response.data.success) {
            finishOrder();
          } else {
            Alert.alert("Order Issue", "Payment succeeded but order creation failed.");
            setProcessing(false);
          }
        } catch (e) {
          Alert.alert("Server Error", "Payment succeeded but order creation failed on server.");
          setProcessing(false);
        }
      })
      .catch((error) => {
        let title = "Payment Failed";
        let message = error?.description || error?.message || (typeof error === 'string' ? error : JSON.stringify(error));
        if (error?.code === 0 || error?.code === '0') {
          title = "Payment Cancelled";
          message = "You cancelled the payment.";
        }
        Alert.alert(title, message);
        setProcessing(false);
      });
  };

  const finishOrder = () => {
    clearCart();
    navigation.reset({
      index: 0,
      routes: [{ name: 'OrderSuccess' }],
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <BackButton />
        <Text style={styles.headerTitle}>Checkout</Text>
      </View>

      <ScrollView style={styles.container} contentContainerStyle={{ padding: 20, paddingBottom: 100 }}>
        <Text style={styles.sectionTitle}>Delivery Details</Text>
        <View style={styles.addressCard}>
          <Text style={styles.label}>👤 Customer</Text>
          <Text style={styles.infoText}>{orderData.customer_name || 'Guest'}</Text>
          {orderData.mobile_no ? <Text style={styles.subInfoText}>{orderData.mobile_no}</Text> : null}
          <Text style={[styles.label, { marginTop: 10 }]}>📍 Address</Text>
          <Text style={styles.infoText}>{orderData.address || 'Please add address'}</Text>
          <View style={styles.deliveryTimeBadge}>
            <Text style={styles.deliveryTimeText}>⚡ Delivery in 30-45 min</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Payment Method</Text>
        <TouchableOpacity
          style={[styles.paymentOption, paymentMethod === 'razorpay' && styles.selectedOption]}
          onPress={() => setPaymentMethod('razorpay')}
        >
          <View style={styles.radioCircle}>
            {paymentMethod === 'razorpay' && <View style={styles.selectedDot} />}
          </View>
          <View>
            <Text style={styles.paymentText}>Online Payment</Text>
            <Text style={styles.subText}>UPI, Cards, Netbanking</Text>
          </View>
        </TouchableOpacity>

        {isCodEnabled && (
          <TouchableOpacity
            style={[styles.paymentOption, paymentMethod === 'cod' && styles.selectedOption]}
            onPress={() => setPaymentMethod('cod')}
          >
            <View style={styles.radioCircle}>
              {paymentMethod === 'cod' && <View style={styles.selectedDot} />}
            </View>
            <View>
              <Text style={styles.paymentText}>Cash on Delivery</Text>
              <Text style={styles.subText}>Pay cash at your doorstep</Text>
            </View>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.paymentOption, paymentMethod === 'pickup' && styles.selectedOption]}
          onPress={() => setPaymentMethod('pickup')}
        >
          <View style={styles.radioCircle}>
            {paymentMethod === 'pickup' && <View style={styles.selectedDot} />}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.paymentText}>Self Pickup / Takeaway</Text>
            <Text style={styles.subText}>Pay at counter: {STORES[orderData.store_id]?.name}</Text>
          </View>
        </TouchableOpacity>

        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Bill Summary</Text>
          <View style={styles.row}>
            <Text style={styles.summaryLabel}>Item Total</Text>
            <Text style={styles.summaryValue}>₹{(cartTotal / 1.05).toFixed(2)}</Text>
          </View>
          
          {(() => {
            let originalBasePrice = cartTotal / 1.05;
            let discountBase = 0;
            let appliedCouponInfo = null;
            
            if (appliedCoupon) {
              discountBase = appliedCoupon.discount_amount / 1.05;
              appliedCouponInfo = appliedCoupon;
            } else if (firstOrderDiscount?.enabled && isFirstOrder && cartTotal >= firstOrderDiscount.minAmount) {
              discountBase = firstOrderDiscount.type === 'percent' ? originalBasePrice * (firstOrderDiscount.value / 100) : firstOrderDiscount.value / 1.05;
            }
            
            if (discountBase > originalBasePrice) discountBase = originalBasePrice;
            let displayDiscount = discountBase * 1.05;
            
            let discountedBasePrice = originalBasePrice - discountBase;
            let finalGst = discountedBasePrice * 0.05;
            let finalTotal = discountedBasePrice + finalGst;

            return (
              <>
                {displayDiscount > 0 && (
                  <View style={styles.row}>
                    <Text style={[styles.summaryLabel, { color: COLORS.primary, fontWeight: 'bold' }]}>
                      {appliedCouponInfo ? `Coupon (${appliedCouponInfo.code})` : 'First Order Discount'}
                    </Text>
                    <Text style={[styles.summaryValue, { color: COLORS.primary, fontWeight: 'bold' }]}>-₹{displayDiscount.toFixed(2)}</Text>
                  </View>
                )}
                <View style={styles.row}>
                  <Text style={styles.summaryLabel}>GST (5%)</Text>
                  <Text style={styles.summaryValue}>₹{finalGst.toFixed(2)}</Text>
                </View>
                <View style={[styles.row, { marginTop: 10, borderTopWidth: 1, borderTopColor: '#ddd', paddingTop: 10 }]}>
                  <Text style={styles.totalLabel}>Total Amount</Text>
                  <Text style={styles.totalValue}>₹{finalTotal.toFixed(2)}</Text>
                </View>
              </>
            );
          })()}
        </View>
      </ScrollView>

      <View style={[styles.bottomContainer, { paddingBottom: insets.bottom + 20 }]}>
        <TouchableOpacity
          style={[styles.confirmBtn, processing && { opacity: 0.7 }]}
          onPress={handleConfirmOrder}
          disabled={processing || (!orderData.address && paymentMethod !== 'pickup')}
        >
          {(() => {
            let originalBasePrice = cartTotal / 1.05;
            let discountBase = 0;
            
            if (appliedCoupon) {
              discountBase = appliedCoupon.discount_amount / 1.05;
            } else if (firstOrderDiscount?.enabled && isFirstOrder && cartTotal >= firstOrderDiscount.minAmount) {
              discountBase = firstOrderDiscount.type === 'percent' ? originalBasePrice * (firstOrderDiscount.value / 100) : firstOrderDiscount.value / 1.05;
            }
            if (discountBase > originalBasePrice) discountBase = originalBasePrice;
            let finalTotal = (originalBasePrice - discountBase) * 1.05;
            
            return processing ? <ActivityIndicator color="#000" /> :
              <Text style={styles.confirmBtnText}>
                {paymentMethod === 'razorpay' ? `Pay ₹${finalTotal.toFixed(2)}` : 'Confirm Order'}
              </Text>;
          })()}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#fff' },
  container: { flex: 1, backgroundColor: '#fff' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', height: '100%' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 15, borderBottomWidth: 1, borderBottomColor: '#eee' },
  headerTitle: { fontSize: 18, fontWeight: 'bold' },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginVertical: 15 },
  addressCard: { backgroundColor: '#F9F9F9', padding: 15, borderRadius: 12, borderWidth: 1, borderColor: '#EEE' },
  label: { fontSize: 12, fontWeight: 'bold', color: '#888' },
  infoText: { fontSize: 15, color: '#333', marginTop: 2, fontWeight: '500' },
  subInfoText: { fontSize: 13, color: '#666', marginBottom: 5 },
  deliveryTimeBadge: { marginTop: 12, backgroundColor: '#E8F5E9', padding: 8, borderRadius: 8, alignSelf: 'flex-start' },
  deliveryTimeText: { color: '#2E7D32', fontWeight: 'bold', fontSize: 13 },
  paymentOption: { flexDirection: 'row', alignItems: 'center', padding: 15, borderWidth: 1, borderColor: '#EEE', borderRadius: 12, marginBottom: 10 },
  selectedOption: { borderColor: COLORS.primary, backgroundColor: '#FFF5F5' },
  radioCircle: { height: 20, width: 20, borderRadius: 10, borderWidth: 2, borderColor: COLORS.primary, alignItems: 'center', justifyContent: 'center', marginRight: 15 },
  selectedDot: { height: 10, width: 10, borderRadius: 5, backgroundColor: COLORS.primary },
  paymentText: { fontSize: 15, fontWeight: '600' },
  subText: { fontSize: 12, color: '#666', marginTop: 2 },
  summaryCard: { backgroundColor: '#F8F8F8', padding: 15, borderRadius: 12, marginTop: 20 },
  summaryTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 10 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 3 },
  summaryLabel: { fontSize: 14, color: '#666' },
  summaryValue: { fontSize: 14, color: '#333', fontWeight: '500' },
  totalLabel: { fontSize: 18, fontWeight: 'bold' },
  totalValue: { fontSize: 18, fontWeight: 'bold', color: COLORS.primary },
  bottomContainer: { paddingHorizontal: 20, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#eee', paddingTop: 15 },
  confirmBtn: { backgroundColor: GOLD_COLOR, padding: 16, borderRadius: 12, alignItems: 'center' },
  confirmBtnText: { color: '#000', fontWeight: 'bold', fontSize: 18 }
});

export default CheckoutScreen;