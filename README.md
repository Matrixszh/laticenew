# Lattice AI Platform

AI Triage + Booking + Human Handover platform built with Next.js 14.2.35.

## Architecture

- **Frontend**: Next.js 14 App Router with Clerk authentication
- **Backend**: Next.js API routes
- **Database**: Airtable (system of record)
- **Calendar**: Airtable Appointments table (Google Calendar sync via Airtable Automations)
- **Webhooks**: Airtable webhooks with cursor-based idempotent processing

## Development

### Prerequisites

- Node.js >= 20.9 (Node 24 LTS recommended)
- Docker (for containerized development)
- Airtable account with base configured
- Clerk account for authentication

### Local Development

1. Install dependencies:
```bash
npm ci
```

2. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your credentials
```

3. Run development server:
```bash
npm run dev
```

4. Access the app at `http://localhost:3000`

### Docker Development

1. Build and start containers:
```bash
docker-compose up
```

2. Access the app at `http://localhost:3000`

### DevContainer

1. Open in VS Code
2. Reopen in Container (Command Palette: "Dev Containers: Reopen in Container")
3. The container will automatically install dependencies
4. Run `npm run dev` inside the container

## Environment Variables

See `.env.example` for required environment variables:

- `AIRTABLE_TOKEN`: Airtable Personal Access Token
- `AIRTABLE_BASE_ID`: Your Airtable base ID
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`: Clerk publishable key
- `CLERK_SECRET_KEY`: Clerk secret key

## Airtable Schema

The platform expects the following tables in Airtable:

- **Businesses**: Business profiles with timezone
- **Leads**: Lead management
- **Interactions**: Call/SMS/Email interactions with transcripts
- **Appointments**: Calendar appointments (UTC timestamps)
- **PromptOverrides**: Custom prompt overrides per business
- **Automations**: Automation rules
- **BusyBlocks**: (Optional) Blocked time slots

See `lib/schema.ts` for the complete schema definition.

## API Routes

### Core Routes
- `GET /api/business-config?businessId=...` - Get business configuration
- `POST /api/interactions` - Create interaction with transcript
- `POST /api/appointments` - Create appointment with conflict checking

### Webhooks
- `POST /api/airtable/webhooks/notify` - Receive webhook notifications
- `GET /api/airtable/webhooks/pull?webhookId=...` - Pull webhook payloads

## Dashboard

Protected routes under `/app`:
- `/app/kpis` - KPIs dashboard
- `/app/automations` - Lead automation management
- `/app/interactions` - Interactions table with CSV export
- `/app/calendar` - Calendar view and prompt overrides
- `/app/settings` - User settings

## Testing

```bash
npm test
```

Integration tests are included for:
- Schema verification
- Appointment conflict checking

## Schema Verification

The platform includes schema verification to prevent drift. Write operations will return 503 if schema mismatches are detected. Run schema verification:

```typescript
import { verifySchema } from '@/lib/airtable/schema-verify'
const result = await verifySchema()
```

All write API routes guard on `requireValidSchema()` and will return `{ error: 'Schema drift', requestId }` with details. Fix the Airtable base to match `lib/schema.ts` before retrying writes.

## Logging and Webhook Cursoring

- Every API route logs a `requestId` (and `businessId` where relevant) for tracing. Responses include the same `requestId` so you can correlate logs.
- Airtable webhook notify/pull endpoints persist cursors and processed payload markers to `.cursor-state.json` (git-ignored). Delete it to reset local cursor state.

## Known Limitations

1. Cursor persistence uses file-based storage (`.cursor-state.json`). For production, consider upgrading to Airtable or a database.
2. Client-side Airtable calls are proxied through API routes for security.
3. Timezone conversion is handled at display time; all storage is UTC.
4. Appointment conflict checking uses Airtable formula filters (may need optimization for large datasets).
