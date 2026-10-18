# MockMaster Smart Exam Preparation Platform

MockMaster is a React/Vite CBT application served by an Express API with a
SQLite database. The server is authoritative for timing, submitted responses,
negative marking, scores, ranks, planner data, administration, and role-based
access. Browser clients receive authenticated server-sent events so open views
refresh when relevant database data changes in another session.

## Run locally

1. Copy `.env.example` to `.env` and set a long `JWT_SECRET`.
2. Optionally set `SEED_ADMIN_EMAIL` and `SEED_ADMIN_PASSWORD` before the first
   database start to create the first administrator. Seed credentials are never
   exposed by the UI.
3. Run `npm install`, then `npm run dev`.

The SQLite database lives at `data/mockmaster.sqlite`; back it up before
deployment or before applying any custom schema changes. The server uses WAL
mode and foreign-key enforcement.

## Production configuration

- Set `NODE_ENV=production`, `JWT_SECRET`, and `PORT`; run `npm run build`,
  then `npm start`.
- Serve only over HTTPS. Session cookies are `HttpOnly`, `Secure` in production,
  and `SameSite=Strict`.
- Password recovery requires `APP_URL`, `RESEND_API_KEY`, and `EMAIL_FROM`.
  `EMAIL_FROM` must be a sender verified by Resend. Without all three values,
  recovery deliberately returns a configuration error instead of pretending a
  reset email was delivered.
- Admin study materials require a real, accessible HTTPS PDF URL (or a real
  application-relative PDF deployed with the app). The reader embeds/downloads
  that file; it does not manufacture document content.

## Verification

Run `npm run lint` for TypeScript checks and `npm run build` for the production
bundle. API smoke checks should cover registration/login, attempting and
submitting an exam, planner CRUD, administrator CRUD, a password reset with
configured Resend credentials, and two signed-in browser sessions observing an
SSE data-change event.
