#!/usr/bin/env node
/**
 * Airtable Schema Drift Report
 * Compares actual Airtable base schema to lib/schema.ts
 * Outputs actionable checklist for manual field setup in Airtable UI
 */

import { config } from 'dotenv'
import { resolve } from 'path'

// Load .env.local explicitly (Next.js convention)
config({ path: resolve(process.cwd(), '.env.local') })
// Also try .env as fallback
config({ path: resolve(process.cwd(), '.env') })
import { AIRTABLE_SCHEMA, type FieldDefinition, type FieldType } from '../lib/schema'

// Map Airtable API field types to our schema types
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

// Map our schema types to Airtable UI field type names
function getAirtableUITypeName(type: FieldType): string {
  const uiTypeMap: Record<FieldType, string> = {
    singleLineText: 'Single line text',
    multilineText: 'Long text',
    email: 'Email',
    url: 'URL',
    phoneNumber: 'Phone number',
    number: 'Number',
    percent: 'Percent',
    currency: 'Currency',
    singleSelect: 'Single select',
    multipleSelects: 'Multiple select',
    date: 'Date',
    dateTime: 'Date & time',
    checkbox: 'Checkbox',
    rating: 'Rating',
    multipleRecordLinks: 'Link to another record',
    singleCollaborator: 'Collaborator',
    multipleCollaborators: 'Multiple collaborators',
    formula: 'Formula',
    rollup: 'Rollup',
    count: 'Count',
    multipleAttachments: 'Attachment',
    barcode: 'Barcode',
    button: 'Button',
    createdBy: 'Created by',
    createdTime: 'Created time',
    lastModifiedBy: 'Last modified by',
    lastModifiedTime: 'Last modified time',
    externalSyncSource: 'External sync source',
  }

  return uiTypeMap[type] || type
}

interface SchemaMismatch {
  table: string
  issue: 'missing_table' | 'missing_field' | 'type_mismatch' | 'required_mismatch' | 'extra_field' | 'select_option_mismatch'
  field?: string
  expected?: string
  actual?: string
  selectOptions?: { expected: string[]; actual: string[] }
}

async function fetchAirtableSchema(): Promise<any> {
  const baseId = process.env.AIRTABLE_BASE_ID
  const token = process.env.AIRTABLE_TOKEN

  if (!baseId || !token) {
    throw new Error('AIRTABLE_BASE_ID and AIRTABLE_TOKEN must be set')
  }

  const response = await fetch(`https://api.airtable.com/v0/meta/bases/${baseId}/tables`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Failed to fetch Airtable schema: ${response.status} ${errorText}`)
  }

  return response.json()
}

function compareSchemas(actualTables: any[]): SchemaMismatch[] {
  const mismatches: SchemaMismatch[] = []

  // Order tables as specified
  const tableOrder = [
    'Businesses',
    'Onboarding',
    'Leads',
    'Interactions',
    'Appointments',
    'PromptOverrides',
    'Automations',
    'BusyBlocks',
  ]

  const orderedExpectedTables = tableOrder
    .map((name) => AIRTABLE_SCHEMA.find((t) => t.name === name))
    .filter(Boolean) as typeof AIRTABLE_SCHEMA

  for (const expectedTable of orderedExpectedTables) {
    const actualTable = actualTables.find((t: any) => t.name === expectedTable.name)

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
      // Skip auto-generated fields - Airtable creates these automatically
      if (expectedField.type === 'createdTime' || expectedField.type === 'lastModifiedTime' || 
          expectedField.type === 'createdBy' || expectedField.type === 'lastModifiedBy') {
        continue
      }

      const actualField = actualFields.find((f: any) => f.name === expectedField.name)

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

      // Check required status
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

      // Check single select options
      if (expectedField.type === 'singleSelect' && actualField.type === 'singleSelect') {
        const expectedOptions = expectedField.options?.choices?.map((c) => c.name) || []
        const actualOptions = actualField.options?.choices?.map((c: any) => c.name) || []

        if (expectedOptions.length > 0) {
          const missingOptions = expectedOptions.filter((opt: string) => !actualOptions.includes(opt))
          const extraOptions = actualOptions.filter((opt: string) => !expectedOptions.includes(opt))

          if (missingOptions.length > 0 || extraOptions.length > 0) {
            mismatches.push({
              table: expectedTable.name,
              issue: 'select_option_mismatch',
              field: expectedField.name,
              selectOptions: {
                expected: expectedOptions,
                actual: actualOptions,
              },
            })
          }
        }
      }
    }

    // Detect unexpected/extra fields
    for (const actualField of actualFields) {
      // Skip auto-generated fields
      if (['createdTime', 'lastModifiedTime', 'createdBy', 'lastModifiedBy'].includes(actualField.type)) {
        continue
      }

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

  return mismatches
}

function printDriftReport(mismatches: SchemaMismatch[]): void {
  if (mismatches.length === 0) {
    console.log('✅ Schema is complete! All tables and fields match lib/schema.ts\n')
    process.exit(0)
  }

  console.log('⚠️  Schema Drift Detected\n')
  console.log('=' .repeat(80))
  console.log('DO THIS IN AIRTABLE UI:\n')

  // Group by table
  const byTable = new Map<string, SchemaMismatch[]>()
  for (const mismatch of mismatches) {
    if (!byTable.has(mismatch.table)) {
      byTable.set(mismatch.table, [])
    }
    byTable.get(mismatch.table)!.push(mismatch)
  }

  // Print in order
  const tableOrder = [
    'Businesses',
    'Onboarding',
    'Leads',
    'Interactions',
    'Appointments',
    'PromptOverrides',
    'Automations',
    'BusyBlocks',
  ]

  for (const tableName of tableOrder) {
    const tableMismatches = byTable.get(tableName)
    if (!tableMismatches || tableMismatches.length === 0) continue

    console.log(`\n📋 Table: ${tableName}`)
    console.log('-'.repeat(80))

    // Missing table
    const missingTable = tableMismatches.find((m) => m.issue === 'missing_table')
    if (missingTable) {
      console.log('❌ MISSING TABLE')
      console.log(`   → Create table "${tableName}" in Airtable`)
      continue
    }

    // Group by issue type
    const missingFields = tableMismatches.filter((m) => m.issue === 'missing_field')
    const typeMismatches = tableMismatches.filter((m) => m.issue === 'type_mismatch')
    const requiredMismatches = tableMismatches.filter((m) => m.issue === 'required_mismatch')
    const selectMismatches = tableMismatches.filter((m) => m.issue === 'select_option_mismatch')
    const extraFields = tableMismatches.filter((m) => m.issue === 'extra_field')

    // Missing fields
    if (missingFields.length > 0) {
      console.log('\n❌ Missing Fields:')
      for (const m of missingFields) {
        const expectedField = AIRTABLE_SCHEMA.find((t) => t.name === tableName)?.fields.find(
          (f) => f.name === m.field
        )
        if (expectedField) {
          const uiType = getAirtableUITypeName(expectedField.type)
          console.log(`   → Add field "${m.field}"`)
          console.log(`     Type: ${uiType}`)
          if (expectedField.required) {
            console.log(`     Required: Yes`)
          }
          if (expectedField.type === 'singleSelect' && expectedField.options?.choices) {
            console.log(`     Options: ${expectedField.options.choices.map((c) => c.name).join(', ')}`)
          }
        }
      }
    }

    // Type mismatches
    if (typeMismatches.length > 0) {
      console.log('\n⚠️  Wrong Field Types:')
      for (const m of typeMismatches) {
        const expectedField = AIRTABLE_SCHEMA.find((t) => t.name === tableName)?.fields.find(
          (f) => f.name === m.field
        )
        if (expectedField) {
          const expectedUIType = getAirtableUITypeName(expectedField.type)
          const actualUIType = m.actual ? getAirtableUITypeName(m.actual as FieldType) : 'unknown'
          console.log(`   → Field "${m.field}"`)
          console.log(`     Current: ${actualUIType}`)
          console.log(`     Expected: ${expectedUIType}`)
          console.log(`     Action: Change field type in Airtable UI`)
        }
      }
    }

    // Required mismatches
    if (requiredMismatches.length > 0) {
      console.log('\n⚠️  Required Field Mismatches:')
      for (const m of requiredMismatches) {
        console.log(`   → Field "${m.field}" should be marked as Required`)
        console.log(`     Action: Enable "Required" checkbox in Airtable field settings`)
      }
    }

    // Select option mismatches
    if (selectMismatches.length > 0) {
      console.log('\n⚠️  Single Select Option Mismatches:')
      for (const m of selectMismatches) {
        if (m.selectOptions) {
          const missing = m.selectOptions.expected.filter(
            (opt) => !m.selectOptions!.actual.includes(opt)
          )
          const extra = m.selectOptions.actual.filter(
            (opt) => !m.selectOptions!.expected.includes(opt)
          )

          console.log(`   → Field "${m.field}"`)
          if (missing.length > 0) {
            console.log(`     Missing options: ${missing.join(', ')}`)
            console.log(`     Action: Add these options in Airtable field settings`)
          }
          if (extra.length > 0) {
            console.log(`     Extra options: ${extra.join(', ')}`)
            console.log(`     Action: Remove or ignore these options`)
          }
        }
      }
    }

    // Extra fields
    if (extraFields.length > 0) {
      console.log('\nℹ️  Extra Fields (not in schema, safe to ignore):')
      for (const m of extraFields) {
        console.log(`   → "${m.field}"`)
      }
    }
  }

  console.log('\n' + '='.repeat(80))
  console.log(`\nTotal issues: ${mismatches.length}`)
  console.log('\nAfter fixing, run: npm run airtable:drift\n')
  process.exit(1)
}

async function main() {
  try {
    const data = await fetchAirtableSchema()
    const actualTables = data.tables || []
    const mismatches = compareSchemas(actualTables)
    printDriftReport(mismatches)
  } catch (error) {
    console.error('Error generating drift report:', error instanceof Error ? error.message : String(error))
    process.exit(1)
  }
}

main()
