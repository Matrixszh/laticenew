/**
 * Airtable utility functions
 */

import { airtableBase } from './client'
import { assertSchemaValid, SchemaDriftError } from './schema-verify'
import { isAirtableReady, getMissingAirtableVars } from '../config'

/**
 * Check if Airtable is configured, throw error if not
 */
export function requireAirtableReady(): void {
  if (!isAirtableReady()) {
    const missing = getMissingAirtableVars()
    const error = new Error('Airtable not configured')
    ;(error as any).status = 503
    ;(error as any).missing = missing
    throw error
  }
}

/**
 * Middleware to check schema validity before write operations
 */
export async function requireValidSchema(): Promise<void> {
  // First check if Airtable is configured
  requireAirtableReady()

  try {
    await assertSchemaValid()
  } catch (error) {
    if (error instanceof SchemaDriftError) {
      throw error
    }
    const message = error instanceof Error ? error.message : 'Schema drift'
    throw new SchemaDriftError(message, [], [message])
  }
}

/**
 * Get business record with related data
 */
export async function getBusinessWithConfig(businessId: string) {
  const business = await airtableBase('Businesses').find(businessId)

  // Get prompt overrides
  const promptOverrides = await airtableBase('PromptOverrides')
    .select({
      filterByFormula: `AND({Business} = "${businessId}", {Active} = TRUE())`,
    })
    .all()

  // Get automation rules
  const automations = await airtableBase('Automations')
    .select({
      filterByFormula: `AND({Business} = "${businessId}", {Active} = TRUE())`,
    })
    .all()

  return {
    business: business.fields,
    promptOverrides: promptOverrides.map((r: any) => ({
      key: r.fields.Key,
      value: r.fields.Value,
    })),
    automations: automations.map((r: any) => ({
      name: r.fields.Name,
      trigger: r.fields.Trigger,
      conditions: r.fields.Conditions ? JSON.parse(r.fields.Conditions as string) : null,
      actions: JSON.parse(r.fields.Actions as string),
    })),
    timezone: business.fields.Timezone as string,
  }
}

/**
 * Check for appointment conflicts
 */
export async function checkAppointmentConflicts(
  businessId: string,
  startUtc: string,
  endUtc: string,
  excludeAppointmentId?: string
): Promise<boolean> {
  const startDate = new Date(startUtc)
  const endDate = new Date(endUtc)

  // Check existing appointments
  // Find appointments that:
  // 1. Are for this business
  // 2. Are in HOLD or CONFIRMED status
  // 3. Overlap with the requested time slot
  const appointments = await airtableBase('Appointments')
    .select({
      filterByFormula: `AND(
        {Business} = "${businessId}",
        OR({Status} = "HOLD", {Status} = "CONFIRMED"),
        OR(
          AND(DATETIME_DIFF({Start UTC}, "${endUtc}", "seconds") < 0, DATETIME_DIFF("${endUtc}", {Start UTC}, "seconds") > 0),
          AND(DATETIME_DIFF("${startUtc}", {End UTC}, "seconds") < 0, DATETIME_DIFF({End UTC}, "${startUtc}", "seconds") > 0),
          AND(DATETIME_DIFF("${startUtc}", {Start UTC}, "seconds") >= 0, DATETIME_DIFF({End UTC}, "${endUtc}", "seconds") <= 0)
        )
      )`,
    })
    .all()

  const activeAppointments = (appointments as any[]).filter((a) =>
    ['HOLD', 'CONFIRMED'].includes((a.fields.Status as string) || '')
  )

  // Filter out the appointment we're updating (if any)
  const conflicting = excludeAppointmentId
    ? activeAppointments.filter((a: any) => a.id !== excludeAppointmentId)
    : activeAppointments

  if (conflicting.length > 0) {
    return true
  }

  // Check busy blocks
  // Find busy blocks that overlap with the requested time slot
  const busyBlocks = await airtableBase('BusyBlocks')
    .select({
      filterByFormula: `AND(
        {Business} = "${businessId}",
        OR(
          AND(DATETIME_DIFF({Start UTC}, "${endUtc}", "seconds") < 0, DATETIME_DIFF("${endUtc}", {Start UTC}, "seconds") > 0),
          AND(DATETIME_DIFF("${startUtc}", {End UTC}, "seconds") < 0, DATETIME_DIFF({End UTC}, "${startUtc}", "seconds") > 0),
          AND(DATETIME_DIFF("${startUtc}", {Start UTC}, "seconds") >= 0, DATETIME_DIFF({End UTC}, "${endUtc}", "seconds") <= 0)
        )
      )`,
    })
    .all()

  return busyBlocks.length > 0
}
