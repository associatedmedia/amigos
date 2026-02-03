import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

const NotificationToast = ({ message, title, visible, onHide }) => {
  const slideAnim = useRef(new Animated.Value(-100)).current; // Start hidden above screen

  useEffect(() => {
    if (visible) {
      // Slide Down
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        speed: 12,
        bounciness: 5,
      }).start();

      // Auto Hide after 4 seconds
      const timer = setTimeout(() => {
        hideToast();
      }, 4000);

      return () => clearTimeout(timer);
    }
  }, [visible]);

  const hideToast = () => {
    Animated.timing(slideAnim, {
      toValue: -150,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
        if(onHide) onHide();
    });
  };

  if (!visible) return null;

  return (
    <Animated.View style={[styles.container, { transform: [{ translateY: slideAnim }] }]}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <View style={styles.content}>
          <View style={styles.iconBox}>
            <Ionicons name="notifications" size={24} color="#D23F45" />
          </View>
          <View style={styles.textContainer}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.message}>{message}</Text>
          </View>
          <TouchableOpacity onPress={hideToast}>
            <Ionicons name="close" size={20} color="#999" />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999, // Ensure it's on top of everything
    backgroundColor: 'transparent',
  },
  safeArea: {
    backgroundColor: 'transparent',
  },
  content: {
    margin: 10,
    marginTop: Platform.OS === 'android' ? 35 : 10, // Adjust for Android Status Bar
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 10, // Android Shadow
    borderLeftWidth: 5,
    borderLeftColor: '#D23F45'
  },
  iconBox: {
    marginRight: 15,
    backgroundColor: '#FFF0F0',
    padding: 8,
    borderRadius: 8
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontWeight: 'bold',
    fontSize: 14,
    color: '#333',
    marginBottom: 2
  },
  message: {
    fontSize: 14,
    color: '#555',
    fontWeight: '500'
  }
});

export default NotificationToast;