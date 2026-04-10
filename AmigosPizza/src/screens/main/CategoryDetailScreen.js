import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../utils/colors';
import ProductCard from '../../components/ProductCard';
import { useCart } from '../../context/CartContext';
import { useMenuData } from '../../hooks/useMenuData';
import BackButton from '../../components/BackButton';
import UpsellModal from '../../components/UpsellModal';

const CategoryDetailScreen = ({ route, navigation }) => {
  const { categoryName } = route.params || {};
  const { products: allProducts, loading } = useMenuData();
  const { addToCart, cartItems, cartTotal } = useCart();

  const [upsellVisible, setUpsellVisible] = useState(false);
  const [targetProduct, setTargetProduct] = useState(null);

  // Filter products by category
  const categoryProducts = useMemo(() => {
    if (!allProducts || !categoryName) return [];

    // CASE 1: Data is grouped from the API (Your current setup)
    if (allProducts.length > 0 && allProducts[0].products !== undefined) {
      const foundCategory = allProducts.find(cat => cat.category_name === categoryName);
      return foundCategory ? foundCategory.products : [];
    }

    // CASE 2: Fallback if data is a flat list
    return allProducts.filter(item => item.category === categoryName);
  }, [allProducts, categoryName]);

  // console.log("Category Products:", categoryProducts);

  // ----------------------------------------------------
  // SIMPLE CLICK LOGIC
  // ----------------------------------------------------
  const handleProductClick = (product) => {
    // Just check if the product has any sizes attached

    const hasVariants = product.variants && product.variants.length > 0;

    if (hasVariants) {
      // It has sizes! Open the Modal.
      setTargetProduct(product);
      setUpsellVisible(true);
    } else {
      // No sizes. Just add it straight to the cart.
      addToCart(product);
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
              onPress={handleProductClick} // Pass our smart logic here!
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

      <UpsellModal
        isVisible={upsellVisible}
        onClose={() => setUpsellVisible(false)}
        currentProduct={targetProduct}
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