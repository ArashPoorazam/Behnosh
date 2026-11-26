import Link from "next/link";
import { FooterSocials } from "./footer-socials";
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
      <div className="brand-footer-grid">
        <div className="footer-content">
          <div className="footer-details">
            <div className="footer-contact">
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
            <nav className="footer-links" aria-label="پیوندهای پایین صفحه">
              <h3>دنیای بهنوش</h3>
              <a href="/#brands">خانواده بهنوش</a>
              <Link href="/products">همه محصولات</Link>
              <a href="/#heritage">داستان ما</a>
              <a href="/#news">اخبار بهنوش</a>
            </nav>
          </div>
          <FooterSocials />
        </div>
        <figure className="footer-bottle">
          <img
            src="/assets/brand/delster-classic-fountain-v1.webp"
            alt="دلستر شیشه کلاسیک با فوران نوشیدنی طلایی از دهانهٔ باز بطری"
            width={800}
            height={1200}
            loading="lazy"
          />
          <figcaption className="footer-signature">
            <strong>۶۰</strong>
            <span>
              سال همراهی
              <br />
              از ۱۳۴۵ تا امروز
            </span>
          </figcaption>
        </figure>
      </div>
      <div className="brand-colophon">
        <span>© ۱۴۰۵ شرکت بهنوش ایران</span>
        <a href="#main" className="round-link" aria-label="بازگشت به بالا">
          ↑
        </a>
        <span dir="ltr">A LIFETIME OF GOOD TASTE</span>
      </div>
    </footer>
  );
}
