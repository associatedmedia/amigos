import React, { useMemo, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../utils/colors';
import ProductCard from '../../components/ProductCard';
import { useCart } from '../../context/CartContext';
import { useMenuData } from '../../hooks/useMenuData';
import BackButton from '../../components/BackButton';
import UpsellModal from '../../components/UpsellModal';

const CategoryDetailScreen = ({ route, navigation }) => {
  // 1. Get Params
  const { categoryName } = route.params || {};

  // 2. Get Data
  const { products: allProducts, loading } = useMenuData();
  const { addToCart, cartItems, cartTotal } = useCart();

  // Upsell Modal State
  const [upsellVisible, setUpsellVisible] = useState(false);
  const [targetProduct, setTargetProduct] = useState(null);

  // 3. DEBUG: See what is happening in the console
  useEffect(() => {
    if (allProducts.length > 0) {
      // Print first 5 categories from DB to check spelling
      const sampleCategories = allProducts.slice(0, 5).map(p => p.category);
    }
  }, [allProducts, categoryName]);

  // 4. SMARTER FILTER LOGIC
  const categoryProducts = useMemo(() => {
    if (!allProducts || !categoryName) return [];

    const target = categoryName.toLowerCase().trim();
    // Remove trailing 's' to handle plurals (e.g. "Burgers" -> "burger")
    const targetSingular = target.endsWith('s') ? target.slice(0, -1) : target;

    return allProducts.filter(item => {
      if (!item.category) return false;
      const dbCat = item.category.toLowerCase();

      // Check 1: Exact match or partial match (Original)
      // Check 2: Singular match (Fixes "Burgers" vs "Burger")
      return dbCat.includes(target) || dbCat.includes(targetSingular);
    });
  }, [allProducts, categoryName]);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right', 'bottom']}>

      {/* HEADER */}
      <View style={styles.header}>
        <BackButton />
        <View>
          <Text style={styles.headerTitle}>{categoryName || 'Category'}</Text>
          <Text style={styles.itemCount}>
            {loading ? 'Loading...' : `${categoryProducts.length} items found`}
          </Text>
        </View>
      </View>

      {/* BODY */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : categoryProducts.length === 0 ? (
        <View style={styles.center}>
          <Text style={{ fontSize: 40 }}>🍔</Text>
          <Text style={{ color: '#888', marginTop: 10, fontWeight: 'bold' }}>
            No items found for "{categoryName}"
          </Text>

        </View>
      ) : (
        <FlatList
          data={categoryProducts}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <ProductCard
              item={item}
              onAdd={(product) => {
                addToCart(product);
                // Check if it's a pizza category
                const catName = (product.category || '').toLowerCase();
                if (catName.includes('pizza')) {
                  setTargetProduct(product);
                  setUpsellVisible(true);
                }
              }}
            />
          )}
          contentContainerStyle={styles.listContent}
        />
      )}

      {/* CART FOOTER */}
      {cartItems.length > 0 && (
        <TouchableOpacity
          style={styles.miniCart}
          onPress={() => navigation.navigate('Cart')}
        >
          <View>
            <Text style={styles.cartQty}>{cartItems.length} Items</Text>
            <Text style={styles.cartPrice}>₹{cartTotal}</Text>
          </View>
          <Text style={styles.viewCartText}>View Cart 🛒</Text>
        </TouchableOpacity>
      )}

      {/* UPSELL MODAL */}
      <UpsellModal
        isVisible={upsellVisible}
        onClose={() => setUpsellVisible(false)}
        currentProduct={targetProduct}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row', alignItems: 'center',
    padding: 15, borderBottomWidth: 1, borderBottomColor: '#F5F5F5'
  },
  backBtn: { width: 40, justifyContent: 'center' },
  backIcon: { fontSize: 28, color: '#000' },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: COLORS.dark },
  itemCount: { fontSize: 12, color: '#888' },
  listContent: { paddingBottom: 100, paddingTop: 10 },
  miniCart: {
    position: 'absolute', bottom: 20, left: 15, right: 15,
    backgroundColor: COLORS.primary, flexDirection: 'row',
    justifyContent: 'space-between', alignItems: 'center',
    padding: 15, borderRadius: 12, elevation: 5
  },
  cartQty: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  cartPrice: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  viewCartText: { color: '#fff', fontWeight: 'bold' }
});

export default CategoryDetailScreen;