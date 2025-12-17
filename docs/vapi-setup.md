# VAPI Setup Guide

This guide walks you through setting up VAPI for inbound call handling with human handover.

## Prerequisites

- VAPI account (sign up at https://vapi.ai)
- Airtable base configured with all required tables
- Public URL for webhooks (use ngrok for local development, or your production domain)

## Step 1: Get VAPI Credentials

1. Go to https://vapi.ai and sign in
2. Navigate to **Settings** → **API Keys**
3. Create a new **Private API Key** (starts with `sk_`)
4. Copy the key to your `.env.local`:
   ```bash
   VAPI_PRIVATE_API_KEY=sk_your_key_here
   ```

## Step 2: Create VAPI Assistant

1. In VAPI Dashboard, go to **Assistants** → **Create Assistant**
2. Configure the assistant:
   - **Name**: "Lattice AI Assistant" (or your preferred name)
   - **Model**: Choose your preferred model (GPT-4, Claude, etc.)
   - **Voice**: Select a voice for the AI
   - **First Message**: Configure greeting message
   - **System Prompt**: Configure AI behavior

3. **Save the Assistant ID** (you'll need it for phone number configuration)

## Step 3: Configure Tools

VAPI tools allow the AI to interact with your backend. Add these tools in the VAPI Assistant configuration:

### Tool 1: getBusinessConfig
- **Name**: `getBusinessConfig`
- **Type**: Function
- **Description**: "Get business configuration including timezone, prompt overrides, and working hours"
- **URL**: `https://your-domain.com/api/vapi/tools/getBusinessConfig`
- **Method**: POST
- **Headers**: None (or add authentication if needed)
- **Parameters**:
  ```json
  {
    "toNumber": "string (optional)",
    "businessId": "string (optional)"
  }
  ```

### Tool 2: createOrUpdateLead
- **Name**: `createOrUpdateLead`
- **Type**: Function
- **Description**: "Create or update a lead record with caller information"
- **URL**: `https://your-domain.com/api/vapi/tools/createOrUpdateLead`
- **Method**: POST
- **Parameters**:
  ```json
  {
    "phone": "string (optional)",
    "email": "string (optional)",
    "name": "string (required)",
    "businessId": "string (optional)"
  }
  ```

### Tool 3: bookAppointment
- **Name**: `bookAppointment`
- **Type**: Function
- **Description**: "Book an appointment for a lead"
- **URL**: `https://your-domain.com/api/vapi/tools/bookAppointment`
- **Method**: POST
- **Parameters**:
  ```json
  {
    "businessId": "string (required)",
    "leadId": "string (optional)",
    "startUtc": "string (ISO 8601 datetime, required)",
    "endUtc": "string (ISO 8601 datetime, required)",
    "notes": "string (optional)",
    "skipConflictCheck": "boolean (optional)"
  }
  ```

### Tool 4: transferToHuman
- **Name**: `transferToHuman`
- **Type**: Function
- **Description**: "Get routing information for transferring call to a human agent"
- **URL**: `https://your-domain.com/api/vapi/tools/transferToHuman`
- **Method**: POST
- **Parameters**:
  ```json
  {
    "businessId": "string (optional)",
    "toNumber": "string (optional)",
    "reason": "string (optional: Scheduling issue, Pricing, Emergency, Complex request, Other)",
    "callId": "string (optional)"
  }
  ```

## Step 4: Configure Webhooks

In VAPI Assistant settings, configure webhooks:

### Webhook 1: Events
- **URL**: `https://your-domain.com/api/vapi/webhooks/events`
- **Events to subscribe**:
  - ✅ Call Start
  - ✅ Call End
  - ✅ Call Update
  - ✅ Transfer

### Webhook 2: Transcript
- **URL**: `https://your-domain.com/api/vapi/webhooks/transcript`
- **Events to subscribe**:
  - ✅ Transcript Chunk (if supported)
  - ✅ Final Transcript

### Webhook Smoke Test (Recommended)

After deployment (Vercel or production), verify the events webhook responds with 200:

```bash
curl -i -X POST "https://<YOUR_VERCEL_DOMAIN>/api/vapi/webhooks/events" \
  -H "Content-Type: application/json" \
  -d '{"type":"call-start","call":{"id":"test-call-1","from":"+10000000000","to":"+10000000001","direction":"inbound","status":"ringing"}}'
```

Expected:
- HTTP status: `200 OK`
- JSON body containing `{ "success": true, "requestId": "<uuid>" }`

For a lighter smoke test that just confirms the route exists:

```bash
curl -i "https://<YOUR_VERCEL_DOMAIN>/api/vapi/webhooks/events"
```

Expected:
- HTTP status: `200 OK`
- JSON: `{ "ok": true }`

## Step 5: Configure Phone Number

### Option A: VAPI-Managed Number (Recommended)

1. In VAPI Dashboard, go to **Phone Numbers** → **Buy Number**
2. Select a phone number (US, Canada, etc.)
3. Configure the number:
   - **Assistant**: Select your assistant created in Step 2
   - **Webhooks**: Already configured in Step 4
4. **Save the Phone Number ID** to `.env.local`:
   ```bash
   VAPI_PHONE_NUMBER_ID=your_phone_number_id
   ```

### Option B: Twilio Number (Advanced)

If you prefer to use your own Twilio number:

1. In Twilio Console, configure your number's webhook URL to point to VAPI
2. In VAPI, configure the number to use your Twilio credentials
3. Add to `.env.local`:
   ```bash
   TWILIO_ACCOUNT_SID=your_account_sid
   TWILIO_AUTH_TOKEN=your_auth_token
   TWILIO_PHONE_NUMBER=your_phone_number
   ```

## Step 6: Configure Transfer/Handoff

In your VAPI Assistant, configure the transfer behavior:

1. In Assistant settings, find **Transfer** or **Handoff** section
2. Configure transfer trigger:
   - Use the `transferToHuman` tool when AI determines handover is needed
   - Or configure automatic transfer rules (e.g., after X minutes, on specific keywords)
3. Set transfer destination:
   - The `transferToHuman` tool will return the destination number
   - VAPI will use this to transfer the call

## Step 7: Update Environment Variables

Add to `.env.local`:

```bash
# VAPI Configuration
VAPI_PRIVATE_API_KEY=sk_your_key_here
VAPI_ASSISTANT_ID=your_assistant_id
VAPI_PHONE_NUMBER_ID=your_phone_number_id

# Public Base URL (for webhook URLs)
PUBLIC_BASE_URL=https://your-domain.com

# Optional: Default escalation number
DEFAULT_ESCALATION_NUMBER=+1234567890
```

## Step 8: Local Development Setup

For local development, use ngrok to expose your local server:

1. Install ngrok: `brew install ngrok` (or download from ngrok.com)
2. Start your dev server: `npm run dev`
3. In another terminal, run: `ngrok http 3000`
4. Copy the ngrok URL (e.g., `https://abc123.ngrok.io`)
5. Update `PUBLIC_BASE_URL` in `.env.local`:
   ```bash
   PUBLIC_BASE_URL=https://abc123.ngrok.io
   ```
6. Update webhook URLs in VAPI Dashboard to use the ngrok URL

## Step 9: Test the Integration

1. **Test inbound call**:
   - Call your VAPI phone number
   - Verify the call is answered by the AI
   - Check Airtable Interactions table - should see a new record with:
     - Call ID
     - From Number
     - To Number
     - Status: "In Progress"

2. **Test transcript**:
   - Have a conversation with the AI
   - After call ends, check Interactions table
   - Verify Transcript field contains speaker-labeled transcript

3. **Test lead creation**:
   - During the call, have the AI use `createOrUpdateLead` tool
   - Check Airtable Leads table - should see new/updated lead

4. **Test appointment booking**:
   - During the call, have the AI use `bookAppointment` tool
   - Check Airtable Appointments table - should see new appointment

5. **Test transfer**:
   - Trigger a transfer scenario (e.g., ask for pricing)
   - Verify AI calls `transferToHuman` tool
   - Verify call is transferred to human
   - Check Interactions table - should show:
     - Transferred To Human: ✅
     - Transfer Destination: (phone number)
     - Transfer Reason: (selected reason)

## Troubleshooting

### Webhooks Not Receiving Events

1. **Check webhook URL**: Ensure it's publicly accessible (use ngrok for local)
2. **Check VAPI logs**: Go to VAPI Dashboard → Logs to see webhook delivery status
3. **Check server logs**: Look for incoming webhook requests
4. **Verify authentication**: If you added auth headers, ensure VAPI is configured correctly

### Transcript Not Appearing

1. **Check transcript webhook**: Verify it's configured and receiving events
2. **Check Call ID**: Ensure events webhook creates interaction with Call ID before transcript webhook
3. **Check Airtable**: Verify Interactions table has "Call ID" field

### Transfer Not Working

1. **Check transfer tool**: Verify `transferToHuman` returns valid destination
2. **Check business phone**: Ensure Business record has Phone field populated
3. **Check VAPI transfer config**: Verify transfer method is configured in VAPI Assistant

### Tools Not Being Called

1. **Check tool configuration**: Verify URLs are correct and publicly accessible
2. **Check tool definitions**: Ensure parameters match expected schema
3. **Check AI prompt**: Ensure system prompt instructs AI to use tools when appropriate

## Required Airtable Fields

Ensure your Interactions table has these fields (run `npm run airtable:drift` to verify):

- ✅ Call ID (Single line text)
- ✅ From Number (Phone number)
- ✅ To Number (Phone number)
- ✅ Transferred To Human (Checkbox)
- ✅ Transfer Destination (Single line text)
- ✅ Transfer Reason (Single select: Scheduling issue, Pricing, Emergency, Complex request, Other)

## Next Steps

1. **Customize AI behavior**: Update system prompt in VAPI Assistant
2. **Add more tools**: Extend with additional tools as needed
3. **Configure escalation rules**: Set up automatic transfer triggers
4. **Monitor calls**: Use VAPI Dashboard to monitor call quality and metrics
5. **Set up alerts**: Configure alerts for failed webhooks or errors

## Security Notes

- ✅ Webhook endpoints use rate limiting (200 req/min)
- ✅ Input validation and sanitization on all endpoints
- ✅ No secrets logged or exposed
- ✅ Schema validation prevents data drift

## Support

- VAPI Documentation: https://docs.vapi.ai
- VAPI Support: support@vapi.ai
- Project Issues: Check project README for support channels
