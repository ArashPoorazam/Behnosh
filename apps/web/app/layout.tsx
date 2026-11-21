import type { Metadata } from "next";
import "@fontsource/vazirmatn/400.css";
import "@fontsource/vazirmatn/500.css";
import "@fontsource/vazirmatn/700.css";
import "@fontsource/vazirmatn/900.css";
import "./globals.css";
export const metadata: Metadata = {
  title: "دلستر و دادلی | دنیای طعم‌ها",
  description:
    "دلستر و دادلی؛ نوشیدنی‌های مالت و میوه‌ای. کشف طعم‌ها و خرید نمایشی محصولات.",
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fa" dir="rtl">
      <body>
        <a className="skip-link" href="#main">
          رفتن به محتوا
        </a>
        {children}
      </body>
    </html>
  );
}
