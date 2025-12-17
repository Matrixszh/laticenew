import Airtable from 'airtable'
import { isAirtableReady } from '../config'

let airtableBaseInstance: ReturnType<Airtable['base']> | null = null

export function getAirtableBase() {
  // Check readiness first - this prevents initialization errors
  if (!isAirtableReady()) {
    throw new Error('Airtable not configured: AIRTABLE_TOKEN and AIRTABLE_BASE_ID are required')
  }

  if (!airtableBaseInstance) {
    airtableBaseInstance = new Airtable({
      apiKey: process.env.AIRTABLE_TOKEN!,
    }).base(process.env.AIRTABLE_BASE_ID!)
  }

  return airtableBaseInstance
}

export const airtableBase = (
  ...args: Parameters<ReturnType<Airtable['base']>>
): ReturnType<ReturnType<Airtable['base']>> => {
  const base = getAirtableBase()
  return base(...args)
}
