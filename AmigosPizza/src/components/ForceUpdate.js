import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Linking, ActivityIndicator, Platform, AppState } from 'react-native';
import Constants from 'expo-constants';
import api from '../services/api';
import { COLORS } from '../utils/colors';

const ForceUpdate = ({ children }) => {
    const [isUpdateRequired, setIsUpdateRequired] = useState(false);
    const [storeUrl, setStoreUrl] = useState('');
    const [loadingConfig, setLoadingConfig] = useState(true);

    useEffect(() => {
        checkAppVersion();

        // Re-check version when app comes from background to foreground
        const subscription = AppState.addEventListener('change', (nextAppState) => {
            if (nextAppState === 'active') {
                checkAppVersion();
            }
        });
        return () => subscription.remove();
    }, []);

    const checkAppVersion = async () => {
        try {
            const response = await api.get('/app-version');
            if (response.data.success) {
                const { minimum_version, store_url_android, store_url_ios } = response.data;

                // Get current app version from Constants
                const currentVersion = Constants.expoConfig?.version || '1.0.0';

                // Compare versions (simple string comparison for semantic versioning x.y.z)
                if (isVersionLower(currentVersion, minimum_version)) {
                    setIsUpdateRequired(true);
                    // Set appropriate store URL based on platform
                    setStoreUrl(Platform.OS === 'ios' ? store_url_ios : store_url_android);
                }
            }
        } catch (error) {
            console.error("Failed to check app version:", error);
            // In case of network error, do not block the user (allow fallback)
        } finally {
            setLoadingConfig(false);
        }
    };

    // Helper function to compare semantic versions
    const isVersionLower = (current, minimum) => {
        const v1 = current.split('.').map(Number);
        const v2 = minimum.split('.').map(Number);

        for (let i = 0; i < Math.max(v1.length, v2.length); i++) {
            const num1 = v1[i] || 0;
            const num2 = v2[i] || 0;

            if (num1 < num2) return true;
            if (num1 > num2) return false;
        }
        return false;
    };

    const handleUpdatePress = () => {
        if (storeUrl) {
            Linking.openURL(storeUrl).catch(err => console.error("Could not open store link", err));
        }
    };

    if (loadingConfig) {
        return (
            <View style={{ flex: 1, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
        );
    }

    return (
        <View style={{ flex: 1 }}>
            {children}

            {/* Forced Update Modal - Stacks on top of everything, cannot be dismissed */}
            <Modal visible={isUpdateRequired} transparent={false} animationType="fade">
                <View style={styles.container}>
                    <Text style={styles.title}>Update Required</Text>
                    <Text style={styles.message}>
                        A new version of Amigos Pizza is available. Please update the app to continue enjoying your favorite food!
                    </Text>
                    <TouchableOpacity style={styles.updateButton} onPress={handleUpdatePress}>
                        <Text style={styles.updateButtonText}>Update Now</Text>
                    </TouchableOpacity>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 30,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 15,
    },
    message: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 40,
    },
    updateButton: {
        backgroundColor: COLORS.primary,
        paddingVertical: 15,
        paddingHorizontal: 40,
        borderRadius: 8,
        width: '100%',
        alignItems: 'center',
    },
    updateButtonText: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: 'bold',
    }
});

export default ForceUpdate;
