"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { trackMetaEvent } from "@/lib/meta-pixel";

type CartItem = {
  id: string;
  name: string;
  slug: string;
  price: number;
  image: string;
  size: string;
  color: string;
  quantity: number;
};

type CartContextType = {
  cart: CartItem[];

  addToCart: (item: CartItem) => void;

  removeFromCart: (
    id: string,
    size: string,
    color: string
  ) => void;

  updateQuantity: (
    id: string,
    size: string,
    color: string,
    quantity: number
  ) => void;

  clearCart: () => void;

  cartCount: number;
};

const CartContext =
  createContext<CartContextType | undefined>(
    undefined
  );

export function CartProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [cart, setCart] =
    useState<CartItem[]>([]);

  const [isLoaded, setIsLoaded] =
    useState(false);

  useEffect(() => {
    const savedCart =
      localStorage.getItem("pqn-cart");

    if (savedCart) {
      try {
        const parsedCart =
          JSON.parse(savedCart);

        // Backward compatibility with old cart items
        const updatedCart = Array.isArray(
          parsedCart
        )
          ? parsedCart.map((item) => ({
              ...item,
              color:
                typeof item.color === "string"
                  ? item.color
                  : "",
            }))
          : [];

        setCart(updatedCart);
      } catch {
        localStorage.removeItem(
          "pqn-cart"
        );
      }
    }

    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (!isLoaded) return;

    localStorage.setItem(
      "pqn-cart",
      JSON.stringify(cart)
    );
  }, [cart, isLoaded]);

  function addToCart(item: CartItem) {
    trackMetaEvent("AddToCart", {
      content_name: item.name,
      content_ids: [item.id],
      content_type: "product",
      value: item.price * (item.quantity || 1),
      currency: "INR",
    });

    setCart((currentCart) => {
      const existingItem =
        currentCart.find(
          (cartItem) =>
            cartItem.id === item.id &&
            cartItem.size === item.size &&
            cartItem.color === item.color
        );

      if (existingItem) {
        return currentCart.map(
          (cartItem) =>
            cartItem.id === item.id &&
            cartItem.size === item.size &&
            cartItem.color === item.color
              ? {
                  ...cartItem,
                  quantity:
                    cartItem.quantity +
                    item.quantity,
                }
              : cartItem
        );
      }

      return [...currentCart, item];
    });
  }

  function removeFromCart(
    id: string,
    size: string,
    color: string
  ) {
    setCart((currentCart) =>
      currentCart.filter(
        (item) =>
          !(
            item.id === id &&
            item.size === size &&
            item.color === color
          )
      )
    );
  }

  function updateQuantity(
    id: string,
    size: string,
    color: string,
    quantity: number
  ) {
    if (quantity <= 0) {
      removeFromCart(
        id,
        size,
        color
      );
      return;
    }

    setCart((currentCart) =>
      currentCart.map((item) =>
        item.id === id &&
        item.size === size &&
        item.color === color
          ? {
              ...item,
              quantity,
            }
          : item
      )
    );
  }

  function clearCart() {
    setCart([]);
  }

  const cartCount = cart.reduce(
    (total, item) =>
      total + item.quantity,
    0
  );

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        cartCount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context =
    useContext(CartContext);

  if (!context) {
    throw new Error(
      "useCart must be used inside CartProvider"
    );
  }

  return context;
}