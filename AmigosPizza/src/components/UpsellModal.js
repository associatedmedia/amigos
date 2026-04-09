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
  Pressable
} from 'react-native';
import { useMenuData } from '../hooks/useMenuData';
import { useCart } from '../context/CartContext';
import { COLORS } from '../utils/colors';

const { width, height } = Dimensions.get('window');
const PRIMARY_RED = '#D23F45';

const UpsellModal = ({ isVisible, onClose, currentProduct }) => {
  const { products } = useMenuData();
  const { addToCart } = useCart();

  // Logic to get related products (Explicitly marked as Upsell in Admin)
  const relatedProducts = useMemo(() => {
    if (!products || !currentProduct) return [];

    // 1. Filter: Find products explicitly marked as "Upsell" in Admin
    let upsellItems = products.filter(p =>
      p.id !== currentProduct.id && !!p.is_upsell
    );

    console.log(`[Upsell] Found ${upsellItems.length} items marked via Admin.`);

    // 2. Fallback: If no items are marked as upsell, use the previous "Pizza" logic
    if (upsellItems.length === 0) {
      upsellItems = products.filter(p =>
        p.id !== currentProduct.id &&
        (
          (p.category && p.category.toLowerCase().includes('pizza')) ||
          (p.category_name && p.category_name.toLowerCase().includes('pizza'))
        )
      );
    }

    // 3. Final Shuffle & Limit (up to 4)
    if (upsellItems.length > 0) {
      return upsellItems.sort(() => 0.5 - Math.random()).slice(0, 4);
    }

    // Last Resort Fallback: Just some random items (best sellers)
    return products.filter(p => p.id !== currentProduct.id).slice(0, 4);
  }, [products, currentProduct]);

  if (!isVisible || !currentProduct) return null;

  const renderItem = ({ item }) => {
    // Robust Image Handling (Similar to FullMenuScreen)
    const imageUrl = item.image_url
      ? item.image_url
      : (item.image ? "https://amigospizza.co/storage/" + item.image.replace(/\\/g, '/') : 'https://placehold.co/150x150/png?text=Pizza');

    return (
      <View style={styles.card}>
        <Image source={{ uri: imageUrl }} style={styles.cardImage} />
        <View style={styles.cardContent}>
          <Text style={styles.cardName} numberOfLines={1}>{item.name}</Text>
          <Text style={styles.cardPrice}>₹{item.price}</Text>
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => addToCart(item)}
          >
            <Text style={styles.addText}>ADD +</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isVisible}
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <View style={styles.modalBody} onStartShouldSetResponder={() => true}>
          <View style={styles.handle} />

          <View style={styles.header}>
            <Text style={styles.title}>You might also like... 🍕</Text>
            <Text style={styles.subtitle}>Complete your Meal with our best Offers!</Text>
          </View>

          <FlatList
            data={relatedProducts}
            keyExtractor={item => item.id.toString()}
            renderItem={renderItem}
            numColumns={2}
            contentContainerStyle={styles.list}
            columnWrapperStyle={styles.columnWrapper}
            showsVerticalScrollIndicator={false}
          />

          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Text style={styles.closeBtnText}>Continue</Text>
          </TouchableOpacity>
        </View>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalBody: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    minHeight: height * 0.6,
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  handle: {
    width: 40,
    height: 5,
    backgroundColor: '#ccc',
    borderRadius: 3,
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  list: {
    paddingBottom: 20,
  },
  columnWrapper: {
    justifyContent: 'space-between',
  },
  card: {
    width: (width - 60) / 2,
    backgroundColor: '#fff',
    borderRadius: 15,
    marginBottom: 15,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
  },
  cardImage: {
    width: '100%',
    height: 100,
  },
  cardContent: {
    padding: 10,
    alignItems: 'center',
  },
  cardName: {
    fontWeight: 'bold',
    fontSize: 14,
    color: '#333',
    textAlign: 'center',
  },
  cardPrice: {
    fontSize: 13,
    color: '#666',
    marginVertical: 5,
  },
  addBtn: {
    backgroundColor: PRIMARY_RED,
    paddingHorizontal: 15,
    paddingVertical: 5,
    borderRadius: 5,
    marginTop: 5,
  },
  addText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  closeBtn: {
    marginTop: 10,
    paddingVertical: 15,
    backgroundColor: COLORS.lightTheme,
    borderRadius: 12,
    alignItems: 'center',
  },
  closeBtnText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default UpsellModal;
