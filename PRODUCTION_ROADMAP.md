# PRODUCTION_ROADMAP

## What We Have Today (Baseline)

- ✅ Next.js 14.2.35 with TypeScript and Tailwind CSS
- ✅ Airtable as system-of-record (Businesses, Leads, Interactions, Appointments, PromptOverrides, BusyBlocks)
- ✅ Clerk authentication and /app gating
- ✅ Setup wizard (`/setup`) with env var checks and schema verification
- ✅ KPI dashboard (`/app/kpis`)
- ✅ Leads dashboard with inline status editing and linked counts
- ✅ Interactions list with transcript viewer and date filters
- ✅ Calendar view with business timezone support and conflict-aware appointments
- ✅ Automations CRUD (stored in Airtable)
- ✅ Airtable webhooks (notify + pull) with idempotent cursor tracking
- ✅ Vapi webhooks & tools (inbound call + transcript + basic handover support)
- ✅ Security hardening: rate limiting, security headers, input sanitization
- ✅ Unit tests for KPIs, timezone conversion, appointment conflicts, Vapi webhooks

## Week 1: Production-Ready Foundation

### 1. Airtable Schema Hardening ✅
- [x] Define and enforce schema for all tables via `lib/schema.ts` and `scripts/airtable-drift-report.ts`
- [x] Add `Onboarding`, `BusyBlocks`, and extended `Interactions` fields (Call ID, From/To Number, Transcript, Status, etc.)
- [x] Add Business Timezone and Handover-related fields (Vapi Number, Human Handover Number, Hours JSON)
- [x] Ensure `Leads` have Phone + Business link and consistent Status values

### 2. Setup Gating & Observability ✅
- [x] `/setup` page with:
  - Env var checklist (Airtable, Clerk, Vapi)
  - Schema drift status and top 3 missing fields
  - Clear instructions for local + Vercel setup
  - Vapi Server URL warning (must use `/api/vapi/webhooks/events`, not `/`)
- [x] `/api/health` with:
  - `airtableReady`, `schemaOk`, `schemaErrors`

### 3. Core Product Flows ✅
- [x] Public marketing & onboarding (`/`, `/onboarding`, `/pricing`)
- [x] Admin dashboard (`/app`) with:
  - **Leads**: list, search, inline status updates, business linkage, interaction/appointment counts
  - **Interactions**: timeline view, filters by date, type, and status; transcript viewer
  - **Calendar**: appointments + busy blocks in business timezone, conflict detection, HOLD → CONFIRMED flow
  - **Automations**: basic rule builder stored in Airtable

### 4. Security & Reliability ✅
- [x] Rate limiting for API routes (API, write, webhook tiers)
- [x] Security headers (CSP, HSTS, X-Frame-Options, X-Content-Type-Options)
- [x] Input sanitization for user-provided fields (notes, emails, URLs)
- [x] Idempotent Airtable webhook processing via `.cursor-state.json`

## Week 2: Multi-Tenant Vapi Voice Integration (Current Focus)

### 5. Vapi Webhooks (Inbound Call + Transcript) 🔄
- [x] Implement `POST /api/vapi/webhooks/events` (no 405s, idempotent)
- [x] Implement `POST /api/vapi/webhooks/transcript` with speaker-labeled transcripts
- [x] Add `GET` handlers returning `{ ok: true }` for smoke testing
- [ ] Harden payload parsing for multiple Vapi event shapes
- [ ] Add full idempotency keyed by `(callId, eventType, timestamp)`
- [ ] Route tenants by `call.to` → `Businesses.Vapi Number`

### 6. Vapi Tools (Single Function Endpoint) 🔄
- [ ] `POST /api/vapi/tools/function_tool` with actions:
  - `getBusinessConfig` (resolve Business by toNumber, return timezone, prompt overrides, handover config)
  - `upsertLead` (by phone/email + Business)
  - `createAppointmentHold` (with conflict checking via `checkAppointmentConflicts`)
  - `confirmAppointment` (HOLD → CONFIRMED)
  - `setOutcome` (update Interaction outcome)
  - `requestHandover` (mark Interaction, return `Human Handover Number`)
- [ ] Zod schemas for each action; ensure all paths return `{ success: true/false, data?, error?, requestId }`

### 7. UI Enhancements for Voice Flows 🔄
- [ ] **Interactions**: show From/To, Status (ringing/in-progress/completed/failed/transferred/missed), Outcome, Transfer Status
- [ ] **KPIs**: ensure metrics are computed from real Interactions/Leads:
  - Incoming calls = Interactions with `Type = Call` in date range
  - Leads contacted = Leads with ≥1 Interaction in date range
  - Leads closed = Leads with `Status = Closed` in date range
- [ ] **Calendar**: display appointments in business timezone with clear HOLD/CONFIRMED badges

### 8. Authentication & Webhook Security 🔄
- [x] Optional `VAPI_WEBHOOK_SECRET` HMAC verification for Vapi webhooks
- [ ] Add `VAPI_WEBHOOK_BEARER` support (Authorization: Bearer ...)
- [ ] Ensure all webhook responses are 2xx for non-fatal issues (to avoid dropped calls)

## Week 3: Hardening & Observability

### 9. Error Handling & Monitoring
- [ ] Add structured logging for Vapi events (requestId, callId, toNumber, businessId, eventType)
- [ ] Add dead-letter handling for failed webhooks (file or Airtable table)
- [ ] Integrate Sentry or similar error tracking
- [ ] Add health checks for Vercel deployment & Airtable connectivity

### 10. Performance & Scale
- [ ] Move webhook idempotency store from `.cursor-state.json` to a durable store (Airtable, Redis, or database)
- [ ] Optimize Airtable queries with views and filters for high-volume accounts
- [ ] Add pagination and lazy loading for large Interactions/Leads/Calendar views

## Week 4+: Advanced Features (Future)

### 11. Advanced Voice Features
- [ ] Dynamic multi-destination handover logic (skills-based routing, schedules)
- [ ] Agent assist: real-time transcript streaming to a supervisor dashboard
- [ ] Call recording ingestion and storage via Vapi/Vercel storage
- [ ] Post-call summaries saved to Interactions (LLM-generated)

### 12. Analytics & Reporting
- [ ] Advanced KPIs (AHT, abandonment, first-contact resolution)
- [ ] Funnels: lead → contact → opportunity → closed
- [ ] Scheduled reports and exports

### 13. Operational Tooling
- [ ] Admin UI for managing Vapi numbers, handover routes, and schedules
- [ ] Self-service onboarding wizard for new Businesses
- [ ] Role-based access control (admin vs agent vs viewer)

---

The current focus is on **Part A–F of the Vapi multi-tenant integration**: finishing schema updates, hardening Vapi webhooks and tools, wiring multi-tenant routing, and surfacing voice data in the dashboard, all while keeping Next.js pinned and avoiding direct PSTN/Google Calendar integrations.
