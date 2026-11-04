import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { findStoreProduct } from './catalog';

const CartContext = createContext(null);
const STORAGE_KEY = 'zuriland_cart';
const MAX_QUANTITY = 99;

const readStoredCart = () => {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        const parsed = stored ? JSON.parse(stored) : [];

        if (!Array.isArray(parsed)) {
            return [];
        }

        const quantities = new Map();
        parsed.forEach((item) => {
            if (!findStoreProduct(item?.title)) {
                return;
            }
            const quantity = Math.min(
                MAX_QUANTITY,
                Math.max(1, Number.parseInt(item.quantity, 10) || 1)
            );
            quantities.set(item.title, Math.min(
                MAX_QUANTITY,
                (quantities.get(item.title) || 0) + quantity
            ));
        });

        return [...quantities].map(([title, quantity]) => ({ title, quantity }));
    } catch (error) {
        console.error('No se pudo leer el carrito guardado:', error);
        return [];
    }
};

export function CartProvider({ children }) {
    const [items, setItems] = useState(readStoredCart);

    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
        } catch (error) {
            console.error('No se pudo guardar el carrito:', error);
        }
    }, [items]);

    const addItem = useCallback((title) => {
        if (!findStoreProduct(title)) {
            throw new Error('El producto seleccionado no está disponible.');
        }

        setItems((currentItems) => {
            const existing = currentItems.find((item) => item.title === title);
            if (existing) {
                return currentItems.map((item) => item.title === title
                    ? { ...item, quantity: Math.min(MAX_QUANTITY, item.quantity + 1) }
                    : item);
            }

            return [...currentItems, { title, quantity: 1 }];
        });
    }, []);

    const updateQuantity = useCallback((title, quantity) => {
        const parsedQuantity = Number.parseInt(quantity, 10);
        if (!findStoreProduct(title) || !Number.isInteger(parsedQuantity)) {
            return;
        }

        setItems((currentItems) => currentItems.map((item) => item.title === title
            ? { ...item, quantity: Math.min(MAX_QUANTITY, Math.max(1, parsedQuantity)) }
            : item));
    }, []);

    const removeItem = useCallback((title) => {
        setItems((currentItems) => currentItems.filter((item) => item.title !== title));
    }, []);

    const clearCart = useCallback(() => setItems([]), []);
    const count = items.reduce((total, item) => total + item.quantity, 0);
    const total = items.reduce((sum, item) => (
        sum + (findStoreProduct(item.title)?.price || 0) * item.quantity
    ), 0);
    const value = useMemo(() => ({
        items,
        count,
        total,
        addItem,
        updateQuantity,
        removeItem,
        clearCart,
    }), [items, count, total, addItem, updateQuantity, removeItem, clearCart]);

    return (
        <CartContext.Provider value={value}>
            {children}
        </CartContext.Provider>
    );
}

export function useCart() {
    const context = useContext(CartContext);
    if (!context) {
        throw new Error('useCart debe usarse dentro de CartProvider.');
    }
    return context;
}
