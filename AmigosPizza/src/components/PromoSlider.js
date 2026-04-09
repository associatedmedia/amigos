import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, Image,
  FlatList, Dimensions, TouchableOpacity, ActivityIndicator
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS } from '../utils/colors'; // Make sure this path is correct
import api from '../services/api';

const CACHE_KEY_BANNERS = 'cached_banners';
const CACHE_TIMESTAMP_BANNERS = 'cache_timestamp_banners';

const { width } = Dimensions.get('window');

const PromoSlider = () => {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef(null);
  const navigation = useNavigation();

  // 1. Fetch Banners (with Offline Caching)
  useEffect(() => {
    const fetchBanners = async () => {
      try {
        const now = Date.now();

        // 1. LOAD FROM CACHE FIRST
        const cachedBanners = await AsyncStorage.getItem(CACHE_KEY_BANNERS);
        const lastFetchTime = await AsyncStorage.getItem(CACHE_TIMESTAMP_BANNERS);

        if (cachedBanners) {
          setBanners(JSON.parse(cachedBanners));
          setLoading(false);
        }

        // 2. CHECK CACHE FRESHNESS
        const cachedTimeline = await AsyncStorage.getItem('app_cache_timeline_minutes');
        const cacheMinutes = cachedTimeline ? parseInt(cachedTimeline, 10) : 15;
        const dynamicCacheDuration = cacheMinutes * 60 * 1000;

        const isCacheFresh = lastFetchTime && (now - parseInt(lastFetchTime) < dynamicCacheDuration);

        if (isCacheFresh && cachedBanners) {
          console.log(`Using fresh banner cache (${cacheMinutes} min), skipping API hit.`);
          return;
        }

        // 3. FETCH FRESH DATA
        console.log('Fetching fresh banners from server...');
        const response = await api.get('/banners');

        setBanners(response.data);
        await AsyncStorage.setItem(CACHE_KEY_BANNERS, JSON.stringify(response.data));
        await AsyncStorage.setItem(CACHE_TIMESTAMP_BANNERS, now.toString());

      } catch (error) {
        console.error('Failed to load banners:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBanners();
  }, []);

  // 2. Auto Scroll
  useEffect(() => {
    if (banners.length === 0) return;

    let interval = setInterval(() => {
      const nextIndex = activeIndex === banners.length - 1 ? 0 : activeIndex + 1;
      if (flatListRef.current) {
        flatListRef.current.scrollToIndex({ index: nextIndex, animated: true });
        setActiveIndex(nextIndex);
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [activeIndex, banners]);

  const onViewableItemsChanged = useRef(({ viewableItems }) => {
    if (viewableItems && viewableItems.length > 0) {
      setActiveIndex(viewableItems[0].index);
    }
  }).current;

  // ✅ FIXED: Handle Navigation Crash
  const handleBannerPress = (item) => {
    if (!item.target_screen) return;

    console.log("Navigating to:", item.target_screen, "Params:", item.target_params);

    // Safety: Ensure params is an object, not null/undefined
    let params = item.target_params;

    // If DB returned a string (rare edge case), parse it
    if (typeof params === 'string') {
      try {
        params = JSON.parse(params);
      } catch (e) {
        params = {};
      }
    }

    // Default to empty object if null
    navigation.navigate(item.target_screen, params || {});
  };

  const renderItem = ({ item }) => (
    <View style={styles.slide}>
      <TouchableOpacity
        activeOpacity={0.9}
        style={styles.card} // ✅ Full Width Style applied here
        onPress={() => handleBannerPress(item)}
      >
        <Image source={{ uri: item.image_url }} style={styles.image} />

        {/* Dark Gradient Overlay for text readability */}
        {/* <View style={styles.darkOverlay} />  disbaled for time being */}
        <View />
        {/* disbaled for time being 
        <View style={styles.overlay}>
          {item.title && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>LIMITED OFFER</Text>
            </View>
          )}
          <Text style={styles.title}>{item.title}</Text>
          {item.subtitle && <Text style={styles.subTitle}>{item.subtitle}</Text>}
        </View> */}
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return <View style={{ height: 200 }} />; // Silent loading placeholder
  }

  if (banners.length === 0) return null;

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={banners}
        renderItem={renderItem}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}
        keyExtractor={(item) => item.id.toString()}
      />

      <View style={styles.pagination}>
        {banners.map((_, index) => (
          <View
            key={index}
            style={[
              styles.dot,
              { backgroundColor: activeIndex === index ? COLORS.primary : 'rgba(255,255,255,0.5)' }, // Better contrast
              activeIndex === index && { width: 20 }
            ]}
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 10,
    backgroundColor: '#000' // Background matches slider for seamless look
  },
  slide: {
    width: width,
    alignItems: 'center'
  },
  card: {
    width: width, // ✅ FULL WIDTH FIX
    height: 220,  // Taller for better impact
    backgroundColor: '#000',
    // Removed borderRadius and margins for edge-to-edge look
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
    opacity: 0.9
  },
  darkOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)', // Slightly darker for better text contrast
  },
  overlay: {
    position: 'absolute',
    bottom: 30, // Moved up slightly
    left: 20,
    right: 20,
  },
  badge: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  badgeText: { color: '#FFF', fontSize: 10, fontWeight: 'bold' },
  title: {
    color: '#FFF',
    fontSize: 28, // Larger title
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10
  },
  subTitle: {
    color: '#EEE',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 4
  },
  pagination: {
    position: 'absolute', // Floating dots on top of image
    bottom: 15,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dot: {
    height: 6,
    width: 6,
    borderRadius: 3,
    marginHorizontal: 4,
  },
});

export default PromoSlider;