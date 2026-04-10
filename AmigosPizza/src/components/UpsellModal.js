import React, { useMemo, useState, useEffect } from 'react';
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
import { COLORS } from '../utils/colors';

const { width, height } = Dimensions.get('window');
const PRIMARY_RED = '#D23F45';

const UpsellModal = ({ isVisible, onClose, currentProduct }) => {
  const { products } = useMenuData();
  const { addToCart } = useCart();

  const [selectedVariant, setSelectedVariant] = useState(null);

  useEffect(() => {
    // Safely check if variants exist AND is an array with items
    if (currentProduct?.variants && Array.isArray(currentProduct.variants) && currentProduct.variants.length > 0) {
      setSelectedVariant(currentProduct.variants[0]);
    } else {
      setSelectedVariant(null);
    }
  }, [currentProduct]);

  // STRICT UPSELL LOGIC: Only show items marked 'is_upsell'
  const relatedProducts = useMemo(() => {
    if (!products || !currentProduct) return [];

    let upsellItems = products.filter(p =>
      p.id !== currentProduct.id && !!p.is_upsell
    );

    return upsellItems.sort(() => 0.5 - Math.random()).slice(0, 4);
  }, [products, currentProduct]);

  if (!isVisible || !currentProduct) return null;

  // Safe fallback for pricing
  const currentPrice = selectedVariant ? selectedVariant.price : (currentProduct.price || 0);

  const renderItem = ({ item }) => {
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

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <Text style={styles.mainProductName}>{currentProduct.name}</Text>

      {currentProduct.description ? (
        <Text style={styles.mainProductDesc}>{currentProduct.description}</Text>
      ) : null}

      {/* Variants / Sizes */}
      {currentProduct?.variants && Array.isArray(currentProduct.variants) && currentProduct.variants.length > 0 ? (
        <View style={styles.variantsSection}>
          <Text style={styles.variantsTitle}>Choose Size:</Text>
          {currentProduct.variants.map((v) => {
            const isSelected = selectedVariant && selectedVariant.id === v.id;
            return (
              <TouchableOpacity
                key={v.id.toString()}
                style={[styles.radioRow, isSelected && styles.radioRowSelected]}
                onPress={() => setSelectedVariant(v)}
                activeOpacity={0.7}
              >
                <View style={styles.radioCircle}>
                  {isSelected ? <View style={styles.radioDot} /> : null}
                </View>
                <Text style={[styles.variantName, isSelected && styles.variantNameSelected]}>
                  {v.variant_name}
                </Text>
                <Text style={[styles.variantPrice, isSelected && styles.variantPriceSelected]}>
                  ₹{v.price}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      ) : null}

      {/* Upsell Header */}
      {relatedProducts.length > 0 && (
        <>
          <View style={styles.divider} />
          <View style={styles.upsellHeader}>
            <Text style={styles.title}>You might also like...</Text>
            <Text style={styles.subtitle}>Complete your order with these favorites!</Text>
          </View>
        </>
      )}
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

          {/* 🛑 UI FIX: flex: 1 added here ensures the list scrolls without pushing the footer away */}
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

          {/* 🛑 UI FIX: Footer is now permanently locked to the bottom */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.mainAddBtn}
              onPress={() => {
                addToCart(currentProduct, selectedVariant);
                onClose();
              }}
            >
              <Text style={styles.mainAddBtnText}>Add Item • ₹{currentPrice}</Text>
            </TouchableOpacity>
          </View>

        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },

  // Changed height to maxHeight so it adapts to small screens but never exceeds 90%
  modalBody: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    maxHeight: height * 0.9,
    height: '85%', // Default height
    paddingTop: 10,
    paddingHorizontal: 20
  },

  handle: { width: 40, height: 5, backgroundColor: '#ccc', borderRadius: 3, alignSelf: 'center', marginBottom: 15 },

  headerContainer: { marginBottom: 10 },
  mainProductName: { fontSize: 24, fontWeight: '900', color: '#111', marginBottom: 5 },
  mainProductDesc: { fontSize: 14, color: '#666', marginBottom: 15 },

  variantsSection: { marginBottom: 10 },
  variantsTitle: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 10 },
  radioRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 15, borderWidth: 1, borderColor: '#eee', borderRadius: 12, marginBottom: 8, backgroundColor: '#fafafa' },
  radioRowSelected: { borderColor: PRIMARY_RED, backgroundColor: '#fff5f5' },
  radioCircle: { height: 20, width: 20, borderRadius: 10, borderWidth: 2, borderColor: '#aaa', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  radioDot: { height: 10, width: 10, borderRadius: 5, backgroundColor: PRIMARY_RED },
  variantName: { flex: 1, fontSize: 16, color: '#333', fontWeight: '500' },
  variantNameSelected: { color: PRIMARY_RED, fontWeight: 'bold' },
  variantPrice: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  variantPriceSelected: { color: PRIMARY_RED },

  divider: { height: 1, backgroundColor: '#eee', marginVertical: 15 },
  upsellHeader: { marginBottom: 15 },
  title: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  subtitle: { fontSize: 13, color: '#666', marginTop: 4 },

  list: { paddingBottom: 20 },
  columnWrapper: { justifyContent: 'space-between' },
  card: { width: (width - 55) / 2, backgroundColor: '#fff', borderRadius: 15, marginBottom: 15, overflow: 'hidden', elevation: 2, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 5, shadowOffset: { width: 0, height: 2 }, borderWidth: 1, borderColor: '#f0f0f0' },
  cardImage: { width: '100%', height: 110 },
  cardContent: { padding: 10, alignItems: 'center' },
  cardName: { fontWeight: 'bold', fontSize: 14, color: '#333', textAlign: 'center' },
  cardPrice: { fontSize: 13, color: '#666', marginVertical: 5, fontWeight: 'bold' },
  addBtn: { backgroundColor: PRIMARY_RED, paddingHorizontal: 20, paddingVertical: 6, borderRadius: 6, marginTop: 5 },
  addText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },

  // Modified footer padding to account for iPhone Safe Area
  footer: {
    paddingTop: 15,
    paddingBottom: Platform.OS === 'ios' ? 35 : 20,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    backgroundColor: '#fff'
  },
  mainAddBtn: { backgroundColor: PRIMARY_RED, paddingVertical: 16, borderRadius: 12, alignItems: 'center' },
  mainAddBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 18 },
});

export default UpsellModal;