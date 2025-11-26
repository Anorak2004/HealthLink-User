# Repository Guidelines

## Project Structure & Module Organization
- `app/`: Next.js App Router entry (root layout and landing `page.tsx`).
- `pages/`: Route-specific flows (doctor consult, health assessment, health record, profile, settings).
- `components/`: Reusable UI, especially emergency response components and Radix UI wrappers.
- `hooks/`: React hooks such as `use-emergency-alert` and `use-toast`.
- `utils/`, `lib/`: Domain logic and service abstractions (monitoring, API clients, config managers).
- `types/`, `typings/`: Shared TypeScript types, including WeChat mini‑program interfaces.
- `docs/`: Design notes and module documentation; `styles/` and `public/` hold global CSS and static assets.

## Build, Test, and Development Commands
- `pnpm dev` – Start the Next.js dev server.
- `pnpm build` – Create a production build (`.next/`).
- `pnpm start` – Run the production server (after `pnpm build`).
- `pnpm lint` – Run Next.js/Tailwind linting.
- Tests are written for Vitest (`vitest.config.ts`). After adding `vitest` as a dev dependency, run `npx vitest` (or `pnpm vitest`) from the repo root.

## Coding Style & Naming Conventions
- Language: TypeScript + React; prefer functional components with hooks.
- Style: 2‑space indentation, single quotes, no semicolons; keep imports sorted and grouped.
- Naming: `PascalCase` for components/types (`EmergencyResponseManager`), `camelCase` for variables/functions, `kebab-case` for file names (`emergency-alert-dialog.tsx`).
- Use path aliases (e.g. `@/utils/...`, `@/types/...`) where configured in `tsconfig.json`.

## Testing Guidelines
- Framework: Vitest with `jsdom` and global test APIs (`vitest.config.ts`, `test-setup.ts`).
- Location: Prefer `__tests__/` directories alongside source (`utils/__tests__`, `components/__tests__`, `hooks/__tests__`).
- Naming: Use `*.test.ts` / `*.test.tsx`; for manual scenarios use `*.manual.test.md`.
- Aim to cover core emergency flows (alert triggering, monitoring thresholds, service integration) before UI details.

## Commit & Pull Request Guidelines
- Follow the existing pattern: short version-like prefix plus clear summary, e.g. `v2.2 Develop Emergency Response User Interface`.
- Keep commits focused on one logical change (feature, fix, refactor, docs).
- PRs should include: purpose/summary, key implementation notes, testing steps (`pnpm lint`, test commands), and links to related issues or design docs (e.g. files in `docs/` or `utils/SERVICE_ABSTRACTION_README.md`).
