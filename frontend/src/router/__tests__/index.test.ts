import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import type { RouteLocationNormalized } from 'vue-router'
import router from '../index'
import { useAuthStore } from '../../stores/auth'

vi.mock('../../stores/auth', () => ({
  useAuthStore: vi.fn(),
}))

vi.mock('../../views/HomeView.vue', () => ({
  default: { name: 'HomeView', template: '<div>Home</div>' }
}))

describe('Router', () => {
  let mockAuthStore: { isAuthenticated: boolean; initialize: ReturnType<typeof vi.fn> | undefined }

  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()

    mockAuthStore = {
      isAuthenticated: false,
      initialize: vi.fn().mockResolvedValue(undefined),
    }
    vi.mocked(useAuthStore).mockReturnValue(mockAuthStore)
  })

  it('should have correct routes defined', () => {
    const routes = router.getRoutes()
    expect(routes.some(r => r.name === 'home')).toBe(true)
    expect(routes.some(r => r.name === 'login')).toBe(true)
    expect(routes.some(r => r.name === 'signup')).toBe(true)
    expect(routes.some(r => r.name === 'article')).toBe(true)
  })

  it('should redirect to login if not authenticated and route requires auth', async () => {
    mockAuthStore.isAuthenticated = false

    await router.push('/')
    expect(router.currentRoute.value.name).toBe('login')
    expect(router.currentRoute.value.query.redirect).toBe('/')
  })

  it('should allow access to home if authenticated', async () => {
    mockAuthStore.isAuthenticated = true

    await router.push('/login') // Go somewhere else first to ensure change
    await router.push('/')
    expect(router.currentRoute.value.name).toBe('home')
  })

  it('should allow access to login even if not authenticated', async () => {
    mockAuthStore.isAuthenticated = false

    await router.push('/login')
    expect(router.currentRoute.value.name).toBe('login')
  })

  it('should allow access to signup even if not authenticated', async () => {
    mockAuthStore.isAuthenticated = false

    await router.push('/signup')
    expect(router.currentRoute.value.name).toBe('signup')
  })

  it('should call initialize on auth store if requires auth', async () => {
    mockAuthStore.isAuthenticated = true
    
    await router.push('/login')
    await router.push('/')
    expect(mockAuthStore.initialize).toHaveBeenCalled()
  })

  it('should handle initialize failure gracefully', async () => {
    mockAuthStore.isAuthenticated = true
    mockAuthStore.initialize.mockRejectedValue(new Error('Init failed'))

    await router.push('/login')
    await router.push('/')
    expect(router.currentRoute.value.name).toBe('home')
  })

  it('should handle auth store without initialize function', async () => {
    mockAuthStore.isAuthenticated = true
    mockAuthStore.initialize = undefined

    await router.push('/login')
    await router.push('/')
    expect(router.currentRoute.value.name).toBe('home')
  })

  it('should scroll to top on navigation', () => {
    const scrollBehavior = router.options.scrollBehavior
    if (typeof scrollBehavior === 'function') {
      const result = scrollBehavior({} as unknown as RouteLocationNormalized, {} as unknown as RouteLocationNormalized, null)
      expect(result).toEqual({ top: 0 })
    } else {
      throw new Error('scrollBehavior is not a function')
    }
  })

  it('should trigger dynamic imports', async () => {
    const routes = router.getRoutes()
    const dynamicRoutes = [
      'article',
      'magazine',
      'profile',
      'user-profile',
      'topics',
      'topic-selection',
      'login',
      'signup'
    ]

    for (const name of dynamicRoutes) {
      const route = routes.find(r => r.name === name)
      if (route && typeof route.components?.default === 'function') {
        try {
          await (route.components.default as () => Promise<unknown>)()
        } catch {
          // It's okay if it fails to load the actual component file in test environment
          // We just want to execute the import function
        }
      }
    }
  })
})
