# Agent Rules

This project is a standard **Next.js App Router** application with TypeScript and Tailwind CSS v4.

## Stack
- Next.js (App Router) — pages in `app/`, API routes in `app/api/`
- Tailwind CSS v4 — configured via `postcss.config.mjs`
- TypeScript with strict mode
- `dayjs` for date formatting, `axios` + `fast-xml-parser` for 1C SOAP integration

## Key conventions
- All report pages are client components (`'use client'`)
- SOAP calls go through `lib/1c-client.ts` — use `callSoap()` for all operations
- API routes return `{ error: string }` with status 500 on failure
- Frontend checks `res.ok` and shows the `error` field in a red banner
- Env vars: `ONEC_URL`, `ONEC_LOGIN`, `ONEC_PASSWORD` — validated at call time via `requireEnv()`
