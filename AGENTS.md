<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Project conventions

- `src/app/` holds routes only. Page UI lives in `src/components/<page>/` and the page file just renders it.
- Generic, reusable UI goes in `src/components/shared/`. Build new UI from these (Button, TextArea, TextInput, Select, Card, Badge, Alert, Dialog, FieldError, CharacterCount) instead of styling raw elements.
- One folder per component: `Name/Name.tsx`, `Name/Name.test.tsx`, `Name/index.ts`. Import through the folder (`@/components/shared/Button`).
- Hooks in `src/hooks/`, client API calls in `src/services/`, server-only code in `src/server/`, Zod schemas in `src/schemas/`, constants in `src/constants/`, hand-written content in `src/data/`, pure helpers in `src/utils/`.
- Claude calls use the shared client in `src/server/anthropic.ts`. Routes map errors with `claudeErrorResponse` (`src/server/apiErrors.ts`). Dev caching goes through `createFileCache` (`src/server/fileCache.ts`).
- Middleware is `src/proxy.ts` (Next.js 16 name), one file only.
- Every change comes with tests next to the code it covers.
