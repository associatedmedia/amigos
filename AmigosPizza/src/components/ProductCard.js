import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS } from '../utils/colors';
import { useSettings } from '../context/SettingsContext';

// Notice we changed 'onAdd' to 'onPress' here to match our CategoryDetailScreen update
const ProductCard = ({ item, onPress }) => {
  const { isStoreOnline } = useSettings();

  // 1. SMART LOGIC: Check if this product has variants attached
  const hasVariants = item.variants && item.variants.length > 0;

  // ADD THIS LINE TEMPORARILY:
  // console.log("Item Data from API:", item);
  // if (item.name.includes("Tex Mex")) {
  //   console.log("Tex Mex Data from API:", item.variants);
  // }

  // 2. Determine button text dynamically based ONLY on variants
  const buttonText = hasVariants ? "OPTIONS" : "ADD +";

  return (
    <TouchableOpacity
      style={[styles.card, !isStoreOnline && { opacity: 0.6 }]}
      onPress={() => isStoreOnline && onPress(item)} // Make the whole card clickable!
      activeOpacity={0.8}
      disabled={!isStoreOnline}
    >
      <View style={styles.info}>
        <View style={styles.vegIconContainer}>
          {/* Dynamic Veg/Non-Veg Indicator */}
          <View style={[styles.vegOuter, { borderColor: item.is_veg ? '#27ae60' : '#e74c3c' }]}>
            <View style={[styles.vegInner, { backgroundColor: item.is_veg ? '#27ae60' : '#e74c3c' }]} />
          </View>
        </View>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.price}>₹{item.price}</Text>
        <Text style={styles.description} numberOfLines={2}>
          {item.description}
        </Text>
      </View>

      <View style={styles.imageContainer}>
        <Image
          source={{ uri: item.image_url || 'https://placehold.co/150' }}
          style={[styles.image, !isStoreOnline && { tintColor: 'gray' }]}
        />
        <TouchableOpacity
          style={[
            styles.addButton,
            (hasVariants && styles.optionsButton), // Change style if it has sizes
            !isStoreOnline && { borderColor: '#ccc', backgroundColor: '#f0f0f0' }
          ]}
          disabled={!isStoreOnline}
          onPress={() => onPress(item)}
        >
          <Text style={[
            styles.addText,
            (hasVariants && styles.optionsText),
            !isStoreOnline && { color: '#888' }
          ]}>
            {buttonText}
          </Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    padding: 15,
    marginHorizontal: 15,
    marginBottom: 15,
    backgroundColor: '#fff',
    borderRadius: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    justifyContent: 'space-between'
  },
  info: { flex: 0.6 },

  // Standard Veg/Non-Veg Square Indicator
  vegIconContainer: { marginBottom: 4 },
  vegOuter: { width: 14, height: 14, borderWidth: 1.5, justifyContent: 'center', alignItems: 'center', borderRadius: 2 },
  vegInner: { width: 6, height: 6, borderRadius: 3 },

  name: { fontSize: 18, fontWeight: 'bold', marginTop: 2, color: '#222' },
  price: { fontSize: 16, fontWeight: '700', marginVertical: 6, color: '#444' },
  description: { fontSize: 13, color: '#777', lineHeight: 18 },
  imageContainer: { flex: 0.35, alignItems: 'center', justifyContent: 'center' },
  image: { width: 110, height: 110, borderRadius: 12 },

  // Standard Add Button (White background, Red text)
  addButton: {
    position: 'absolute',
    bottom: -10,
    backgroundColor: '#fff',
    paddingHorizontal: 22,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.primary || '#D23F45',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
  },
  addText: { color: COLORS.primary || '#D23F45', fontWeight: '900', fontSize: 13 },

  // Options Button (Slightly tinted background so the user knows it's different)
  optionsButton: {
    backgroundColor: '#fff0f1', // Light red tint
  },
  optionsText: {
    color: '#D23F45',
  }
});

export default ProductCard;