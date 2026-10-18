# WOD Prep

Paste a CrossFit workout and get it broken down by movement — with (soon) videos, points of performance, articles, and alternative movements for each.

## Setup

```bash
npm install
cp .env.example .env.local   # then add your ANTHROPIC_API_KEY
npm run dev
```

Open http://localhost:3000.

## Checks

```bash
npm test              # Vitest unit + component tests
npm run lint          # ESLint
npm run format:check  # Prettier (npm run format to fix)
npm run typecheck     # TypeScript
```

CI runs all of these plus `npm run build` on every pull request. `main` is protected: all changes go through a PR.

## Structure

- `src/app/page.tsx` — the UI (paste WOD → movement cards)
- `src/app/api/parse/route.ts` — API route that parses the WOD
- `src/lib/parse-wod.ts` — Claude call that turns WOD text into structured data
- `src/lib/wod.ts` — the shared WOD/movement schema

## Roadmap

1. ~~Paste WOD → parsed movement list~~
2. Points of performance agent
3. Videos agent (YouTube)
4. Alternative movements agent + friction toggles
5. Articles agent
6. Per-movement caching
