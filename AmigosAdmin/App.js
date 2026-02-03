import React, { useContext } from 'react';
import { View, ActivityIndicator } from 'react-native'; 
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context'; 
import { Ionicons } from '@expo/vector-icons'; 
import { AuthProvider, AuthContext } from './src/context/AuthContext'; 

// --- SCREENS ---
import LoginScreen from './src/screens/LoginScreen';
import AdminDashboard from './src/screens/AdminDashboard'; 
import OrdersScreen from './src/screens/OrdersScreen';     
import ProfileScreen from './src/screens/ProfileScreen';   
import CustomersScreen from './src/screens/CustomersScreen'; 
import ContentScreen from './src/screens/ContentScreen'; 
import DriversScreen from './src/screens/DriversScreen';
import PrinterScreen from './src/screens/PrinterScreen'; // ✅ Added Printer Setup

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// --- 1. TAB NAVIGATOR ---
function MainTabs() {
  const insets = useSafeAreaInsets(); 

  const bottomPadding = insets.bottom > 0 ? insets.bottom : 20;
  const tabBarHeight = 60 + bottomPadding;

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: '#D23F45', 
        tabBarInactiveTintColor: 'gray',
        tabBarStyle: { 
          height: tabBarHeight,
          paddingBottom: bottomPadding,
          paddingTop: 10,
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#EEEEEE',
          elevation: 10,
        },
        tabBarLabelStyle: {
          marginBottom: 5, 
          fontSize: 10,
          fontWeight: 'bold'
        },
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Dashboard') iconName = focused ? 'restaurant' : 'restaurant-outline';
          else if (route.name === 'Orders') iconName = focused ? 'list' : 'list-outline';
          else if (route.name === 'Profile') iconName = focused ? 'person' : 'person-outline';
          else if (route.name === 'Content') iconName = focused ? 'library' : 'library-outline';
          else if (route.name === 'Drivers') iconName = focused ? 'bicycle' : 'bicycle-outline';

          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Dashboard" component={AdminDashboard} />
      <Tab.Screen name="Orders" component={OrdersScreen} />
      <Tab.Screen name="Content" component={ContentScreen} />
      <Tab.Screen name="Drivers" component={DriversScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

// --- 2. AUTHENTICATION NAVIGATION LAYOUT ---
// This component sits inside AuthProvider so it can use 'useContext'
const AppLayout = () => {
  const { userToken, isLoading } = useContext(AuthContext);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#D23F45" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {userToken ? (
          // ✅ AUTHENTICATED STACK (User is Logged In)
          <>
            <Stack.Screen name="MainTabs" component={MainTabs} />
            <Stack.Screen name="Customers" component={CustomersScreen} />
            <Stack.Screen name="PrinterSetup" component={PrinterScreen} />
          </>
        ) : (
          // ❌ GUEST STACK (User is Logged Out)
          <Stack.Screen name="Login" component={LoginScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

// --- 3. ROOT APP ---
export default function App() {
  return (
    <AuthProvider>
      <SafeAreaProvider>
        <AppLayout /> 
      </SafeAreaProvider>
    </AuthProvider>
  );
}