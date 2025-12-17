/**
 * Airtable Schema Verification
 * Fetches the actual Airtable base schema and compares it to the expected schema.
 * If there's a mismatch, logs errors and can block write operations.
 */

import { AIRTABLE_SCHEMA, type FieldDefinition, type FieldType } from '../schema'

export interface SchemaMismatch {
  table: string
  issue: 'missing_table' | 'missing_field' | 'type_mismatch' | 'required_mismatch' | 'extra_field'
  field?: string
  expected?: string
  actual?: string
}

export interface SchemaVerificationResult {
  valid: boolean
  mismatches: SchemaMismatch[]
  errors: string[]
}

export class SchemaDriftError extends Error {
  status = 503
  mismatches: SchemaMismatch[]
  errors: string[]

  constructor(message: string, mismatches: SchemaMismatch[], errors: string[]) {
    super(message)
    this.name = 'SchemaDriftError'
    this.mismatches = mismatches
    this.errors = errors
  }
}

/**
 * Map Airtable API field types to our schema types
 */
function mapAirtableType(airtableType: string): FieldType {
  const typeMap: Record<string, FieldType> = {
    singleLineText: 'singleLineText',
    multilineText: 'multilineText',
    email: 'email',
    url: 'url',
    phoneNumber: 'phoneNumber',
    number: 'number',
    percent: 'percent',
    currency: 'currency',
    singleSelect: 'singleSelect',
    multipleSelects: 'multipleSelects',
    date: 'date',
    dateTime: 'dateTime',
    checkbox: 'checkbox',
    rating: 'rating',
    multipleRecordLinks: 'multipleRecordLinks',
    singleCollaborator: 'singleCollaborator',
    multipleCollaborators: 'multipleCollaborators',
    formula: 'formula',
    rollup: 'rollup',
    count: 'count',
    multipleAttachments: 'multipleAttachments',
    barcode: 'barcode',
    button: 'button',
    createdBy: 'createdBy',
    createdTime: 'createdTime',
    lastModifiedBy: 'lastModifiedBy',
    lastModifiedTime: 'lastModifiedTime',
    externalSyncSource: 'externalSyncSource',
  }

  return (typeMap[airtableType] || 'singleLineText') as FieldType
}

/**
 * Verify the Airtable base schema matches our expected schema
 */
export async function verifySchema(): Promise<SchemaVerificationResult> {
  const mismatches: SchemaMismatch[] = []
  const errors: string[] = []

  try {
    if (!process.env.AIRTABLE_BASE_ID || !process.env.AIRTABLE_TOKEN) {
      const missing = [
        !process.env.AIRTABLE_BASE_ID ? 'AIRTABLE_BASE_ID' : null,
        !process.env.AIRTABLE_TOKEN ? 'AIRTABLE_TOKEN' : null,
      ].filter(Boolean)
      const message = `Missing required environment variables: ${missing.join(', ')}`
      errors.push(message)
      console.error('Schema verification error:', message)
      return { valid: false, mismatches, errors }
    }

    // Fetch actual schema from Airtable with timeout
    const baseId = process.env.AIRTABLE_BASE_ID!
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 4000) // 4 second timeout

    const response = await fetch(
      `https://api.airtable.com/v0/meta/bases/${baseId}/tables`,
      {
        headers: {
          Authorization: `Bearer ${process.env.AIRTABLE_TOKEN}`,
        },
        signal: controller.signal,
      }
    )
    clearTimeout(timeoutId)

    if (!response.ok) {
      const errorText = await response.text()
      errors.push(`Failed to fetch Airtable schema: ${response.status} ${errorText}`)
      console.error('Schema verification error:', `${response.status} ${errorText}`)
      return { valid: false, mismatches, errors }
    }

    const data = await response.json()
    const actualTables = data.tables || []

    // Check each expected table exists
    for (const expectedTable of AIRTABLE_SCHEMA) {
      const actualTable = actualTables.find(
        (t: any) => t.name === expectedTable.name
      )

      if (!actualTable) {
        mismatches.push({
          table: expectedTable.name,
          issue: 'missing_table',
        })
        continue
      }

      const actualFields = actualTable.fields || []
      const expectedFields = expectedTable.fields

      // Check each expected field
      for (const expectedField of expectedFields) {
        const actualField = actualFields.find(
          (f: any) => f.name === expectedField.name
        )

        if (!actualField) {
          mismatches.push({
            table: expectedTable.name,
            issue: 'missing_field',
            field: expectedField.name,
            expected: expectedField.type,
          })
          continue
        }

        const actualType = mapAirtableType(actualField.type)
        if (actualType !== expectedField.type) {
          mismatches.push({
            table: expectedTable.name,
            issue: 'type_mismatch',
            field: expectedField.name,
            expected: expectedField.type,
            actual: actualType,
          })
        }

        // Check required status (Airtable doesn't have a direct required flag,
        // but we can check if it's in the requiredFields array)
        const isRequiredInAirtable = actualTable.requiredFields?.some(
          (rf: any) => rf.id === actualField.id
        )
        if (expectedField.required && !isRequiredInAirtable) {
          mismatches.push({
            table: expectedTable.name,
            issue: 'required_mismatch',
            field: expectedField.name,
            expected: 'required',
            actual: 'optional',
          })
        }
      }

      // Detect unexpected/extra fields present in Airtable but not in our schema
      for (const actualField of actualFields) {
        const expectedField = expectedFields.find((f) => f.name === actualField.name)
        if (!expectedField) {
          mismatches.push({
            table: expectedTable.name,
            issue: 'extra_field',
            field: actualField.name,
          })
        }
      }
    }

    // Log mismatches
    if (mismatches.length > 0) {
      console.error('Schema mismatches detected:')
      for (const mismatch of mismatches) {
        const message = formatMismatchMessage(mismatch)
        console.error(`  - ${message}`)
        errors.push(message)
      }
    }

    return {
      valid: mismatches.length === 0,
      mismatches,
      errors,
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    errors.push(`Schema verification failed: ${errorMessage}`)
    console.error('Schema verification error:', error)
    return { valid: false, mismatches, errors }
  }
}

function formatMismatchMessage(mismatch: SchemaMismatch): string {
  switch (mismatch.issue) {
    case 'missing_table':
      return `Table "${mismatch.table}" is missing in Airtable`
    case 'missing_field':
      return `Field "${mismatch.field}" is missing in table "${mismatch.table}"`
    case 'type_mismatch':
      return `Field "${mismatch.field}" in table "${mismatch.table}" has type "${mismatch.actual}" but expected "${mismatch.expected}"`
    case 'required_mismatch':
      return `Field "${mismatch.field}" in table "${mismatch.table}" is ${mismatch.actual} but expected to be ${mismatch.expected}`
    case 'extra_field':
      return `Table "${mismatch.table}" has unexpected field "${mismatch.field}"`
    default:
      return `Unknown issue in table "${mismatch.table}"`
  }
}

/**
 * Check if schema is valid and throw if not (for use in API routes)
 */
export async function assertSchemaValid(): Promise<void> {
  const result = await verifySchema()
  if (!result.valid) {
    const message = result.errors.length > 0 ? result.errors.join('; ') : 'Schema drift'
    throw new SchemaDriftError(message, result.mismatches, result.errors)
  }
}
