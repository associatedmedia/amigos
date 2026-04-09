import Constants from 'expo-constants';

// Fallback is for safety, but app.config.js should handle defaults
const fallbackUrl = 'https://api.amigospizza.co/api';

export const API_BASE_URL = Constants.expoConfig?.extra?.apiUrl || fallbackUrl;
