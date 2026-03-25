import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Vibration, Alert, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { Audio } from 'expo-av';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'https://api.amigospizza.co/api';
const { width } = Dimensions.get('window');

export default function NewOrderRingerScreen() {
  const params = useLocalSearchParams();
  const [sound, setSound] = useState(null);
  const [loading, setLoading] = useState(false);
  
  // Safely parse the order param
  let orderData = null;
  try {
     orderData = params.orderData ? JSON.parse(params.orderData) : null;
  } catch(e) {}

  useEffect(() => {
    let internalSound;

    async function playSound() {
      try {
        await Audio.setAudioModeAsync({
            playsInSilentModeIOS: true,
            staysActiveInBackground: true,
            shouldDuckAndroid: true,
        });
        const { sound: playbackObject } = await Audio.Sound.createAsync(
           { uri: 'https://actions.google.com/sounds/v1/alarms/beep_short.ogg' },
           { shouldPlay: true, isLooping: true }
        );
        internalSound = playbackObject;
        setSound(playbackObject);
        // Start device vibration loop: wait 500ms, vibrate 1000ms, repeat
        Vibration.vibrate([500, 1000], true);
      } catch (e) {
         console.log('Error initializing sound', e);
         // Fallback strictly to vibration if audio fails
         Vibration.vibrate([500, 1000], true);
      }
    }

    playSound();

    return () => {
       Vibration.cancel();
       if (internalSound) {
           internalSound.stopAsync();
           internalSound.unloadAsync();
       }
    };
  }, []);

  const stopAlerts = () => {
      Vibration.cancel();
      if (sound) {
         sound.stopAsync();
      }
  };

  const handleAccept = async () => {
      if (!orderData) return router.back();
      setLoading(true);
      try {
          // Acknowledge locally so it doesn't pop up again
          const ackStr = await AsyncStorage.getItem('acknowledged_orders');
          const ackList = ackStr ? JSON.parse(ackStr) : [];
          ackList.push(orderData.id);
          await AsyncStorage.setItem('acknowledged_orders', JSON.stringify(ackList));
          
          stopAlerts();
          router.back();
      } catch (error) {
          console.error(error);
      }
      setLoading(false);
  };

  const handleDecline = async () => {
      if (!orderData) return router.back();
      setLoading(true);
      try {
          stopAlerts();

          const token = await AsyncStorage.getItem('userToken');
          
          // Decline via Backend
          await axios.post(`${API_URL}/driver/orders/${orderData.id}/decline`, {}, {
              headers: { Authorization: `Bearer ${token}` }
          });
          
          Alert.alert("Declined", "You have declined this delivery.");
          router.back();
      } catch (error) {
          Alert.alert("Error", "Could not decline. Please try again or check connection.");
      }
      setLoading(false);
  };

  if (!orderData) return <View style={styles.container} />;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.pulseRing}>
          <Ionicons name="notifications-circle" size={120} color="#e63946" />
      </View>
      
      <Text style={styles.titleText}>NEW ORDER ASSIGNED!</Text>

      <View style={styles.card}>
         <View style={styles.row}>
            <Ionicons name="restaurant" size={20} color="#666" style={{marginRight: 8}}/>
            <Text style={styles.restaurantName}>Amigos Pizza</Text>
         </View>
         <View style={styles.divider} />
         <View style={styles.row}>
            <Ionicons name="location" size={20} color="#e63946" style={{marginRight: 8}}/>
            <Text style={styles.addressText} numberOfLines={3}>{orderData.address || 'Customer Address'}</Text>
         </View>
         <View style={styles.divider} />
         <View style={styles.rowBetween}>
            <Text style={styles.paymentMethod}>{orderData.payment_method?.toUpperCase() || 'ONLINE'}</Text>
            <Text style={styles.totalAmount}>₹{orderData.total_amount}</Text>
         </View>
      </View>

      <View style={styles.buttonContainer}>
          <TouchableOpacity 
             style={[styles.btn, styles.acceptBtn]} 
             onPress={handleAccept}
             disabled={loading}
          >
             <Ionicons name="checkmark-circle" size={28} color="#fff" />
             <Text style={styles.btnText}>ACCEPT</Text>
          </TouchableOpacity>

          <TouchableOpacity 
             style={[styles.btn, styles.declineBtn]} 
             onPress={handleDecline}
             disabled={loading}
          >
             <Ionicons name="close-circle" size={28} color="#fff" />
             <Text style={styles.btnText}>DECLINE</Text>
          </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
      flex: 1,
      backgroundColor: '#111', 
      alignItems: 'center',
      padding: 24,
      justifyContent: 'center'
  },
  pulseRing: {
      marginBottom: 30,
      shadowColor: '#e63946',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.8,
      shadowRadius: 20,
      elevation: 10
  },
  titleText: {
      fontSize: 26,
      fontWeight: '900',
      color: '#fff',
      marginBottom: 40,
      textAlign: 'center',
      letterSpacing: 1
  },
  card: {
      backgroundColor: '#fff',
      width: '100%',
      borderRadius: 16,
      padding: 20,
      marginBottom: 50
  },
  row: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12
  },
  rowBetween: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 12
  },
  divider: {
      height: 1,
      backgroundColor: '#eee'
  },
  restaurantName: {
      fontSize: 18,
      fontWeight: 'bold',
      color: '#222'
  },
  addressText: {
      fontSize: 16,
      color: '#444',
      flex: 1,
      lineHeight: 22
  },
  paymentMethod: {
      fontSize: 14,
      fontWeight: 'bold',
      color: '#888'
  },
  totalAmount: {
      fontSize: 24,
      fontWeight: '900',
      color: '#111'
  },
  buttonContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      width: '100%'
  },
  btn: {
      flexDirection: 'row',
      flex: 1,
      paddingVertical: 20,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
      marginHorizontal: 8
  },
  acceptBtn: {
      backgroundColor: '#4cd137'
  },
  declineBtn: {
      backgroundColor: '#e63946'
  },
  btnText: {
      color: '#fff',
      fontSize: 18,
      fontWeight: '900',
      marginLeft: 8,
      letterSpacing: 1
  }
});
