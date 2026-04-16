import { sendLocalNotification } from '../utils/notifications';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

const getStatusMessage = (status) => {
    switch (status) {
        case 'confirmed': return { title: 'Order Confirmed ✅', body: 'We have received your order!' };
        case 'cooking': return { title: 'Cooking Now 👨‍🍳', body: 'The chef is preparing your food.' };
        case 'out_for_delivery': return { title: 'On the Way 🛵', body: 'Driver has picked up your order.' };
        case 'delivered': return { title: 'Delivered! 🍕', body: 'Enjoy your meal.' };
        default: return null;
    }
};

export const showOrderNotification = async (order) => {
    const details = getStatusMessage(order.status);
    if (!details) return;

    // Schedule the notification immediately
    await sendLocalNotification(details.title, details.body, { orderId: order.id });
};

export async function registerForPushNotificationsAsync() {
  let token;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      console.log('Failed to get push token for push notification!');
      return null;
    }
    try {
      const projectId =
        Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
      token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
      console.log('Expo Push Token:', token);
    } catch (e) {
      console.log('Error getting push token', e);
    }
  } else {
    console.log('Must use physical device for Push Notifications');
  }

  return token;
}