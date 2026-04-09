import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api'; // Your axios instance

const CACHE_KEY_CATEGORIES = 'cached_categories';
const CACHE_KEY_PRODUCTS = 'cached_products';
const CACHE_TIMESTAMP = 'cache_timestamp';

// We will fetch the dynamic Cache Duration from AsyncStorage (saved by SettingsContext)
// Fallback to 15 minutes if not set.

export const useMenuData = () => {
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(false);

  const fetchData = useCallback(async (forceRefresh = false) => {
    setLoading(true);
    setIsOffline(false);

    try {
      const now = Date.now();

      // 1. LOAD FROM CACHE FIRST (Instant Load)
      const cachedCats = await AsyncStorage.getItem(CACHE_KEY_CATEGORIES);
      const cachedProds = await AsyncStorage.getItem(CACHE_KEY_PRODUCTS);
      const lastFetchTime = await AsyncStorage.getItem(CACHE_TIMESTAMP);

      if (cachedCats && cachedProds) {
        setCategories(JSON.parse(cachedCats));
        setProducts(JSON.parse(cachedProds));
        setLoading(false); // Show data immediately
      }

      const cachedTimeline = await AsyncStorage.getItem('app_cache_timeline_minutes');
      // For development/testing of upsells, we use a much shorter window (2 min) if not set
      const cacheMinutes = cachedTimeline ? parseInt(cachedTimeline, 10) : 2; 
      const dynamicCacheDuration = cacheMinutes * 60 * 1000;

      // 2. CHECK IF WE NEED TO FETCH FRESH DATA
      const isCacheFresh = lastFetchTime && (now - parseInt(lastFetchTime) < dynamicCacheDuration);

      // FORCE REFRESH: If forceRefresh is true, we ALWAYS hit the API
      if (isCacheFresh && !forceRefresh && cachedCats) {
        console.log(`[Menu] Using fresh cache (${cacheMinutes} min). To refresh, Pull-to-Refresh.`);
        return;
      }

      // 3. FETCH FROM API (Background Update)
      console.log('Fetching fresh data from server...');

      // Use Promise.all to fetch both in parallel
      const [catResponse, prodResponse] = await Promise.all([
        api.get('/categories'),
        api.get('/products')
      ]);

      const newCategories = catResponse.data;
      const newProducts = prodResponse.data;

      // 4. UPDATE STATE & CACHE
      setCategories(newCategories);
      setProducts(newProducts);

      await AsyncStorage.setItem(CACHE_KEY_CATEGORIES, JSON.stringify(newCategories));
      await AsyncStorage.setItem(CACHE_KEY_PRODUCTS, JSON.stringify(newProducts));
      await AsyncStorage.setItem(CACHE_TIMESTAMP, now.toString());

      console.log('Cache updated successfully.');

    } catch (error) {
      console.log('Network Request Failed - Switching to Offline Mode', error.message);
      setIsOffline(true);

      // If we have no cache and API fails, we are in trouble
      if (!categories.length) {
        // Optional: Show alert or empty state
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Return data and the refresh function (for Pull-to-Refresh)
  return { categories, products, loading, isOffline, refresh: () => fetchData(true) };
};