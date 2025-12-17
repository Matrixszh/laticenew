# Airtable Schema Checklist

This document provides a human-readable checklist for creating the Airtable base schema. Use this when setting up your Airtable base to avoid schema drift.

## Table: Businesses

| Field Name | Type | Required | Options/Notes |
|------------|------|----------|--------------|
| Name | Single line text | ✅ Yes | - |
| Timezone | Single line text | ✅ Yes | IANA timezone string (e.g., "America/New_York") |
| Phone | Phone number | ❌ No | - |
| Email | Email | ❌ No | - |
| Active | Checkbox | ❌ No | - |
| Vapi Number | Single line text | ✅ Yes | Inbound phone number in E.164 format (e.g., +15551234567) |
| Human Handover Number | Single line text | ❌ No | Destination number for human handover (E.164 format) |
| Handover Enabled | Checkbox | ❌ No | Enable/disable human handover |
| Handover Description | Long text | ❌ No | Notes about handover process or conditions |
| Hours JSON | Long text | ❌ No | JSON describing business hours (e.g., `{ "mon": [["09:00","17:00"]] }`) |
| Created | Created time | Auto | Auto-generated |

## Table: Onboarding

| Field Name | Type | Required | Options/Notes |
|------------|------|----------|--------------|
| Company Name | Single line text | ✅ Yes | - |
| Email | Email | ✅ Yes | - |
| Phone | Phone number | ❌ No | - |
| Industry | Single line text | ✅ Yes | - |
| Use Case | Single line text | ✅ Yes | - |
| Team Size | Single line text | ✅ Yes | - |
| Expected Volume | Single line text | ✅ Yes | - |
| Onboarding Notes | Long text | ❌ No | - |
| Status | Single select | ✅ Yes | Options: New, Contacted, Converted, Archived (default: New) |
| Created | Created time | Auto | Auto-generated |

### Status Field Options:
- New (blueLight2)
- Contacted (yellowLight2)
- Converted (greenLight2)
- Archived (grayLight2)

## Table: Leads

| Field Name | Type | Required | Options/Notes |
|------------|------|----------|--------------|
| Name | Single line text | ✅ Yes | - |
| Phone | Phone number | ❌ No | Used for upsert from Vapi (caller phone) |
| Email | Email | ❌ No | Optional secondary identifier for upsert |
| Status | Single select | ❌ No | Options: New, Contacted, Qualified, Closed, Lost |
| Business | Multiple record links | ❌ No | Link to Businesses table |
| Industry | Single line text | ❌ No | - |
| Use Case | Single line text | ❌ No | - |
| Team Size | Single line text | ❌ No | - |
| Expected Volume | Single line text | ❌ No | - |
| Onboarding Notes | Long text | ❌ No | - |
| Created | Created time | Auto | Auto-generated |

### Status Field Options:
- New (blueLight2)
- Contacted (yellowLight2)
- Qualified (greenLight2)
- Closed (greenDark1)
- Lost (redLight2)

## Table: Interactions

| Field Name | Type | Required | Options/Notes |
|------------|------|----------|--------------|
| Lead | Multiple record links | ❌ No | Link to Leads table |
| Business | Multiple record links | ❌ No | Link to Businesses table |
| Type | Single select | ❌ No | Options: Call, SMS, Email |
| Transcript | Long text | ✅ Yes | Speaker-labeled transcript (e.g., `AI: ...` / `Caller: ...`) |
| Start UTC | Date & time | ❌ No | Call start time in UTC |
| End UTC | Date & time | ❌ No | Call end time in UTC |
| Duration | Number | ❌ No | Duration in seconds |
| Direction | Single select | ❌ No | Options: Inbound, Outbound |
| Status | Single select | ❌ Yes | Options: ringing, in-progress, completed, failed, transferred, missed |
| Outcome | Single select | ❌ No | Options: booked, info, transferred, followup, spam, unknown |
| Call ID | Single line text | ✅ Yes | Unique Vapi call identifier |
| From Number | Single line text | ❌ No | Caller phone number (E.164) |
| To Number | Single line text | ❌ No | Called phone number (E.164) |
| Transferred To Human | Checkbox | ❌ No | Whether call was transferred to a human |
| Transfer Destination | Single line text | ❌ No | Phone number or identifier of human recipient |
| Transfer Status | Single select | ❌ No | Options: requested, success, failed |
| Created | Created time | Auto | Auto-generated |

### Type Field Options:
- Call (blueLight2)
- SMS (greenLight2)
- Email (purpleLight2)

### Direction Field Options:
- Inbound (blueLight2)
- Outbound (orangeLight2)

### Status Field Options:
- ringing (yellowLight2)
- in-progress (blueLight2)
- completed (greenLight2)
- failed (redLight2)
- transferred (purpleLight2)
- missed (redLight2)

### Outcome Field Options:
- booked (greenLight2)
- info (blueLight2)
- transferred (purpleLight2)
- followup (yellowLight2)
- spam (redLight2)
- unknown (grayLight2)

## Table: Appointments

| Field Name | Type | Required | Options/Notes |
|------------|------|----------|--------------|
| Lead | Multiple record links | ❌ No | Link to Leads table |
| Business | Multiple record links | ✅ Yes | Link to Businesses table |
| Start UTC | Date & time | ✅ Yes | ISO 8601 format |
| End UTC | Date & time | ✅ Yes | ISO 8601 format |
| Status | Single select | ✅ Yes | Options: HOLD, CONFIRMED, CANCELLED, COMPLETED |
| Notes | Long text | ❌ No | - |
| Created | Created time | Auto | Auto-generated |

### Status Field Options:
- HOLD (yellowLight2)
- CONFIRMED (greenLight2)
- CANCELLED (redLight2)
- COMPLETED ( blueLight2)

## Table: PromptOverrides

| Field Name | Type | Required | Options/Notes |
|------------|------|----------|--------------|
| Business | Multiple record links | ✅ Yes | Link to Businesses table |
| Key | Single line text | ✅ Yes | - |
| Value | Long text | ✅ Yes | - |
| Active | Checkbox | ❌ No | - |
| Created | Created time | Auto | Auto-generated |

## Table: Automations

| Field Name | Type | Required | Options/Notes |
|------------|------|----------|--------------|
| Business | Multiple record links | ✅ Yes | Link to Businesses table |
| Name | Single line text | ✅ Yes | Human-readable name for the automation |
| Trigger | Single select | ✅ Yes | Options: Lead Created, Lead Status Changed, Interaction Completed |
| Conditions | Long text | ❌ No | JSON describing conditions |
| Actions | Long text | ✅ Yes | JSON describing actions to take |
| Active | Checkbox | ❌ No | Whether the automation is enabled |
| Created | Created time | Auto | Auto-generated |

## Table: BusyBlocks

| Field Name | Type | Required | Options/Notes |
|------------|------|----------|--------------|
| Business | Multiple record links | ✅ Yes | Link to Businesses table |
| Start UTC | Date & time | ✅ Yes | Start of busy period (UTC) |
| End UTC | Date & time | ✅ Yes | End of busy period (UTC) |
| Reason | Single line text | ❌ No | Reason for unavailability |
| Recurring | Checkbox | ❌ No | Whether this block recurs |
| Created | Created time | Auto | Auto-generated |

## Table: Users

| Field Name | Type | Required | Options/Notes |
|------------|------|----------|--------------|
| Email | Single line text | ✅ Yes | Clerk user email |
| Role | Single select | ✅ Yes | Options: Owner, Staff, Admin |
| Business | Multiple record links | ✅ Yes | Link to Businesses |
| Created | Created time | Auto | Auto-generated |
