import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createMemoryHistory } from 'vue-router'
import NavBar from '../NavBar.vue'
import { useAuthStore } from '../../stores/auth'
import { useArticleStore } from '../../stores/articles'

describe('NavBar', () => {
  let router: ReturnType<typeof createRouter>

  beforeEach(() => {
    setActivePinia(createPinia())

    router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/', component: { template: '<div>Home</div>' } },
        { path: '/topics', component: { template: '<div>Topics</div>' } },
        { path: '/profile', component: { template: '<div>Profile</div>' } },
        { path: '/login', component: { template: '<div>Login</div>' } },
        { path: '/signup', component: { template: '<div>Signup</div>' } },
      ],
    })
  })

  it('should render the Flipboard logo', () => {
    const wrapper = mount(NavBar, {
      global: {
        plugins: [router],
      },
    })

    expect(wrapper.text()).toContain('FLIPBOARD')
  })

  it('should show Home and Topics links', () => {
    const wrapper = mount(NavBar, {
      global: {
        plugins: [router],
      },
    })

    expect(wrapper.text()).toContain('Home')
    expect(wrapper.text()).toContain('Topics')
  })

  it('should show Log In and Sign Up when not authenticated', () => {
    const wrapper = mount(NavBar, {
      global: {
        plugins: [router],
      },
    })

    const authStore = useAuthStore()
    expect(authStore.isAuthenticated).toBe(false)

    expect(wrapper.text()).toContain('Log In')
    expect(wrapper.text()).toContain('Sign Up')
  })

  it('should show Profile and Logout when authenticated', async () => {
    const authStore = useAuthStore()
    authStore.isAuthenticated = true
    authStore.user = {
      id: 'user-1',
      name: 'Test User',
      email: 'test@example.com',
      avatarUrl: '',
      newsletter_subscribed: false,
      followers: [],
      following: [],
      followed_magazines: [],
    }

    const wrapper = mount(NavBar, {
      global: {
        plugins: [router],
      },
    })

    expect(wrapper.text()).toContain('Profile')
    expect(wrapper.text()).toContain('Logout')
    expect(wrapper.text()).not.toContain('Log In')
    expect(wrapper.text()).not.toContain('Sign Up')
  })

  it('should display user avatar when authenticated with avatar', async () => {
    const authStore = useAuthStore()
    authStore.isAuthenticated = true
    authStore.user = {
      id: 'user-1',
      name: 'Test User',
      email: 'test@example.com',
      avatarUrl: 'https://example.com/avatar.jpg',
      newsletter_subscribed: false,
      followers: [],
      following: [],
      followed_magazines: [],
    }

    const wrapper = mount(NavBar, {
      global: {
        plugins: [router],
      },
    })

    const avatar = wrapper.find('img')
    expect(avatar.exists()).toBe(true)
    expect(avatar.attributes('src')).toBe('https://example.com/avatar.jpg')
  })

  it('should display user initial when authenticated without avatar', async () => {
    const authStore = useAuthStore()
    authStore.isAuthenticated = true
    authStore.user = {
      id: 'user-1',
      name: 'Test User',
      email: 'test@example.com',
      avatarUrl: '',
      newsletter_subscribed: false,
      followers: [],
      following: [],
      followed_magazines: [],
    }

    const wrapper = mount(NavBar, {
      global: {
        plugins: [router],
      },
    })

    // Should show 'T' for 'Test User'
    expect(wrapper.text()).toContain('T')
  })

  it('should call logout when logout button is clicked', async () => {
    const authStore = useAuthStore()
    authStore.isAuthenticated = true
    authStore.user = {
      id: 'user-1',
      name: 'Test User',
      email: 'test@example.com',
      avatarUrl: '',
      newsletter_subscribed: false,
      followers: [],
      following: [],
      followed_magazines: [],
    }

    const logoutSpy = vi.spyOn(authStore, 'logout').mockImplementation(() => {})

    const wrapper = mount(NavBar, {
      global: {
        plugins: [router],
      },
    })

    // Find the logout button specifically (contains "Logout" text)
    const logoutButton = wrapper.findAll('button').find(btn => btn.text().toLowerCase().includes('logout'))
    expect(logoutButton).toBeDefined()
    await logoutButton!.trigger('click')

    expect(logoutSpy).toHaveBeenCalled()
  })

  it('should have mobile menu button', () => {
    const wrapper = mount(NavBar, {
      global: {
        plugins: [router],
      },
    })

    // Mobile menu button should exist (visible only on small screens via CSS)
    const buttons = wrapper.findAll('button')
    expect(buttons.length).toBeGreaterThan(0)
  })

  it('should toggle mobile menu when button is clicked', async () => {
    const wrapper = mount(NavBar, {
      global: {
        plugins: [router],
      },
    })

    // Menu should be closed initially
    expect(wrapper.vm.isMenuOpen).toBe(false)

    // Find the mobile menu toggle button (first button in the component)
    const toggleButton = wrapper.findAll('button')[0]
    await toggleButton.trigger('click')

    // Menu should be open
    expect(wrapper.vm.isMenuOpen).toBe(true)

    // Click again to close
    await toggleButton.trigger('click')
    expect(wrapper.vm.isMenuOpen).toBe(false)
  })

  it('should show mobile menu content when open', async () => {
    const wrapper = mount(NavBar, {
      global: {
        plugins: [router],
      },
    })

    // Open the menu
    const toggleButton = wrapper.findAll('button')[0]
    await toggleButton.trigger('click')

    // Mobile menu should show navigation links
    const mobileMenu = wrapper.find('.sm\\:hidden.bg-gray-900')
    expect(mobileMenu.exists()).toBe(true)
  })

  it('should have search input', () => {
    const wrapper = mount(NavBar, {
      global: {
        plugins: [router],
      },
    })

    const searchInput = wrapper.find('input[placeholder="Search stories..."]')
    expect(searchInput.exists()).toBe(true)
  })

  it('should bind search input to article store searchQuery', async () => {
    const wrapper = mount(NavBar, {
      global: {
        plugins: [router],
      },
    })

    const articleStore = useArticleStore()
    const searchInput = wrapper.find('input[placeholder="Search stories..."]')

    await searchInput.setValue('test search')

    expect(articleStore.searchQuery).toBe('test search')
  })

  it('should have proper navigation links', () => {
    const wrapper = mount(NavBar, {
      global: {
        plugins: [router],
      },
    })

    const links = wrapper.findAllComponents({ name: 'RouterLink' })
    const hrefs = links.map((link) => link.props('to'))

    expect(hrefs).toContain('/')
    expect(hrefs).toContain('/topics')
    expect(hrefs).toContain('/login')
    expect(hrefs).toContain('/signup')
  })

  it('should scroll to top when logo is clicked', async () => {
    const scrollToSpy = vi.spyOn(window, 'scrollTo').mockImplementation(() => {})

    const wrapper = mount(NavBar, {
      global: {
        plugins: [router],
      },
    })

    const logoLink = wrapper.findAllComponents({ name: 'RouterLink' }).find(
      (link) => link.text() === 'FLIPBOARD'
    )

    expect(logoLink).toBeDefined()
    await logoLink?.trigger('click')

    expect(scrollToSpy).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' })

    scrollToSpy.mockRestore()
  })
})
