import Link from "next/link";
import { notFound } from "next/navigation";
import { brands } from "@/lib/brand-content";
import { DadliExperience } from "@/components/dadli-experience";
import { BrandMark, BrandFooter } from "@/components/brand-shell";
import "@/styles/dadali-page.css";
export function generateStaticParams() {
  return brands.map(({ slug }) => ({ slug }));
}
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const brand = brands.find((b) => b.slug === slug);
  return { title: `${brand?.name || "برندها"} | بهنوش` };
}
export default async function BrandPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const brand = brands.find((b) => b.slug === slug);
  if (!brand) notFound();
  if (slug === "dadali") {
    return (
      <main id="main" className="brand-site dadali-page">
        <h1 className="sr-only">دنیای دادالی</h1>
        <DadliExperience />
      </main>
    );
  }
  return (
    <div className="brand-site brand-subpage">
      <header className="brand-subheader">
        <Link href="/" aria-label="بهنوش، خانه">
          <BrandMark />
        </Link>
        <Link href="/#brands">بازگشت به خانواده بهنوش ←</Link>
      </header>
      <main id="main">
        <section className="brand-pending">
          <img
            src={`/assets/brand/${slug}.png`}
            alt=""
            width="160"
            height="160"
          />
          <h1>{brand.name}</h1>
          <p>داستان تازه‌ی این خانواده به‌زودی اینجا آغاز می‌شود.</p>
          <Link className="brand-pill" href="/products">
            مشاهده محصولات بهنوش ↖
          </Link>
        </section>
      </main>
      <BrandFooter />
    </div>
  );
}
