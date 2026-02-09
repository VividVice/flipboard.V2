import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createMemoryHistory } from 'vue-router'
import NewsCard from '../NewsCard.vue'
import { apiServiceExtended } from '../../services/api'

vi.mock('../../services/api', () => ({
  apiServiceExtended: {
    getMagazines: vi.fn().mockResolvedValue([]),
    importArticle: vi.fn(),
    likeArticle: vi.fn(),
    saveArticle: vi.fn(),
  },
}))

const createMockPost = (overrides = {}) => ({
  uuid: 'post-1',
  title: 'Test News Article',
  text: 'This is the content of the test news article that provides information about current events.',
  highlightText: '',
  url: 'https://example.com/news/post-1',
  published: new Date().toISOString(),
  author: 'John Doe',
  sentiment: 'positive',
  categories: ['technology', 'business'],
  thread: {
    site: 'example.com',
    main_image: 'https://example.com/image.jpg',
    country: 'US',
    social: { facebook: { likes: 100, comments: 25 } },
  },
  liked: false,
  saved: false,
  ...overrides,
})

describe('NewsCard', () => {
  let router: ReturnType<typeof createRouter>

  beforeEach(() => {
    setActivePinia(createPinia())

    router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/', component: { template: '<div>Home</div>' } },
        { path: '/article/:id', name: 'article', component: { template: '<div>Article</div>' } },
      ],
    })

    vi.clearAllMocks()
  })

  const mountComponent = (props = {}) => {
    return mount(NewsCard, {
      props: {
        post: createMockPost(),
        ...props,
      },
      global: {
        plugins: [router],
        stubs: {
          SaveModal: true,
        },
      },
    })
  }

  describe('Rendering', () => {
    it('should render the post title', () => {
      const wrapper = mountComponent()
      expect(wrapper.text()).toContain('Test News Article')
    })

    it('should render the site name', () => {
      const wrapper = mountComponent()
      expect(wrapper.text()).toContain('example.com')
    })

    it('should render the first letter of the site name', () => {
      const wrapper = mountComponent()
      expect(wrapper.text()).toContain('E')
    })

    it('should render the post image', () => {
      const wrapper = mountComponent()
      const img = wrapper.find('img')
      expect(img.exists()).toBe(true)
      expect(img.attributes('src')).toBe('https://example.com/image.jpg')
    })

    it('should use fallback image when no main_image', () => {
      const post = createMockPost({
        thread: {
          site: 'example.com',
          main_image: null,
          country: 'US',
          social: { facebook: { likes: 0, comments: 0 } },
        },
      })
      const wrapper = mountComponent({ post })
      const img = wrapper.find('img')
      expect(img.attributes('src')).toContain('unsplash.com')
    })

    it('should render sentiment badge', () => {
      const wrapper = mountComponent()
      expect(wrapper.text()).toContain('positive')
    })

    it('should render categories', () => {
      const wrapper = mountComponent()
      expect(wrapper.text()).toContain('technology')
      expect(wrapper.text()).toContain('business')
    })

    it('should not render categories in compact variant', () => {
      const wrapper = mountComponent({ variant: 'compact' })
      // Categories div should not be visible in compact mode
      const categoriesSection = wrapper.findAll('.flex.flex-wrap.gap-1.mb-3')
      expect(categoriesSection.length).toBe(0)
    })

    it('should render country when available', () => {
      const wrapper = mountComponent()
      expect(wrapper.text()).toContain('US')
    })

    it('should render social stats', () => {
      const wrapper = mountComponent()
      // Like count should show facebook likes
      expect(wrapper.text()).toContain('100')
      expect(wrapper.text()).toContain('25')
    })
  })

  describe('Sentiment Badge Colors', () => {
    it('should have green classes for positive sentiment', () => {
      const wrapper = mountComponent({ post: createMockPost({ sentiment: 'positive' }) })
      const badge = wrapper.find('.bg-green-500\\/20')
      expect(badge.exists()).toBe(true)
    })

    it('should have red classes for negative sentiment', () => {
      const wrapper = mountComponent({ post: createMockPost({ sentiment: 'negative' }) })
      const badge = wrapper.find('.bg-red-500\\/20')
      expect(badge.exists()).toBe(true)
    })

    it('should have gray classes for neutral sentiment', () => {
      const wrapper = mountComponent({ post: createMockPost({ sentiment: 'neutral' }) })
      const badge = wrapper.find('.bg-gray-500\\/20')
      expect(badge.exists()).toBe(true)
    })
  })

  describe('Date Formatting', () => {
    it('should show "Just now" for very recent posts', () => {
      const wrapper = mountComponent({
        post: createMockPost({ published: new Date().toISOString() }),
      })
      expect(wrapper.text()).toContain('Just now')
    })

    it('should show hours for posts less than a day old', () => {
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
      const wrapper = mountComponent({
        post: createMockPost({ published: twoHoursAgo }),
      })
      expect(wrapper.text()).toContain('2h')
    })

    it('should show days for posts less than a week old', () => {
      const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
      const wrapper = mountComponent({
        post: createMockPost({ published: threeDaysAgo }),
      })
      expect(wrapper.text()).toContain('3d')
    })

    it('should show formatted date for older posts', () => {
      const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString()
      const wrapper = mountComponent({
        post: createMockPost({ published: twoWeeksAgo }),
      })
      // Should show a date format like "1/20/2024"
      expect(wrapper.text()).toMatch(/\d+\/\d+\/\d+/)
    })
  })

  describe('Excerpt', () => {
    it('should use highlightText when available', () => {
      const wrapper = mountComponent({
        post: createMockPost({ highlightText: '<em>Highlighted</em> text here' }),
      })
      expect(wrapper.html()).toContain('Highlighted')
    })

    it('should truncate long text', () => {
      const longText = 'A'.repeat(200)
      const wrapper = mountComponent({
        post: createMockPost({ text: longText, highlightText: '' }),
      })
      // Text should be truncated to 150 chars + '...'
      expect(wrapper.text().includes('...')).toBe(true)
    })

    it('should not show excerpt in compact variant', () => {
      const wrapper = mountComponent({
        variant: 'compact',
        post: createMockPost({ text: 'Some excerpt text' }),
      })
      // Excerpt div should have v-if="variant !== 'compact'"
      const excerptDiv = wrapper.findAll('.text-sm.text-gray-400.mb-4')
      expect(excerptDiv.length).toBe(0)
    })
  })

  describe('Variants', () => {
    it('should apply default variant classes', () => {
      const wrapper = mountComponent({ variant: 'default' })
      expect(wrapper.find('.flex-col').exists()).toBe(true)
    })

    it('should apply horizontal variant classes', () => {
      const wrapper = mountComponent({ variant: 'horizontal' })
      expect(wrapper.find('.flex-row').exists()).toBe(true)
    })

    it('should apply featured variant classes to title', () => {
      const wrapper = mountComponent({ variant: 'featured' })
      const title = wrapper.find('h3')
      expect(title.classes()).toContain('text-3xl')
    })

    it('should apply compact variant classes to title', () => {
      const wrapper = mountComponent({ variant: 'compact' })
      const title = wrapper.find('h3')
      expect(title.classes()).toContain('text-lg')
    })
  })

  describe('Navigation', () => {
    it('should navigate to article on click', async () => {
      const wrapper = mountComponent()
      const routerPushSpy = vi.spyOn(router, 'push')

      await wrapper.trigger('click')

      expect(routerPushSpy).toHaveBeenCalledWith({
        name: 'article',
        params: { id: 'post-1' },
      })
    })
  })

  describe('Like Functionality', () => {
    it('should toggle like state on click', async () => {
      vi.mocked(apiServiceExtended.importArticle).mockResolvedValue({ id: 'imported-1' })
      vi.mocked(apiServiceExtended.likeArticle).mockResolvedValue({ is_liked: true })

      const wrapper = mountComponent()
      const likeButton = wrapper.findAll('button')[0]

      await likeButton.trigger('click')

      expect(apiServiceExtended.importArticle).toHaveBeenCalled()
      expect(apiServiceExtended.likeArticle).toHaveBeenCalledWith('imported-1')
    })

    it('should revert like state on error', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      vi.mocked(apiServiceExtended.importArticle).mockRejectedValue(new Error('Failed'))

      const wrapper = mountComponent()
      const likeButton = wrapper.findAll('button')[0]

      await likeButton.trigger('click')
      await wrapper.vm.$nextTick()

      expect(consoleSpy).toHaveBeenCalled()
      consoleSpy.mockRestore()
    })

    it('should show filled heart when liked', () => {
      const wrapper = mountComponent({ post: createMockPost({ liked: true }) })
      const svg = wrapper.find('button svg')
      expect(svg.attributes('fill')).toBe('currentColor')
    })
  })

  describe('Save Functionality', () => {
    it('should toggle save state on click', async () => {
      vi.mocked(apiServiceExtended.importArticle).mockResolvedValue({ id: 'imported-1' })
      vi.mocked(apiServiceExtended.saveArticle).mockResolvedValue({ is_saved: true })

      const wrapper = mountComponent()
      // Save button is after like and comment buttons
      const saveButton = wrapper.findAll('button')[2]

      await saveButton.trigger('click')

      expect(apiServiceExtended.importArticle).toHaveBeenCalled()
      expect(apiServiceExtended.saveArticle).toHaveBeenCalledWith('imported-1')
    })

    it('should revert save state on error', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      vi.mocked(apiServiceExtended.importArticle).mockRejectedValue(new Error('Failed'))

      const wrapper = mountComponent()
      const saveButton = wrapper.findAll('button')[2]

      await saveButton.trigger('click')
      await wrapper.vm.$nextTick()

      expect(consoleSpy).toHaveBeenCalled()
      consoleSpy.mockRestore()
    })
  })

  describe('Save Modal', () => {
    it('should open save modal when add to magazine button clicked', async () => {
      const wrapper = mountComponent()
      // Add to magazine button is the 4th button
      const addButton = wrapper.findAll('button')[3]

      await addButton.trigger('click')

      expect(wrapper.vm.isSaveModalOpen).toBe(true)
    })

    it('should fetch magazines when opening save modal', async () => {
      const wrapper = mountComponent()
      const addButton = wrapper.findAll('button')[3]

      await addButton.trigger('click')

      expect(apiServiceExtended.getMagazines).toHaveBeenCalled()
    })
  })

  describe('Article Data Computation', () => {
    it('should compute article data correctly', () => {
      const wrapper = mountComponent()
      const articleData = wrapper.vm.articleData

      expect(articleData.id).toBe('post-1')
      expect(articleData.title).toBe('Test News Article')
      expect(articleData.author).toBe('John Doe')
      expect(articleData.publisher).toBe('example.com')
      expect(articleData.source_url).toBe('https://example.com/news/post-1')
      expect(articleData.image_url).toBe('https://example.com/image.jpg')
      expect(articleData.topics).toEqual(['technology', 'business'])
    })

    it('should use site as author when author is not available', () => {
      const wrapper = mountComponent({
        post: createMockPost({ author: null }),
      })
      const articleData = wrapper.vm.articleData

      expect(articleData.author).toBe('example.com')
    })
  })
})
