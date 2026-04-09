import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS } from '../utils/colors';
import { useSettings } from '../context/SettingsContext';

const ProductCard = ({ item, onAdd }) => {
  const { isStoreOnline } = useSettings();

  return (
    <View style={[styles.card, !isStoreOnline && { opacity: 0.6 }]}>
      <View style={styles.info}>
        <View style={styles.vegIconContainer}>
          {/* Simple Veg Green Square Icon */}
          <View style={styles.vegIcon} />
        </View>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.price}>₹{item.price}</Text>
        <Text style={styles.description} numberOfLines={2}>
          {item.description}
        </Text>
      </View>

      <View style={styles.imageContainer}>
        <Image source={{ uri: item.image_url }} style={[styles.image, !isStoreOnline && { tintColor: 'gray' }]} />
        <TouchableOpacity
          style={[styles.addButton, !isStoreOnline && { borderColor: '#ccc', backgroundColor: '#f0f0f0' }]}
          disabled={!isStoreOnline}
          onPress={() => onAdd(item)}
        >
          <Text style={[styles.addText, !isStoreOnline && { color: '#888' }]}>ADD</Text>
        </TouchableOpacity>
      </View>
    </View>
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
    shadowOpacity: 0.1,
    justifyContent: 'space-between'
  },
  info: { flex: 0.6 },
  vegIcon: { width: 12, height: 12, borderWidth: 1, borderColor: 'green', backgroundColor: 'green', borderRadius: 2 },
  name: { fontSize: 18, fontWeight: 'bold', marginTop: 5 },
  price: { fontSize: 16, fontWeight: '600', marginVertical: 4 },
  description: { fontSize: 13, color: '#777' },
  imageContainer: { flex: 0.35, alignItems: 'center' },
  image: { width: 110, height: 110, borderRadius: 12 },
  addButton: {
    position: 'absolute',
    bottom: -10,
    backgroundColor: '#fff',
    paddingHorizontal: 25,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.primary,
    elevation: 4,
  },
  addText: { color: COLORS.primary, fontWeight: 'bold', fontSize: 14 }
});

export default ProductCard;