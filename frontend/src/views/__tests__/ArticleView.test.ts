import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import ArticleView from '../ArticleView.vue'
import { apiServiceExtended, type Article } from '../../services/api'

// Mock components
vi.mock('../../components/CommentSection.vue', () => ({
  default: { name: 'CommentSection', props: ['articleId'], template: '<div id="comments-section"></div>' }
}))
vi.mock('../../components/SaveModal.vue', () => ({
  default: { name: 'SaveModal', props: ['isOpen', 'articleData', 'shouldImport'], template: '<div></div>' }
}))

// Mock API
vi.mock('../../services/api', () => ({
  apiServiceExtended: {
    getArticle: vi.fn(),
    importArticle: vi.fn(),
    getArticleContent: vi.fn(),
    likeArticle: vi.fn(),
    saveArticle: vi.fn(),
  }
}))

const mockGetArticleById = vi.fn()
const mockGetPostById = vi.fn()
const mockFetchUserMagazines = vi.fn()
const mockUpdatePostStatus = vi.fn()

vi.mock('../../stores/articles', () => ({
  useArticleStore: () => ({
    getArticleById: mockGetArticleById,
    articles: []
  })
}))

vi.mock('../../stores/news', () => ({
  useNewsStore: () => ({
    getPostById: mockGetPostById,
    updatePostStatus: mockUpdatePostStatus
  })
}))

vi.mock('../../stores/magazines', () => ({
  useMagazineStore: () => ({
    fetchUserMagazines: mockFetchUserMagazines
  })
}))

describe('ArticleView', () => {
  const router = createRouter({
    history: createWebHistory(),
    routes: [{ path: '/article/:id', component: { template: '<div></div>' } }]
  })

  const mockArticle = {
    id: '1',
    title: 'Test Title',
    content: 'Test content <p>Junk</p>',
    excerpt: 'Test excerpt',
    publisher: 'Test Pub',
    author: 'Test Author',
    source_url: 'http://example.com',
    image_url: 'http://example.com/img.jpg',
    published_at: '2024-01-01',
    topics: ['Tech'],
    liked: false,
    saved: false
  }

  beforeEach(async () => {
    setActivePinia(createPinia())
    router.push('/article/1')
    await router.isReady()
    
    mockGetArticleById.mockReset()
    mockGetPostById.mockReset()
    mockFetchUserMagazines.mockReset()
    mockUpdatePostStatus.mockReset()
    vi.mocked(apiServiceExtended.getArticleContent).mockResolvedValue({ content: '' })

    // Mock navigator
    Object.assign(global.navigator, {
      share: vi.fn(),
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined)
      }
    })
    
    // Mock scroll
    window.scrollTo = vi.fn()
    Element.prototype.scrollIntoView = vi.fn()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('should load article from articleStore on mount', async () => {
    mockGetArticleById.mockReturnValue({ ...mockArticle })
    
    const wrapper = mount(ArticleView, {
      global: {
        plugins: [router],
        stubs: ['Teleport']
      }
    })
    
    await flushPromises()
    expect(wrapper.text()).toContain('Test Title')
  })

  it('should fetch from API if not in store', async () => {
    mockGetArticleById.mockReturnValue(undefined)
    vi.mocked(apiServiceExtended.getArticle).mockResolvedValue({ ...mockArticle })
    
    const wrapper = mount(ArticleView, {
      global: {
        plugins: [router],
        stubs: ['Teleport']
      }
    })
    
    await flushPromises()
    expect(apiServiceExtended.getArticle).toHaveBeenCalledWith('1')
    expect(wrapper.text()).toContain('Test Title')
  })

  it('should try external news store if not in API', async () => {
    mockGetArticleById.mockReturnValue(undefined)
    vi.mocked(apiServiceExtended.getArticle).mockRejectedValue(new Error('not found'))
    
    const mockNewsPost = {
      uuid: '1',
      title: 'External Title',
      text: 'External content',
      author: 'Ext Author',
      url: 'http://ext.com',
      published: '2024',
      categories: ['ExtTopic'],
      thread: { site: 'ExtSite', main_image: '' }
    }
    mockGetPostById.mockReturnValue(mockNewsPost)
    vi.mocked(apiServiceExtended.importArticle).mockResolvedValue({ ...mockArticle, title: 'External Title', id: 'imported-1' } as unknown as Article)
    vi.mocked(apiServiceExtended.getArticleContent).mockResolvedValue({ content: 'Full scraped content' })

    const wrapper = mount(ArticleView, {
      global: {
        plugins: [router],
        stubs: ['Teleport']
      }
    })
    
    await flushPromises()
    expect(wrapper.text()).toContain('External Title')
    expect(apiServiceExtended.importArticle).toHaveBeenCalled()
    
    await flushPromises() 
    expect(wrapper.vm.article.content).toBe('Full scraped content')
  })

  it('should handle missing article (not found)', async () => {
    mockGetArticleById.mockReturnValue(undefined)
    vi.mocked(apiServiceExtended.getArticle).mockRejectedValue(new Error('404'))
    mockGetPostById.mockReturnValue(undefined)

    const wrapper = mount(ArticleView, {
      global: {
        plugins: [router],
        stubs: ['Teleport']
      }
    })
    
    await flushPromises()
    expect(wrapper.text()).toContain('Article not found')
  })

  it('should update scroll progress on scroll', async () => {
    mockGetArticleById.mockReturnValue({ ...mockArticle })
    
    const wrapper = mount(ArticleView, {
      global: {
        plugins: [router],
        stubs: ['Teleport']
      }
    })
    await flushPromises()

    Object.defineProperty(document.documentElement, 'scrollTop', { value: 500, configurable: true })
    Object.defineProperty(document.documentElement, 'scrollHeight', { value: 2000, configurable: true })
    Object.defineProperty(document.documentElement, 'clientHeight', { value: 1000, configurable: true })

    window.dispatchEvent(new Event('scroll'))
    expect(wrapper.vm.scrollProgress).toBe(50)
  })

  it('should handle like interaction', async () => {
    mockGetArticleById.mockReturnValue({ ...mockArticle })
    vi.mocked(apiServiceExtended.likeArticle).mockResolvedValue({ is_liked: true, is_saved: false })

    const wrapper = mount(ArticleView, {
      global: {
        plugins: [router],
        stubs: ['Teleport']
      }
    })
    await flushPromises()

    const likeButton = wrapper.findAll('button').find(b => b.text().includes('Like'))
    await likeButton?.trigger('click')

    expect(apiServiceExtended.likeArticle).toHaveBeenCalledWith('1')
    expect(wrapper.vm.article.liked).toBe(true)
  })

  it('should handle save interaction', async () => {
    mockGetArticleById.mockReturnValue({ ...mockArticle })
    vi.mocked(apiServiceExtended.saveArticle).mockResolvedValue({ is_liked: false, is_saved: true })

    const wrapper = mount(ArticleView, {
      global: {
        plugins: [router],
        stubs: ['Teleport']
      }
    })
    await flushPromises()

    const saveButton = wrapper.findAll('button').find(b => b.text().includes('Save'))
    await saveButton?.trigger('click')

    expect(apiServiceExtended.saveArticle).toHaveBeenCalledWith('1')
    expect(wrapper.vm.article.saved).toBe(true)
  })

  it('should handle share via navigator.share', async () => {
    mockGetArticleById.mockReturnValue({ ...mockArticle })
    
    const wrapper = mount(ArticleView, {
      global: {
        plugins: [router],
        stubs: ['Teleport']
      }
    })
    await flushPromises()

    const shareButton = wrapper.findAll('button').find(b => b.text().includes('Share'))
    await shareButton?.trigger('click')

    expect(navigator.share).toHaveBeenCalled()
  })

  it('should fallback to clipboard if navigator.share fails', async () => {
    mockGetArticleById.mockReturnValue({ ...mockArticle })
    vi.mocked(navigator.share).mockRejectedValue(new Error('fail'))
    
    const wrapper = mount(ArticleView, {
      global: {
        plugins: [router],
        stubs: ['Teleport']
      }
    })
    await flushPromises()

    const shareButton = wrapper.findAll('button').find(b => b.text().includes('Share'))
    await shareButton?.trigger('click')

    expect(navigator.clipboard.writeText).toHaveBeenCalled()
  })

  it('should open save modal and fetch user magazines', async () => {
    mockGetArticleById.mockReturnValue({ ...mockArticle })

    const wrapper = mount(ArticleView, {
      global: {
        plugins: [router],
        stubs: ['Teleport']
      }
    })
    await flushPromises()

    const flipButton = wrapper.findAll('button').find(b => b.text().includes('Flip'))
    await flipButton?.trigger('click')

    expect(wrapper.vm.isSaveModalOpen).toBe(true)
    expect(mockFetchUserMagazines).toHaveBeenCalled()
  })

  it('should scroll to comments section', async () => {
    mockGetArticleById.mockReturnValue({ ...mockArticle })
    
    const wrapper = mount(ArticleView, {
      global: {
        plugins: [router],
        stubs: ['Teleport']
      },
      attachTo: document.body
    })
    await flushPromises()

    const commentButton = wrapper.findAll('button').find(b => b.text().includes('Comment'))
    await commentButton?.trigger('click')
    await flushPromises()

    expect(Element.prototype.scrollIntoView).toHaveBeenCalled()
    wrapper.unmount()
  })

  it('should clean content correctly', async () => {
    const contentWithJunk = 'Real content. More from Test'
    mockGetArticleById.mockReturnValue({ ...mockArticle, content: contentWithJunk })
    
    const wrapper = mount(ArticleView, {
      global: {
        plugins: [router],
        stubs: ['Teleport']
      }
    })
    await flushPromises()

    expect(wrapper.vm.cleanContent).toContain('Real content.')
    expect(wrapper.vm.cleanContent).not.toContain('More from Test')
  })
})
