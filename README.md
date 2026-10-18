# WOD Prep

Paste a CrossFit workout and get it broken down by movement — with (soon) videos, points of performance, articles, and alternative movements for each.

## Setup

```bash
npm install
cp .env.example .env.local   # then add your ANTHROPIC_API_KEY
npm run dev
```

Open http://localhost:3000.

## Parse cache

In development, every parsed WOD is saved to `.cache/parsed-wods.json` (gitignored), so testing with the same workouts costs nothing after the first parse. Cached workouts even work without an API key.

- **Formatting is ignored:** `"Fran" 21-15-9 for time: Thrusters (95/65 lb), Pull-ups` and `fran 21-15-9 for time thrusters 95/65lb pullups` hit the same entry.
- **Named workouts** are also stored under their name, so after parsing Fran once, typing just `Fran` is a cache hit.
- **Different wording** (e.g. `21-15-9 pullups and thrusters`) is parsed once more, then cached too.
- Responses carry an `X-Cache: HIT` or `MISS` header (visible in the browser's network tab).
- **Clear the cache:** delete `.cache/`. **Turn it on or off:** set `WOD_CACHE=on|off`. It's off in production by default.
- Bump `CACHE_VERSION` in `src/server/wodCache.ts` when the parser prompt or schema changes.

## Checks

```bash
npm test              # Vitest unit + component tests
npm run lint          # ESLint
npm run format:check  # Prettier (npm run format to fix)
npm run typecheck     # TypeScript
```

CI runs all of these plus `npm run build` on every pull request. `main` is protected: all changes go through a PR.

## Structure

```
src/
├── app/                  # Next.js routes only (pages, layouts, API route handlers)
│   ├── page.tsx          #   renders <HomePage />
│   └── api/parse/        #   POST /api/parse
├── components/
│   ├── shared/           # Generic, reusable UI (Button, TextArea, TextInput, Select, Card, Badge, Dialog, …)
│   └── home/             # Components used only by the home page (HomePage, StimulusCard, …)
├── hooks/                # React hooks (useParseWod, useUndoableText, useAutoResize, …)
├── services/             # Client-side API calls (wodApi)
├── server/               # Server-only code (the Claude call); never imported by components
├── schemas/              # Zod schemas and the types inferred from them
├── types/                # Hand-written shared types (UI state)
├── constants/            # App-wide constants (limits, labels, example WOD)
├── styles/               # Shared Tailwind class helpers
├── utils/                # Small pure helpers (cn, withId)
└── test/                 # Test setup and fixtures
```

Each component has its own folder with the component, its tests and an `index.ts`:

```
components/shared/Button/
├── Button.tsx
├── Button.test.tsx
└── index.ts              # import { Button } from "@/components/shared/Button"
```

Middleware is called **proxy** in Next.js 16 and must live in a single `src/proxy.ts`. There isn't one yet.

## Roadmap

1. ~~Paste WOD → parsed movement list~~
2. Points of performance agent
3. Videos agent (YouTube)
4. Alternative movements agent + friction toggles
5. Articles agent
6. Per-movement caching
