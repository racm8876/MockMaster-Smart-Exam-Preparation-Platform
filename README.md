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
- Signed-in users (including administrators) can change their email address or
  password from **Account settings** in the header. Credential changes require
  the current password. If the administrator cannot sign in, use **Forgot
  password** after configuring the recovery email settings above.

### Local administrator recovery

To create an additional administrator on the server machine, choose the email
and password yourself and run:

```powershell
$env:ADMIN_NAME = 'Site Administrator' # optional
$env:ADMIN_EMAIL = 'admin@example.com'
$env:ADMIN_PASSWORD = 'A-long-new-password1'
npm run admin:create
```

The account is created with the `ADMIN` role, and the command rejects an email
that is already registered. Remove those variables from the shell after use.

For a self-hosted deployment where the administrator is locked out and email
recovery is unavailable, run the local-only recovery command from the server
machine. It is not an HTTP endpoint and requires filesystem/environment access
to the deployment:

```powershell
$env:ADMIN_CURRENT_EMAIL = 'admin@example.com'
$env:ADMIN_NEW_EMAIL = 'new-admin@example.com' # use the current address to keep it
$env:ADMIN_NEW_PASSWORD = 'A-long-new-password1'
npm run admin:reset
```

Remove those environment variables from the shell after use. The command only
updates an existing `ADMIN` account, never creates or promotes a user.
- Admin study materials require a real, accessible HTTPS PDF URL (or a real
  application-relative PDF deployed with the app). The reader embeds/downloads
  that file; it does not manufacture document content.

## Verification

Run `npm run lint` for TypeScript checks and `npm run build` for the production
bundle. API smoke checks should cover registration/login, attempting and
submitting an exam, planner CRUD, administrator CRUD, a password reset with
configured Resend credentials, and two signed-in browser sessions observing an
SSE data-change event.
