import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  FlatList,
  TouchableOpacity,
  Dimensions
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useCart } from '../context/CartContext';
import { useSettings } from '../context/SettingsContext';
import { useMenuData } from '../hooks/useMenuData'; // ✅ Uses Offline Cache
import Toast from 'react-native-toast-message';
import UpsellModal from './UpsellModal';

const { width } = Dimensions.get('window');
const PRIMARY_RED = '#D23F45';

const BestSellerSlider = () => {
  const navigation = useNavigation();
  const { products } = useMenuData(); // Get all products from DB/Cache
  const { addToCart } = useCart();
  const { isStoreOnline } = useSettings();
  
  // Upsell Modal State
  const [upsellVisible, setUpsellVisible] = useState(false);
  const [targetProduct, setTargetProduct] = useState(null);

  // ✅ FILTER LOGIC: Only show items marked as Best Seller in DB
  const bestSellers = useMemo(() => {
    return products.filter(item => item.is_best_seller === true || item.is_best_seller === 1 || item.is_best_seller === '1');
  }, [products]);

  // If no best sellers are marked yet, hide the section entirely
  if (bestSellers.length === 0) return null;

  const renderLargeCard = ({ item }) => {

    // Safety check for image
    const hasImage = item.image_url && item.image_url !== "";
    const imageSource = hasImage
      ? { uri: item.image_url }
      : { uri: 'https://placehold.co/800x600/png?text=Best+Seller' };

    return (
      <View style={styles.card}>
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => navigation.navigate('CategoryDetail', {
            categoryName: item.category
          })}
        >
          {/* Large Hero Image */}
          <Image source={imageSource} style={styles.cardImage} />
        </TouchableOpacity>

        <View style={styles.contentContainer}>
          {/* Title Row with Veg Icon */}
          <View style={styles.titleRow}>
            <Image
              source={{
                uri: item.is_veg
                  ? 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b2/Veg_symbol.svg/1200px-Veg_symbol.svg.png'
                  : 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/ba/Non_veg_symbol.svg/2048px-Non_veg_symbol.svg.png'
              }}
              style={styles.vegIcon}
            />
            <Text style={styles.title} numberOfLines={1}>{item.name}</Text>
          </View>

          {/* Description (Fallback if missing) */}
          <Text style={styles.description} numberOfLines={2}>
            {item.description || `The delicious ${item.name} is a customer favorite! Try it today.`}
          </Text>

          {/* Footer with Price & Add Button */}
          <View style={styles.footerRow}>
            <View style={styles.priceBlock}>
              <Text style={styles.currentPrice}>₹{item.price}</Text>

              {/* Optional: Fake "Save" badge logic just for UI pop (can be removed) */}
              {/* <View style={styles.saveBadge}>
                      <Text style={styles.saveText}>Best Value</Text>
                  </View> */}
            </View>

            <TouchableOpacity
              style={[styles.addButton, !isStoreOnline && { backgroundColor: '#ccc' }]}
              disabled={!isStoreOnline}
              onPress={() => {
                addToCart(item);
                // Use a simpler toast call or ensure Toast is set up in App.js
                if (Toast && Toast.show) {
                  Toast.show({ type: 'success', text1: 'Added to cart!' });
                }

                // Show Upsell Modal for Pizza Categories
                const catName = (item.category || '').toLowerCase();
                if (catName.includes('pizza')) {
                  setTargetProduct(item);
                  setUpsellVisible(true);
                }
              }}
            >
              <Text style={[styles.addButtonText, !isStoreOnline && { color: '#666' }]}>Add +</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.sectionTitle}>Best Sellers 🔥</Text>
      </View>

      <FlatList
        data={bestSellers}
        horizontal
        showsHorizontalScrollIndicator={false}
        renderItem={renderLargeCard}
        keyExtractor={item => item.id.toString()}
        contentContainerStyle={styles.listContent}
        snapToInterval={width * 0.9 + 15} // Card width + margin
        decelerationRate="fast"
      />

      {/* UPSELL MODAL */}
      <UpsellModal 
        isVisible={upsellVisible} 
        onClose={() => setUpsellVisible(false)} 
        currentProduct={targetProduct} 
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { marginTop: 20, marginBottom: 10 },
  header: { paddingHorizontal: 15, marginBottom: 15 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#222' },

  listContent: { paddingHorizontal: 15 },

  // Large Card Styles
  card: {
    width: width * 0.9, // 90% of screen width
    backgroundColor: '#fff',
    borderRadius: 15,
    marginRight: 15,
    overflow: 'hidden',
    elevation: 4, // Android shadow
    shadowColor: '#000', // iOS shadow
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    marginBottom: 5,
  },
  cardImage: {
    width: '100%',
    height: 180,
    resizeMode: 'cover',
  },
  contentContainer: {
    padding: 15,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  vegIcon: {
    width: 16,
    height: 16,
    marginRight: 8,
    resizeMode: 'contain'
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  description: {
    fontSize: 12,
    color: '#666',
    marginBottom: 15,
    lineHeight: 18,
    height: 36, // Fixed height for 2 lines text consistency
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceBlock: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  currentPrice: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginRight: 8,
  },
  saveBadge: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  saveText: {
    color: '#2E7D32',
    fontSize: 10,
    fontWeight: 'bold',
  },
  addButton: {
    backgroundColor: PRIMARY_RED,
    paddingHorizontal: 25,
    paddingVertical: 10,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
});

export default BestSellerSlider;