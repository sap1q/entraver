"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { productsApi } from "@/lib/api/products";

const WISHLIST_STORAGE_KEY = "entraverse_wishlist_ids";
const wishlistSubscribers = new Set<(ids: string[]) => void>();
let wishlistCache: string[] | null = null;

const toUniqueIds = (ids: string[]): string[] => {
  return Array.from(new Set(ids.filter((id) => id.trim().length > 0)));
};

const readWishlistIds = (): string[] => {
  if (typeof window === "undefined") return [];
  if (wishlistCache) return wishlistCache;

  try {
    const rawValue = window.localStorage.getItem(WISHLIST_STORAGE_KEY);
    if (!rawValue) {
      wishlistCache = [];
      return [];
    }

    const parsed = JSON.parse(rawValue);
    if (!Array.isArray(parsed)) {
      wishlistCache = [];
      return [];
    }

    wishlistCache = toUniqueIds(parsed.map((value) => String(value)));
    return wishlistCache;
  } catch {
    wishlistCache = [];
    return [];
  }
};

const writeWishlistIds = (ids: string[]) => {
  const normalized = toUniqueIds(ids);
  wishlistCache = normalized;

  if (typeof window !== "undefined") {
    window.localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(normalized));
  }

  wishlistSubscribers.forEach((subscriber) => subscriber(normalized));
};

export const useWishlist = () => {
  const [wishlistIds, setWishlistIds] = useState<string[]>(() => readWishlistIds());
  const [loadingIds, setLoadingIds] = useState<string[]>([]);

  useEffect(() => {
    const subscriber = (ids: string[]) => {
      setWishlistIds(ids);
    };

    wishlistSubscribers.add(subscriber);
    return () => {
      wishlistSubscribers.delete(subscriber);
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    const handleStorageChange = (event: StorageEvent) => {
      if (event.key !== WISHLIST_STORAGE_KEY) return;
      setWishlistIds(readWishlistIds());
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const toggleWishlist = useCallback(async (productId: string) => {
    if (!productId) return;

    setLoadingIds((prev) => (prev.includes(productId) ? prev : [...prev, productId]));

    const previous = readWishlistIds();
    const optimistic = previous.includes(productId)
      ? previous.filter((id) => id !== productId)
      : [...previous, productId];

    writeWishlistIds(optimistic);

    try {
      const response = await productsApi.toggleWishlist(productId);

      if (!response.success) {
        writeWishlistIds(previous);
        return;
      }

      const isWishlisted = response.is_wishlisted;
      const synced = isWishlisted
        ? toUniqueIds([...optimistic, productId])
        : optimistic.filter((id) => id !== productId);

      writeWishlistIds(synced);
    } catch (error) {
      console.error("Failed to toggle wishlist:", error);
      writeWishlistIds(previous);
    } finally {
      setLoadingIds((prev) => prev.filter((id) => id !== productId));
    }
  }, []);

  const isInWishlist = useCallback(
    (productId: string) => {
      return wishlistIds.includes(productId);
    },
    [wishlistIds]
  );

  const isPending = useCallback(
    (productId: string) => {
      return loadingIds.includes(productId);
    },
    [loadingIds]
  );

  const loading = useMemo(() => loadingIds.length > 0, [loadingIds]);

  return {
    wishlistIds,
    toggleWishlist,
    isInWishlist,
    isPending,
    loading,
  };
};
