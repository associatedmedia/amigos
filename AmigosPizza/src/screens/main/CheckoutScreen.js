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
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { useSettings } from '../../context/SettingsContext';
import { COLORS } from '../../utils/colors';
import api from '../../services/api';
import Toast from 'react-native-toast-message';
import BackButton from '../../components/BackButton';
import Constants from 'expo-constants';

// Get Key from app.config.js (extra)
const RAZORPAY_KEY_ID = Constants.expoConfig?.extra?.razorpayKeyId || 'rzp_test_cGaBr3RC6a520W';
const GOLD_COLOR = '#FFD700';
const PRIMARY_RED = '#D23F45';

const CheckoutScreen = ({ navigation }) => {
  const { cartItems, cartTotal, clearCart, chefNote } = useCart();
  const { isGuest, logout } = useAuth();
  const { isCodEnabled, minOrderCriteria } = useSettings();
  const insets = useSafeAreaInsets();

  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('razorpay');

  // Store Details
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

  // --- HELPER: Distance Calculation ---
  const getDistanceFromLatLonInKm = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const deg2rad = (deg) => deg * (Math.PI / 180);

  const determineStore = (userLat, userLong) => {
    if (!userLat || !userLong) return '0';
    const srinagarLat = 34.0706;
    const srinagarLong = 74.8033;
    const distance = getDistanceFromLatLonInKm(userLat, userLong, srinagarLat, srinagarLong);
    return distance <= 20 ? '0' : '1';
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
      const response = await api.get('/user'); // Ensure this route exists in Laravel
      if (response.data.success) {
        const user = response.data.user;
        const detectedStoreId = determineStore(user.latitude, user.longitude);

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
      // Fallback if API fails (e.g. guest mode)
      setOrderData(prev => ({ ...prev, customer_name: 'Guest' }));
    } finally {
      setLoading(false);
    }
  };

  // --- ORDER PLACEMENT LOGIC ---
  const handleConfirmOrder = async () => {
    if (cartItems.length === 0) return Alert.alert("Error", "Your cart is empty");

    // Address Check (only if delivery)
    if (paymentMethod !== 'pickup' && !orderData.address) {
      return Alert.alert("Required", "Please add a delivery address first.");
    }

    // --- MINIMUM ORDER CRITERIA BY DISTANCE (Delivery Only) ---
    if (paymentMethod !== 'pickup' && orderData.latitude && orderData.longitude && minOrderCriteria.length > 0) {
      // Main Store Coordinates (Srinagar)
      const MAIN_STORE_LAT = 34.0706;
      const MAIN_STORE_LONG = 74.8033;
      const distance = getDistanceFromLatLonInKm(orderData.latitude, orderData.longitude, MAIN_STORE_LAT, MAIN_STORE_LONG);
      let minOrderVal = 0;

      const sortedCriteria = [...minOrderCriteria].sort((a, b) => a.distance - b.distance);
      const fallback = sortedCriteria.find(c => c.distance === 'fallback') || { min_value: 2500 };
      minOrderVal = fallback.min_value;

      for (const criterion of sortedCriteria) {
        if (criterion.distance !== 'fallback' && distance <= criterion.distance) {
          minOrderVal = criterion.min_value;
          break;
        }
      }

      if (cartTotal < minOrderVal) {
        return Alert.alert(
          "Minimum Order Not Met",
          `For a distance of ${distance.toFixed(1)} km, the minimum order value is ₹${minOrderVal}.\nCurrent Total: ₹${cartTotal}`
        );
      }
    }

    setProcessing(true);

    // 1. Format Items (Clean Data)
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
      total_amount: cartTotal,
      comment: chefNote,
      platform: Platform.OS,
      status: 'pending'
    };

    try {
      if (paymentMethod === 'razorpay') {
        // Prevent creating backend order first. Let's start payment gateway directly.
        // We will generate a temporary pseudo-order ID for Razorpay notes.
        const tempOrderId = `TEMP_${Date.now()}`;
        startRazorpayPayment(tempOrderId, cartTotal, orderData, payload);
      } else {
        // 2. COD / Pickup -> Call Laravel API normally
        const response = await api.post('/place-order', payload);
        if (response.status === 201 || response.data.success) {
          finishOrder();
        } else {
          Alert.alert("Order Failed", response.data.message || "Unknown error");
          setProcessing(false);
        }
      }
    } catch (error) {
      console.error("Order Creation Error:", error);
      Alert.alert("Error", "Could not place order. Server error.");
      setProcessing(false);
    }
  };

  const startRazorpayPayment = (orderId, amount, userDetails, fullPayload) => {
    // Resolve local asset to URI
    const logoSource = require('../../../assets/logo.png');
    const logoUri = Image.resolveAssetSource(logoSource).uri;

    var options = {
      description: 'Order Payment',
      image: logoUri,
      currency: 'INR',
      key: RAZORPAY_KEY_ID,
      amount: amount * 100, // paise
      name: 'Amigos Pizza',
      prefill: {
        email: userDetails.email,
        contact: userDetails.mobile_no,
        name: userDetails.customer_name
      },
      notes: { temp_order_id: orderId },
      theme: { color: COLORS.primary } // Removed strict method constraints to allow UPI/Wallets
    };

    RazorpayCheckout.open(options)
      .then(async (data) => {
        // Payment Success -> Now Update Backend with actual order
        try {
          // Attach payment details to payload
          const finalPayload = {
            ...fullPayload,
            payment_id: data.razorpay_payment_id,
            status: 'processing' // Paid
          };

          const response = await api.post('/place-order', finalPayload);
          if (response.status === 201 || response.data.success) {
            finishOrder();
          } else {
            Alert.alert("Order Issue", "Payment succeeded but order creation failed. Please contact support.");
            setProcessing(false);
          }
        } catch (e) {
          console.error(e);
          Alert.alert("Server Error", "Payment succeeded but order creation failed on server.");
          setProcessing(false);
        }
      })
      .catch((error) => {
        // Payment Cancelled/Failed
        // Error Code 0 is usually "Payment Cancelled" by user
        console.log("Payment Error:", error);

        let title = "Payment Failed";
        let message = error.description || "Something went wrong";

        if (error.code === 0 || error.code === '0') {
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
      routes: [{ name: 'OrderSuccess' }], // Make sure you have this screen!
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

        {/* Option 1: Online */}
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

        {/* Option 3: Cash on Delivery */}
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

        {/* Option 2: Self Pickup */}
        <TouchableOpacity
          style={[styles.paymentOption, paymentMethod === 'pickup' && styles.selectedOption]}
          onPress={() => setPaymentMethod('pickup')}
        >
          <View style={styles.radioCircle}>
            {paymentMethod === 'pickup' && <View style={styles.selectedDot} />}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.paymentText}>Self Pickup / Takeaway</Text>
            <Text style={styles.subText}>
              Pay at counter: {STORES[orderData.store_id]?.name}
            </Text>
          </View>
        </TouchableOpacity>

        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Bill Summary</Text>
          
          <View style={styles.row}>
            <Text style={styles.summaryLabel}>Item Total</Text>
            <Text style={styles.summaryValue}>₹{(cartTotal / 1.05).toFixed(2)}</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.summaryLabel}>CGST (2.5%)</Text>
            <Text style={styles.summaryValue}>₹{( (cartTotal - (cartTotal / 1.05)) / 2 ).toFixed(2)}</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.summaryLabel}>SGST (2.5%)</Text>
            <Text style={styles.summaryValue}>₹{( (cartTotal - (cartTotal / 1.05)) / 2 ).toFixed(2)}</Text>
          </View>

          <View style={[styles.row, { marginTop: 10, borderTopWidth: 1, borderTopColor: '#ddd', paddingTop: 10 }]}>
            <Text style={styles.totalLabel}>Total Amount</Text>
            <Text style={styles.totalValue}>₹{cartTotal.toFixed(2)}</Text>
          </View>
        </View>

      </ScrollView>

      {/* Bottom Button Container */}
      <View style={[styles.bottomContainer, { paddingBottom: insets.bottom + 20 }]}>
        <TouchableOpacity
          style={[styles.confirmBtn, processing && { opacity: 0.7 }]}
          onPress={handleConfirmOrder}
          disabled={processing || (!orderData.address && paymentMethod !== 'pickup')}
        >
          {processing ? <ActivityIndicator color="#000" /> :
            <Text style={styles.confirmBtnText}>
              {paymentMethod === 'razorpay' ? `Pay ₹${cartTotal}` : 'Confirm Order'}
            </Text>
          }
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
  backBtn: { paddingRight: 15 },
  backIcon: { fontSize: 24, color: '#000' },
  headerTitle: { fontSize: 18, fontWeight: 'bold' },

  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginVertical: 15 },
  addressCard: { backgroundColor: '#F9F9F9', padding: 15, borderRadius: 12, borderWidth: 1, borderColor: '#EEE' },
  label: { fontSize: 12, fontWeight: 'bold', color: '#888' },
  infoText: { fontSize: 15, color: '#333', marginTop: 2, fontWeight: '500' },
  subInfoText: { fontSize: 13, color: '#666', marginBottom: 5 },

  deliveryTimeBadge: {
    marginTop: 12, backgroundColor: '#E8F5E9', padding: 8,
    borderRadius: 8, alignSelf: 'flex-start'
  },
  deliveryTimeText: { color: '#2E7D32', fontWeight: 'bold', fontSize: 13 },

  paymentOption: {
    flexDirection: 'row', alignItems: 'center', padding: 15,
    borderWidth: 1, borderColor: '#EEE', borderRadius: 12, marginBottom: 10
  },
  selectedOption: { borderColor: COLORS.primary, backgroundColor: '#FFF5F5' },
  radioCircle: {
    height: 20, width: 20, borderRadius: 10, borderWidth: 2,
    borderColor: COLORS.primary, alignItems: 'center', justifyContent: 'center', marginRight: 15
  },
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

  bottomContainer: {
    paddingHorizontal: 20,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 15
  },
  confirmBtn: {
    backgroundColor: GOLD_COLOR,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center'
  },
  confirmBtnText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 18
  }
});

export default CheckoutScreen;