# Repository Guidelines

## Project Structure & Module Organization
- `src/` TypeScript/React source. Key folders: `components/` (UI + game UI), `modules/` (`ai/`, `core/`), `hooks/`, `stores/`, `types/`, `utils/`, `lib/`, `pages/`.
- `public/` Static assets served by Vite.
- `docs/` Architecture and specs (Chinese): API, system design, error strategy.
- `dist/` Production build output. `index.html` is Vite entry.

Example imports use the alias `@/`: `import { utils } from '@/lib/utils'`.

## Build, Test, and Development Commands
- `npm run dev` Start Vite dev server (Node ≥ 18) with HMR.
- `npm run build` Type-check then build to `dist/` (`tsc -b && vite build`).
- `npm run preview` Serve the production build locally.
- `npm test` Run unit tests with Vitest.
- `npm run lint` Lint and auto-fix via ESLint.
- `npm run typecheck` Strict TS checks without emit.
- `npm run format` / `format:check` Format or verify with Prettier.

## Coding Style & Naming Conventions
- Prettier: 2 spaces, single quotes, no semicolons, 80 cols, LF, JSX single quotes.
- ESLint: prefer `const`, forbid `var`, no unused vars (prefix `_` to ignore).
- Components: PascalCase for pages/complex components (e.g., `GameHeader.tsx`); kebab-case for UI primitives (e.g., `button.tsx`, `alert-dialog.tsx`).
- Hooks: `use-*.ts(x)` (e.g., `use-toast.ts`). Types/interfaces in `src/types/` with PascalCase.

## Testing Guidelines
- Framework: Vitest. Place tests as `*.test.ts(x)` or under `__tests__/` near sources.
- Example: `src/utils/__tests__/gameEventHelpers.test.ts`.
- Run tests locally: `npm test`. For coverage: `npx vitest run --coverage`.

## Commit & Pull Request Guidelines
- Prefer Conventional Commits: `feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `test:`. Keep messages clear (English or Chinese accepted).
- Before PR: run `lint`, `typecheck`, `test`, and `build` to ensure green checks.
- PRs: concise description, linked issue, screenshots/GIFs for UI changes, and note any docs updates under `docs/`.

## Security & Configuration Tips
- Vite env vars must start with `VITE_` and should be stored in `.env.local` (do not commit secrets).
- Use path alias `@/` for intra-project imports; avoid long relative paths.

