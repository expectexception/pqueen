"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";

export type WishlistItem = {
  id: string;
  name: string;
  slug: string;
  price: number;
  image: string;
};

type WishlistContextType = {
 wishlist: WishlistItem[];
  isWishlisted: (id: string) => boolean;
  addToWishlist: (item: WishlistItem) => void;
  removeFromWishlist: (id: string) => void;
  toggleWishlist: (item: WishlistItem) => void;
  clearWishlist: () => void;
  wishlistCount: number;
};

const WishlistContext =
  createContext<WishlistContextType | undefined>(
    undefined
  );

export function WishlistProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [wishlist, setWishlist] = useState<WishlistItem[]>(
    []
  );

  const [isLoaded, setIsLoaded] = useState(false);

  /* LOAD WISHLIST */
  useEffect(() => {
    const savedWishlist =
      localStorage.getItem("pqn-wishlist");

    if (savedWishlist) {
      try {
        setWishlist(JSON.parse(savedWishlist));
      } catch {
        localStorage.removeItem("pqn-wishlist");
      }
    }

    setIsLoaded(true);
  }, []);

  /* SAVE WISHLIST */
  useEffect(() => {
    if (!isLoaded) return;

    localStorage.setItem(
      "pqn-wishlist",
      JSON.stringify(wishlist)
    );
  }, [wishlist, isLoaded]);

  function isWishlisted(id: string) {
    return wishlist.some(
      (item) => item.id === id
    );
  }

  function addToWishlist(item: WishlistItem) {
    setWishlist((current) => {
      if (
        current.some(
          (wishlistItem) =>
            wishlistItem.id === item.id
        )
      ) {
        return current;
      }

      return [...current, item];
    });
  }

  function removeFromWishlist(id: string) {
    setWishlist((current) =>
      current.filter(
        (item) => item.id !== id
      )
    );
  }

  function toggleWishlist(item: WishlistItem) {
    setWishlist((current) => {
      const exists = current.some(
        (wishlistItem) =>
          wishlistItem.id === item.id
      );

      if (exists) {
        return current.filter(
          (wishlistItem) =>
            wishlistItem.id !== item.id
        );
      }

      return [...current, item];
    });
  }

  function clearWishlist() {
    setWishlist([]);
  }

  const wishlistCount = wishlist.length;

  return (
    <WishlistContext.Provider
      value={{
        wishlist,
        isWishlisted,
        addToWishlist,
        removeFromWishlist,
        toggleWishlist,
        clearWishlist,
        wishlistCount,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);

  if (!context) {
    throw new Error(
      "useWishlist must be used inside WishlistProvider"
    );
  }

  return context;
}