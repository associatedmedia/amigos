import 'dotenv/config';

export default ({ config }) => {
    return {
        ...config,
        ios: {
            ...config.ios,
            config: {
                ...config.ios?.config,
                googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY || "AIzaSyA024waSwg_D8uc9p631ClPteTdpDRDQ4U",
            },
        },
        android: {
            ...config.android,
            config: {
                ...config.android?.config,
                googleMaps: {
                    apiKey: process.env.GOOGLE_MAPS_API_KEY || "AIzaSyA024waSwg_D8uc9p631ClPteTdpDRDQ4U",
                },
            },
        },
        extra: {
            ...config.extra,
            apiUrl: process.env.API_BASE_URL || "https://api.amigospizza.co/api",
            razorpayKeyId: process.env.RAZORPAY_ENV === 'prod'
                ? process.env.RAZORPAY_PROD_KEY_ID
                : (process.env.RAZORPAY_TEST_KEY_ID || "rzp_test_cGaBr3RC6a520W"),
            enableCache: process.env.ENABLE_CACHE !== 'false', // Default to true if missing
        },
    };
};
