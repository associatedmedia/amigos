// App.js
import 'react-native-gesture-handler';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import Toast from 'react-native-toast-message';

// Context
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import { SettingsProvider } from './src/context/SettingsContext';

// Auth Screens
import LoginScreen from './src/screens/auth/LoginScreen';
import VerifyOTPScreen from './src/screens/auth/VerifyOTPScreen';

// Main Screens
import HomeScreen from './src/screens/main/HomeScreen';
import ProfileScreen from './src/screens/main/ProfileScreen';
import CategoryDetailScreen from './src/screens/main/CategoryDetailScreen';
import CartScreen from './src/screens/main/CartScreen';
import CheckoutScreen from './src/screens/main/CheckoutScreen';
import EditProfileScreen from './src/screens/main/EditProfileScreen';
import OrderHistoryScreen from './src/screens/main/OrderHistoryScreen';
import HelpSupportScreen from './src/screens/main/HelpSupportScreen';
import PrivacyPolicyScreen from './src/screens/main/PrivacyPolicyScreen';
import OrderSuccessScreen from './src/screens/main/OrderSuccessScreen';
import FullMenuScreen from './src/screens/main/FullMenuScreen';
import LiveTrackingScreen from './src/screens/main/LiveTrackingScreen';

// Cart Context
import { CartProvider } from './src/context/CartContext';

// Force Update Mechanism
import ForceUpdate from './src/components/ForceUpdate';

// notification setup
import * as Notifications from 'expo-notifications';

const Stack = createStackNavigator();

// Configure how notifications appear when the app is foregrounded
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true, // Show the banner (toast) at the top
    shouldShowList: true,   // Show in the notification list/center
    shouldPlaySound: true,  // Play sound
    shouldSetBadge: false,  // Update app icon badge
  }),
});


import * as Linking from 'expo-linking';

const prefix = Linking.createURL('/');

const linking = {
  prefixes: [prefix],
  config: {
    screens: {
      Login: 'login',
      VerifyOTP: 'verify-otp',
      Home: 'home',
      Profile: 'profile',
      Cart: 'cart',
      OrderHistory: 'orders',
      LiveTracking: 'tracking/:orderId',
      // Add other screens as needed
    },
  },
};

function RootNavigation() {
  const { isLoggedIn, isGuest, loading } = useAuth();
  const { isDark } = useTheme();

  // Prevents flicker while checking if user is already logged in
  if (loading) return null;

  return (
    <>
      <StatusBar style={isDark ? "light" : "dark"} />
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {(!isLoggedIn && !isGuest) ? (
          <Stack.Group>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="VerifyOTP" component={VerifyOTPScreen} />
          </Stack.Group>
        ) : (
          <Stack.Group>
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="Profile" component={ProfileScreen} />
            <Stack.Screen name="LiveTracking" component={LiveTrackingScreen} />
            <Stack.Screen name="CategoryDetail" component={CategoryDetailScreen} />
            <Stack.Screen name="Cart" component={CartScreen} />
            <Stack.Screen name="Checkout" component={CheckoutScreen} />
            <Stack.Screen name="EditProfile" component={EditProfileScreen} options={{ title: 'Edit Profile' }} />
            <Stack.Screen name="OrderHistory" component={OrderHistoryScreen} />
            <Stack.Screen name="HelpSupport" component={HelpSupportScreen} />
            <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} />
            <Stack.Screen
              name="OrderSuccess"
              component={OrderSuccessScreen}
              options={{ headerShown: false }} // Looks better without header
            />
            <Stack.Screen
              name="FullMenu"
              component={FullMenuScreen}
              options={{ headerShown: false }}
            />
          </Stack.Group>
        )}
      </Stack.Navigator>
    </>
  );
}

export default function App() {

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <CartProvider>
          <SettingsProvider>
            <ThemeProvider>
              <ForceUpdate>
                <NavigationContainer linking={linking}>
                  <RootNavigation />
                  <Toast />
                </NavigationContainer>
              </ForceUpdate>
            </ThemeProvider>
          </SettingsProvider>
        </CartProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}