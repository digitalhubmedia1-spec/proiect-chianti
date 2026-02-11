import React, { createContext, useContext, useState, useEffect } from 'react';
import { useMenu } from './MenuContext';

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
    const { categories } = useMenu();
    const [cartItems, setCartItems] = useState(() => {
        const savedCart = localStorage.getItem('chianti_cart');
        return savedCart ? JSON.parse(savedCart) : [];
    });

    useEffect(() => {
        localStorage.setItem('chianti_cart', JSON.stringify(cartItems));
    }, [cartItems]);

    const getItemType = (itemCategory) => {
        const cat = categories.find(c => c.name === itemCategory);
        return cat ? (cat.type || 'delivery') : 'delivery';
    };

    const addToCart = (product, quantity = 1, selectedOptions = {}) => {
        // Prevent mixing types
        if (cartItems.length > 0) {
            const currentType = getItemType(cartItems[0].category);
            const newType = getItemType(product.category);

            if (currentType !== newType) {
                const confirmClear = window.confirm(
                    `Coșul conține deja produse de tip "${currentType === 'delivery' ? 'Livrări' : 'Catering'}".\n` +
                    `Nu puteți amesteca produsele de Catering cu cele de Livrare.\n\n` +
                    `Doriți să goliți coșul pentru a adăuga acest produs?`
                );

                if (confirmClear) {
                    setCartItems([{ ...product, quantity, selectedOptions, cartId: Date.now() + Math.random() }]);
                }
                return;
            }
        }

        setCartItems(prevItems => {
            // Check for existing item with SAME ID and SAME OPTIONS
            const existingItemIndex = prevItems.findIndex(item =>
                item.id === product.id &&
                JSON.stringify(item.selectedOptions || {}) === JSON.stringify(selectedOptions || {})
            );

            if (existingItemIndex > -1) {
                // Update quantity of existing line
                const newItems = [...prevItems];
                newItems[existingItemIndex].quantity += quantity;
                return newItems;
            }
            // Add new line
            return [...prevItems, { ...product, quantity, selectedOptions, cartId: Date.now() + Math.random() }];
        });
    };

    const removeFromCart = (cartId) => {
        setCartItems(prevItems => prevItems.filter(item => (item.cartId || item.id) !== cartId));
    };

    const updateQuantity = (cartId, newQuantity) => {
        if (newQuantity < 1) return;
        setCartItems(prevItems =>
            prevItems.map(item =>
                (item.cartId || item.id) === cartId ? { ...item, quantity: newQuantity } : item
            )
        );
    };

    const clearCart = () => {
        setCartItems([]);
    };

    const cartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

    const cartTotal = cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);

    return (
        <CartContext.Provider value={{
            cartItems,
            addToCart,
            removeFromCart,
            updateQuantity,
            clearCart,
            cartCount,
            cartTotal
        }}>
            {children}
        </CartContext.Provider>
    );
};
