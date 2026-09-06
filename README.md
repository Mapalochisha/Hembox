# HemBox

A custom full-stack e-commerce platform built with Next.js 14, Prisma, and PostgreSQL (Supabase).

## Tech Stack
- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Database:** PostgreSQL via Supabase
- **ORM:** Prisma
- **Auth:** NextAuth.js
- **Hosting:** Vercel

## Getting Started
```bash
npm install
npm run dev
```

## Validation
Run the same checks used by CI before deploying:
```bash
npx prisma generate
npx tsc --noEmit
npm run test:unit
npm run build
```

## Database Migrations
Production databases must use committed Prisma migrations:
```bash
npx prisma migrate deploy
```

Do **not** use `prisma migrate reset` against production. Do not use `prisma db push` as the production deployment mechanism.

## Seed Data
The seed script creates development/admin bootstrap data and requires `HEMBOX_ADMIN_SECRET` to be set. Do not use the seed script as a production migration mechanism.

## Environment
Keep environment files out of Git. Required production secrets and database URLs must be configured through the deployment environment, not committed to the repository.
