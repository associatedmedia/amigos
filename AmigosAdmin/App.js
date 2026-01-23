import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons'; // Built-in icons

// Screens
import LoginScreen from './src/screens/LoginScreen';
import AdminDashboard from './src/screens/AdminDashboard'; // This is your existing dashboard
import OrdersScreen from './src/screens/OrdersScreen';     // New file
import ProfileScreen from './src/screens/ProfileScreen';   // New file
import CustomersScreen from './src/screens/CustomersScreen'; // <--- Import this
import ContentScreen from './src/screens/ContentScreen'; // Import new screen

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// --- 1. THE TAB NAVIGATOR ---
function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: '#3b82f6', // Active Color (Blue)
        tabBarInactiveTintColor: 'gray',
        tabBarStyle: { height: 60, paddingBottom: 10, paddingTop: 10 },
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Dashboard') {
            iconName = focused ? 'restaurant' : 'restaurant-outline';
          } else if (route.name === 'Orders') {
            iconName = focused ? 'list' : 'list-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
           } else if (route.name === 'Content') {
            iconName = focused ? 'library' : 'library-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Dashboard" component={AdminDashboard} />
      <Tab.Screen name="Orders" component={OrdersScreen} />
      <Tab.Screen name="Content" component={ContentScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

// --- 2. THE MAIN STACK ---
export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {/* Login is the first screen */}
        <Stack.Screen name="Login" component={LoginScreen} />
        
        {/* Once logged in, we go to "MainTabs" which has the bottom bar */}
        <Stack.Screen name="AdminDashboard" component={MainTabs} /> 
        <Stack.Screen name="Customers" component={CustomersScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}