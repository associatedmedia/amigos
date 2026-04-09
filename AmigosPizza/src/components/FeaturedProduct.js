
import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS } from '../utils/colors';

const FeaturedProduct = () => {

    return (
        <View>
        <Text style={styles.sectionTitle}>Today's Best Deal</Text>
        <TouchableOpacity style={styles.foodCard}>
          <Image source={{uri: 'https://images.unsplash.com/photo-1593560708920-61dd98c46a4e?w=800'}} style={styles.foodImg} />
          <View style={styles.badge}><Text style={styles.badgeText}>FLAT ₹100 OFF</Text></View>
          <View style={styles.foodDetails}>
            <Text style={styles.foodName}>Pizzeria The Pizza</Text>
            <Text style={styles.foodRating}>⭐ 4.0 • 30 mins</Text>
          </View>
        </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginLeft: 20, marginVertical: 15, color: '#222' },
  foodCard: { width: '90%', alignSelf: 'center', marginBottom: 25 },
  foodImg: { width: '100%', height: 200, borderRadius: 20 },
  badge: { position: 'absolute', top: 15, left: 15, backgroundColor: '#2563EB', padding: 5, borderRadius: 5 },
  badgeText: { color: '#fff', fontWeight: 'bold', fontSize: 10 },
  foodDetails: { marginTop: 10 },
  foodName: { fontSize: 18, fontWeight: 'bold' },
  foodRating: { color: '#666', marginTop: 2 },
});

export default FeaturedProduct;