import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import LottieView from 'lottie-react-native'; 
import { useAudioPlayer } from 'expo-audio'; // 1. New Import
import { COLORS } from '../../utils/colors';
import { SafeAreaView } from 'react-native-safe-area-context'; // 2. Safe Area Import

const { width } = Dimensions.get('window');

// 2. Define Sound Source (Remote URL or Local Require)
const SUCCESS_SOUND_SOURCE = require('../../../assets/sounds/success.mp3');
// OR Remote: { uri: 'https://www.soundjay.com/buttons/sounds/button-3.mp3' }

const OrderSuccessScreen = ({ navigation }) => {
  
  // 3. Initialize the new Player Hook
  const player = useAudioPlayer(SUCCESS_SOUND_SOURCE);

  useEffect(() => {
    // 4. Play Sound on Mount
    player.play(); 
  }, []);

  const handleContinue = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: 'OrderHistory' }],
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right','bottom']}>
      
      {/* Lottie Animation */}
      <View style={styles.lottieContainer}>
        <LottieView
          source={require('../../../assets/animations/Success-animation.json')}
          autoPlay
          loop={false} 
          style={styles.lottie}
        />
      </View>

      <Text style={styles.title}>Order Placed!</Text>
      <Text style={styles.subtitle}>
        Your Order is being prepared. We will notify you once it's out for delivery.
      </Text>

      <TouchableOpacity style={styles.btn} onPress={handleContinue}>
        <Text style={styles.btnText}>Track Order</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.homeLink} 
        onPress={() => navigation.navigate('Home')}
      >
        <Text style={{color: '#888'}}>Go to Home</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    backgroundColor: '#fff', 
    padding: 20 
  },
  lottieContainer: {
    width: width * 0.8,
    height: width * 0.8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20
  },
  lottie: {
    width: '100%',
    height: '100%',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 10
  },
  subtitle: {
    textAlign: 'center',
    color: '#666',
    fontSize: 16,
    marginBottom: 40,
    lineHeight: 24
  },
  btn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 15,
    paddingHorizontal: 60,
    borderRadius: 30,
    elevation: 5,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    marginBottom: 20
  },
  btnText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold'
  },
  homeLink: {
    padding: 10
  }
});

export default OrderSuccessScreen;