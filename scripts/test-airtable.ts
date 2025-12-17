/**
 * Test script to verify Airtable connection
 * Run with: npx tsx scripts/test-airtable.ts
 */

import Airtable from 'airtable'
// @ts-ignore - dotenv types will be available after npm install
import * as dotenv from 'dotenv'
import { resolve } from 'path'

// Load environment variables
dotenv.config({ path: resolve(__dirname, '../.env.local') })

const AIRTABLE_TOKEN = process.env.AIRTABLE_TOKEN
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID

async function testAirtableConnection() {
  console.log('Testing Airtable connection...\n')

  // Check environment variables
  if (!AIRTABLE_TOKEN) {
    console.error('❌ AIRTABLE_TOKEN is not set')
    return false
  }

  if (!AIRTABLE_BASE_ID) {
    console.error('❌ AIRTABLE_BASE_ID is not set')
    return false
  }

  console.log('✅ Environment variables found')
  console.log(`   Token: ${AIRTABLE_TOKEN.substring(0, 10)}...`)
  console.log(`   Base ID: ${AIRTABLE_BASE_ID}\n`)

  try {
    // Initialize Airtable
    const base = new Airtable({
      apiKey: AIRTABLE_TOKEN,
    }).base(AIRTABLE_BASE_ID)

    // Test connection by fetching base metadata
    console.log('Testing connection...')
    
    // Try to list tables (this requires schema.bases:read scope)
    // We'll test by trying to read from a table instead
    // First, let's try to get the first record from Businesses table (if it exists)
    try {
      const businessesTable = base('Businesses')
      const records = await businessesTable.select({ maxRecords: 1 }).firstPage()
      console.log('✅ Successfully connected to Airtable!')
      console.log(`   Found ${records.length} record(s) in Businesses table`)
      return true
    } catch (error: any) {
      // If Businesses table doesn't exist, try to get base info another way
      if (error.statusCode === 404 || error.message?.includes('Could not find table')) {
        console.log('⚠️  Businesses table not found (this is okay if you haven\'t created it yet)')
        console.log('✅ Airtable connection is working, but tables need to be created')
        console.log('   See docs/airtable-schema.md for the schema checklist')
        return true
      }
      throw error
    }
  } catch (error: any) {
    console.error('❌ Failed to connect to Airtable:')
    if (error.statusCode === 401) {
      console.error('   Authentication failed. Check your AIRTABLE_TOKEN.')
    } else if (error.statusCode === 404) {
      console.error('   Base not found. Check your AIRTABLE_BASE_ID.')
    } else {
      console.error(`   Error: ${error.message}`)
      if (error.error) {
        console.error(`   Details: ${JSON.stringify(error.error, null, 2)}`)
      }
    }
    return false
  }
}

// Run the test
testAirtableConnection()
  .then((success) => {
    process.exit(success ? 0 : 1)
  })
  .catch((error) => {
    console.error('Unexpected error:', error)
    process.exit(1)
  })
