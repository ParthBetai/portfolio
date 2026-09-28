import type { Metadata } from "next";
import Link from "next/link";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Page not found",
};

/* Rendered inside the root layout, so the grain, the cursor and the skip
   link (which targets #main) all carry over. Static on purpose: a 404
   should never be the page that fails to load. */
export default function NotFound() {
  return (
    <>
    <main
      id="main"
      className="gutter flex min-h-[100svh] flex-col items-center justify-center bg-void py-24 text-center text-bone"
    >
      <h1 className="t-display chrome text-[32vw] leading-[0.85] sm:text-[12rem] md:text-[15rem]">
        404
        <span className="sr-only">, page not found</span>
      </h1>

      {/* Set at 24px and up so ash counts as large text and clears the
          3:1 contrast WCAG asks of it. */}
      <p className="t-serif mt-8 text-2xl text-ash md:text-4xl">This page wandered off.</p>

      <Link
        href="/"
        data-hover
        className="mt-12 inline-flex rounded-full bg-acid px-6 py-3 text-sm font-medium text-void transition-colors duration-300 hover:bg-bone"
      >
        Back to home
      </Link>
    </main>
    {/* The same footer as every other page. */}
    <Footer />
    </>
  );
}
