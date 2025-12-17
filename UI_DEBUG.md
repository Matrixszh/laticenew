# UI Debugging Guide

## Current Status

The onboarding page should be working. Here's what to check:

## Quick Checks

1. **Open Browser Console** (F12 or Cmd+Option+I)
   - Look for JavaScript errors (red messages)
   - Check Network tab for failed requests

2. **Test Form Submission**
   - Fill out all required fields
   - Click through all steps
   - Submit the form
   - Check if success message appears

3. **Check API Response**
   ```bash
   curl -X POST http://localhost:3000/api/onboarding \
     -H "Content-Type: application/json" \
     -d '{"companyName":"Test","email":"test@test.com","industry":"healthcare","useCase":"appointments","teamSize":"1-5","expectedVolume":"<10"}'
   ```

## Common Issues Fixed

✅ **API Error Handling**
- Now gracefully handles missing Airtable tables
- Won't fail if Onboarding table doesn't exist yet
- Falls back to Leads table only

✅ **Form Validation**
- All required fields marked with red asterisks
- Step-by-step validation
- Clear error messages

✅ **Animation Resilience**
- AnimatedSection has fallback if IntersectionObserver fails
- Content will show even if animations don't work

## If UI Still Fails

1. **Clear Browser Cache**
   - Hard refresh: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)

2. **Check Server Logs**
   - Look at terminal where `npm run dev` is running
   - Check for error messages

3. **Test in Incognito/Private Mode**
   - Rules out browser extension issues

4. **Check Network Tab**
   - See if API requests are failing
   - Check response status codes

## Specific Error Messages to Look For

- **"Could not find table"** → Airtable table doesn't exist (expected if not created yet)
- **"Validation failed"** → Missing required fields
- **"Internal server error"** → Check server logs
- **CORS errors** → Check middleware configuration

## Next Steps

If you see a specific error message, share it and I can fix it directly.
