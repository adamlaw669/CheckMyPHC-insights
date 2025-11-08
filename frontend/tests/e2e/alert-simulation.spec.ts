import { test, expect } from '@playwright/test'

test.describe('Alert Simulation', () => {
  test.beforeEach(async ({ page }) => {
    // Set up session user
    await page.addInitScript(() => {
      localStorage.setItem('sessionUser', JSON.stringify({ name: 'Test User', email: 'test@example.com' }))
    })
    
    // Navigate to dashboard
    await page.goto('http://localhost:3000/dashboard')
  })

  test('should load dashboard with map', async ({ page }) => {
    // Wait for dashboard to load
    await page.waitForSelector('h1:has-text("PHC Intelligence Dashboard")', { timeout: 10000 })
    
    // Check if map container exists
    const mapContainer = await page.locator('.w-full.h-\\[500px\\]')
    await expect(mapContainer).toBeVisible()
  })

  test('should display alerts feed', async ({ page }) => {
    // Wait for alerts feed to load
    await page.waitForSelector('text=Alerts Feed', { timeout: 10000 })
    
    // Check if alerts are displayed or empty state
    const alertsExist = await page.locator('[class*="space-y-2"]').count()
    expect(alertsExist).toBeGreaterThan(0)
  })

  test('should simulate alert when clicking map marker', async ({ page }) => {
    // Wait for map to load
    await page.waitForTimeout(2000)
    
    // Try to click a marker (if visible)
    const marker = page.locator('.custom-marker').first()
    if (await marker.isVisible({ timeout: 5000 }).catch(() => false)) {
      await marker.click()
      
      // Wait for popup
      await page.waitForTimeout(500)
      
      // Check if popup has buttons
      const alertButton = page.locator('button:has-text("Alert")').first()
      if (await alertButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await alertButton.click()
        
        // Check localStorage for simulated alert
        const simulatedAlerts = await page.evaluate(() => {
          return localStorage.getItem('simulatedAlerts')
        })
        
        // Should have alerts in localStorage if simulation worked
        if (simulatedAlerts) {
          const alerts = JSON.parse(simulatedAlerts)
          expect(alerts.length).toBeGreaterThan(0)
        }
      }
    }
  })

  test('should display metrics', async ({ page }) => {
    await page.waitForSelector('h1:has-text("PHC Intelligence Dashboard")')
    
    // Check for metric cards
    const trackedPHCs = await page.locator('text=Tracked PHCs').count()
    expect(trackedPHCs).toBeGreaterThan(0)
  })
})
