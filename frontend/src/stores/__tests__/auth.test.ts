import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAuthStore } from '../auth'
import { useToastStore } from '../toast'
import { apiService } from '../../services/api'

vi.mock('../../services/api', () => ({
  apiService: {
    login: vi.fn(),
    signup: vi.fn(),
  },
}))

// Mock fetch globally
global.fetch = vi.fn()

describe('Auth Store', () => {
  let localStorageMock: { [key: string]: string }

  beforeEach(() => {
    setActivePinia(createPinia())

    // Mock localStorage
    localStorageMock = {}
    global.localStorage = {
      getItem: vi.fn((key: string) => localStorageMock[key] || null),
      setItem: vi.fn((key: string, value: string) => {
        localStorageMock[key] = value
      }),
      removeItem: vi.fn((key: string) => {
        delete localStorageMock[key]
      }),
      clear: vi.fn(() => {
        localStorageMock = {}
      }),
      length: 0,
      key: vi.fn(),
    } as Storage
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Initial State', () => {
    it('should initialize with no user and not authenticated', () => {
      const store = useAuthStore()
      expect(store.user).toBeNull()
      expect(store.isAuthenticated).toBe(false)
    })
  })

  describe('login()', () => {
    it('should successfully login a user', async () => {
      const mockUserData = {
        id: '1',
        username: 'testuser',
        email: 'test@example.com',
        profile_pic: 'https://example.com/pic.jpg',
      }

      vi.mocked(apiService.login).mockResolvedValue(undefined)
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockUserData,
      } as Response)

      localStorageMock.token = 'mock-token'

      const store = useAuthStore()
      await store.login('testuser', 'password123')

      expect(apiService.login).toHaveBeenCalledWith({
        username: 'testuser',
        password: 'password123',
      })
      expect(store.user).toEqual({
        id: '1',
        name: 'testuser',
        email: 'test@example.com',
        avatarUrl: 'https://example.com/pic.jpg',
        bio: undefined,
        newsletter_subscribed: false,
        followers: [],
        following: [],
        followed_magazines: [],
      })
      expect(store.isAuthenticated).toBe(true)
    })

    it('should use default avatar if profile_pic is not provided', async () => {
      const mockUserData = {
        id: '1',
        username: 'testuser',
        email: 'test@example.com',
        profile_pic: null,
      }

      vi.mocked(apiService.login).mockResolvedValue(undefined)
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockUserData,
      } as Response)

      localStorageMock.token = 'mock-token'

      const store = useAuthStore()
      await store.login('testuser', 'password123')

      expect(store.user?.avatarUrl).toContain('unsplash.com')
    })

    it('should show success toast on successful login', async () => {
      const mockUserData = {
        id: '1',
        username: 'testuser',
        email: 'test@example.com',
      }

      vi.mocked(apiService.login).mockResolvedValue(undefined)
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockUserData,
      } as Response)

      localStorageMock.token = 'mock-token'

      const store = useAuthStore()
      const toastStore = useToastStore()
      const showSpy = vi.spyOn(toastStore, 'show')

      await store.login('testuser', 'password123')

      expect(showSpy).toHaveBeenCalledWith('Welcome back, testuser!')
    })

    it('should show error toast and throw on login failure', async () => {
      vi.mocked(apiService.login).mockRejectedValue(new Error('Invalid credentials'))

      const store = useAuthStore()
      const toastStore = useToastStore()
      const showSpy = vi.spyOn(toastStore, 'show')

      await expect(store.login('testuser', 'wrongpassword')).rejects.toThrow('Invalid credentials')

      expect(showSpy).toHaveBeenCalledWith('Invalid credentials', 'error')
      expect(store.user).toBeNull()
      expect(store.isAuthenticated).toBe(false)
    })

    it('should handle user fetch failure after successful auth', async () => {
      vi.mocked(apiService.login).mockResolvedValue(undefined)
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: false,
        status: 500,
      } as Response)

      localStorageMock.token = 'mock-token'

      const store = useAuthStore()
      const toastStore = useToastStore()
      const showSpy = vi.spyOn(toastStore, 'show')

      await expect(store.login('testuser', 'password123')).rejects.toThrow('Failed to fetch user data')
      expect(showSpy).toHaveBeenCalledWith('Failed to fetch user data', 'error')
    })
  })

  describe('signup()', () => {
    it('should successfully signup a new user', async () => {
      const mockUserData = {
        id: '1',
        username: 'newuser',
        email: 'new@example.com',
        profile_pic: null,
      }

      vi.mocked(apiService.signup).mockResolvedValue(mockUserData)
      vi.mocked(apiService.login).mockResolvedValue(undefined)

      const store = useAuthStore()
      await store.signup('newuser', 'new@example.com', 'password123')

      expect(apiService.signup).toHaveBeenCalledWith({
        username: 'newuser',
        email: 'new@example.com',
        password: 'password123',
      })
      expect(apiService.login).toHaveBeenCalledWith({
        username: 'newuser',
        password: 'password123',
      })
      expect(store.user).toEqual({
        id: '1',
        name: 'newuser',
        email: 'new@example.com',
        avatarUrl: expect.stringContaining('unsplash.com'),
        bio: undefined,
        newsletter_subscribed: false,
        followers: [],
        following: [],
        followed_magazines: [],
      })
      expect(store.isAuthenticated).toBe(true)
    })

    it('should show welcome toast on successful signup', async () => {
      const mockUserData = {
        id: '1',
        username: 'newuser',
        email: 'new@example.com',
      }

      vi.mocked(apiService.signup).mockResolvedValue(mockUserData)
      vi.mocked(apiService.login).mockResolvedValue(undefined)

      const store = useAuthStore()
      const toastStore = useToastStore()
      const showSpy = vi.spyOn(toastStore, 'show')

      await store.signup('newuser', 'new@example.com', 'password123')

      expect(showSpy).toHaveBeenCalledWith('Welcome to Flipboard, newuser!')
    })

    it('should show error toast and throw on signup failure', async () => {
      vi.mocked(apiService.signup).mockRejectedValue(new Error('Email already exists'))

      const store = useAuthStore()
      const toastStore = useToastStore()
      const showSpy = vi.spyOn(toastStore, 'show')

      await expect(
        store.signup('newuser', 'existing@example.com', 'password123')
      ).rejects.toThrow('Email already exists')

      expect(showSpy).toHaveBeenCalledWith('Email already exists', 'error')
      expect(store.user).toBeNull()
      expect(store.isAuthenticated).toBe(false)
    })

    it('should handle login failure after successful signup', async () => {
      const mockUserData = {
        id: '1',
        username: 'newuser',
        email: 'new@example.com',
      }

      vi.mocked(apiService.signup).mockResolvedValue(mockUserData)
      vi.mocked(apiService.login).mockRejectedValue(new Error('Auto-login failed'))

      const store = useAuthStore()
      const toastStore = useToastStore()
      const showSpy = vi.spyOn(toastStore, 'show')

      await expect(
        store.signup('newuser', 'new@example.com', 'password123')
      ).rejects.toThrow('Auto-login failed')

      expect(showSpy).toHaveBeenCalledWith('Auto-login failed', 'error')
    })
  })

  describe('logout()', () => {
    it('should clear user data and token', () => {
      const store = useAuthStore()

      // Set up authenticated state
      store.user = {
        id: '1',
        name: 'testuser',
        email: 'test@example.com',
        avatarUrl: 'https://example.com/pic.jpg',
        newsletter_subscribed: false,
        followers: [],
        following: [],
        followed_magazines: []
      }
      store.isAuthenticated = true
      localStorageMock.token = 'some-token'

      store.logout()

      expect(store.user).toBeNull()
      expect(store.isAuthenticated).toBe(false)
      expect(localStorage.removeItem).toHaveBeenCalledWith('token')
    })

    it('should show logout toast', () => {
      const store = useAuthStore()
      const toastStore = useToastStore()
      const showSpy = vi.spyOn(toastStore, 'show')

      store.user = {
        id: '1',
        name: 'testuser',
        email: 'test@example.com',
        avatarUrl: 'https://example.com/pic.jpg',
        newsletter_subscribed: false,
        followers: [],
        following: [],
        followed_magazines: []
      }
      store.isAuthenticated = true

      store.logout()

      expect(showSpy).toHaveBeenCalledWith('You have been logged out.', 'info')
    })

    it('should work when already logged out', () => {
      const store = useAuthStore()

      expect(() => store.logout()).not.toThrow()
      expect(store.user).toBeNull()
      expect(store.isAuthenticated).toBe(false)
    })
  })
})
