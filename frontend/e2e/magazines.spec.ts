import { test, expect, type APIRequestContext, type Page } from '@playwright/test'

const API_URL = process.env.VITE_API_URL || 'http://localhost:8000'

type TestUser = {
  username: string
  email: string
  password: string
}

const createUser = async (request: APIRequestContext, user: TestUser) => {
  const response = await request.post(`${API_URL}/auth/signup`, {
    data: {
      username: user.username,
      email: user.email,
      password: user.password,
    },
  })

  if (!response.ok()) {
    const body = await response.text()
    throw new Error(`Failed to create user: ${response.status()} ${body}`)
  }
}

const loginUser = async (request: APIRequestContext, user: TestUser) => {
  const response = await request.post(`${API_URL}/auth/login`, {
    form: {
      username: user.username,
      password: user.password,
    },
  })

  if (!response.ok()) {
    const body = await response.text()
    throw new Error(`Failed to login: ${response.status()} ${body}`)
  }

  const data = await response.json()
  return data.access_token as string
}

const createMagazine = async (
  request: APIRequestContext,
  token: string,
  name: string,
  description?: string
) => {
  const response = await request.post(`${API_URL}/magazines/`, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    data: { name, description },
  })

  if (!response.ok()) {
    const body = await response.text()
    throw new Error(`Failed to create magazine: ${response.status()} ${body}`)
  }

  return response.json()
}

const setAuthToken = async (page: Page, token: string) => {
  await page.addInitScript((value) => {
    window.localStorage.setItem('token', value)
  }, token)
}

test.describe.serial('Authenticated Magazine Tests', () => {
  test.skip(!!process.env.CI, 'Requires a running backend server')
  let owner: TestUser
  let follower: TestUser
  let ownerToken: string
  let followerToken: string
  let followMagazineId: string
  let followMagazineName: string
  let editableMagazineId: string
  let removableMagazineId: string
  let removableMagazineName: string
  let createdMagazineName: string

  test.beforeAll(async ({ request }) => {
    const suffix = Date.now()
    owner = {
      username: `e2e_owner_${suffix}`,
      email: `e2e_owner_${suffix}@example.com`,
      password: 'Password123!',
    }
    follower = {
      username: `e2e_follower_${suffix}`,
      email: `e2e_follower_${suffix}@example.com`,
      password: 'Password123!',
    }

    await createUser(request, owner)
    await createUser(request, follower)

    ownerToken = await loginUser(request, owner)
    followerToken = await loginUser(request, follower)

    const followMag = await createMagazine(request, ownerToken, `Follow Me ${suffix}`)
    followMagazineId = followMag.id
    followMagazineName = followMag.name

    const editableMag = await createMagazine(request, ownerToken, `Editable ${suffix}`)
    editableMagazineId = editableMag.id

    const removableMag = await createMagazine(request, ownerToken, `Removable ${suffix}`)
    removableMagazineId = removableMag.id
    removableMagazineName = removableMag.name
  })

  test('should access magazines from profile when authenticated', async ({ page }) => {
    await setAuthToken(page, ownerToken)
    await page.goto('/profile')
    await page.getByRole('button', { name: 'Magazines' }).click()
    await expect(page.getByText(/my magazines/i)).toBeVisible()
  })

  test('should open and close save modal when add button is clicked', async ({ page }) => {
    await setAuthToken(page, ownerToken)
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    const addButton = page.locator('button[title="Add to Magazine"]').first()
    await addButton.waitFor({ state: 'visible', timeout: 15000 })
    await addButton.click()

    await expect(page.getByRole('heading', { name: /save to magazine/i })).toBeVisible()
    await page.getByRole('button', { name: 'Cancel' }).click()
    await expect(page.getByRole('heading', { name: /save to magazine/i })).toBeHidden()
  })

  test('should create a new magazine', async ({ page }) => {
    createdMagazineName = `E2E Magazine ${Date.now()}`
    await setAuthToken(page, ownerToken)
    await page.goto('/profile')

    await page.getByRole('button', { name: 'Magazines' }).click()
    await page.getByText('Create Magazine').click({ force: true })

    await page.getByPlaceholder(/for later/i).fill(createdMagazineName)
    await page.getByRole('button', { name: /^Create$/ }).click()

    await expect(page.getByText(createdMagazineName)).toBeVisible()
  })

  test('should view own magazines', async ({ page }) => {
    await setAuthToken(page, ownerToken)
    await page.goto('/profile')

    await page.getByRole('button', { name: 'Magazines' }).click()
    await expect(page.getByText(createdMagazineName)).toBeVisible()
  })

  test('should add article to magazine', async ({ page }) => {
    await setAuthToken(page, ownerToken)
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    const addButton = page.locator('button[title="Add to Magazine"]').first()
    await addButton.waitFor({ state: 'visible', timeout: 15000 })
    await addButton.click()

    await expect(page.getByRole('heading', { name: /save to magazine/i })).toBeVisible()
    await page.getByRole('button', { name: new RegExp(removableMagazineName, 'i') }).click()

    // Wait for save to complete (modal closes after successful save)
    await expect(page.getByRole('heading', { name: /save to magazine/i })).toBeHidden()

    await page.goto(`/magazine/${removableMagazineId}`)
    await page.waitForLoadState('networkidle')
    await expect(page.getByRole('button', { name: /remove from magazine/i }).first()).toBeVisible({ timeout: 10000 })
  })

  test('should allow removing article from magazine', async ({ page }) => {
    await setAuthToken(page, ownerToken)
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    const addButton = page.locator('button[title="Add to Magazine"]').first()
    await addButton.waitFor({ state: 'visible', timeout: 15000 })
    await addButton.click()

    await page.getByRole('button', { name: new RegExp(removableMagazineName, 'i') }).click()

    // Wait for save to complete (modal closes after successful save)
    await expect(page.getByRole('heading', { name: /save to magazine/i })).toBeHidden()

    await page.goto(`/magazine/${removableMagazineId}`)
    await page.waitForLoadState('networkidle')

    const removeButtons = page.getByRole('button', { name: /remove from magazine/i })
    await removeButtons.first().waitFor({ state: 'visible', timeout: 10000 })
    const initialCount = await removeButtons.count()
    expect(initialCount).toBeGreaterThan(0)

    await removeButtons.first().click()
    await expect(removeButtons).toHaveCount(initialCount - 1)
  })

  test('should allow editing magazine name when owner', async ({ page }) => {
    const updatedName = `Edited ${Date.now()}`

    await setAuthToken(page, ownerToken)
    await page.goto(`/magazine/${editableMagazineId}`)

    await page.getByRole('button', { name: 'Edit Magazine' }).click()
    await page.getByLabel('Magazine Title').fill(updatedName)
    await page.getByRole('button', { name: /save changes/i }).click()

    await expect(page.getByRole('heading', { name: updatedName })).toBeVisible()
  })

  test('should allow deleting magazine when owner', async ({ page, request }) => {
    const toDelete = await createMagazine(request, ownerToken, `Delete ${Date.now()}`)

    await setAuthToken(page, ownerToken)
    await page.goto(`/magazine/${toDelete.id}`)

    await page.getByRole('button', { name: 'Delete Magazine' }).click()
    await expect(page.getByRole('heading', { name: 'Delete Magazine' })).toBeVisible()
    await page.getByRole('button', { name: /^Delete$/ }).click()

    await expect(page).toHaveURL(/\/profile/)
  })

  test('should allow following a magazine', async ({ page }) => {
    await setAuthToken(page, followerToken)
    await page.goto(`/magazine/${followMagazineId}`)

    await page.getByRole('button', { name: /follow magazine/i }).click()
    await expect(page.getByRole('button', { name: /following magazine/i })).toBeVisible()
  })

  test('should show followed magazines in profile', async ({ page }) => {
    await setAuthToken(page, followerToken)
    await page.goto('/profile')

    await page.getByRole('button', { name: 'Magazines' }).click()
    await expect(page.getByText(/followed magazines/i)).toBeVisible()
    await expect(page.getByText(followMagazineName)).toBeVisible()
  })

  test.afterAll(async ({ request }) => {
    // Clean up all magazines created by the test owner
    const response = await request.get(`${API_URL}/magazines/`, {
      headers: { Authorization: `Bearer ${ownerToken}` },
    })
    if (response.ok()) {
      const magazines = await response.json()
      for (const mag of magazines) {
        await request.delete(`${API_URL}/magazines/${mag.id}`, {
          headers: { Authorization: `Bearer ${ownerToken}` },
        })
      }
    }
  })
})
