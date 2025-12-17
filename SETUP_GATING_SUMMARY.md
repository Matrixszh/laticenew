# Setup Gating & Environment Readiness Summary

## What Was Implemented

### 1. Setup Page & Env Var Checklist

- Added a dedicated `/setup` page that:
  - Shows separate sections for **Clerk Authentication** and **Airtable**
  - Displays whether each required env var is present:
    - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
    - `CLERK_SECRET_KEY`
    - `AIRTABLE_TOKEN`
    - `AIRTABLE_BASE_ID`
    - `VAPI_PRIVATE_API_KEY` (for Vapi)
    - `VAPI_WEBHOOK_SECRET` (optional, for verifying Vapi webhooks)
  - Explains what each env var unlocks (e.g., "Enables secure login", "Connects to your Airtable base", "Enables Vapi inbound calls")
  - Shows a green check ✅ when configured, a warning icon when missing
  - Includes step-by-step instructions for local and Vercel setup

### 2. Setup Gating for Admin Dashboard

- All `/app/*` routes are protected by:
  - Clerk auth (when `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY` are set)
  - Airtable readiness (when `AIRTABLE_TOKEN` and `AIRTABLE_BASE_ID` are set)
- If required env vars are missing:
  - Requests to `/app/*` are redirected to `/setup`
  - Public routes (`/`, `/onboarding`, `/pricing`, `/setup`, `/api/health`) remain accessible

### 3. Health Endpoint

- Implemented `GET /api/health` that returns a JSON payload with:
  - `ok`: `true` if both auth and Airtable are ready
  - `authReady`: whether Clerk env vars are set
  - `airtableReady`: whether Airtable env vars are set
  - `schemaOk`: whether Airtable schema matches `lib/schema.ts`
  - `schemaErrors`: array of human-readable mismatch descriptions (if any)
- The endpoint never returns secrets; only boolean flags and high-level messages.

### 4. Vercel Integration

- `next.config.js` updated to include security headers for all routes:
  - `Strict-Transport-Security` (in production)
  - `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, basic CSP
- `VERCEL_DEPLOYMENT.md` documents how to:
  - Deploy to Vercel with `npm run build` + `vercel`
  - Configure env vars in Vercel project settings
  - Use `vercel env pull` to sync env vars locally

### 5. Playwright E2E Tests for Gating

- Added `e2e/setup-gating.spec.ts` to verify:
  - Visiting `/app` without config redirects to `/setup`
  - `/setup` shows missing env vars
  - `/api/health` reports `ok: false` when env vars or schema are missing
  - Once env vars are set, `/app` loads and `/setup` shows all checks green

## Environment Variables

### Required for Auth + Airtable

- `NEXT_PUBLIC` **Clerk**
  - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
  - `CLERK_SECRET_KEY`
- `Airtable`
  - `AIRTABLE_TOKEN`
  - `AIRTABLE_BASE_ID`

### Required for Vapi Integration

- `VAPI_PRIVATE_API_KEY` - Vapi private API key
- `VAPI_WEBHOOK_SECRET` (optional but recommended) - HMAC signing secret for Vapi webhooks

### Public Base URL

- `PUBLIC_BASE_URL` - The public URL of your deployment, used to build webhook URLs, e.g.:
  - Local: `http://localhost:3000`
  - Vercel: `https://your-project-name.vercel.app`

## How to Set Up Locally

1. **Create `.env.local` from template**

```bash
cp .env.example .env.local
```

2. **Fill in required keys**

```bash
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...
AIRTABLE_TOKEN=pat...
AIRTABLE_BASE_ID=app...
VAPI_PRIVATE_API_KEY=sk_...
# Optional: set VAPI_WEBHOOK_SECRET for signed webhooks
VAPI_WEBHOOK_SECRET=your_vapi_webhook_secret
PUBLIC_BASE_URL=http://localhost:3000
```

3. **Run the dev server**

```bash
npm run dev
```

4. **Verify setup**

- Visit `http://localhost:3000/setup` to confirm all required env vars are green
- Visit `http://localhost:3000/api/health` to confirm `ok: true` once configured

## How to Set Up on Vercel

1. **Deploy the app** (see `VERCEL_DEPLOYMENT.md`)
2. **In Vercel Project → Settings → Environment Variables**, add:
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
   - `CLERK_SECRET_KEY`
   - `AIRTABLE_TOKEN`
   - `AIRTABLE_BASE_ID`
   - `VAPI_PRIVATE_API_KEY`
   - `VAPI_WEBHOOK_SECRET` (optional, recommended)
   - `PUBLIC_BASE_URL` (e.g., `https://your-project-name.vercel.app`)
3. **Redeploy** the project after saving env vars
4. **Verify** `/setup` and `/api/health` on the deployed URL

## Notes

- The platform is designed to be **safe by default**: without required env vars or schema alignment, admin routes are gated and webhooks will no-op rather than fail calls.
- All env-related logs avoid printing raw secret values.
- Schema drift is surfaced to admins via `/setup` and does not leak details to end users.
