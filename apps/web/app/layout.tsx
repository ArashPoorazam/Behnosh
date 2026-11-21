import type { Metadata } from "next";
import "@fontsource/vazirmatn/400.css";
import "@fontsource/vazirmatn/500.css";
import "@fontsource/vazirmatn/700.css";
import "@fontsource/vazirmatn/900.css";
import "./globals.css";
export const metadata: Metadata = {
  title: "بهنوش | یک جرعه، حال تازه",
  description:
    "سفر به دنیای طعم‌های بهنوش. تجربه تعاملی نوشیدنی‌ها با خرید و پرداخت نمایشی.",
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
