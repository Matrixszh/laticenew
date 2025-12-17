/**
 * Create/update Airtable base schema to match `lib/schema.ts`.
 *
 * Run with:
 *   npx tsx scripts/setup-airtable-schema.ts
 *
 * Requires a PAT with schema write access to the base.
 * Suggested scopes:
 *   - schema.bases:read
 *   - schema.bases:write
 *   - data.records:read (optional)
 *   - data.records:write (optional)
 */

import * as dotenv from 'dotenv'
import { resolve } from 'path'
import { AIRTABLE_SCHEMA, type FieldDefinition, type FieldType } from '../lib/schema'

dotenv.config({ path: resolve(__dirname, '../.env.local') })

const AIRTABLE_TOKEN = process.env.AIRTABLE_TOKEN
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID

type AirtableMetaTable = {
  id: string
  name: string
  fields: Array<{ id: string; name: string; type: string }>
}

function metaUrl(path: string) {
  return `https://api.airtable.com/v0/meta${path}`
}

async function metaFetch<T>(path: string, init?: RequestInit): Promise<T> {
  if (!AIRTABLE_TOKEN) throw new Error('AIRTABLE_TOKEN is not set')
  const res = await fetch(metaUrl(path), {
    ...init,
    headers: {
      Authorization: `Bearer ${AIRTABLE_TOKEN}`,
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`Airtable Meta API ${res.status}: ${text || res.statusText}`)
  }
  return (await res.json()) as T
}

function mapFieldType(type: FieldType): { type: string } {
  // Airtable Meta API types are close to our internal schema types.
  // We keep it conservative and only map supported types.
  switch (type) {
    case 'singleLineText':
    case 'multilineText':
    case 'email':
    case 'url':
    case 'phoneNumber':
    case 'number':
    case 'percent':
    case 'currency':
    case 'singleSelect':
    case 'multipleSelects':
    case 'date':
    case 'dateTime':
    case 'checkbox':
    case 'rating':
    case 'multipleRecordLinks':
    case 'createdTime':
      return { type }
    default:
      // Fallback to singleLineText for unsupported types
      return { type: 'singleLineText' }
  }
}

function buildFieldPayload(
  field: FieldDefinition,
  tableNameToId: Map<string, string>
): Record<string, any> {
  const base: Record<string, any> = { name: field.name, ...mapFieldType(field.type) }

  // Attempt to mark required when supported.
  // If the API rejects it, we'll retry without it.
  if (field.required) {
    base.isRequired = true
  }

  // Airtable Meta API requires `options` for some field types even when defaults are fine.
  // Provide safe defaults to avoid INVALID_FIELD_TYPE_OPTIONS_FOR_CREATE.
  if (field.type === 'checkbox') {
    base.options = base.options || { icon: 'check', color: 'greenBright' }
  }
  if (field.type === 'rating') {
    base.options = base.options || { max: 5, icon: 'star', color: 'yellowBright' }
  }
  // For `date`/`dateTime`, Airtable requires options, but the allowed formats are strict.
  // Provide minimal options using only "name" (avoid specifying "format" which can be rejected).
  if (field.type === 'date') {
    base.options =
      base.options || {
        dateFormat: { name: 'local' },
      }
  }
  if (field.type === 'dateTime') {
    base.options =
      base.options || {
        dateFormat: { name: 'local' },
        timeFormat: { name: '12hour' },
        timeZone: 'client',
      }
  }
  if (field.type === 'singleSelect' || field.type === 'multipleSelects') {
    base.options = base.options || { choices: [] }
  }
  if (field.type === 'number' || field.type === 'percent') {
    base.options = base.options || { precision: 0 }
  }
  if (field.type === 'currency') {
    base.options = base.options || { precision: 2, symbol: '$' }
  }

  if (field.type === 'singleSelect' || field.type === 'multipleSelects') {
    base.options = base.options || {}
    if (field.options?.choices) {
      base.options.choices = field.options.choices.map((c) => ({
        name: c.name,
        ...(c.color ? { color: c.color } : {}),
      }))
    }
  }

  if (field.type === 'number' || field.type === 'percent') {
    if (typeof field.options?.precision === 'number') {
      base.options = base.options || {}
      base.options.precision = field.options.precision
    }
  }

  if (field.type === 'currency') {
    base.options = base.options || {}
    if (typeof field.options?.precision === 'number') base.options.precision = field.options.precision
    if (field.options?.symbol) base.options.symbol = field.options.symbol
  }

  if (field.type === 'multipleRecordLinks') {
    // Our schema uses this field type for links; figure out the linked table from comments
    // by convention: field name is "Business" -> links to "Businesses", "Lead" -> "Leads".
    const inferred =
      field.name === 'Business'
        ? 'Businesses'
        : field.name === 'Lead'
          ? 'Leads'
          : field.name === 'Users'
            ? 'Users'
            : field.name
    const linkedTableId = tableNameToId.get(inferred)
    if (linkedTableId) {
      base.options = base.options || {}
      base.options.linkedTableId = linkedTableId
    }
  }

  return base
}

async function listTables(): Promise<AirtableMetaTable[]> {
  if (!AIRTABLE_BASE_ID) throw new Error('AIRTABLE_BASE_ID is not set')
  const data = await metaFetch<{ tables: AirtableMetaTable[] }>(`/bases/${AIRTABLE_BASE_ID}/tables`)
  return data.tables
}

async function createTable(name: string) {
  if (!AIRTABLE_BASE_ID) throw new Error('AIRTABLE_BASE_ID is not set')

  // Create with a simple primary field. We intentionally do NOT use the schema's
  // first field because some tables start with a linked-record field (e.g. Interactions.Lead),
  // and Airtable requires extra options for link fields at creation time.
  const payload = {
    name,
    fields: [
      {
        name: 'Name',
        type: 'singleLineText',
      },
    ],
  }
  await metaFetch(`/bases/${AIRTABLE_BASE_ID}/tables`, { method: 'POST', body: JSON.stringify(payload) })
}

async function addField(tableId: string, fieldPayload: Record<string, any>) {
  if (!AIRTABLE_BASE_ID) throw new Error('AIRTABLE_BASE_ID is not set')
  const path = `/bases/${AIRTABLE_BASE_ID}/tables/${tableId}/fields`
  try {
    await metaFetch(path, { method: 'POST', body: JSON.stringify(fieldPayload) })
  } catch (e: any) {
    // If Airtable complains about missing options, apply defaults by type and retry once.
    const msg = e instanceof Error ? e.message : String(e)
    if (
      fieldPayload?.type &&
      msg.includes('INVALID_FIELD_TYPE_OPTIONS_FOR_CREATE') &&
      msg.includes('options is missing')
    ) {
      const patched = { ...fieldPayload }
      if (patched.type === 'checkbox') patched.options = patched.options || { icon: 'check', color: 'greenBright' }
      if (patched.type === 'rating') patched.options = patched.options || { max: 5, icon: 'star', color: 'yellowBright' }
      if (patched.type === 'date') patched.options = patched.options || { dateFormat: { name: 'local' } }
      if (patched.type === 'dateTime') {
        patched.options =
          patched.options || { dateFormat: { name: 'local' }, timeFormat: { name: '12hour' }, timeZone: 'client' }
      }
      if (patched.type === 'singleSelect' || patched.type === 'multipleSelects') {
        patched.options = patched.options || { choices: [] }
      }
      if (patched.type === 'number' || patched.type === 'percent') patched.options = patched.options || { precision: 0 }
      if (patched.type === 'currency') patched.options = patched.options || { precision: 2, symbol: '$' }
      await metaFetch(path, { method: 'POST', body: JSON.stringify(patched) })
      return
    }

    // Retry without "isRequired" (not supported for some field types or base plans).
    if (fieldPayload.isRequired) {
      const { isRequired, ...rest } = fieldPayload
      await metaFetch(path, { method: 'POST', body: JSON.stringify(rest) })
      return
    }
    throw e
  }
}

async function main() {
  if (!AIRTABLE_TOKEN) throw new Error('AIRTABLE_TOKEN is not set')
  if (!AIRTABLE_BASE_ID) throw new Error('AIRTABLE_BASE_ID is not set')

  console.log('Airtable schema setup starting...')
  console.log(`- Base: ${AIRTABLE_BASE_ID}`)
  console.log(`- Token: ${AIRTABLE_TOKEN.slice(0, 10)}...`)

  // 1) Ensure tables exist
  let tables = await listTables()
  const existingNames = new Set(tables.map((t) => t.name))
  for (const def of AIRTABLE_SCHEMA) {
    if (!existingNames.has(def.name)) {
      console.log(`Creating table: ${def.name}`)
      await createTable(def.name)
    }
  }

  // Refresh after any creations
  tables = await listTables()

  // 2) Build name->id map for link fields
  const tableNameToId = new Map(tables.map((t) => [t.name, t.id] as const))

  // 3) Ensure fields exist (two passes to allow linked tables to be created first)
  for (let pass = 1; pass <= 2; pass++) {
    for (const def of AIRTABLE_SCHEMA) {
      const table = tables.find((t) => t.name === def.name)
      if (!table) continue
      const existingFieldNames = new Set(table.fields.map((f) => f.name))

      for (const field of def.fields) {
        if (existingFieldNames.has(field.name)) continue

        // Airtable does not support creating `createdTime` fields via Meta API.
        // These are auto-managed system fields; skip and allow schema verification to report drift.
        if (field.type === 'createdTime') {
          continue
        }

        const payload = buildFieldPayload(field, tableNameToId)

        // Defer link fields until we can resolve the linked table id (pass 2)
        if (field.type === 'multipleRecordLinks') {
          const linkedTableId = payload?.options?.linkedTableId
          if (!linkedTableId && pass === 1) continue
        }

        console.log(`Adding field: ${def.name}.${field.name} (${field.type})`)
        await addField(table.id, payload)
      }
    }

    // Refresh fields list for next pass
    tables = await listTables()
  }

  console.log('✅ Airtable schema setup completed.')
  console.log('Note: Airtable may not allow programmatically enforcing some "required" constraints;')
  console.log('the app will still work, but /api/health may report some optional/required drift.')
}

main().catch((err) => {
  console.error('❌ Schema setup failed:')
  console.error(err instanceof Error ? err.message : String(err))
  process.exit(1)
})


