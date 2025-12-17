# Quick Start Guide - Get to Production in 80 Minutes

## Step 1: Set Up Airtable (15 minutes)

### 1.1 Create Airtable Base
1. Go to https://airtable.com and sign in
2. Click "Add a base" → "Start from scratch"
3. Name it "Lattice AI Platform"
4. Copy the Base ID from the URL (format: `appXXXXXXXXXXXXXX`)

### 1.2 Create Tables
Create these tables exactly as specified in `lib/schema.ts`:

**Businesses Table:**
- `Name` (Single line text, required)
- `Timezone` (Single line text, required) - e.g., "America/New_York"
- `Created` (Created time, auto-generated)

**Leads Table:**
- `Name` (Single line text, required)
- `Email` (Email, required)
- `Phone` (Phone number, optional)
- `Status` (Single select, required) - Options: New, Contacted, Qualified, Closed, Lost
- `Industry` (Single line text, optional)
- `Use Case` (Single line text, optional)
- `Team Size` (Single line text, optional)
- `Expected Volume` (Single line text, optional)
- `Onboarding Notes` (Long text, optional)
- `Created` (Created time, auto-generated)

**Interactions Table:**
- `Type` (Single select, required) - Options: Call, SMS, Email
- `Transcript` (Long text, **REQUIRED**)
- `Duration` (Number, optional)
- `Direction` (Single select, optional) - Options: Inbound, Outbound
- `Status` (Single select, optional) - Options: Completed, Missed, In Progress
- `Lead` (Link to Leads table, optional)
- `Business` (Link to Businesses table, optional)
- `Created` (Created time, auto-generated)

**Appointments Table:**
- `Lead` (Link to Leads table, optional)
- `Business` (Link to Businesses table, required)
- `Start UTC` (Date, required) - Format: ISO 8601
- `End UTC` (Date, required) - Format: ISO 8601
- `Status` (Single select, required) - Options: HOLD, CONFIRMED, CANCELLED
- `Created` (Created time, auto-generated)

**PromptOverrides Table:**
- `Business` (Link to Businesses table, required)
- `Date` (Date, required)
- `Prompt` (Long text, required)
- `Created` (Created time, auto-generated)

**Automations Table:**
- `Name` (Single line text, required)
- `Trigger` (Single line text, required)
- `Conditions` (Long text, optional)
- `Actions` (Long text, required)
- `Active` (Checkbox, default: checked)
- `Business` (Link to Businesses table, optional)
- `Created` (Created time, auto-generated)

**BusyBlocks Table (Optional):**
- `Business` (Link to Businesses table, required)
- `Start UTC` (Date, required)
- `End UTC` (Date, required)
- `Reason` (Single line text, optional)
- `Created` (Created time, auto-generated)

**Onboarding Table:**
- `Company Name` (Single line text, required)
- `Email` (Email, required)
- `Phone` (Phone number, optional)
- `Industry` (Single line text, required)
- `Use Case` (Single line text, required)
- `Team Size` (Single line text, required)
- `Expected Volume` (Single line text, required)
- `Onboarding Notes` (Long text, optional)
- `Status` (Single select, required) - Options: New, Contacted, Converted, Archived (default: New)
- `Created` (Created time, auto-generated)

### 1.3 Get Personal Access Token
1. Go to https://airtable.com/create/tokens
2. Click "Create new token"
3. Name it "Lattice AI Platform"
4. Grant access to your base
5. Scopes needed:
   - `data.records:read`
   - `data.records:write`
   - `schema.bases:read`
6. Copy the token (starts with `pat...`)

### 1.4 Add to Environment Variables
Create `.env.local` file:
```bash
AIRTABLE_TOKEN=pat_your_token_here
AIRTABLE_BASE_ID=app_your_base_id_here
```

## Step 2: Set Up Clerk Authentication (10 minutes)

### 2.1 Create Clerk Account
1. Go to https://clerk.com
2. Sign up for free account
3. Click "Create Application"
4. Choose authentication methods (Email, Google, etc.)

### 2.2 Get API Keys
1. In Clerk Dashboard, go to "API Keys"
2. Copy `Publishable Key` (starts with `pk_test_...`)
3. Copy `Secret Key` (starts with `sk_test_...`)

### 2.3 Add to Environment Variables
Add to `.env.local`:
```bash
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
```

## Step 3: Test Locally (10 minutes)

### 3.1 Start Development Server
```bash
npm run dev
```

### 3.2 Verify Setup
1. Visit `http://localhost:3000/api/health`
   - Should show `airtableReady: true` and `authReady: true`

2. Visit `http://localhost:3000/onboarding`
   - Fill out and submit the form
   - Should see success message

3. Visit `http://localhost:3000/app/leads`
   - Should redirect to Clerk sign-in
   - After signing in, should see your test lead

4. Verify Schema
   - Try creating an interaction via API
   - Should work without schema drift errors

## Step 4: Deploy to Production (30 minutes)

### Option A: Vercel (Recommended - Easiest)

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Deploy**
   ```bash
   vercel
   ```
   - Follow prompts
   - Choose defaults

3. **Set Environment Variables**
   - Go to Vercel Dashboard → Your Project → Settings → Environment Variables
   - Add all variables from `.env.local`:
     - `AIRTABLE_TOKEN`
     - `AIRTABLE_BASE_ID`
     - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
     - `CLERK_SECRET_KEY`
     - `NODE_ENV=production`

4. **Update Clerk Allowed Origins**
   - In Clerk Dashboard → Settings → Domains
   - Add your Vercel domain (e.g., `your-app.vercel.app`)

5. **Deploy Production**
   ```bash
   vercel --prod
   ```

6. **Update Airtable Webhook URL**
   - In Airtable → Extensions → Webhooks
   - Update notification URL to: `https://your-domain.vercel.app/api/airtable/webhooks/notify`

### Option B: Docker Production

1. **Build Image**
   ```bash
   docker build -t lattice-ai:latest .
   ```

2. **Run Container**
   ```bash
   docker run -d \
     -p 3000:3000 \
     -e AIRTABLE_TOKEN=pat_... \
     -e AIRTABLE_BASE_ID=app_... \
     -e NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_... \
     -e CLERK_SECRET_KEY=sk_... \
     -e NODE_ENV=production \
     --name lattice-ai \
     lattice-ai:latest
   ```

## Step 5: Configure Webhooks (15 minutes)

### 5.1 Set Up Airtable Webhook
1. In Airtable Base → Extensions → Webhooks
2. Click "Create a webhook"
3. Set notification URL: `https://your-domain.com/api/airtable/webhooks/notify`
4. Select tables to watch:
   - ✅ Interactions
   - ✅ Appointments
   - ✅ Leads
   - ✅ Automations
5. Save and copy the Webhook ID

### 5.2 Test Webhook
1. Create a test record in Airtable
2. Check server logs for webhook notification
3. Verify cursor is saved in `.cursor-state.json` (or your cursor storage)

## Verification Checklist

- [ ] Airtable base created with all tables
- [ ] Airtable token configured and working
- [ ] Clerk account created and keys configured
- [ ] Local testing: onboarding form works
- [ ] Local testing: leads appear in dashboard
- [ ] Local testing: authentication works
- [ ] Deployed to production
- [ ] Environment variables set in production
- [ ] Webhooks configured
- [ ] Production URL tested end-to-end

## Troubleshooting

### Schema Drift Error
- **Problem**: API returns 503 "Schema drift"
- **Solution**: Verify all tables and fields match `lib/schema.ts` exactly
- **Check**: Field names, types, and required flags must match

### Airtable Not Configured
- **Problem**: API returns 503 "Airtable not configured"
- **Solution**: Check `.env.local` has `AIRTABLE_TOKEN` and `AIRTABLE_BASE_ID`
- **Verify**: Token starts with `pat` and Base ID starts with `app`

### Clerk Authentication Not Working
- **Problem**: Redirects to `/setup` even with keys
- **Solution**: Verify keys start with `pk_` and `sk_` (not placeholders)
- **Check**: Keys are correct in `.env.local` and production environment

### Webhooks Not Working
- **Problem**: Webhook notifications not received
- **Solution**: Verify webhook URL is correct and publicly accessible
- **Check**: Server logs for webhook POST requests

## Next Steps After Setup

1. **Create Your First Business**
   - Add a record to `Businesses` table
   - Set timezone (e.g., "America/New_York")

2. **Test Full Flow**
   - Submit onboarding form → appears in Leads
   - Create interaction → appears in Interactions
   - Create appointment → appears in Calendar
   - Test automation rules

3. **Customize**
   - Update branding/colors
   - Customize automation rules
   - Set up prompt overrides

4. **Monitor**
   - Check `/api/health` regularly
   - Monitor error logs
   - Track webhook processing

## Support Resources

- **Airtable API Docs**: https://airtable.com/developers/web/api/introduction
- **Clerk Docs**: https://clerk.com/docs
- **Next.js Docs**: https://nextjs.org/docs
- **Project README**: See `README.md` for detailed documentation

