"use client";

import { useCallback, useState } from "react";
import { productsApi } from "@/lib/api/products";

export const useCart = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addToCart = useCallback(async (productId: string, quantity: number, variant?: Record<string, string>) => {
    try {
      setLoading(true);
      setError(null);

      const response = await productsApi.addToCart(productId, quantity, variant);
      if (response.success === false) {
        const message = response.message ?? "Gagal menambahkan produk ke keranjang.";
        setError(message);
        return { success: false as const, message };
      }

      return { success: true as const, message: response.message ?? "Berhasil." };
    } catch (fetchError) {
      console.error(fetchError);
      const message = "Gagal menambahkan produk ke keranjang.";
      setError(message);
      return { success: false as const, message };
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    addToCart,
    loading,
    error,
  };
};
