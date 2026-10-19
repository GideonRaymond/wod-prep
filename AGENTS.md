<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Project conventions

- `src/app/` holds routes only. Page UI lives in `src/components/<page>/` and the page file just renders it.
- Generic, reusable UI goes in `src/components/shared/`. Build new UI from these (Button, ButtonLink, TextArea, TextInput, Select, Card, Badge, CategoryBadge, Alert, Dialog, FieldError, CharacterCount, IntensityGauge, MovementDetails) instead of styling raw elements. `WodBoard` (the whiteboard) and `BoardLayout` (board beside the page) are shared by every step.
- One folder per component: `Name/Name.tsx`, `Name/Name.test.tsx`, `Name/index.ts`. Import through the folder (`@/components/shared/Button`).
- The flow is three routes, shown by `Stepper` with the steps in `src/constants/flow.ts`: `/` (paste; parsing writes the board up as it goes), `/review` (edit beside the board; `src/components/review/`), `/workout` (loading screen, then the class).
- App-wide state in `src/providers/` (e.g. `WodProvider`, the current workout shared by the review and workout pages). It reads from a store in `src/stores/` (`wodStore`) via `useSyncExternalStore`; every change (and the text the workout was parsed from) is written through to sessionStorage so a refresh restores it. Don't read `sessionStorage` during render elsewhere — it isn't available on the server.
- Hooks in `src/hooks/`, client API calls in `src/services/`, server-only code in `src/server/`, Zod schemas in `src/schemas/`, constants in `src/constants/`, hand-written content in `src/data/`, pure helpers in `src/utils/`.
- Claude calls use the shared client in `src/server/anthropic.ts`. Routes map errors with `claudeErrorResponse` (`src/server/apiErrors.ts`). Dev caching goes through `createFileCache` (`src/server/fileCache.ts`). Videos: hand-picked ones in `src/data/movementVideos.ts`, otherwise YouTube search in `src/server/movementVideos.ts` (key `YOUTUBE_API_KEY`) ranked by Claude in `src/server/rankVideos.ts`; cached per movement for 30 days. Articles: Claude with web search/fetch in `src/server/articles.ts`, per workout part; only URLs seen in its search results are kept; cached for 30 days. Warm-up and skills: one Claude call per workout in `src/server/classPrep.ts`; the time budget, fitting and stage order (skills right before the part that uses them) live in `src/utils/classPlan.ts`. Whiteboard: the outline call writes each part's `board` lines; the board stays as read while editing, and parts edited since (`boardOutdated` in `src/utils/partKey.ts`) are redrawn on the workout page by `useBoardRedraw` through `/api/board` (`src/server/redrawBoard.ts`, `FAST_MODEL`). The planned warm-up and stretches go on the board via `src/utils/boardExtras.ts`. Cool-down stretches: hand-picked library in `src/data/stretches.ts`, chosen per workout by `src/utils/suggestStretches.ts` (no API call).
- Parsing is two steps (`src/server/parseWod.ts`): a quick outline with `FAST_MODEL`, then each part's details in parallel, streamed to the client as NDJSON `ParseEvent`s (`src/types/parse.ts`, read by `src/services/wodApi.ts`). Test helpers for the stream are in `src/test/parseStream.ts`.
- The workout page's loading screen (`src/components/workout/LoadingScreen`) is driven by `classChecklist` and the hand-over by `useHandOver`. The handwriting fonts load only in `WodBoard/fonts.ts`; tests mock `next/font/google` in `src/test/setup.ts`.
- Routes call `mockLoad(kind)` (`src/server/mockLoad.ts`) before returning a cached or hand-picked result, so `MOCK_LOAD=true` shows the loading screens with cached data. Do the same in new routes.
- Middleware is `src/proxy.ts` (Next.js 16 name), one file only.
- Every change comes with tests next to the code it covers.
