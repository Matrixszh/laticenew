# Quick Deploy Checklist

## Before Deploying

- [ ] Code is committed and pushed to Git
- [ ] `npm run build` succeeds locally
- [ ] All environment variables are ready (see below)

## Environment Variables to Add in Vercel

### Required (Minimum for basic functionality)

```bash
AIRTABLE_TOKEN=pat_...
AIRTABLE_BASE_ID=app_...
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...
PUBLIC_BASE_URL=https://your-app.vercel.app
```

### Optional (for VAPI integration)

```bash
VAPI_PRIVATE_API_KEY=sk_...
VAPI_ASSISTANT_ID=...
VAPI_PHONE_NUMBER_ID=...
TWILIO_ACCOUNT_SID=...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=...
DEFAULT_ESCALATION_NUMBER=+1234567890
```

## Quick Deploy Steps

1. **Go to https://vercel.com** → Add New Project
2. **Import your Git repository**
3. **Add environment variables** (Settings → Environment Variables)
4. **Deploy**
5. **Update PUBLIC_BASE_URL** with your actual Vercel URL
6. **Redeploy** after updating PUBLIC_BASE_URL

## After Deploying

- [ ] Update Clerk allowed origins with Vercel URL
- [ ] Update Airtable webhook URLs (if using)
- [ ] Update VAPI webhook URLs (if using)
- [ ] Test public routes (`/`, `/onboarding`)
- [ ] Test admin routes (`/app` - should require auth)
- [ ] Test API health (`/api/health`)

## Quick Commands

```bash
# Install Vercel CLI (optional)
npm i -g vercel

# Deploy preview
vercel

# Deploy production
vercel --prod

# Pull env vars locally (optional)
vercel env pull .env.local
```

See `VERCEL_DEPLOYMENT.md` for detailed instructions.
