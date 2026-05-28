# Simplicit MVP

Production-oriented MVP foundation for Simplicit, built with:

- Next.js App Router
- TypeScript
- TailwindCSS
- React Query
- Feature-driven frontend architecture inspired by Bulletproof React

## Routes

- `/` landing page
- `/sign-in`
- `/sign-up`
- `/forgot-password`
- `/dashboard`
- `/workspace`
- `/architecture`
- `/generations/demo`
- `/settings`

## Structure

The app keeps route files thin and pushes implementation into `src/features/*`. Shared UI, data, and utilities live in `src/components` and `src/lib`.

## Run

```bash
npm install
npm run dev
```
