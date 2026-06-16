import Link from "next/link";

export function Attribution() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
      <span>Relog</span>
      <span className="opacity-50">·</span>
      <span>
        Metadata from{" "}
        <a
          href="https://www.themoviedb.org/"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-[var(--color-gold-bright)]"
        >
          TMDB
        </a>
        ,{" "}
        <a
          href="https://rawg.io/"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-[var(--color-gold-bright)]"
        >
          RAWG
        </a>
        , and{" "}
        <a
          href="https://books.google.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-[var(--color-gold-bright)]"
        >
          Google Books
        </a>
      </span>
      <span className="opacity-50">·</span>
      <Link href="/about/attribution" className="hover:text-[var(--color-gold-bright)]">
        Attribution
      </Link>
    </div>
  );
}
