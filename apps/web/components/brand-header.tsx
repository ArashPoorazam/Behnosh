"use client";

import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { brands } from "@/lib/brand-content";
import { number } from "@/lib/money";
import { useBrandCommerce } from "./brand-commerce";

export function BrandHeader({ slug }: { slug: string }) {
  const { cart, openCart } = useBrandCommerce();
  return (
    <header className="campaign-header">
      <Link href="/#brands" className="campaign-home">
        خانواده بهنوش
      </Link>
      <nav className="campaign-nav" aria-label="برندهای بهنوش">
        {brands.map((item) => (
          <Link
            key={item.slug}
            href={`/brands/${item.slug}`}
            aria-current={item.slug === slug ? "page" : undefined}
          >
            {item.name}
          </Link>
        ))}
      </nav>
      <button
        className="campaign-cart"
        onClick={openCart}
        aria-label="باز کردن سبد خرید"
      >
        <ShoppingBag size={18} />
        <span>سبد خرید</span>
        <b>
          {number(cart.items.reduce((sum, item) => sum + item.quantity, 0))}
        </b>
      </button>
    </header>
  );
}
