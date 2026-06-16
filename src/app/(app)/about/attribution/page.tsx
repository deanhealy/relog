import { Attribution } from "@/components/shell/Attribution";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata = { title: "Attribution · Relog" };

export default function AttributionPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <Link
        href="/films"
        className="mb-6 inline-flex items-center gap-1 text-xs text-[var(--color-muted)] hover:text-[var(--color-text)]"
      >
        <ArrowLeft className="h-3 w-3" />
        Back
      </Link>
      <h1 className="font-serif text-3xl tracking-tight">Attribution</h1>
      <p className="mt-2 text-sm text-[var(--color-muted)]">
        Relog uses third-party services to fetch cover art and metadata. We
        don’t claim ownership of any data returned by these APIs.
      </p>

      <div className="mt-8 flex flex-col gap-6">
        <AttributionItem
          name="The Movie Database (TMDB)"
          url="https://www.themoviedb.org/"
          license="Free for non-commercial use with attribution."
          description="Movie and TV show metadata and poster art."
        />
        <AttributionItem
          name="RAWG"
          url="https://rawg.io/"
          license="Free for non-commercial and small commercial use with backlink."
          description="Video game metadata and cover art."
        />
        <AttributionItem
          name="Google Books"
          url="https://books.google.com/"
          license="Free with API key, standard Google APIs ToS apply."
          description="Book metadata and cover art."
        />
      </div>

      <div className="mt-10 border-t border-[var(--color-border)] pt-6 text-xs text-[var(--color-muted)]">
        <Attribution />
      </div>
    </div>
  );
}

function AttributionItem({
  name,
  url,
  license,
  description,
}: {
  name: string;
  url: string;
  license: string;
  description: string;
}) {
  return (
    <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)]/50 p-4">
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="font-serif text-lg text-[var(--color-gold-bright)] hover:underline"
      >
        {name}
      </a>
      <p className="mt-1 text-sm text-[var(--color-text)]">{description}</p>
      <p className="mt-1 text-xs text-[var(--color-muted)]">{license}</p>
    </div>
  );
}
