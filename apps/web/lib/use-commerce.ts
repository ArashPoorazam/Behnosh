"use client";
import { useCallback, useEffect, useState } from "react";
import { api, errorMessage, unwrap, type Cart, type Product } from "./api";
export function useCommerce() {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<Cart>({ items: [], total_rial: 0 });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const reload = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [catalog, basket] = await Promise.all([
        api.GET("/api/v1/catalog"),
        api.GET("/api/v1/cart"),
      ]);
      const products = unwrap(catalog);
      const cart = unwrap(basket);
      setProducts(products);
      setCart(cart);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    void reload();
    const refresh = () => void reload();
    window.addEventListener("focus", refresh);
    return () => window.removeEventListener("focus", refresh);
  }, [reload]);
  const setQuantity = async (variantID: string, quantity: number) => {
    setBusy(true);
    setError("");
    try {
      const next = unwrap(
        await api.PUT("/api/v1/cart/items", {
          body: { variant_id: variantID, quantity },
        }),
      );
      setCart(next);
      return true;
    } catch (e) {
      setError(errorMessage(e));
      return false;
    } finally {
      setBusy(false);
    }
  };
  return { products, cart, error, loading, busy, reload, setQuantity };
}
