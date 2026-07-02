"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type CartItemType = 'COURSE' | 'BOOK';

export interface CartItem {
  id: string; // Product ID (Course ID or Book ID)
  title: string;
  price: number;
  type: CartItemType;
  format?: 'DIGITAL' | 'PHYSICAL'; // Only for books
  image_url?: string;
  quantity?: number;
}

interface CartContextType {
  items: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (id: string, format?: string) => void;
  updateQuantity: (id: string, format: string, quantity: number) => void;
  clearCart: () => void;
  totalPrice: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  // Load from local storage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('core_cart');
    if (savedCart) {
      try {
        setItems(JSON.parse(savedCart));
      } catch (e) {
        console.error("Failed to parse cart", e);
      }
    }
  }, []);

  // Save to local storage when items change
  useEffect(() => {
    localStorage.setItem('core_cart', JSON.stringify(items));
  }, [items]);

  const addToCart = (newItem: CartItem) => {
    setItems((prevItems) => {
      // Check if already in cart (for courses)
      if (newItem.type === 'COURSE' && prevItems.some(i => i.id === newItem.id && i.type === 'COURSE')) {
        alert("هذا الكورس موجود بالفعل في السلة");
        return prevItems;
      }
      
      // Check if already in cart (for books with same format)
      if (newItem.type === 'BOOK' && newItem.format === 'PHYSICAL') {
        const existingBook = prevItems.find(i => i.id === newItem.id && i.type === 'BOOK' && i.format === 'PHYSICAL');
        if (existingBook) {
          alert("هذا الكتاب موجود بالفعل في السلة، يمكنك تعديل الكمية من صفحة السلة.");
          return prevItems;
        }
      } else if (newItem.type === 'BOOK' && prevItems.some(i => i.id === newItem.id && i.type === 'BOOK' && i.format === newItem.format)) {
        alert("هذا الكتاب بنفس الصيغة موجود بالفعل في السلة");
        return prevItems;
      }

      alert("تمت الإضافة إلى السلة بنجاح!");
      return [...prevItems, { ...newItem, quantity: newItem.quantity || 1 }];
    });
  };

  const updateQuantity = (id: string, format: string, quantity: number) => {
    if (quantity < 1) return;
    setItems((prevItems) => 
      prevItems.map(item => {
        if (item.id === id && item.format === format) {
          return { ...item, quantity };
        }
        return item;
      })
    );
  };

  const removeFromCart = (id: string, format?: string) => {
    setItems((prevItems) => 
      prevItems.filter(item => {
        if (format) return !(item.id === id && item.format === format);
        return item.id !== id;
      })
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  const totalPrice = items.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0);

  return (
    <CartContext.Provider value={{ items, addToCart, removeFromCart, updateQuantity, clearCart, totalPrice }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
