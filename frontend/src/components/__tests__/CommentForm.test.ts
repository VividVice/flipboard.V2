import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createMemoryHistory } from 'vue-router'
import CommentForm from '../CommentForm.vue'
import { useAuthStore } from '../../stores/auth'
import { useCommentsStore } from '../../stores/comments'

describe('CommentForm', () => {
  let router: any

  beforeEach(() => {
    setActivePinia(createPinia())

    router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/', component: { template: '<div>Home</div>' } },
        { path: '/login', component: { template: '<div>Login</div>' } },
      ],
    })
  })

  describe('When user is authenticated', () => {
    beforeEach(() => {
      const authStore = useAuthStore()
      authStore.user = {
        id: '1',
        name: 'Test User',
        email: 'test@example.com',
        avatarUrl: 'https://example.com/avatar.jpg',
      }
      authStore.isAuthenticated = true
    })

    it('should render comment form', () => {
      const wrapper = mount(CommentForm, {
        props: {
          articleId: 'article-1',
        },
        global: {
          plugins: [router],
        },
      })

      expect(wrapper.find('textarea').exists()).toBe(true)
      expect(wrapper.find('button').text()).toContain('Post Comment')
    })

    it('should display user avatar', () => {
      const wrapper = mount(CommentForm, {
        props: {
          articleId: 'article-1',
        },
        global: {
          plugins: [router],
        },
      })

      const avatar = wrapper.find('img')
      expect(avatar.exists()).toBe(true)
      expect(avatar.attributes('src')).toBe('https://example.com/avatar.jpg')
      expect(avatar.attributes('alt')).toBe('Test User')
    })

    it('should display user initial when no avatar URL', () => {
      const authStore = useAuthStore()
      authStore.user = {
        id: '1',
        name: 'Test User',
        email: 'test@example.com',
        avatarUrl: '',
      }

      const wrapper = mount(CommentForm, {
        props: {
          articleId: 'article-1',
        },
        global: {
          plugins: [router],
        },
      })

      expect(wrapper.text()).toContain('T')
    })

    it('should enable submit button when text is entered', async () => {
      const wrapper = mount(CommentForm, {
        props: {
          articleId: 'article-1',
        },
        global: {
          plugins: [router],
        },
      })

      const textarea = wrapper.find('textarea')
      const button = wrapper.find('button')

      expect(button.attributes('disabled')).toBeDefined()

      await textarea.setValue('This is a test comment')

      expect(button.attributes('disabled')).toBeUndefined()
    })

    it('should disable submit button when text is only whitespace', async () => {
      const wrapper = mount(CommentForm, {
        props: {
          articleId: 'article-1',
        },
        global: {
          plugins: [router],
        },
      })

      const textarea = wrapper.find('textarea')
      const button = wrapper.find('button')

      await textarea.setValue('   ')

      expect(button.attributes('disabled')).toBeDefined()
    })

    it('should call createComment when form is submitted', async () => {
      const wrapper = mount(CommentForm, {
        props: {
          articleId: 'article-1',
        },
        global: {
          plugins: [router],
        },
      })

      const commentsStore = useCommentsStore()
      const createCommentSpy = vi.spyOn(commentsStore, 'createComment').mockResolvedValue()

      const textarea = wrapper.find('textarea')
      const button = wrapper.find('button')

      await textarea.setValue('This is a test comment')
      await button.trigger('click')

      expect(createCommentSpy).toHaveBeenCalledWith('article-1', 'This is a test comment')
    })

    it('should clear textarea after successful submission', async () => {
      const wrapper = mount(CommentForm, {
        props: {
          articleId: 'article-1',
        },
        global: {
          plugins: [router],
        },
      })

      const commentsStore = useCommentsStore()
      vi.spyOn(commentsStore, 'createComment').mockResolvedValue()

      const textarea = wrapper.find('textarea')
      const button = wrapper.find('button')

      await textarea.setValue('This is a test comment')
      await button.trigger('click')

      // Wait for async operation
      await wrapper.vm.$nextTick()
      await new Promise((resolve) => setTimeout(resolve, 0))

      expect((textarea.element as HTMLTextAreaElement).value).toBe('')
    })

    it('should trim whitespace before submitting', async () => {
      const wrapper = mount(CommentForm, {
        props: {
          articleId: 'article-1',
        },
        global: {
          plugins: [router],
        },
      })

      const commentsStore = useCommentsStore()
      const createCommentSpy = vi.spyOn(commentsStore, 'createComment').mockResolvedValue()

      const textarea = wrapper.find('textarea')
      const button = wrapper.find('button')

      await textarea.setValue('  Test comment with spaces  ')
      await button.trigger('click')

      expect(createCommentSpy).toHaveBeenCalledWith('article-1', 'Test comment with spaces')
    })

    it('should show loading state while submitting', async () => {
      const wrapper = mount(CommentForm, {
        props: {
          articleId: 'article-1',
        },
        global: {
          plugins: [router],
        },
      })

      const commentsStore = useCommentsStore()
      let resolvePromise: any
      const promise = new Promise((resolve) => {
        resolvePromise = resolve
      })
      vi.spyOn(commentsStore, 'createComment').mockReturnValue(promise as any)

      const textarea = wrapper.find('textarea')
      const button = wrapper.find('button')

      await textarea.setValue('Test comment')
      await button.trigger('click')

      expect(button.text()).toContain('Posting...')
      expect(button.attributes('disabled')).toBeDefined()

      resolvePromise()
      await wrapper.vm.$nextTick()
    })

    it('should disable textarea while submitting', async () => {
      const wrapper = mount(CommentForm, {
        props: {
          articleId: 'article-1',
        },
        global: {
          plugins: [router],
        },
      })

      const commentsStore = useCommentsStore()
      let resolvePromise: any
      const promise = new Promise((resolve) => {
        resolvePromise = resolve
      })
      vi.spyOn(commentsStore, 'createComment').mockReturnValue(promise as any)

      const textarea = wrapper.find('textarea')
      const button = wrapper.find('button')

      await textarea.setValue('Test comment')
      await button.trigger('click')

      expect(textarea.attributes('disabled')).toBeDefined()

      resolvePromise()
      await wrapper.vm.$nextTick()
    })

    it('should submit on Ctrl+Enter', async () => {
      const wrapper = mount(CommentForm, {
        props: {
          articleId: 'article-1',
        },
        global: {
          plugins: [router],
        },
      })

      const commentsStore = useCommentsStore()
      const createCommentSpy = vi.spyOn(commentsStore, 'createComment').mockResolvedValue()

      const textarea = wrapper.find('textarea')

      await textarea.setValue('Test comment')
      await textarea.trigger('keydown', { key: 'Enter', ctrlKey: true })

      expect(createCommentSpy).toHaveBeenCalledWith('article-1', 'Test comment')
    })

    it('should submit on Cmd+Enter', async () => {
      const wrapper = mount(CommentForm, {
        props: {
          articleId: 'article-1',
        },
        global: {
          plugins: [router],
        },
      })

      const commentsStore = useCommentsStore()
      const createCommentSpy = vi.spyOn(commentsStore, 'createComment').mockResolvedValue()

      const textarea = wrapper.find('textarea')

      await textarea.setValue('Test comment')
      await textarea.trigger('keydown', { key: 'Enter', metaKey: true })

      expect(createCommentSpy).toHaveBeenCalledWith('article-1', 'Test comment')
    })

    it('should not submit on Enter alone', async () => {
      const wrapper = mount(CommentForm, {
        props: {
          articleId: 'article-1',
        },
        global: {
          plugins: [router],
        },
      })

      const commentsStore = useCommentsStore()
      const createCommentSpy = vi.spyOn(commentsStore, 'createComment')

      const textarea = wrapper.find('textarea')

      await textarea.setValue('Test comment')
      await textarea.trigger('keydown', { key: 'Enter' })

      expect(createCommentSpy).not.toHaveBeenCalled()
    })

    it('should show keyboard shortcut hint', () => {
      const wrapper = mount(CommentForm, {
        props: {
          articleId: 'article-1',
        },
        global: {
          plugins: [router],
        },
      })

      expect(wrapper.text()).toContain('Ctrl+Enter')
      expect(wrapper.text()).toContain('Cmd+Enter')
    })
  })

  describe('When user is not authenticated', () => {
    beforeEach(() => {
      const authStore = useAuthStore()
      authStore.user = null
      authStore.isAuthenticated = false
    })

    it('should show login prompt instead of form', () => {
      const wrapper = mount(CommentForm, {
        props: {
          articleId: 'article-1',
        },
        global: {
          plugins: [router],
        },
      })

      expect(wrapper.text()).toContain('Please login to join the conversation')
      expect(wrapper.find('textarea').exists()).toBe(false)
    })

    it('should display login button', () => {
      const wrapper = mount(CommentForm, {
        props: {
          articleId: 'article-1',
        },
        global: {
          plugins: [router],
        },
      })

      const loginLink = wrapper.findComponent({ name: 'RouterLink' })
      expect(loginLink.exists()).toBe(true)
      expect(loginLink.props('to')).toBe('/login')
      expect(loginLink.text()).toBe('Login to Comment')
    })

    it('should display lock icon', () => {
      const wrapper = mount(CommentForm, {
        props: {
          articleId: 'article-1',
        },
        global: {
          plugins: [router],
        },
      })

      const lockIcon = wrapper.find('svg')
      expect(lockIcon.exists()).toBe(true)
      expect(lockIcon.attributes('viewBox')).toBe('0 0 24 24')
    })
  })
})
