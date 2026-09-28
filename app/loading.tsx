/* Shown the instant a link to another page is clicked, until that page is
   ready. The deployed site has every page prebuilt, so this is usually a
   blink; in local development a page is compiled the first time it is
   opened, which can take several seconds, and without this a click looked
   like it did nothing. */
export default function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-void">
      <div role="status" className="flex flex-col items-center gap-4">
        <p className="t-mono text-ash">Loading</p>
        <span aria-hidden className="block h-px w-28 overflow-hidden bg-white/10">
          <span
            className="block h-full w-1/3 bg-acid"
            style={{ animation: "route-scan 1.1s cubic-bezier(0.76, 0, 0.24, 1) infinite" }}
          />
        </span>
      </div>
    </div>
  );
}
