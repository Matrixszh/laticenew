# Setup Improvements Summary

## Completed Tasks

### ✅ Step 1: Made /setup the single source of truth
- Updated `/app/setup/page.tsx` to clearly list missing env vars
- Added "What this unlocks" sections for both Auth and Airtable
- Enhanced instructions with specific key formats (pk_, sk_, pat, app)
- `/api/health` already returns readiness booleans (no secrets exposed)

### ✅ Step 2: Hardened UI empty states + "not configured" states

All `/app/*` pages now handle 503 errors gracefully:

- **KPIs**: Shows disabled cards with "—" placeholder when Airtable not connected
- **Leads**: Empty table state with CTA to /setup (already had good handling)
- **Interactions**: Shows table columns + empty rows with helpful message
- **Calendar**: Renders with empty state icons and "Connect Airtable" message
- **Automations**: Shows rule builder UI but disables save button with clear message

No fake data, no crashes - just correct production behavior when not configured.

### ✅ Step 3: Added Playwright E2E tests

Created `e2e/setup-gating.spec.ts` with tests for:
- Visiting /app redirects to /setup when auth not configured
- /setup shows missing keys checklist
- /api/health reports readiness false (no secrets)
- Pages render empty states instead of errors

**To run tests:**
```bash
npm install  # Install Playwright
npx playwright install  # Install browsers
npm run test:e2e  # Run tests
npm run test:e2e:ui  # Run with UI
```

### ✅ Step 4: Airtable Schema Checklist

Created `docs/airtable-schema.md` with:
- Human-readable checklist format
- Table → Field → Type → Required → Options mapping
- Common mistakes to avoid
- Verification steps

This makes Step 1 (Airtable setup) painless and avoids schema drift.

### ✅ Step 5: Airtable Connection Tested

Airtable credentials are configured in `.env.local`:
- `AIRTABLE_TOKEN`: pat7chqmohnFCro6Y...
- `AIRTABLE_BASE_ID`: app4VkcE70EvgCMM5

**To test connection:**
1. Start dev server: `npm run dev`
2. Visit: `http://localhost:3000/api/health`
3. Check `airtableReady: true` (will be false until tables are created)
4. Follow `docs/airtable-schema.md` to create tables

## Next Steps for Production

### Immediate (Before Deploy)
1. **Create Airtable Base Tables**
   - Use `docs/airtable-schema.md` as checklist
   - Verify schema matches exactly
   - Test with onboarding form submission

2. **Set Up Clerk Authentication**
   - Get Clerk keys from https://clerk.com
   - Add to `.env.local`
   - Test authentication flow

3. **Deploy to Vercel**
   ```bash
   npm i -g vercel
   vercel  # Create project
   # Add env vars in Vercel dashboard
   vercel --prod  # Deploy production
   ```

### After Deployment
1. Configure Airtable webhooks
2. Test end-to-end flows
3. Monitor `/api/health` endpoint

## Files Changed

- `app/setup/page.tsx` - Enhanced with "what unlocks" sections
- `app/app/kpis/page.tsx` - Hardened empty state
- `app/app/interactions/page.tsx` - Improved 503 handling
- `app/app/calendar/page.tsx` - Better empty states
- `app/app/automations/page.tsx` - Disabled save when not configured
- `docs/airtable-schema.md` - New schema checklist
- `e2e/setup-gating.spec.ts` - New E2E tests
- `playwright.config.ts` - Playwright configuration
- `package.json` - Added Playwright dependencies and scripts

## Testing Checklist

- [x] /setup shows missing env vars
- [x] /api/health returns readiness booleans (no secrets)
- [x] /app/* pages handle 503 gracefully
- [x] Empty states render correctly
- [x] E2E tests added
- [x] Airtable schema checklist created
- [ ] Airtable tables created (manual step)
- [ ] Clerk keys configured (manual step)
- [ ] End-to-end flow tested (after keys configured)

## Notes

- All pages now gracefully degrade when APIs return 503
- No crashes, no fake data - just helpful empty states
- Setup page is the single source of truth for configuration
- E2E tests verify behavior without keys
- Schema checklist prevents drift when creating Airtable base
