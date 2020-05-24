import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from 'react';
import produce from 'immer';

import AsyncStorage from '@react-native-community/async-storage';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface CartContext {
  products: Product[];
  addToCart(item: Product): void;
  increment(id: string): void;
  decrement(id: string): void;
}

const CartContext = createContext<CartContext | null>(null);

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      const productsStored = await AsyncStorage.getItem(
        '@GoMarketPlace:products',
      );
      if (productsStored) {
        setProducts(JSON.parse(productsStored));
      }
    }
    loadProducts();
  }, []);

  const addToCart = useCallback(
    async product => {
      setProducts(
        produce(products, draft => {
          const productIndex = draft.findIndex(p => p.id === product.id);
          if (productIndex >= 0) {
            draft[productIndex].quantity += 1;
          } else {
            draft.push({ ...product, quantity: 1 });
          }
        }),
      );
      await AsyncStorage.setItem(
        '@GoMarketPlace:products',
        JSON.stringify(products),
      );
    },
    [products],
  );

  const increment = useCallback(
    async id => {
      setProducts(
        produce(products, draft => {
          const productIndex = draft.findIndex(p => p.id === id);
          if (productIndex >= 0) {
            draft[productIndex].quantity += 1;
          }
        }),
      );

      await AsyncStorage.setItem(
        '@GoMarketPlace:products',
        JSON.stringify(products),
      );
    },
    [products],
  );

  const decrement = useCallback(
    async id => {
      const productIndex = products.findIndex(p => p.id === id);
      if (productIndex >= 0 && products[productIndex].quantity > 0) {
        setProducts(
          produce(products, draft => {
            draft[productIndex].quantity -= 1;
          }),
        );
      }

      await AsyncStorage.setItem(
        '@GoMarketPlace:products',
        JSON.stringify(products.filter(p => p.quantity > 0)),
      );
    },
    [products],
  );

  const value = React.useMemo(
    () => ({ addToCart, increment, decrement, products }),
    [products, addToCart, increment, decrement],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

function useCart(): CartContext {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(`useCart must be used within a CartProvider`);
  }

  return context;
}

export { CartProvider, useCart };
