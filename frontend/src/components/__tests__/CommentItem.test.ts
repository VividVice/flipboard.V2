import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createMemoryHistory } from 'vue-router'
import CommentItem from '../CommentItem.vue'
import { useAuthStore } from '../../stores/auth'
import { useCommentsStore } from '../../stores/comments'

// Mock ConfirmModal component
vi.mock('../ConfirmModal.vue', () => ({
  default: {
    name: 'ConfirmModal',
    props: ['isOpen', 'title', 'message', 'confirmText', 'cancelText'],
    template: '<div class="confirm-modal-mock" v-if="isOpen"><slot /></div>',
    emits: ['confirm', 'cancel'],
  },
}))

const mockComment = {
  id: 'comment-1',
  content: 'This is a test comment',
  author: {
    id: 'author-1',
    name: 'Test Author',
    avatarUrl: 'https://example.com/avatar.jpg',
  },
  createdAt: new Date().toISOString(),
  updatedAt: null,
}

const mockCommentWithArticle = {
  ...mockComment,
  articleId: 'article-1',
  articleTitle: 'Test Article Title',
}

describe('CommentItem', () => {
  let router: ReturnType<typeof createRouter>

  beforeEach(() => {
    setActivePinia(createPinia())

    router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/', component: { template: '<div>Home</div>' } },
        { path: '/user/:username', component: { template: '<div>User</div>' } },
        { path: '/article/:id', component: { template: '<div>Article</div>' } },
      ],
    })
  })

  it('should render comment content', () => {
    const wrapper = mount(CommentItem, {
      props: {
        comment: mockComment,
        articleId: 'article-1',
      },
      global: {
        plugins: [router],
      },
    })

    expect(wrapper.text()).toContain('This is a test comment')
  })

  it('should render author name', () => {
    const wrapper = mount(CommentItem, {
      props: {
        comment: mockComment,
        articleId: 'article-1',
      },
      global: {
        plugins: [router],
      },
    })

    expect(wrapper.text()).toContain('Test Author')
  })

  it('should display author avatar when provided', () => {
    const wrapper = mount(CommentItem, {
      props: {
        comment: mockComment,
        articleId: 'article-1',
      },
      global: {
        plugins: [router],
      },
    })

    const img = wrapper.find('img')
    expect(img.exists()).toBe(true)
    expect(img.attributes('src')).toBe('https://example.com/avatar.jpg')
  })

  it('should display author initial when no avatar', () => {
    const commentWithoutAvatar = {
      ...mockComment,
      author: {
        ...mockComment.author,
        avatarUrl: null,
      },
    }

    const wrapper = mount(CommentItem, {
      props: {
        comment: commentWithoutAvatar,
        articleId: 'article-1',
      },
      global: {
        plugins: [router],
      },
    })

    expect(wrapper.text()).toContain('T') // First letter of 'Test Author'
  })

  it('should not show edit/delete buttons for non-author', () => {
    const wrapper = mount(CommentItem, {
      props: {
        comment: mockComment,
        articleId: 'article-1',
      },
      global: {
        plugins: [router],
      },
    })

    expect(wrapper.text()).not.toContain('Modifier')
    expect(wrapper.text()).not.toContain('Supprimer')
  })

  it('should show edit/delete buttons for comment author', () => {
    const authStore = useAuthStore()
    authStore.user = {
      id: 'author-1', // Same as comment author
      name: 'Test Author',
      email: 'test@example.com',
      avatarUrl: null,
    }

    const wrapper = mount(CommentItem, {
      props: {
        comment: mockComment,
        articleId: 'article-1',
      },
      global: {
        plugins: [router],
      },
    })

    expect(wrapper.text()).toContain('Modifier')
    expect(wrapper.text()).toContain('Supprimer')
  })

  it('should enter edit mode when edit button is clicked', async () => {
    const authStore = useAuthStore()
    authStore.user = {
      id: 'author-1',
      name: 'Test Author',
      email: 'test@example.com',
      avatarUrl: null,
    }

    const wrapper = mount(CommentItem, {
      props: {
        comment: mockComment,
        articleId: 'article-1',
      },
      global: {
        plugins: [router],
      },
    })

    expect(wrapper.vm.isEditing).toBe(false)

    const editButton = wrapper.findAll('button').find((btn) => btn.text() === 'Modifier')
    await editButton?.trigger('click')

    expect(wrapper.vm.isEditing).toBe(true)
    expect(wrapper.find('textarea').exists()).toBe(true)
  })

  it('should cancel edit mode', async () => {
    const authStore = useAuthStore()
    authStore.user = {
      id: 'author-1',
      name: 'Test Author',
      email: 'test@example.com',
      avatarUrl: null,
    }

    const wrapper = mount(CommentItem, {
      props: {
        comment: mockComment,
        articleId: 'article-1',
      },
      global: {
        plugins: [router],
      },
    })

    // Enter edit mode
    const editButton = wrapper.findAll('button').find((btn) => btn.text() === 'Modifier')
    await editButton?.trigger('click')

    expect(wrapper.vm.isEditing).toBe(true)

    // Cancel edit
    const cancelButton = wrapper.findAll('button').find((btn) => btn.text() === 'Annuler')
    await cancelButton?.trigger('click')

    expect(wrapper.vm.isEditing).toBe(false)
  })

  it('should show error when saving empty comment', async () => {
    const authStore = useAuthStore()
    authStore.user = {
      id: 'author-1',
      name: 'Test Author',
      email: 'test@example.com',
      avatarUrl: null,
    }

    const wrapper = mount(CommentItem, {
      props: {
        comment: mockComment,
        articleId: 'article-1',
      },
      global: {
        plugins: [router],
      },
    })

    // Enter edit mode
    const editButton = wrapper.findAll('button').find((btn) => btn.text() === 'Modifier')
    await editButton?.trigger('click')

    // Clear the content
    const textarea = wrapper.find('textarea')
    await textarea.setValue('   ')

    // Try to save
    const saveButton = wrapper.findAll('button').find((btn) => btn.text() === 'Enregistrer')
    await saveButton?.trigger('click')

    expect(wrapper.vm.editError).toBe('Comment cannot be empty')
  })

  it('should call updateComment when saving valid edit', async () => {
    const authStore = useAuthStore()
    authStore.user = {
      id: 'author-1',
      name: 'Test Author',
      email: 'test@example.com',
      avatarUrl: null,
    }

    const commentsStore = useCommentsStore()
    const updateSpy = vi.spyOn(commentsStore, 'updateComment').mockResolvedValue(undefined)

    const wrapper = mount(CommentItem, {
      props: {
        comment: mockComment,
        articleId: 'article-1',
      },
      global: {
        plugins: [router],
      },
    })

    // Enter edit mode
    const editButton = wrapper.findAll('button').find((btn) => btn.text() === 'Modifier')
    await editButton?.trigger('click')

    // Update content
    const textarea = wrapper.find('textarea')
    await textarea.setValue('Updated comment content')

    // Save
    const saveButton = wrapper.findAll('button').find((btn) => btn.text() === 'Enregistrer')
    await saveButton?.trigger('click')

    expect(updateSpy).toHaveBeenCalledWith('comment-1', 'article-1', 'Updated comment content')
  })

  it('should show delete confirmation modal', async () => {
    const authStore = useAuthStore()
    authStore.user = {
      id: 'author-1',
      name: 'Test Author',
      email: 'test@example.com',
      avatarUrl: null,
    }

    const wrapper = mount(CommentItem, {
      props: {
        comment: mockComment,
        articleId: 'article-1',
      },
      global: {
        plugins: [router],
      },
    })

    expect(wrapper.vm.showDeleteConfirm).toBe(false)

    const deleteButton = wrapper.findAll('button').find((btn) => btn.text() === 'Supprimer')
    await deleteButton?.trigger('click')

    expect(wrapper.vm.showDeleteConfirm).toBe(true)
  })

  it('should call deleteComment when delete is confirmed', async () => {
    const authStore = useAuthStore()
    authStore.user = {
      id: 'author-1',
      name: 'Test Author',
      email: 'test@example.com',
      avatarUrl: null,
    }

    const commentsStore = useCommentsStore()
    const deleteSpy = vi.spyOn(commentsStore, 'deleteComment').mockResolvedValue(undefined)

    const wrapper = mount(CommentItem, {
      props: {
        comment: mockComment,
        articleId: 'article-1',
      },
      global: {
        plugins: [router],
      },
    })

    // Call confirmDelete directly
    await wrapper.vm.confirmDelete()

    expect(deleteSpy).toHaveBeenCalledWith('comment-1', 'article-1')
  })

  it('should format date as "Just now" for recent comments', () => {
    const recentComment = {
      ...mockComment,
      createdAt: new Date().toISOString(),
    }

    const wrapper = mount(CommentItem, {
      props: {
        comment: recentComment,
        articleId: 'article-1',
      },
      global: {
        plugins: [router],
      },
    })

    expect(wrapper.text()).toContain('Just now')
  })

  it('should format date with minutes for older comments', () => {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)
    const olderComment = {
      ...mockComment,
      createdAt: fiveMinutesAgo.toISOString(),
    }

    const wrapper = mount(CommentItem, {
      props: {
        comment: olderComment,
        articleId: 'article-1',
      },
      global: {
        plugins: [router],
      },
    })

    expect(wrapper.text()).toContain('5m ago')
  })

  it('should show article title when in profile view', () => {
    const wrapper = mount(CommentItem, {
      props: {
        comment: mockCommentWithArticle,
        articleId: 'article-1',
      },
      global: {
        plugins: [router],
      },
    })

    expect(wrapper.text()).toContain('Test Article Title')
    expect(wrapper.text()).toContain('Publié dans')
  })

  it('should show (modifié) indicator when comment is updated', () => {
    const updatedComment = {
      ...mockComment,
      updatedAt: new Date().toISOString(),
    }

    const wrapper = mount(CommentItem, {
      props: {
        comment: updatedComment,
        articleId: 'article-1',
      },
      global: {
        plugins: [router],
      },
    })

    expect(wrapper.text()).toContain('modifié')
  })

  it('should link to user profile', () => {
    const wrapper = mount(CommentItem, {
      props: {
        comment: mockComment,
        articleId: 'article-1',
      },
      global: {
        plugins: [router],
      },
    })

    const links = wrapper.findAllComponents({ name: 'RouterLink' })
    const userLink = links.find((link) => link.props('to') === '/user/Test Author')
    expect(userLink).toBeDefined()
  })

  it('should work with magazine comments', async () => {
    const authStore = useAuthStore()
    authStore.user = {
      id: 'author-1',
      name: 'Test Author',
      email: 'test@example.com',
      avatarUrl: null,
    }

    const commentsStore = useCommentsStore()
    const deleteSpy = vi.spyOn(commentsStore, 'deleteComment').mockResolvedValue(undefined)

    const wrapper = mount(CommentItem, {
      props: {
        comment: mockComment,
        magazineId: 'magazine-1',
      },
      global: {
        plugins: [router],
      },
    })

    // Call confirmDelete directly
    await wrapper.vm.confirmDelete()

    expect(deleteSpy).toHaveBeenCalledWith('comment-1', 'magazine-1', true)
  })
})
