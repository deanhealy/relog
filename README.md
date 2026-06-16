# Relog

**Review Your Backlog.**

A sleek, single-user tracker for films, TV, games, and books. Add items to a per-category backlog, get cover art auto-fetched, and leave a 5-star rating + review on completion. Dark + warm gold theme. Installable as a PWA.

## Stack

- Next.js (App Router) + TypeScript
- Tailwind CSS v4
- Framer Motion
- Dexie.js (IndexedDB)
- TanStack Query
- TMDB / RAWG / Google Books (via server-side API routes)

## Getting started

```bash
npm install
cp .env.example .env.local   # then fill in your API keys
npm run dev
```

Open http://localhost:3000.

## Deployment

Hosted on Vercel (free tier). Every push to `main` auto-deploys.

API keys live in Vercel project settings → Environment Variables (never committed).
