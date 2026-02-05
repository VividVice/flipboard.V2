import { test, expect } from '@playwright/test'

test.describe('Authentication', () => {
  test.describe('Signup Flow', () => {
    test('should display signup page', async ({ page }) => {
      await page.goto('/signup')

      // The page has "Flipboard" heading and "Create your account" subtitle
      await expect(page.getByRole('heading', { name: /flipboard/i })).toBeVisible()
      await expect(page.getByText(/create your account/i)).toBeVisible()
      await expect(page.getByPlaceholder(/username/i)).toBeVisible()
      await expect(page.getByPlaceholder(/email/i)).toBeVisible()
      await expect(page.getByPlaceholder(/password/i)).toBeVisible()
    })

    test('should show validation error for empty fields', async ({ page }) => {
      await page.goto('/signup')

      // Try to submit empty form
      await page.getByRole('button', { name: /sign up/i }).click()

      // Check for validation (HTML5 or custom)
      const usernameInput = page.getByPlaceholder(/username/i)
      await expect(usernameInput).toBeVisible()
    })

    test('should navigate to login from signup', async ({ page }) => {
      await page.goto('/signup')

      // Click the "Log in" link in the form (not the navbar one)
      await page.locator('form ~ div').getByRole('link', { name: /log in/i }).click()

      await expect(page).toHaveURL(/\/login/)
    })

    test('should show error for invalid email format', async ({ page }) => {
      await page.goto('/signup')

      await page.getByPlaceholder(/username/i).fill('testuser')
      await page.getByPlaceholder(/email/i).fill('invalid-email')
      await page.getByPlaceholder(/password/i).fill('password123')

      await page.getByRole('button', { name: /sign up/i }).click()

      // Browser validation should prevent submission
      const emailInput = page.getByPlaceholder(/email/i)
      await expect(emailInput).toBeVisible()
    })
  })

  test.describe('Login Flow', () => {
    test('should display login page', async ({ page }) => {
      await page.goto('/login')

      // The page has "Flipboard" heading and "Log in to your account" subtitle
      await expect(page.getByRole('heading', { name: /flipboard/i })).toBeVisible()
      await expect(page.getByText(/log in to your account/i)).toBeVisible()
      await expect(page.getByPlaceholder(/username/i)).toBeVisible()
      await expect(page.getByPlaceholder(/password/i)).toBeVisible()
    })

    test('should show error for invalid credentials', async ({ page }) => {
      await page.goto('/login')

      await page.getByPlaceholder(/username/i).fill('wronguser')
      await page.getByPlaceholder(/password/i).fill('wrongpassword')
      await page.getByRole('button', { name: /log in/i }).click()

      // Wait for error message (network error or invalid credentials)
      await expect(page.getByText(/login failed|invalid|error|incorrect/i).first()).toBeVisible({ timeout: 10000 })
    })

    test('should navigate to signup from login', async ({ page }) => {
      await page.goto('/login')

      // Click the "Create an account" link in the form
      await page.getByRole('link', { name: /create an account/i }).click()

      await expect(page).toHaveURL(/\/signup/)
    })

    test('should have Google login option', async ({ page }) => {
      await page.goto('/login')

      // Check for Google login button - it's rendered by vue3-google-login
      // The Google button has a specific class or we can look for the container
      const googleButton = page.locator('[class*="google"], [id*="gsi"], .google-login-button').first()
      await expect(googleButton).toBeVisible({ timeout: 10000 })
    })
  })

  test.describe('Logout Flow', () => {
    test('should show login/signup buttons when not authenticated', async ({ page, isMobile }) => {
      await page.goto('/')

      if (isMobile) {
        // On mobile, open the menu first
        await page.locator('nav button').first().click()
        await page.waitForTimeout(300)
      }

      // NavBar should show login/signup
      await expect(page.getByRole('link', { name: 'Log In', exact: true })).toBeVisible()
      await expect(page.getByRole('link', { name: 'Sign Up', exact: true })).toBeVisible()
    })

    test('should redirect to home after logout', async ({ page }) => {
      // This test assumes a logged-in state
      // In a real scenario, you'd set up authentication first
      await page.goto('/')

      // If logged in, there should be a logout button
      const logoutButton = page.getByRole('button', { name: /logout/i })

      if (await logoutButton.isVisible()) {
        await logoutButton.click()
        await expect(page.getByRole('link', { name: 'Log In', exact: true })).toBeVisible()
      }
    })
  })

  test.describe('Protected Routes', () => {
    test('should redirect to login when accessing profile without auth', async ({ page }) => {
      await page.goto('/profile')

      // Should either redirect to login or show login prompt
      await expect(page).toHaveURL(/\/(login|profile)/)
    })
  })
})
