import Link from "next/link";
export function SimpleHeader() {
  return (
    <header className="simple-header">
      <Link href="/" className="wordmark">
        بهنوش<span>BEHNOSH</span>
      </Link>
      <Link href="/">بازگشت به فروشگاه</Link>
    </header>
  );
}
