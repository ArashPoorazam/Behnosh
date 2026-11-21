import Link from "next/link";
export default function NotFound() {
  return (
    <main id="main" className="page-shell">
      <h1 className="page-title">این صفحه پیدا نشد.</h1>
      <Link className="button dark" href="/">
        بازگشت به فروشگاه
      </Link>
    </main>
  );
}
