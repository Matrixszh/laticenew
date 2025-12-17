/**
 * KPI Calculation Utilities
 * Provides correct KPI calculations with date range filtering
 */

export interface DateRange {
  startDate: string // ISO date string (YYYY-MM-DD)
  endDate: string // ISO date string (YYYY-MM-DD)
}

export interface KPIResult {
  incomingCalls: number
  leadsContacted: number
  leadsClosed: number
  leadsNew: number
  conversionRate: number // percentage
}

/**
 * Calculate KPIs from interactions and leads data
 */
export function calculateKPIs(
  interactions: Array<{ fields: any; createdTime?: string }>,
  leads: Array<{ fields: any; createdTime?: string }>,
  dateRange?: DateRange
): KPIResult {
  // Filter by date range if provided
  let filteredInteractions = interactions
  let filteredLeads = leads

  if (dateRange) {
    const start = new Date(dateRange.startDate)
    start.setHours(0, 0, 0, 0)
    const end = new Date(dateRange.endDate)
    end.setHours(23, 59, 59, 999)

    filteredInteractions = interactions.filter((interaction) => {
      // If no timestamp, include it (assume old data)
      if (!interaction.createdTime) return true
      try {
        const created = new Date(interaction.createdTime)
        // Check if date is valid
        if (isNaN(created.getTime())) return true
        return created >= start && created <= end
      } catch {
        return true
      }
    })

    filteredLeads = leads.filter((lead) => {
      // If no timestamp, include it (assume old data)
      if (!lead.createdTime) return true
      try {
        const created = new Date(lead.createdTime)
        // Check if date is valid
        if (isNaN(created.getTime())) return true
        return created >= start && created <= end
      } catch {
        return true
      }
    })
  }

  // Incoming Calls: Type = "Call" AND Direction = "Inbound"
  const incomingCalls = filteredInteractions.filter(
    (i) => i.fields.Type === 'Call' && i.fields.Direction === 'Inbound'
  ).length

  // Leads Contacted: Status = "Contacted" OR "Qualified"
  const leadsContacted = filteredLeads.filter(
    (l) => l.fields.Status === 'Contacted' || l.fields.Status === 'Qualified'
  ).length

  // Leads Closed: Status = "Closed"
  const leadsClosed = filteredLeads.filter((l) => l.fields.Status === 'Closed').length

  // Leads New: Status = "New" or undefined
  const leadsNew = filteredLeads.filter(
    (l) => !l.fields.Status || l.fields.Status === 'New'
  ).length

  // Conversion Rate: (Closed / Total) * 100
  const totalLeads = filteredLeads.length
  const conversionRate = totalLeads > 0 ? (leadsClosed / totalLeads) * 100 : 0

  return {
    incomingCalls,
    leadsContacted,
    leadsClosed,
    leadsNew,
    conversionRate: Math.round(conversionRate * 100) / 100, // Round to 2 decimal places
  }
}

/**
 * Get default date range (last 30 days)
 */
export function getDefaultDateRange(): DateRange {
  const end = new Date()
  const start = new Date()
  start.setDate(start.getDate() - 30)

  return {
    startDate: start.toISOString().split('T')[0],
    endDate: end.toISOString().split('T')[0],
  }
}

/**
 * Get date range for "Today"
 */
export function getTodayDateRange(): DateRange {
  const today = new Date().toISOString().split('T')[0]
  return {
    startDate: today,
    endDate: today,
  }
}

/**
 * Get date range for "This Week"
 */
export function getThisWeekDateRange(): DateRange {
  const today = new Date()
  const start = new Date(today)
  start.setDate(today.getDate() - today.getDay()) // Start of week (Sunday)

  return {
    startDate: start.toISOString().split('T')[0],
    endDate: today.toISOString().split('T')[0],
  }
}

/**
 * Get date range for "This Month"
 */
export function getThisMonthDateRange(): DateRange {
  const today = new Date()
  const start = new Date(today.getFullYear(), today.getMonth(), 1)

  return {
    startDate: start.toISOString().split('T')[0],
    endDate: today.toISOString().split('T')[0],
  }
}
