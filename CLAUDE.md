# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Vue 3 + Vite + TypeScript project. The application is a minimal Vue 3 SPA with a single root component.

## Development Commands

### Development Server
```bash
npm run dev
```
Starts the Vite dev server with hot module replacement.

### Building
```bash
npm run build
```
Runs type checking with `vue-tsc` in parallel with the Vite build process. This is the full production build command.

```bash
npm run build-only
```
Builds the project without type checking (faster, useful for testing build output).

```bash
npm run type-check
```
Runs TypeScript type checking via `vue-tsc --build` without building the project.

### Preview Production Build
```bash
npm run preview
```
Preview the production build locally after running `npm run build`.

### Linting and Formatting
```bash
npm run lint
```
Runs ESLint with auto-fix enabled and uses cache for performance.

```bash
npm run format
```
Formats source files with Prettier.

## Architecture

### Project Structure
- **Entry point**: [index.html](index.html) - Vite uses the HTML file as the entry point, which loads [src/main.ts](src/main.ts)
- **Application bootstrap**: [src/main.ts](src/main.ts) - Creates the Vue app instance and mounts it to `#app`
- **Root component**: [src/App.vue](src/App.vue) - Currently minimal/empty, serves as the application shell

### TypeScript Configuration
The project uses a split TypeScript configuration:
- [tsconfig.json](tsconfig.json) - Root config that references the others
- [tsconfig.app.json](tsconfig.app.json) - Config for application code in `src/`
- [tsconfig.node.json](tsconfig.node.json) - Config for Node.js tooling files (Vite config, ESLint config, etc.)

### Path Aliases
- `@/*` maps to `./src/*` (configured in both Vite and TypeScript)

### ESLint Configuration
Uses the modern flat config format ([eslint.config.ts](eslint.config.ts)) with:
- Vue plugin essential rules
- TypeScript support via `@vue/eslint-config-typescript`
- Prettier integration (skip formatting rules to avoid conflicts)
- Lints `**/*.{vue,ts,mts,tsx}` files

### Node Version Requirements
Requires Node.js `^20.19.0 || >=22.12.0` as specified in [package.json](package.json).

## Key Dependencies
- **Vue 3.5**: Core framework
- **Vite 7**: Build tool and dev server
- **vue-tsc**: TypeScript type checking for Vue SFC files
- **vite-plugin-vue-devtools**: Vue DevTools integration during development
