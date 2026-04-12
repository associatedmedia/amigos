import React, { createContext, useState, useContext } from 'react';
import { Vibration } from 'react-native';
const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [chefNote, setChefNote] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);

  const clearCart = () => {
    setCartItems([]);
    setChefNote('');
    setAppliedCoupon(null);
  };

  const addToCart = (product, selectedVariant = null) => {
    Vibration.vibrate(100);
    setCartItems(prevItems => {
      let cartItemId = product.cartItemId || (selectedVariant ? `${product.id}_v${selectedVariant.id}` : product.id);
      
      const existingItem = prevItems.find(item => (item.cartItemId || item.id) === cartItemId);
      if (existingItem) {
        return prevItems.map(item =>
          (item.cartItemId || item.id) === cartItemId ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      
      const price = selectedVariant ? parseFloat(selectedVariant.price) : parseFloat(product.price);
      const name = selectedVariant ? `${product.name} (${selectedVariant.variant_name})` : product.name;
      
      return [...prevItems, { 
        ...product, 
        cartItemId, 
        price, 
        name, 
        variant_id: selectedVariant ? selectedVariant.id : null, 
        quantity: 1 
      }];
    });
  };

  const removeFromCart = (identifier) => {
    setCartItems(prevItems => prevItems.filter(item => (item.cartItemId || item.id) !== identifier));
  };

  const cartTotal = cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);

  return (
    <CartContext.Provider value={{ 
      cartItems, addToCart, removeFromCart, clearCart, cartTotal,
      chefNote, setChefNote, appliedCoupon, setAppliedCoupon
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);