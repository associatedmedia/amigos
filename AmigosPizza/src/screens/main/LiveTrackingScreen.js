import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Dimensions,
    TouchableOpacity,
    Image,
    Linking,
    Alert
} from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Notifications from 'expo-notifications';
import { COLORS } from '../../utils/colors';
import api from '../../services/api';
import { showOrderNotification } from '../../services/notificationService';
import BackButton from '../../components/BackButton';

const { width, height } = Dimensions.get('window');
const ASPECT_RATIO = width / height;
const LATITUDE_DELTA = 0.012;
const LONGITUDE_DELTA = LATITUDE_DELTA * ASPECT_RATIO;

// Icons
const SCOOTER_ICON = 'https://cdn-icons-png.flaticon.com/512/7541/7541900.png';
const DRIVER_AVATAR_DEFAULT = 'https://cdn-icons-png.flaticon.com/512/4140/4140048.png';
const STORE_ICON = 'https://cdn-icons-png.flaticon.com/512/610/610413.png';

const STATUS_STEPS = {
    'pending': 0, 
    'confirmed': 1, 
    'cooking': 1,
    'ready_for_pickup': 2, 
    'out_for_delivery': 3,
    'delivered': 4, 
    'cancelled': -1
};

const LiveTrackingScreen = ({ route, navigation }) => {
    const { order: initialOrder } = route.params || {};
    const [order, setOrder] = useState(initialOrder);
    const [driverLocation, setDriverLocation] = useState(null);
    const [currentStep, setCurrentStep] = useState(0);
    const mapRef = useRef(null);
    const lastStatusRef = useRef(null);

    const userLocation = {
        latitude: parseFloat(order?.latitude) || 34.0837,
        longitude: parseFloat(order?.longitude) || 74.7973,
    };

    // Store Location (Srinagar default '0', Anantnag '1')
    const storeLocation = {
        latitude: order?.store_id === '1' ? 33.7297 : 34.0706,
        longitude: order?.store_id === '1' ? 75.1498 : 74.8033,
    };

    useEffect(() => {
        if (order?.status) {
            setCurrentStep(STATUS_STEPS[order.status] || 0);
            lastStatusRef.current = order.status;
        }
        
        fetchLiveTracking();
        const interval = setInterval(fetchLiveTracking, 5000);
        return () => clearInterval(interval);
    }, []);

    // Request Notification Permissions
    useEffect(() => {
        async function requestPermissions() {
            const { status } = await Notifications.getPermissionsAsync();
            if (status !== 'granted') {
                await Notifications.requestPermissionsAsync();
            }
        }
        requestPermissions();
    }, []);

    const fetchLiveTracking = async () => {
        try {
            if (!order?.id) return;
            const response = await api.get(`/orders/${order.id}/track`);

            if (response.data.success) {
                const { driver_location, status, driver } = response.data;

                // Handle Status Change
                if (status && status !== lastStatusRef.current) {
                    showOrderNotification(response.data);
                    lastStatusRef.current = status;
                    setCurrentStep(STATUS_STEPS[status] || 0);
                }

                if (driver) setOrder(prev => ({ ...prev, driver: driver }));

                if (driver_location && driver_location.latitude) {
                    setDriverLocation({
                        latitude: parseFloat(driver_location.latitude),
                        longitude: parseFloat(driver_location.longitude)
                    });
                }
            }
        } catch (error) {
            console.log("Tracking Error:", error.message);
        }
    };

    useEffect(() => {
        if (mapRef.current) {
            const coordsToFit = [userLocation, storeLocation];
            if (driverLocation) coordsToFit.push(driverLocation);

            mapRef.current.fitToCoordinates(coordsToFit, {
                edgePadding: { top: 100, right: 100, bottom: 400, left: 100 },
                animated: true,
            });
        }
    }, [driverLocation]);

    const handleCallDriver = () => {
        if (order?.driver?.mobile_no) {
            Linking.openURL(`tel:${order.driver.mobile_no}`);
        } else {
            Alert.alert("Info", "Driver number not available.");
        }
    };

    const isStepActive = (stepIndex) => currentStep >= stepIndex;

    const getStatusText = () => {
        switch (currentStep) {
            case 0: return "Pending";
            case 1: return "Preparing your food...";
            case 2: return "Ready for pickup!";
            case 3: return "Driver on the way";
            case 4: return "Delivered ✅";
            case -1: return "Order Cancelled ❌";
            default: return "Processing...";
        }
    };

    return (
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right', 'bottom']}>

            <MapView
                ref={mapRef}
                provider={PROVIDER_GOOGLE}
                style={styles.map}
                initialRegion={{
                    ...userLocation,
                    latitudeDelta: LATITUDE_DELTA,
                    longitudeDelta: LONGITUDE_DELTA,
                }}
            >
                {/* 🏠 HOME */}
                <Marker
                    coordinate={userLocation}
                    title="Delivery Location"
                    pinColor="green"
                />

                {/* 🏪 STORE */}
                <Marker coordinate={storeLocation} title="Restaurant">
                    <Image
                        source={{ uri: STORE_ICON }}
                        style={{ width: 40, height: 40 }}
                        resizeMode="contain"
                    />
                </Marker>

                {/* 🛵 DRIVER & LINE */}
                {driverLocation && (
                    <>
                        <Polyline
                            coordinates={[driverLocation, userLocation]}
                            strokeWidth={4}
                            strokeColor={COLORS.primary}
                        />

                        <Marker coordinate={driverLocation} title="Delivery Partner">
                            <Image
                                source={{ uri: SCOOTER_ICON }}
                                style={{ width: 50, height: 50 }}
                                resizeMode="contain"
                            />
                        </Marker>
                    </>
                )}
            </MapView>

            {/* HEADER */}
            <SafeAreaView style={styles.headerContainer} edges={['top']}>
                <BackButton />
                <View style={styles.headerInfo}>
                    <Text style={styles.headerTitle}>Order #{order?.order_number}</Text>
                    <Text style={styles.headerStatus}>{getStatusText()}</Text>
                </View>
            </SafeAreaView>

            {/* BOTTOM SHEET */}
            <View style={styles.bottomSheet}>
                <View style={styles.dragHandle} />

                <View style={styles.driverRow}>
                    {order?.driver ? (
                        <>
                            <Image
                                source={{ uri: DRIVER_AVATAR_DEFAULT }}
                                style={styles.driverPic}
                            />
                            <View style={{ flex: 1, marginLeft: 15 }}>
                                <Text style={styles.driverName}>{order.driver.name}</Text>
                                <Text style={styles.driverRole}>Delivery Partner • 4.9 ★</Text>
                            </View>
                            <TouchableOpacity style={styles.callBtn} onPress={handleCallDriver}>
                                <Text style={{ fontSize: 20 }}>📞</Text>
                            </TouchableOpacity>
                        </>
                    ) : (
                        <>
                            <View style={[styles.driverPic, { backgroundColor: '#eee' }]} />
                            <View style={{ flex: 1, marginLeft: 15 }}>
                                <Text style={styles.driverName}>Finding Driver...</Text>
                                <Text style={styles.driverRole}>Please wait</Text>
                            </View>
                        </>
                    )}
                </View>

                <View style={styles.divider} />

                <View style={styles.addressSection}>
                    <Text style={styles.sectionLabel}>DELIVERING TO</Text>
                    <Text style={styles.addressText} numberOfLines={2}>
                        {order?.address || "Address not provided"}
                    </Text>
                </View>

                {/* PROGRESS BAR */}
                <View style={styles.stepsContainer}>
                    <View style={[styles.stepDot, isStepActive(1) && styles.stepActive]} />
                    <View style={[styles.stepLine, isStepActive(2) && styles.stepActive]} />
                    <View style={[styles.stepDot, isStepActive(2) && styles.stepActive]} />
                    <View style={[styles.stepLine, isStepActive(3) && styles.stepActive]} />
                    <View style={[styles.stepDot, isStepActive(3) && styles.stepActive]} />
                    <View style={[styles.stepLine, isStepActive(4) && styles.stepActive]} />
                    <View style={[styles.stepDot, isStepActive(4) && styles.stepActive]} />
                </View>
                <View style={styles.stepsLabels}>
                    <Text style={[styles.stepLabel, isStepActive(1) && styles.textActive]}>Cooking</Text>
                    <Text style={[styles.stepLabel, isStepActive(2) && styles.textActive]}>Ready</Text>
                    <Text style={[styles.stepLabel, isStepActive(3) && styles.textActive]}>On Way</Text>
                    <Text style={[styles.stepLabel, isStepActive(4) && styles.textActive]}>Delivered</Text>
                </View>
            </View>

        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    map: { flex: 1 },
    headerContainer: { position: 'absolute', top: 10, left: 20, right: 20, flexDirection: 'row', alignItems: 'center' },
    headerInfo: { marginLeft: 15, backgroundColor: '#fff', paddingVertical: 8, paddingHorizontal: 15, borderRadius: 20, elevation: 5 },
    headerTitle: { fontSize: 12, color: '#888', fontWeight: 'bold' },
    headerStatus: { fontSize: 14, color: COLORS.primary, fontWeight: 'bold' },
    bottomSheet: { position: 'absolute', bottom: 0, width: '100%', backgroundColor: '#fff', borderTopLeftRadius: 25, borderTopRightRadius: 25, padding: 20, paddingBottom: 40, elevation: 20, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10 },
    dragHandle: { width: 40, height: 5, backgroundColor: '#ddd', borderRadius: 5, alignSelf: 'center', marginBottom: 20 },
    driverRow: { flexDirection: 'row', alignItems: 'center' },
    driverPic: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#eee' },
    driverName: { fontSize: 16, fontWeight: 'bold', color: '#333' },
    driverRole: { fontSize: 12, color: '#888' },
    callBtn: { width: 45, height: 45, backgroundColor: '#E8F5E9', borderRadius: 25, justifyContent: 'center', alignItems: 'center' },
    divider: { height: 1, backgroundColor: '#eee', marginVertical: 20 },
    addressSection: { marginBottom: 20 },
    sectionLabel: { fontSize: 10, color: '#999', fontWeight: 'bold', marginBottom: 5 },
    addressText: { fontSize: 14, color: '#333', fontWeight: '500' },
    stepsContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 10 },
    stepDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#eee' },
    stepLine: { flex: 1, height: 2, backgroundColor: '#eee' },
    stepActive: { backgroundColor: COLORS.primary },
    stepsLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 5 },
    stepLabel: { fontSize: 10, color: '#AAA', width: 60, textAlign: 'center' },
    textActive: { color: COLORS.primary, fontWeight: 'bold' }
});

export default LiveTrackingScreen;
