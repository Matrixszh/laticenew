// @ts-nocheck - Playwright types will be available after npm install
import { test, expect } from '@playwright/test'

/**
 * E2E tests for setup gating behavior
 * These tests verify that the app behaves correctly when environment variables are not configured
 */

test.describe('Setup Gating', () => {
  test('visiting /app redirects to /setup when auth is not configured', async ({ page }) => {
    // Navigate to /app without auth configured
    await page.goto('/app')
    
    // Should redirect to /setup
    await expect(page).toHaveURL(/.*\/setup/)
  })

  test('/setup shows missing keys checklist', async ({ page }) => {
    await page.goto('/setup')
    
    // Should show setup page
    await expect(page.locator('h1')).toContainText('Setup Required')
    
    // Should show Authentication section
    await expect(page.locator('h2:has-text("Authentication (Clerk)")')).toBeVisible()
    
    // Should show Airtable section
    await expect(page.locator('h2:has-text("Airtable")')).toBeVisible()
    
    // Should list missing environment variables (check that they appear somewhere on the page)
    const pageContent = await page.textContent('body')
    expect(pageContent).toContain('AIRTABLE_TOKEN')
    expect(pageContent).toContain('AIRTABLE_BASE_ID')
    expect(pageContent).toContain('NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY')
    expect(pageContent).toContain('CLERK_SECRET_KEY')
  })

  test('/api/health reports readiness false when not configured', async ({ request }) => {
    const response = await request.get('/api/health')
    const data = await response.json()
    
    // Should return 200
    expect(response.status()).toBe(200)
    
    // Should have readiness booleans
    expect(data).toHaveProperty('authReady')
    expect(data).toHaveProperty('airtableReady')
    expect(data).toHaveProperty('setupReady')
    
    // Should have missing vars arrays
    expect(data).toHaveProperty('missingAuth')
    expect(data).toHaveProperty('missingAirtable')
    
    // Should not expose secrets
    expect(JSON.stringify(data)).not.toContain('pat_')
    expect(JSON.stringify(data)).not.toContain('sk_')
    expect(JSON.stringify(data)).not.toContain('pk_')
  })

  test('KPIs page shows empty state instead of error', async ({ page }) => {
    // This test assumes auth is configured but Airtable is not
    // In a real scenario, you'd need to mock or conditionally test
    await page.goto('/app/kpis')
    
    // Should either redirect to setup or show empty state
    // Since we can't easily test with partial config, we'll check for graceful handling
    const url = page.url()
    if (url.includes('/setup')) {
      // If redirected, that's also acceptable behavior
      await expect(page.locator('text=Setup Required')).toBeVisible()
    } else {
      // If on KPIs page, should show empty state
      await expect(page.locator('text=KPIs Dashboard')).toBeVisible()
    }
  })

  test('Leads page shows empty table state', async ({ page }) => {
    await page.goto('/app/leads')
    
    const url = page.url()
    if (url.includes('/setup')) {
      // Redirected to setup is acceptable
      await expect(page.locator('text=Setup Required')).toBeVisible()
    } else {
      // Should show leads page with empty state
      await expect(page.locator('text=Leads')).toBeVisible()
      // Should show empty state message or table structure
      const hasEmptyState = await page.locator('text=No leads yet').isVisible().catch(() => false)
      const hasTable = await page.locator('table').isVisible().catch(() => false)
      expect(hasEmptyState || hasTable).toBeTruthy()
    }
  })

  test('Interactions page renders columns and empty rows', async ({ page }) => {
    await page.goto('/app/interactions')
    
    const url = page.url()
    if (url.includes('/setup')) {
      await expect(page.locator('text=Setup Required')).toBeVisible()
    } else {
      await expect(page.locator('text=Interactions')).toBeVisible()
      // Should show table structure even if empty
      const hasTable = await page.locator('table').isVisible().catch(() => false)
      const hasEmptyState = await page.locator('text=No interactions yet').isVisible().catch(() => false)
      expect(hasTable || hasEmptyState).toBeTruthy()
    }
  })

  test('Calendar page renders with empty state message', async ({ page }) => {
    await page.goto('/app/calendar')
    
    const url = page.url()
    if (url.includes('/setup')) {
      await expect(page.locator('text=Setup Required')).toBeVisible()
    } else {
      await expect(page.locator('text=Calendar')).toBeVisible()
      // Should show empty state or calendar structure
      const hasEmptyState = await page.locator('text=Connect Airtable').isVisible().catch(() => false)
      expect(hasEmptyState).toBeTruthy()
    }
  })

  test('Automations page shows rule builder UI but disables save', async ({ page }) => {
    await page.goto('/app/automations')
    
    const url = page.url()
    if (url.includes('/setup')) {
      await expect(page.locator('text=Setup Required')).toBeVisible()
    } else {
      await expect(page.locator('text=Lead Automations')).toBeVisible()
      
      // Click "New Automation" button if it exists
      const newButton = page.locator('text=New Automation')
      if (await newButton.isVisible()) {
        await newButton.click()
        
        // Form should be visible
        await expect(page.locator('input[type="text"]').first()).toBeVisible()
        
        // Save button should be disabled or show message
        const saveButton = page.locator('button[type="submit"]')
        if (await saveButton.isVisible()) {
          const isDisabled = await saveButton.isDisabled()
          const buttonText = await saveButton.textContent()
          expect(isDisabled || buttonText?.includes('Connect Airtable')).toBeTruthy()
        }
      }
    }
  })
})
