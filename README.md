# panevain.dev

[![Test](https://github.com/panevain/website/actions/workflows/test.yml/badge.svg)](https://github.com/panevain/website/actions/workflows/test.yml)
[![Deploy](https://github.com/panevain/website/actions/workflows/deploy.yml/badge.svg?branch=main)](https://github.com/panevain/website/actions/workflows/deploy.yml)

Matt Newcomer's personal site, built with [VitePress](https://vitepress.dev/)
and Vue 3.

## Project Structure

```text
pages/          # VitePress content (Markdown + config)
components/     # Vue components
  features/     # Interactive feature components (e.g. Game of Life)
  ui/           # Reusable UI primitives (e.g. Card)
  pages/        # Page-level layout components
composables/    # Vue composables (shared stateful logic)
tests/          # Vitest unit tests
```

## Development

```bash
npm install
npm run dev       # Start local dev server
npm run build     # Build for production
npm run preview   # Preview production build
```

## Code Quality

```bash
npm run lint          # ESLint
npm run format        # Prettier (write)
npm run format:check  # Prettier (check only)
npm test              # Vitest unit tests
```

## Path Alias

`~` resolves to the project root. This alias is configured in three places so
it works consistently across all contexts:

| Context             | File                          |
| ------------------- | ----------------------------- |
| IDE / type checking | `tsconfig.json`               |
| Build (VitePress)   | `pages/.vitepress/config.mts` |
| Tests (Vitest)      | `vitest.config.ts`            |

## CI

Tests run automatically on push to `main` via `.github/workflows/test.yml`.
The full deploy pipeline (lint → test → build → deploy to GitHub Pages) runs
via `.github/workflows/deploy.yml`.
