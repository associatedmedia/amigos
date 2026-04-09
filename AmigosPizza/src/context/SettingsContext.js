import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api'; // existing axios instance

const SettingsContext = createContext();

export const SettingsProvider = ({ children }) => {
    const [isStoreOnline, setIsStoreOnline] = useState(true);
    const [isCodEnabled, setIsCodEnabled] = useState(true);
    const [minOrderCriteria, setMinOrderCriteria] = useState([]);
    const [appCacheTimeline, setAppCacheTimeline] = useState(15);
    const [isLoadingSettings, setIsLoadingSettings] = useState(true);

    const fetchStoreStatus = useCallback(async () => {
        try {
            const response = await api.get('/settings');
            if (response.data && response.data.success) {
                const settings = response.data.data;
                if (Array.isArray(settings)) {
                    settings.forEach(setting => {
                        if (setting.key === 'is_store_online') {
                            setIsStoreOnline(setting.value === '1');
                        } else if (setting.key === 'cod_enabled') {
                            setIsCodEnabled(setting.value === '1');
                        } else if (setting.key === 'minimum_order_criteria') {
                            try {
                                setMinOrderCriteria(JSON.parse(setting.value));
                            } catch (e) {
                                console.error('Failed to parse minimum_order_criteria:', e);
                                setMinOrderCriteria([]);
                            }
                        } else if (setting.key === 'app_cache_timeline_minutes') {
                            const minutes = parseInt(setting.value, 10);
                            if (!isNaN(minutes)) {
                                setAppCacheTimeline(minutes);
                                AsyncStorage.setItem('app_cache_timeline_minutes', minutes.toString());
                            }
                        }
                    });
                }
            }
        } catch (error) {
            console.error('Failed to fetch store settings:', error);
        } finally {
            setIsLoadingSettings(false);
        }
    }, []);

    // Fetch immediately on mount
    useEffect(() => {
        fetchStoreStatus();
    }, [fetchStoreStatus]);

    // Fetch every time the app comes back to the foreground
    useEffect(() => {
        const subscription = AppState.addEventListener('change', nextAppState => {
            if (nextAppState === 'active') {
                fetchStoreStatus();
            }
        });

        return () => {
            subscription.remove();
        };
    }, [fetchStoreStatus]);

    const updateSetting = async (key, value) => {
        try {
            const response = await api.post('/settings/update', { key, value });
            if (response.data.success) {
                if (key === 'is_store_online') {
                    setIsStoreOnline(value === '1');
                } else if (key === 'cod_enabled') {
                    setIsCodEnabled(value === '1');
                }
                return true;
            }
        } catch (error) {
            console.error(`Failed to update setting ${key}:`, error);
            return false;
        }
    };

    return (
        <SettingsContext.Provider value={{ isStoreOnline, isCodEnabled, minOrderCriteria, appCacheTimeline, isLoadingSettings, fetchStoreStatus, updateSetting }}>
            {children}
        </SettingsContext.Provider>
    );
};

export const useSettings = () => useContext(SettingsContext);
