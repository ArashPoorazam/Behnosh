"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import { useCommerce } from "@/lib/use-commerce";
import { CartDrawer } from "./cart-drawer";

const BrandCommerce = createContext<
  (ReturnType<typeof useCommerce> & { openCart: () => void }) | null
>(null);

export function BrandCommerceProvider({ children }: { children: ReactNode }) {
  const commerce = useCommerce();
  const [open, setOpen] = useState(false);
  return (
    <BrandCommerce.Provider
      value={{ ...commerce, openCart: () => setOpen(true) }}
    >
      {children}
      <CartDrawer
        open={open}
        onClose={() => setOpen(false)}
        cart={commerce.cart}
        busy={commerce.busy}
        error={commerce.error}
        onQuantity={commerce.setQuantity}
        onCheckedOut={() => void commerce.reload()}
      />
    </BrandCommerce.Provider>
  );
}

export function useBrandCommerce() {
  const commerce = useContext(BrandCommerce);
  if (!commerce) throw new Error("Brand commerce requires its provider");
  return commerce;
}
