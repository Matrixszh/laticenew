/**
 * Seed Airtable with demo data so the UI has something to display.
 *
 * Run with:
 *   npm run airtable:seed
 *
 * Uses Data API (not Meta API). Requires:
 *   AIRTABLE_TOKEN, AIRTABLE_BASE_ID in .env.local
 */

import Airtable from 'airtable'
import * as dotenv from 'dotenv'
import { resolve } from 'path'

dotenv.config({ path: resolve(__dirname, '../.env.local') })

const AIRTABLE_TOKEN = process.env.AIRTABLE_TOKEN
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID

function must<T>(v: T | undefined | null, name: string): T {
  if (v === undefined || v === null || (typeof v === 'string' && v.trim() === '')) {
    throw new Error(`${name} is not set`)
  }
  return v as T
}

function iso(d: Date) {
  return d.toISOString()
}

async function firstOrNull(base: Airtable.Base, table: string) {
  const rows = await base(table).select({ maxRecords: 1 }).firstPage()
  return rows?.[0] ?? null
}

async function main() {
  const token = must(AIRTABLE_TOKEN, 'AIRTABLE_TOKEN')
  const baseId = must(AIRTABLE_BASE_ID, 'AIRTABLE_BASE_ID')

  const base = new Airtable({ apiKey: token }).base(baseId)

  console.log('Seeding Airtable demo data...')

  // 1) Businesses
  let business = await firstOrNull(base, 'Businesses')
  if (!business) {
    const created = await base('Businesses').create({
      Name: 'Orvexis (Demo)',
      Timezone: 'America/New_York',
      'Vapi Number': '+10000000000',
      Active: true,
      'Handover Enabled': false,
    })
    business = created as any
    console.log(`- Created business: ${created.id}`)
  } else {
    console.log(`- Using existing business: ${business.id}`)
  }
  const businessId = business.id as string

  // 2) Users (link the first user email we can find, or create a placeholder)
  const existingUsers = await base('Users').select({ maxRecords: 50 }).firstPage()
  const existing = existingUsers.find((u: any) => (u.fields?.Email || '').includes('@'))
  const userEmail = (existing?.fields?.Email as string | undefined) || 'demo@example.com'

  const usersForEmail = await base('Users')
    .select({ filterByFormula: `{Email} = "${userEmail.replace(/"/g, '\\"')}"`, maxRecords: 1 })
    .firstPage()
  if (usersForEmail.length === 0) {
    const created = await base('Users').create({
      Email: userEmail,
      Role: 'Admin',
      Business: [businessId],
    } as any) as any
    console.log(`- Created user: ${created.id} (${userEmail})`)
  } else {
    // Ensure it is linked to the demo business
    const u = usersForEmail[0] as any
    const currentBiz = Array.isArray(u.fields?.Business) ? u.fields.Business : []
    if (!currentBiz.includes(businessId)) {
      await base('Users').update(u.id, { Business: [businessId], Role: u.fields?.Role || 'Admin' } as any)
      console.log(`- Updated user link: ${u.id} -> business ${businessId}`)
    } else {
      console.log(`- Using existing user: ${u.id} (${userEmail})`)
    }
  }

  // 3) Leads
  const leadsExisting = await base('Leads')
    .select({ filterByFormula: `FIND("${businessId}", ARRAYJOIN({Business}))`, maxRecords: 5 })
    .firstPage()
  let leadIds: string[] = leadsExisting.map((r: any) => r.id)

  if (leadIds.length === 0) {
    const created = await base('Leads').create(
      [
        {
          fields: {
            Name: 'John Demo',
            Email: 'john.demo@example.com',
            Phone: '+15551234567',
            Status: 'New',
            Business: [businessId],
            Industry: 'Home Services',
            'Use Case': 'Inbound calls & booking',
            'Team Size': '1-5',
            'Expected Volume': '10-50 / week',
            'Onboarding Notes': 'Seeded record',
          },
        },
        {
          fields: {
            Name: 'Sarah Sample',
            Email: 'sarah.sample@example.com',
            Phone: '+15557654321',
            Status: 'Contacted',
            Business: [businessId],
            Industry: 'Healthcare',
            'Use Case': 'Lead triage',
            'Team Size': '6-20',
            'Expected Volume': '50-200 / week',
          },
        },
      ],
      { typecast: true }
    )
    leadIds = (created as any[]).map((r: any) => r.id)
    console.log(`- Created leads: ${leadIds.join(', ')}`)
  } else {
    console.log(`- Using existing leads: ${leadIds.join(', ')}`)
  }

  // 4) Interactions (calls/SMS)
  const existingInteractions = await base('Interactions')
    .select({ filterByFormula: `FIND("${businessId}", ARRAYJOIN({Business}))`, maxRecords: 1 })
    .firstPage()
  if (existingInteractions.length === 0 && leadIds.length > 0) {
    const now = new Date()
    const earlier = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    await base('Interactions').create(
      [
        {
          fields: {
            Lead: [leadIds[0]],
            Business: [businessId],
            Type: 'Call',
            Transcript: 'Customer called asking about pricing and availability.',
            'Start UTC': iso(earlier),
            'End UTC': iso(new Date(earlier.getTime() + 4 * 60 * 1000)),
            Duration: 240,
            Direction: 'Inbound',
            Status: 'Completed',
            Outcome: 'Qualified',
            'From Number': '+15551234567',
            'To Number': '+10000000000',
            'Transferred To Human': false,
          },
        },
        {
          fields: {
            Lead: [leadIds[1] || leadIds[0]],
            Business: [businessId],
            Type: 'SMS',
            Transcript: 'Follow-up text sent. Customer confirmed interest.',
            'Start UTC': iso(now),
            'End UTC': iso(new Date(now.getTime() + 30 * 1000)),
            Duration: 30,
            Direction: 'Outbound',
            Status: 'Completed',
            Outcome: 'Contacted',
            'From Number': '+10000000000',
            'To Number': '+15557654321',
            'Transferred To Human': false,
          },
        },
      ],
      { typecast: true }
    )
    console.log('- Created demo interactions')
  }

  // 5) Appointments
  const existingAppointments = await base('Appointments')
    .select({ filterByFormula: `FIND("${businessId}", ARRAYJOIN({Business}))`, maxRecords: 1 })
    .firstPage()
  if (existingAppointments.length === 0 && leadIds.length > 0) {
    const start = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000)
    const end = new Date(start.getTime() + 30 * 60 * 1000)
    await base('Appointments').create(
      {
        Lead: [leadIds[0]],
        Business: [businessId],
        'Start UTC': iso(start),
        'End UTC': iso(end),
        Status: 'CONFIRMED',
        Notes: 'Initial consultation (seeded)',
      } as any,
      { typecast: true }
    )
    console.log('- Created a demo appointment')
  }

  // 6) PromptOverrides
  const existingOverrides = await base('PromptOverrides')
    .select({ filterByFormula: `FIND("${businessId}", ARRAYJOIN({Business}))`, maxRecords: 1 })
    .firstPage()
  if (existingOverrides.length === 0) {
    await base('PromptOverrides').create(
      {
        Business: [businessId],
        Key: 'greeting',
        Value: 'Hi! Thanks for calling Orvexis. How can I help you today?',
        Active: true,
      } as any,
      { typecast: true }
    )
    console.log('- Created a demo prompt override')
  }

  // 7) Automations
  const existingAutomations = await base('Automations')
    .select({ filterByFormula: `FIND("${businessId}", ARRAYJOIN({Business}))`, maxRecords: 1 })
    .firstPage()
  if (existingAutomations.length === 0) {
    await base('Automations').create(
      {
        Business: [businessId],
        Name: 'Auto-follow-up on new leads',
        Trigger: 'Lead Created',
        Conditions: JSON.stringify([{ field: 'Status', op: 'equals', value: 'New' }]),
        Actions: JSON.stringify([{ type: 'sms', template: 'Thanks for reaching out—when would you like to book?' }]),
        Active: true,
      } as any,
      { typecast: true }
    )
    console.log('- Created a demo automation')
  }

  // 8) BusyBlocks
  const existingBusy = await base('BusyBlocks')
    .select({ filterByFormula: `FIND("${businessId}", ARRAYJOIN({Business}))`, maxRecords: 1 })
    .firstPage()
  if (existingBusy.length === 0) {
    const start = new Date(Date.now() + 24 * 60 * 60 * 1000)
    const end = new Date(start.getTime() + 60 * 60 * 1000)
    await base('BusyBlocks').create(
      {
        Business: [businessId],
        'Start UTC': iso(start),
        'End UTC': iso(end),
        Reason: 'Lunch (seeded)',
        Recurring: false,
      } as any,
      { typecast: true }
    )
    console.log('- Created a demo busy block')
  }

  console.log('✅ Seeding complete. Refresh your app pages (KPIs, Leads, Calendar).')
}

main().catch((err) => {
  console.error('❌ Seeding failed:')
  console.error(err instanceof Error ? err.message : String(err))
  process.exit(1)
})
