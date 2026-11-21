"use client";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main id="main" className="page-shell">
      <h1 className="page-title">صفحه آماده نشد.</h1>
      <p>لطفاً دوباره تلاش کن.</p>
      <button className="button dark" onClick={reset}>
        تلاش دوباره
      </button>
    </main>
  );
}
