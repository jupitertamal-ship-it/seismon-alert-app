# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.

## GitHub

- Target repo: `https://github.com/jupitertamal-ship-it/seismon-alert-app`
- The GitHub integration OAuth was dismissed by the user; instead the PAT is stored as the secret `GITHUB_PERSONAL_ACCESS_TOKEN`.
- To push to GitHub, run `bash push-to-github.sh` from the Replit Shell (the script lives at the workspace root).
- Note: The main agent cannot run git write operations directly — they must be run manually via the Shell tool.

## Android (Capacitor)

- Capacitor Android project lives at `artifacts/earthquake-app/android/`
- App ID: `com.earthquakeapp.earlywarning`
- Plugins: `@capacitor/push-notifications`, `@capacitor/device`, `@capacitor/app`
- `google-services.json` is at `artifacts/earthquake-app/android/app/google-services.json`
- To rebuild for Android: `pnpm run build:android` then `npx cap sync` from `artifacts/earthquake-app/`
- To open in Android Studio: `npx cap open android` from `artifacts/earthquake-app/`
