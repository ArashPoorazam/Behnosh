import Link from "next/link";
export function SimpleHeader() {
  return (
    <header className="simple-header">
      <Link href="/" className="delster-wordmark" dir="ltr">
        DELSTER<span>®</span>
      </Link>
      <Link href="/products">بازگشت به فروشگاه</Link>
    </header>
  );
}
