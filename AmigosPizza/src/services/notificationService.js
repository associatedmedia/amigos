import { sendLocalNotification } from '../utils/notifications';

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