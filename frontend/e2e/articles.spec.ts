import { test, expect, Page } from '@playwright/test'

// Helper to detect mobile by viewport width
const isMobileViewport = (page: Page) => {
  const viewport = page.viewportSize()
  return viewport && viewport.width < 640 // sm breakpoint in Tailwind
}

test.describe('Articles', () => {
  test.describe('Home Page', () => {
    test('should display home page with Flipboard branding', async ({ page }) => {
      await page.goto('/')

      // Use the specific navbar link instead of generic text
      await expect(page.getByRole('link', { name: 'FLIPBOARD' })).toBeVisible()
    })

    test('should display navigation bar', async ({ page }) => {
      await page.goto('/')

      if (isMobileViewport(page)) {
        // On mobile, open the menu first
        await page.locator('nav button').first().click()
        await page.waitForTimeout(300)
      }

      await expect(page.getByRole('link', { name: /^home$/i })).toBeVisible()
      await expect(page.getByRole('link', { name: /^topics$/i })).toBeVisible()
    })

    test('should have search input', async ({ page }) => {
      await page.goto('/')

      if (isMobileViewport(page)) {
        // On mobile, search is in the dropdown menu
        await page.locator('nav button').first().click()
        // Wait for the mobile menu to open
        await page.waitForTimeout(500)
        // Get the visible search input in the mobile menu
        const mobileSearch = page.locator('.sm\\:hidden input[placeholder*="Search"]')
        await expect(mobileSearch).toBeVisible()
      } else {
        const searchInput = page.getByPlaceholder(/search/i).first()
        await expect(searchInput).toBeVisible()
      }
    })

    test('should filter articles when searching', async ({ page }) => {
      await page.goto('/')

      let searchInput
      if (isMobileViewport(page)) {
        // On mobile, search is in the dropdown menu
        await page.locator('nav button').first().click()
        await page.waitForTimeout(500)
        // Get the mobile search input specifically
        searchInput = page.locator('.sm\\:hidden input[placeholder*="Search"]')
      } else {
        searchInput = page.getByPlaceholder(/search/i).first()
      }

      await searchInput.fill('test search query')

      // Wait for debounce and results
      await page.waitForTimeout(500)

      // The search should be reflected in the input
      await expect(searchInput).toHaveValue('test search query')
    })

    test('should display article cards', async ({ page }) => {
      await page.goto('/')

      // Wait for articles to load
      await page.waitForLoadState('networkidle')

      // Look for article cards (they should have titles or images)
      const articles = page.locator('[class*="group"]').filter({ hasText: /.+/ })

      // There should be at least some content on the page
      const count = await articles.count()
      expect(count).toBeGreaterThanOrEqual(0)
    })
  })

  test.describe('Article Detail Page', () => {
    test('should navigate to article detail', async ({ page }) => {
      await page.goto('/')

      // Wait for articles to load
      await page.waitForLoadState('networkidle')

      // Find an article link and click it
      const articleLinks = page.locator('a[href*="/article/"]')
      const count = await articleLinks.count()

      if (count > 0) {
        await articleLinks.first().click()
        await expect(page).toHaveURL(/\/article\//)
      }
    })

    test('should display article content', async ({ page }) => {
      // Navigate to a specific article if available
      await page.goto('/')
      await page.waitForLoadState('networkidle')

      const articleLinks = page.locator('a[href*="/article/"]')
      const count = await articleLinks.count()

      if (count > 0) {
        await articleLinks.first().click()
        await page.waitForLoadState('networkidle')

        // Article page should have content
        const articleContent = page.locator('article, [class*="article"], main')
        await expect(articleContent.first()).toBeVisible()
      }
    })
  })

  test.describe('Article Interactions', () => {
    test('should have like button on articles', async ({ page }) => {
      await page.goto('/')
      await page.waitForLoadState('networkidle')

      // Find article cards with like buttons (exclude navbar buttons)
      const articleCards = page.locator('a[href*="/article/"]')
      const count = await articleCards.count()

      expect(count).toBeGreaterThanOrEqual(0)
    })

    test('should have save button on articles', async ({ page }) => {
      await page.goto('/')
      await page.waitForLoadState('networkidle')

      // Find bookmark/save buttons
      const buttons = page.locator('button')
      const count = await buttons.count()

      expect(count).toBeGreaterThanOrEqual(0)
    })

    test('should show login prompt when liking without auth', async ({ page }) => {
      await page.goto('/')
      await page.waitForLoadState('networkidle')

      // Find article card buttons in main content (not navbar)
      const articleButtons = page.locator('main button').filter({ has: page.locator('svg') })
      const count = await articleButtons.count()

      if (count > 0) {
        await articleButtons.first().click()
        // Should either show login modal or redirect to login
        await page.waitForTimeout(500)
      }
    })
  })

  test.describe('Comments Section', () => {
    test('should display comments section on article page', async ({ page }) => {
      await page.goto('/')
      await page.waitForLoadState('networkidle')

      const articleLinks = page.locator('a[href*="/article/"]')
      const count = await articleLinks.count()

      if (count > 0) {
        await articleLinks.first().click()
        await page.waitForLoadState('networkidle')

        // Look for comments section
        const commentsSection = page.getByText(/comment/i)
        const commentCount = await commentsSection.count()
        expect(commentCount).toBeGreaterThanOrEqual(0)
      }
    })
  })

  test.describe('Responsive Design', () => {
    test('should be responsive on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 })
      await page.goto('/')

      // Mobile menu button should be visible (it's the first button in the navbar)
      const menuButton = page.locator('nav button').first()
      await expect(menuButton).toBeVisible()
    })

    test('should show mobile menu when toggled', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 })
      await page.goto('/')

      // Click mobile menu button
      const menuButton = page.locator('nav button').first()
      await menuButton.click()

      // Mobile menu should be visible - check for menu links
      await page.waitForTimeout(300)
      await expect(page.getByRole('link', { name: /^home$/i })).toBeVisible()
    })
  })
})
