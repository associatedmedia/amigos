import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../utils/colors';
import ProductCard from '../../components/ProductCard';
import { useCart } from '../../context/CartContext';
import { useMenuData } from '../../hooks/useMenuData';
import BackButton from '../../components/BackButton';
import VariantSelectionModal from '../../components/VariantSelectionModal';
import DynamicUpsellModal from '../../components/DynamicUpsellModal';
import Toast from 'react-native-toast-message';

const CategoryDetailScreen = ({ route, navigation }) => {
  const { categoryName } = route.params || {};
  const { products: allProducts, categories, loading } = useMenuData();
  const { addToCart, cartItems, cartTotal } = useCart();

  const [variantModalVisible, setVariantModalVisible] = useState(false);
  const [dynamicUpsellVisible, setDynamicUpsellVisible] = useState(false);
  const [targetProduct, setTargetProduct] = useState(null);

  // Find the entire category object
  const currentCategory = useMemo(() => {
    if (categories && categories.length > 0) {
      return categories.find(cat => cat.name === categoryName || cat.category_name === categoryName);
    }
    // Fallback if useMenuData magically returns grouped products somehow
    if (allProducts && allProducts.length > 0 && allProducts[0].products !== undefined) {
      return allProducts.find(cat => cat.category_name === categoryName);
    }
    return null;
  }, [categories, allProducts, categoryName]);

  // Filter products by category
  const categoryProducts = useMemo(() => {
    // If the category object already has a nested products array, use it
    if (currentCategory && currentCategory.products) {
      return currentCategory.products;
    }
    
    // Fallback: If it's a flat list, filter all products manually
    return allProducts ? allProducts.filter(item => item.category === categoryName) : [];
  }, [currentCategory, allProducts, categoryName]);

  const tryShowUpsell = () => {
    if (currentCategory?.is_upsell_enabled && currentCategory?.upsell_product_ids?.length > 0) {
      setDynamicUpsellVisible(true);
    } else {
      Toast.show({ type: 'success', text1: 'Added', text2: `Item added to cart` });
    }
  };

  const handleProductClick = (product) => {
    const hasVariants = product.variants && product.variants.length > 0;
    if (hasVariants) {
      setTargetProduct(product);
      setVariantModalVisible(true);
    } else {
      addToCart(product);
      tryShowUpsell();
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right', 'bottom']}>
      <View style={styles.header}>
        <BackButton />
        <View>
          <Text style={styles.headerTitle}>{categoryName || 'Category'}</Text>
          <Text style={styles.itemCount}>
            {loading ? 'Loading...' : `${categoryProducts.length} items`}
          </Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator size="large" color={COLORS.primary} /></View>
      ) : categoryProducts.length === 0 ? (
        <View style={styles.center}>
          <Text style={{ fontSize: 40 }}>🍔</Text>
          <Text style={{ color: '#888', marginTop: 10, fontWeight: 'bold' }}>No items found</Text>
        </View>
      ) : (
        <FlatList
          data={categoryProducts}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <ProductCard
              item={item}
              onPress={handleProductClick} 
            />
          )}
          contentContainerStyle={styles.listContent}
        />
      )}

      {cartItems.length > 0 && (
        <TouchableOpacity style={styles.miniCart} onPress={() => navigation.navigate('Cart')}>
          <View>
            <Text style={styles.cartQty}>{cartItems.length} Items</Text>
            <Text style={styles.cartPrice}>₹{cartTotal}</Text>
          </View>
          <Text style={styles.viewCartText}>View Cart 🛒</Text>
        </TouchableOpacity>
      )}

      <VariantSelectionModal
        isVisible={variantModalVisible}
        onClose={() => setVariantModalVisible(false)}
        currentProduct={targetProduct}
        onVariantAdded={tryShowUpsell}
      />

      <DynamicUpsellModal
        isVisible={dynamicUpsellVisible}
        onClose={() => setDynamicUpsellVisible(false)}
        upsellProductIds={currentCategory?.upsell_product_ids || []}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f5f7' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 15, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee', marginBottom: 10 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#111' },
  itemCount: { fontSize: 12, color: '#888' },
  listContent: { paddingBottom: 100 },
  miniCart: { position: 'absolute', bottom: 20, left: 15, right: 15, backgroundColor: '#D23F45', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15, borderRadius: 12, elevation: 5 },
  cartQty: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  cartPrice: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  viewCartText: { color: '#fff', fontWeight: 'bold' }
});

export default CategoryDetailScreen;