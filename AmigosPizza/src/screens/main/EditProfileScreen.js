import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Modal,
  Image,
  Alert,
  LogBox
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView from 'react-native-maps';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import { COLORS } from '../../utils/colors';
import api from '../../services/api';
import Toast from 'react-native-toast-message';
import BackButton from '../../components/BackButton';
import * as Location from 'expo-location';

// 🔴 REPLACE WITH YOUR VALID GOOGLE API KEY
const GOOGLE_API_KEY = "AIzaSyA024waSwg_D8uc9p631ClPteTdpDRDQ4U";

const SRINAGAR_LAT = 34.0837;
const SRINAGAR_LONG = 74.7973;

// 1. Suppress the nesting warning (Safe to ignore for this specific library)
LogBox.ignoreLogs(['VirtualizedLists should never be nested']);

const EditProfileScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const ref = useRef();

  // Map States
  const [mapVisible, setMapVisible] = useState(false);
  const [region, setRegion] = useState({
    latitude: SRINAGAR_LAT,
    longitude: SRINAGAR_LONG,
    latitudeDelta: 0.005,
    longitudeDelta: 0.005,
  });

  const [formData, setFormData] = useState({
    name: '',
    mobile_no: '',
    address: '',
    latitude: null,
    longitude: null
  });

  useEffect(() => {
    fetchCurrentProfile();
  }, []);

  const fetchCurrentProfile = async () => {
    try {
      const response = await api.get('/user');
      if (response.data.success) {
        const { name, mobile_no, address, latitude, longitude } = response.data.user;
        setFormData({
          name: name || '',
          mobile_no: mobile_no || '',
          address: address || '',
          latitude: latitude || null,
          longitude: longitude || null
        });

        // Pre-fill search box
        if (ref.current && address) {
          ref.current.setAddressText(address);
        }

        if (latitude && longitude) {
          setRegion(prev => ({
            ...prev,
            latitude: parseFloat(latitude),
            longitude: parseFloat(longitude)
          }));
        }
      }
    } catch (error) {
      console.error(error);
      Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to fetch profile' });
    } finally {
      setLoading(false);
    }
  };

  const handleMapConfirm = async () => {
    const lat = region.latitude.toFixed(6);
    const long = region.longitude.toFixed(6);

    setMapVisible(false);

    try {
      // Reverse Geocode to get address from Pin
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${long}&key=${GOOGLE_API_KEY}`
      );
      const data = await response.json();

      let locationName = "Pinned Location";
      if (data.results && data.results.length > 0) {
        locationName = data.results[0].formatted_address;
      }

      setFormData({
        ...formData,
        address: locationName,
        latitude: lat,
        longitude: long
      });

      if (ref.current) {
        ref.current.setAddressText(locationName);
      }
      Toast.show({ type: 'success', text1: 'Location Captured!' });
    } catch (error) {
      console.error("Geocoding Error:", error);
      setFormData({ ...formData, latitude: lat, longitude: long });
    }
  };

  const handleSave = async () => {
    if (!formData.name) return Toast.show({ type: 'error', text1: 'Name is required' });
    if (!formData.address) return Toast.show({ type: 'error', text1: 'Address is required' });

    setUpdating(true);
    try {
      const response = await api.post('/user/update', {
        name: formData.name,
        mobile_no: formData.mobile_no,
        address: formData.address,
        latitude: formData.latitude,
        longitude: formData.longitude
      });

      if (response.data.success) {
        Toast.show({ type: 'success', text1: 'Profile Updated!' });
        navigation.goBack();
      }
    } catch (error) {
      Toast.show({ type: 'error', text1: 'Update Failed' });
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerLoader}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>

      <View style={styles.header}>
        <BackButton />
        <Text style={styles.title}>Edit Profile</Text>
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingBottom: 100 }} // Extra padding for dropdown
        keyboardShouldPersistTaps="always"
      >
        <View style={styles.form}>

          <Text style={styles.label}>Full Name</Text>
          <TextInput
            style={styles.input}
            value={formData.name}
            placeholder="Enter your name"
            onChangeText={(txt) => setFormData({ ...formData, name: txt })}
          />

          <Text style={styles.label}>Mobile Number</Text>
          <View style={[styles.input, styles.disabledInput]}>
            <Text style={styles.disabledText}>+91-{formData.mobile_no || 'Not available'}</Text>
          </View>

          <Text style={styles.label}>Delivery Address</Text>

          {/* Autocomplete Container */}
          <View style={styles.autocompleteWrapper}>
            <GooglePlacesAutocomplete
              ref={ref}
              placeholder='Search area (e.g. Dalgate)'
              fetchDetails={true}
              debounce={300}
              minLength={2}
              predefinedPlaces={[{
                description: '📍 Use My Current Location',
                geometry: { location: { lat: 0, lng: 0 } },
              }]}

              onFail={(error) => Alert.alert("Google Maps Error", error)}
              onNotFound={() => Toast.show({ type: 'error', text1: 'No results found' })}

              onPress={async (data, details = null) => {
                const isCurrentLocation = data.description === '📍 Use My Current Location';
                if (isCurrentLocation) {
                  try {
                    Toast.show({ type: 'info', text1: 'Detecting Location...' });
                    let { status } = await Location.requestForegroundPermissionsAsync();
                    if (status !== 'granted') {
                      Toast.show({ type: 'error', text1: 'Permission Denied' });
                      return;
                    }
                    let loc = await Location.getCurrentPositionAsync({ accuracy: 3 }); // Balanced accuracy
                    const lat = loc.coords.latitude;
                    const lng = loc.coords.longitude;

                    // Manual reverse geocode to bypass strictbounds limitations
                    const response = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${GOOGLE_API_KEY}`);
                    const json = await response.json();

                    let address = "Unknown Location";
                    if (json.results && json.results.length > 0) {
                      address = json.results[0].formatted_address;
                    }

                    if (ref.current) {
                      ref.current.setAddressText(address);
                    }

                    setFormData({
                      ...formData,
                      address: address,
                      latitude: lat,
                      longitude: lng
                    });

                    setRegion({
                      latitude: parseFloat(lat),
                      longitude: parseFloat(lng),
                      latitudeDelta: 0.005,
                      longitudeDelta: 0.005,
                    });
                    
                    Toast.show({ type: 'success', text1: 'Location Detected!' });
                  } catch (error) {
                    console.error("Auto detect error:", error);
                    Toast.show({ type: 'error', text1: 'Failed to detect location' });
                  }
                  return;
                }

                // Standard Autocomplete Selection
                const lat = details?.geometry?.location.lat;
                const lng = details?.geometry?.location.lng;
                const address = data.description;

                setFormData({
                  ...formData,
                  address: address,
                  latitude: lat,
                  longitude: lng
                });

                if (lat && lng) {
                  setRegion({
                    latitude: lat,
                    longitude: lng,
                    latitudeDelta: 0.005,
                    longitudeDelta: 0.005,
                  });
                }
              }}

              // 2. Disable nested VirtualizedList scrolling to fix React Native warning
              flatListProps={{
                keyboardShouldPersistTaps: 'always',
                scrollEnabled: false,
              }}

              query={{
                key: GOOGLE_API_KEY,
                language: 'en',
                components: 'country:in',
                location: `${SRINAGAR_LAT},${SRINAGAR_LONG}`,
                radius: '50000',
                strictbounds: true,
              }}

              styles={{
                textInputContainer: { backgroundColor: '#fff', borderTopWidth: 0, borderBottomWidth: 0 },
                textInput: styles.googleInput,
                listView: styles.listView, // Absolute styling below
                row: { backgroundColor: '#FFFFFF', padding: 13 },
              }}
              enablePoweredByContainer={false}
            />
          </View>

          {/* Banner (Pushed behind dropdown with zIndex: -1) */}
          <View style={[styles.blueBanner, { zIndex: -1 }]}>
            <View style={styles.blueBannerLeft}>
              <View style={styles.blueIconBg}>
                <Text style={{ fontSize: 18 }}>📍</Text>
              </View>
              <Text style={styles.blueBannerText}>
                Location not showing in search?{'\n'}Pin it on the map manually.
              </Text>
            </View>
            <TouchableOpacity
              style={styles.useCurrentBtn}
              onPress={() => setMapVisible(true)}
            >
              <Text style={styles.useCurrentText}>Open Map</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.sectionHeader}>Saved Details</Text>

          <View style={[styles.savedAddressCard, { zIndex: -1 }]}>
            <View style={styles.homeIconContainer}>
              <Text style={{ fontSize: 20 }}>🏠</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.addressType}>Current Address</Text>
              <Text style={styles.addressValue} numberOfLines={3}>
                {formData.address || 'No location set yet'}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.btn, updating && { opacity: 0.7 }, { zIndex: -1 }]}
            onPress={handleSave}
            disabled={updating}
          >
            {updating ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Save Profile</Text>}
          </TouchableOpacity>

        </View>
      </ScrollView>

      {/* Map Modal */}
      <Modal visible={mapVisible} animationType="slide">
        <View style={styles.mapContainer}>
          <MapView
            style={styles.map}
            region={region}
            onRegionChangeComplete={(r) => setRegion(r)}
          />
          <View style={styles.fixedMarkerContainer}>
            <View style={styles.tooltip}>
              <Text style={styles.tooltipText}>Confirm Location</Text>
              <View style={styles.tooltipArrow} />
            </View>
            <Image
              source={{ uri: 'https://cdn-icons-png.flaticon.com/512/684/684908.png' }}
              style={styles.fixedPinIcon}
            />
          </View>

          <View style={styles.mapFooter}>
            <Text style={styles.mapInstruction}>Move map to refine pin location</Text>
            <View style={styles.mapBtnRow}>
              <TouchableOpacity style={styles.cancelMapBtn} onPress={() => setMapVisible(false)}>
                <Text style={{ color: '#333', fontWeight: 'bold' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmMapBtn} onPress={handleMapConfirm}>
                <Text style={{ color: '#fff', fontWeight: 'bold' }}>Confirm Location</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#fff' },
  container: { flex: 1 },
  centerLoader: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  header: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 15,
    borderBottomWidth: 1, borderBottomColor: '#f0f0f0'
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  backIcon: { fontSize: 28, color: '#000' },
  title: { fontSize: 20, fontWeight: 'bold', color: '#222' },

  form: { padding: 20 },
  label: { fontSize: 14, fontWeight: 'bold', color: '#444', marginBottom: 8 },
  input: {
    borderWidth: 1, borderColor: '#DDD', borderRadius: 12,
    padding: 15, marginBottom: 20, fontSize: 16, color: '#000'
  },
  disabledInput: { backgroundColor: '#F9F9F9', borderColor: '#EEE' },
  disabledText: { color: '#888', fontSize: 16 },

  // --- AUTOCOMPLETE STYLES (Fixed Z-Index & Positioning) ---
  autocompleteWrapper: {
    marginBottom: 20,
    zIndex: 1000,
    minHeight: 50,
  },
  googleInput: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 12,
    fontSize: 16,
    color: '#000',
    backgroundColor: '#fff',
    height: 50,
    paddingHorizontal: 15
  },
  listView: {
    position: 'absolute',
    top: 60, // Pushes list down so it doesn't cover input
    left: 0,
    right: 0,
    backgroundColor: 'white',
    borderRadius: 5,
    elevation: 10,
    zIndex: 2000,
  },

  blueBanner: {
    backgroundColor: '#005b96',
    borderRadius: 8, padding: 15, marginBottom: 25,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  blueBannerLeft: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  blueIconBg: {
    width: 30, height: 30, backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 15, justifyContent: 'center', alignItems: 'center', marginRight: 10
  },
  blueBannerText: { color: '#fff', fontSize: 12, fontWeight: '500', lineHeight: 16 },
  useCurrentBtn: { backgroundColor: '#fff', paddingVertical: 6, paddingHorizontal: 10, borderRadius: 4 },
  useCurrentText: { color: '#005b96', fontSize: 10, fontWeight: 'bold' },

  sectionHeader: { fontSize: 16, fontWeight: 'bold', marginBottom: 15, color: '#222' },
  savedAddressCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', paddingVertical: 10, marginBottom: 20,
  },
  homeIconContainer: { marginRight: 15 },
  addressType: { fontSize: 16, fontWeight: 'bold', color: '#000', marginBottom: 2 },
  addressValue: { fontSize: 13, color: '#666', lineHeight: 18 },

  btn: {
    backgroundColor: COLORS.primary, padding: 18, borderRadius: 15,
    alignItems: 'center', marginTop: 10, elevation: 3
  },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },

  mapContainer: { flex: 1 },
  map: { flex: 1 },
  fixedMarkerContainer: {
    position: 'absolute', top: '50%', left: '50%',
    marginTop: -35, marginLeft: -15,
    alignItems: 'center', justifyContent: 'center'
  },
  fixedPinIcon: { width: 40, height: 40, resizeMode: 'contain' },
  tooltip: {
    backgroundColor: '#333', paddingVertical: 5, paddingHorizontal: 10,
    borderRadius: 5, marginBottom: 5
  },
  tooltipText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  tooltipArrow: {
    width: 0, height: 0,
    borderLeftWidth: 5, borderRightWidth: 5, borderTopWidth: 5,
    borderLeftColor: 'transparent', borderRightColor: 'transparent', borderTopColor: '#333',
    alignSelf: 'center'
  },
  mapFooter: { padding: 20, backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, elevation: 10 },
  mapInstruction: { textAlign: 'center', marginBottom: 15, color: '#666' },
  mapBtnRow: { flexDirection: 'row', justifyContent: 'space-between' },
  cancelMapBtn: { padding: 15, borderRadius: 10, backgroundColor: '#f0f0f0', width: '45%', alignItems: 'center' },
  confirmMapBtn: { padding: 15, borderRadius: 10, backgroundColor: COLORS.primary, width: '45%', alignItems: 'center' }
});

export default EditProfileScreen;