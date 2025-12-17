# Vercel Deployment Guide

## Prerequisites

- Vercel account (sign up at https://vercel.com)
- Git repository (GitHub, GitLab, or Bitbucket)
- All environment variables ready (see below)

## Step 1: Prepare Your Repository

1. **Ensure your code is committed:**
   ```bash
   git status
   git add .
   git commit -m "Prepare for Vercel deployment"
   git push
   ```

2. **Verify build works locally:**
   ```bash
   npm run build
   ```
   Should complete without errors.

## Step 2: Deploy to Vercel

### Option A: Via Vercel Dashboard (Recommended)

1. **Go to https://vercel.com and sign in**

2. **Click "Add New Project"**

3. **Import your Git repository:**
   - Select your repository (GitHub/GitLab/Bitbucket)
   - Vercel will auto-detect Next.js

4. **Configure Project:**
   - **Framework Preset**: Next.js (auto-detected)
   - **Root Directory**: `./` (default)
   - **Build Command**: `npm run build` (default)
   - **Output Directory**: `.next` (default)
   - **Install Command**: `npm ci` (recommended for production)

5. **Add Environment Variables** (see Step 3 below)

6. **Click "Deploy"**

### Option B: Via Vercel CLI

1. **Install Vercel CLI:**
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel:**
   ```bash
   vercel login
   ```

3. **Deploy:**
   ```bash
   vercel
   ```
   - Follow prompts
   - Choose defaults
   - This creates a preview deployment

4. **Deploy to Production:**
   ```bash
   vercel --prod
   ```

## Step 3: Configure Environment Variables

Go to **Vercel Dashboard → Your Project → Settings → Environment Variables**

Add these variables for **Production**, **Preview**, and **Development**:

### Required Variables

```bash
# Airtable
AIRTABLE_TOKEN=pat_your_token_here
AIRTABLE_BASE_ID=app_your_base_id_here

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_... (or pk_test_... for testing)
CLERK_SECRET_KEY=sk_live_... (or sk_test_... for testing)

# Public Base URL (for webhooks)
PUBLIC_BASE_URL=https://your-app.vercel.app
```

### Optional Variables (for VAPI integration)

```bash
# VAPI Integration
VAPI_PRIVATE_API_KEY=sk_your_vapi_key
VAPI_ASSISTANT_ID=your_assistant_id
VAPI_PHONE_NUMBER_ID=your_phone_number_id

# Twilio (if using directly)
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=your_phone_number

# Default Escalation Number (for VAPI transfers)
DEFAULT_ESCALATION_NUMBER=+1234567890
```

### Important Notes:

1. **NEXT_PUBLIC_ prefix**: Variables starting with `NEXT_PUBLIC_` are exposed to the browser. Only use for public keys.

2. **Environment Scope**: 
   - **Production**: Live production site
   - **Preview**: Pull request previews
   - **Development**: Local development (if using `vercel dev`)

3. **PUBLIC_BASE_URL**: 
   - For production: `https://your-app.vercel.app` or your custom domain
   - Update this after you know your Vercel URL
   - Used for VAPI webhook URLs

4. **After adding variables**: Click "Save" and **redeploy** your project.

## Step 4: Configure Clerk

1. **Go to Clerk Dashboard** → Your Application → Settings → Domains

2. **Add your Vercel domain:**
   - Add: `your-app.vercel.app`
   - If using custom domain, add that too

3. **Verify allowed origins:**
   - Production: `https://your-app.vercel.app`
   - Preview: `https://your-app-*.vercel.app` (wildcard for PR previews)

## Step 5: Configure Airtable Webhooks (if using)

1. **Go to Airtable Base** → Extensions → Webhooks

2. **Update webhook URLs:**
   - Notification URL: `https://your-app.vercel.app/api/airtable/webhooks/notify`
   - Pull URL: `https://your-app.vercel.app/api/airtable/webhooks/pull?webhookId=YOUR_WEBHOOK_ID`

## Step 6: Configure VAPI Webhooks (if using)

1. **Go to VAPI Dashboard** → Your Assistant → Webhooks

2. **Update webhook URLs:**
   - Events: `https://your-app.vercel.app/api/vapi/webhooks/events`
   - Transcript: `https://your-app.vercel.app/api/vapi/webhooks/transcript`

3. **Update tool URLs:**
   - getBusinessConfig: `https://your-app.vercel.app/api/vapi/tools/getBusinessConfig`
   - createOrUpdateLead: `https://your-app.vercel.app/api/vapi/tools/createOrUpdateLead`
   - bookAppointment: `https://your-app.vercel.app/api/vapi/tools/bookAppointment`
   - transferToHuman: `https://your-app.vercel.app/api/vapi/tools/transferToHuman`

## Step 7: Verify Deployment

1. **Visit your Vercel URL:**
   - Should load the landing page

2. **Test public routes:**
   - `/` - Landing page
   - `/onboarding` - Onboarding form
   - `/pricing` - Pricing page
   - `/industries` - Industries page

3. **Test setup page:**
   - `/setup` - Should show configuration checklist
   - If env vars are set, should show "Setup complete"

4. **Test API health:**
   - `/api/health` - Should return readiness status

5. **Test admin routes (after Clerk setup):**
   - `/app` - Should redirect to Clerk sign-in
   - After sign-in, should show dashboard

## Step 8: Custom Domain (Optional)

1. **Go to Vercel Dashboard** → Your Project → Settings → Domains

2. **Add your domain:**
   - Enter your domain (e.g., `lattice.ai`)
   - Follow DNS configuration instructions

3. **Update environment variables:**
   - Update `PUBLIC_BASE_URL` to your custom domain
   - Update Clerk allowed origins
   - Update Airtable/VAPI webhook URLs
   - Redeploy

## Troubleshooting

### Build Fails

1. **Check build logs in Vercel Dashboard**
2. **Common issues:**
   - Missing dependencies → Check `package.json`
   - TypeScript errors → Run `npm run build` locally first
   - Environment variable issues → Check variable names and values

### Environment Variables Not Working

1. **Verify variable names** match exactly (case-sensitive)
2. **Check environment scope** (Production vs Preview)
3. **Redeploy** after adding variables
4. **Check for typos** in variable values

### Clerk Authentication Not Working

1. **Verify domain is added** in Clerk Dashboard
2. **Check environment variables** are set correctly
3. **Verify keys are for correct environment** (test vs live)
4. **Check browser console** for errors

### Airtable Not Working

1. **Verify AIRTABLE_TOKEN and AIRTABLE_BASE_ID** are set
2. **Check token permissions** (needs read/write access)
3. **Verify base ID** is correct
4. **Check Airtable API logs** for errors

### Webhooks Not Receiving Events

1. **Verify PUBLIC_BASE_URL** is set correctly
2. **Check webhook URLs** in external services (Airtable, VAPI)
3. **Verify HTTPS** (Vercel provides this automatically)
4. **Check Vercel function logs** for incoming requests
5. **Test webhook endpoint** manually with curl:
   ```bash
   curl -X POST https://your-app.vercel.app/api/vapi/webhooks/events \
     -H "Content-Type: application/json" \
     -d '{"test": "data"}'
   ```

## Post-Deployment Checklist

- [ ] Environment variables added to Vercel
- [ ] Clerk domain configured
- [ ] Airtable webhooks updated (if using)
- [ ] VAPI webhooks updated (if using)
- [ ] Public routes accessible
- [ ] Admin routes require authentication
- [ ] API health endpoint working
- [ ] Onboarding form submits successfully
- [ ] Custom domain configured (if applicable)
- [ ] SSL certificate active (automatic with Vercel)

## Monitoring

### Vercel Analytics (Optional)

1. **Enable Analytics:**
   - Go to Vercel Dashboard → Your Project → Analytics
   - Enable Web Analytics (free tier available)

### Function Logs

1. **View logs:**
   - Vercel Dashboard → Your Project → Deployments → Click deployment → Functions tab
   - See real-time logs for API routes

### Error Tracking (Future Enhancement)

Consider adding:
- Sentry for error tracking
- LogRocket for session replay
- Vercel Analytics for performance

## Rollback

If something goes wrong:

1. **Go to Vercel Dashboard** → Your Project → Deployments
2. **Find previous working deployment**
3. **Click "..." → Promote to Production**

## Continuous Deployment

Vercel automatically deploys:
- **Production**: Pushes to `main`/`master` branch
- **Preview**: Pull requests and other branches

To disable auto-deploy:
- Settings → Git → Disable "Automatic deployments"

## Next Steps

After successful deployment:

1. **Test all features** end-to-end
2. **Monitor error logs** for first few days
3. **Set up monitoring** (UptimeRobot, Pingdom)
4. **Configure backups** for Airtable data
5. **Set up staging environment** (separate Vercel project)
