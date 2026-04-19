import React, { useMemo } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  Dimensions,
  Pressable,
  Platform
} from 'react-native';
import { useMenuData } from '../hooks/useMenuData';
import { useCart } from '../context/CartContext';
import Toast from 'react-native-toast-message';

const { width, height } = Dimensions.get('window');
const PRIMARY_RED = '#D23F45';

const DynamicUpsellModal = ({ isVisible, onClose, upsellProductIds }) => {
  const { products } = useMenuData();
  const { addToCart } = useCart();

  const relatedProducts = useMemo(() => {
    if (!products || !upsellProductIds || !Array.isArray(upsellProductIds) || upsellProductIds.length === 0) return [];

    // Flatten products regardless of grouped API structure
    let flatProducts = [];
    if (products.length > 0 && products[0].products !== undefined) {
      products.forEach(cat => {
        if (Array.isArray(cat.products)) flatProducts.push(...cat.products);
      });
    } else {
      flatProducts = products;
    }

    return flatProducts.filter(p => 
      upsellProductIds.includes(String(p.id)) || upsellProductIds.includes(Number(p.id))
    );
  }, [products, upsellProductIds]);

  if (!isVisible || relatedProducts.length === 0) return null;

  const renderItem = ({ item }) => {
    // Determine the base image URL safely
    const imageUrl = item.image_url
      ? item.image_url
      : (item.image ? "https://amigospizza.co/storage/" + item.image.replace(/\\/g, '/') : 'https://placehold.co/150x150/png?text=Pizza');

    // Default to adding the base product (if variations exist, maybe we just use base price here)
    const basePrice = item.price || (item.variants && item.variants.length > 0 ? item.variants[0].price : 0);

    return (
      <View style={styles.card}>
        <Image source={{ uri: imageUrl }} style={styles.cardImage} />
        <View style={styles.cardContent}>
          <Text style={styles.cardName} numberOfLines={1}>{item.name}</Text>
          <Text style={styles.cardPrice}>₹{basePrice}</Text>
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => {
               // Default to 1st variant if it exists, otherwise normal item
               let variant = null;
               if (item.variants && item.variants.length > 0) {
                 variant = item.variants[0];
               }
               addToCart(item, variant);
               Toast.show({ type: 'success', text1: 'Added', text2: `${item.name} added to cart` });
            }}
          >
            <Text style={styles.addText}>ADD +</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderHeader = () => (
    <View style={styles.upsellHeader}>
      <Text style={styles.title}>You might also like...</Text>
      <Text style={styles.subtitle}>Complete your order with these favorites!</Text>
    </View>
  );

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isVisible}
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.modalBody} onPress={(e) => e.stopPropagation()}>
          <View style={styles.handle} />

          <FlatList
            style={{ flex: 1 }}
            ListHeaderComponent={renderHeader}
            data={relatedProducts}
            keyExtractor={item => item.id.toString()}
            renderItem={renderItem}
            numColumns={2}
            contentContainerStyle={styles.list}
            columnWrapperStyle={styles.columnWrapper}
            showsVerticalScrollIndicator={false}
          />

          <View style={styles.footer}>
            <TouchableOpacity style={styles.skipBtn} onPress={onClose}>
              <Text style={styles.skipBtnText}>Continue to Cart</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalBody: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    maxHeight: height * 0.9,
    height: '75%', 
    paddingTop: 10,
    paddingHorizontal: 20
  },
  handle: { width: 40, height: 5, backgroundColor: '#ccc', borderRadius: 3, alignSelf: 'center', marginBottom: 15 },
  upsellHeader: { marginBottom: 15, marginTop: 10, alignItems: 'center' },
  title: { fontSize: 20, fontWeight: '900', color: '#111' },
  subtitle: { fontSize: 14, color: '#666', marginTop: 4 },
  list: { paddingBottom: 20 },
  columnWrapper: { justifyContent: 'space-between' },
  card: { width: (width - 55) / 2, backgroundColor: '#fff', borderRadius: 15, marginBottom: 15, overflow: 'hidden', elevation: 2, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 5, shadowOffset: { width: 0, height: 2 }, borderWidth: 1, borderColor: '#f0f0f0' },
  cardImage: { width: '100%', height: 110 },
  cardContent: { padding: 10, alignItems: 'center' },
  cardName: { fontWeight: 'bold', fontSize: 14, color: '#333', textAlign: 'center' },
  cardPrice: { fontSize: 13, color: '#666', marginVertical: 5, fontWeight: 'bold' },
  addBtn: { backgroundColor: PRIMARY_RED, paddingHorizontal: 20, paddingVertical: 6, borderRadius: 6, marginTop: 5 },
  addText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  footer: {
    paddingTop: 15,
    paddingBottom: Platform.OS === 'ios' ? 35 : 20,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    backgroundColor: '#fff'
  },
  skipBtn: { backgroundColor: '#f5f5f5', paddingVertical: 16, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: '#e0e0e0' },
  skipBtnText: { color: '#333', fontWeight: 'bold', fontSize: 16 },
});

export default DynamicUpsellModal;
