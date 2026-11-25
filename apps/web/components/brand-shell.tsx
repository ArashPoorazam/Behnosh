import Link from "next/link";
export function BrandMark({ className = "" }: { className?: string }) {
  return (
    <span
      className={`brand-mark ${className}`}
      role="img"
      aria-label="نشان بهنوش"
    >
      <img
        src="/assets/brand/behnoush-official.png"
        alt=""
        width={300}
        height={300}
      />
    </span>
  );
}
export function BrandFooter() {
  return (
    <footer id="contact" className="brand-footer">
      <div className="footer-invite">
        <BrandMark className="footer-emblem" />
        <h2>خاطره‌ها ادامه دارند.</h2>
        <a href="#main" className="round-link" aria-label="بازگشت به بالا">
          ↑
        </a>
      </div>
      <div className="brand-footer-grid">
        <div>
          <h3>با بهنوش در ارتباط باشید</h3>
          <a href="tel:+982144556003" dir="ltr">
            021–44556003
          </a>
          <a href="mailto:info@behnoushiran.ir">info@behnoushiran.ir</a>
          <p>
            تهران، کیلومتر ۹ جاده مخصوص کرج،
            <br /> خیابان شهید پوری، پلاک ۵
          </p>
        </div>
        <nav aria-label="پیوندهای پایین صفحه">
          <a href="/#brands">خانواده بهنوش</a>
          <Link href="/products">همه محصولات</Link>
          <a href="/#heritage">داستان ما</a>
          <a href="/#news">اخبار بهنوش</a>
        </nav>
        <div className="footer-signature">
          <strong>۶۰</strong>
          <span>
            سال همراهی
            <br />
            از ۱۳۴۵ تا امروز
          </span>
        </div>
      </div>
      <div className="brand-colophon">
        <span>© ۱۴۰۵ شرکت بهنوش ایران</span>
        <span dir="ltr">A LIFETIME OF GOOD TASTE.</span>
      </div>
    </footer>
  );
}
