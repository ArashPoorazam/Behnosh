import Link from "next/link";
import { BrandMark } from "./brand-shell";
export function SimpleHeader() {
  return (
    <header className="simple-header">
      <Link href="/" className="simple-home" aria-label="بهنوش، خانه">
        <BrandMark />
      </Link>
      <Link href="/products">بازگشت به فروشگاه</Link>
    </header>
  );
}
