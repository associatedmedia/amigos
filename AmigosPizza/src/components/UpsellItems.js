import React, { useMemo } from 'react';
import {
  View, Text, FlatList, Image, TouchableOpacity, StyleSheet
} from 'react-native';
import { useMenuData } from '../hooks/useMenuData'; // ✅ Uses Offline Cache
import { useCart } from '../context/CartContext';
import { useSettings } from '../context/SettingsContext';
import { COLORS } from '../utils/colors';

const PRIMARY_RED = '#D23F45';

const UpsellItems = () => {
  const { products } = useMenuData();
  const { addToCart } = useCart();
  const { isStoreOnline } = useSettings();

  // ✅ SMART LOGIC: Get items explicitly marked as "Upsell" in Admin
  const randomSuggestions = useMemo(() => {
    if (!products || products.length === 0) return [];

    // 1. Filter: Find products marked as "Upsell"
    let suggestions = products.filter(p => !!p.is_upsell);

    // 2. Fallback: If no items are marked as upsell, use the previous "Cheap Items" logic
    if (suggestions.length === 0) {
      suggestions = products.filter(p => p.price < 500);
    }

    // 3. Final Shuffle & Limit (up to 3)
    return suggestions.sort(() => 0.5 - Math.random()).slice(0, 3);
  }, [products]);

  if (randomSuggestions.length === 0) return null;

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      {/* Image Handling */}
      <Image
        source={{ uri: item.image_url || 'https://placehold.co/150x150/png?text=Yum' }}
        style={styles.image}
      />

      <View style={styles.content}>
        <Text style={styles.name} numberOfLines={2}>{item.name}</Text>

        <View style={styles.footer}>
          <Text style={styles.price}>₹{item.price}</Text>
          <TouchableOpacity
            style={[styles.addBtn, !isStoreOnline && { backgroundColor: '#ccc' }]}
            disabled={!isStoreOnline}
            onPress={() => addToCart({ ...item, quantity: 1 })}
          >
            <Text style={[styles.addText, !isStoreOnline && { color: '#888' }]}>ADD +</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Complete Your Meal With</Text>
      <FlatList
        data={randomSuggestions}
        horizontal
        showsHorizontalScrollIndicator={false}
        renderItem={renderItem}
        keyExtractor={item => item.id.toString()}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { marginTop: 20 },
  title: { fontSize: 14, color: '#666', textAlign: 'center', marginBottom: 15 },
  listContent: { paddingHorizontal: 15 },

  card: {
    width: 140, backgroundColor: '#fff', borderRadius: 10, marginBottom: 10,
    marginRight: 12, overflow: 'hidden', elevation: 2, paddingBottom: 10
  },
  image: { width: '100%', height: 90, backgroundColor: '#eee' },
  content: { padding: 8 },
  name: { fontSize: 12, fontWeight: 'bold', color: '#333', height: 35 },

  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 5 },
  price: { fontWeight: 'bold', fontSize: 13 },
  addBtn: { backgroundColor: PRIMARY_RED, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 5 },
  addText: { color: '#fff', fontSize: 10, fontWeight: 'bold' }
});

export default UpsellItems;