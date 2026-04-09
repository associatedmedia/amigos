import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, Image, TouchableOpacity, StyleSheet
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useCart } from '../context/CartContext';
import { useSettings } from '../context/SettingsContext';
import api from '../services/api';
import { COLORS } from '../utils/colors';

const PreviouslyOrdered = () => {
  const navigation = useNavigation();
  const { addToCart } = useCart();
  const { isStoreOnline } = useSettings();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const userRes = await api.get('/user');
      if (userRes.data.success) {
        const userId = userRes.data.user.id;
        // Fetch real history from backend
        const historyRes = await api.get(`/user/history?user_id=${userId}`);
        setItems(historyRes.data);
      }
    } catch (error) {
      console.log("History fetch error:", error.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading || items.length === 0) return null;

  // ✅ Matches your requested UI structure for the card
  const renderRecentCard = ({ item }) => (
    <View style={styles.card}>
      <Image
        source={{ uri: item.image_url || 'https://placehold.co/100x100/png?text=No Image' }}
        style={styles.image}
      />

      <View style={styles.content}>
        <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.price}>₹{item.price}</Text>

        <TouchableOpacity
          style={[styles.reorderBtn, !isStoreOnline && { borderColor: '#ccc', backgroundColor: '#f0f0f0' }]}
          disabled={!isStoreOnline}
          onPress={() => {
            // Ensure we pass a valid object to cart
            addToCart({
              id: item.id,
              name: item.name,
              price: item.price,
              image_url: item.image_url,
              is_veg: item.is_veg
            });
            navigation.navigate('Cart');
          }}
        >
          <Text style={[styles.reorderText, !isStoreOnline && { color: '#888' }]}>ADD +</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.recentSection}>
      <Text style={styles.sectionTitle}>Previously ordered items 🕒</Text>
      <FlatList
        data={items}
        horizontal
        showsHorizontalScrollIndicator={false}
        renderItem={renderRecentCard}
        keyExtractor={item => item.id.toString()}
        contentContainerStyle={{ paddingHorizontal: 15 }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  // ✅ Section Styles
  recentSection: {
    marginVertical: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginLeft: 20,
    marginBottom: 15,
  },

  // ✅ Card Styles
  card: {
    width: 150, // Slightly compact for horizontal scroll
    backgroundColor: '#fff',
    borderRadius: 12,
    marginRight: 12,
    marginBottom: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    alignItems: 'center', // Center content vertically
    elevation: 2,         // Subtle shadow
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  image: {
    width: 80,
    height: 80,
    borderRadius: 40, // Circular image looks modern for "Recent"
    marginBottom: 8,
    backgroundColor: '#f0f0f0',
  },
  content: {
    alignItems: 'center',
    width: '100%',
  },
  name: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 2,
  },
  price: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
    marginBottom: 8,
  },
  reorderBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 6,
    paddingHorizontal: 20,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: COLORS.primary, // Red border
    width: '100%',
    alignItems: 'center',
  },
  reorderText: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: 'bold',
  }
});

export default PreviouslyOrdered;