import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useToastStore } from '../toast'

describe('Toast Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Initial State', () => {
    it('should initialize with empty toasts array', () => {
      const store = useToastStore()
      expect(store.toasts).toEqual([])
    })
  })

  describe('show()', () => {
    it('should add a success toast with default type', () => {
      const store = useToastStore()
      store.show('Test message')

      expect(store.toasts).toHaveLength(1)
      expect(store.toasts[0].message).toBe('Test message')
      expect(store.toasts[0].type).toBe('success')
      expect(store.toasts[0].id).toBeDefined()
    })

    it('should add an error toast when type is error', () => {
      const store = useToastStore()
      store.show('Error message', 'error')

      expect(store.toasts).toHaveLength(1)
      expect(store.toasts[0].message).toBe('Error message')
      expect(store.toasts[0].type).toBe('error')
    })

    it('should add an info toast when type is info', () => {
      const store = useToastStore()
      store.show('Info message', 'info')

      expect(store.toasts).toHaveLength(1)
      expect(store.toasts[0].message).toBe('Info message')
      expect(store.toasts[0].type).toBe('info')
    })

    it('should add multiple toasts', () => {
      const store = useToastStore()
      store.show('First message')
      store.show('Second message')

      expect(store.toasts).toHaveLength(2)
      expect(store.toasts[0].message).toBe('First message')
      expect(store.toasts[1].message).toBe('Second message')
    })

    it('should generate unique IDs for each toast', () => {
      const store = useToastStore()
      store.show('First')
      vi.advanceTimersByTime(1) // Advance time by 1ms to ensure different timestamp
      store.show('Second')

      expect(store.toasts[0].id).not.toBe(store.toasts[1].id)
    })

    it('should auto-remove toast after 3 seconds', () => {
      const store = useToastStore()
      store.show('Auto-remove message')

      expect(store.toasts).toHaveLength(1)

      vi.advanceTimersByTime(3000)

      expect(store.toasts).toHaveLength(0)
    })

    it('should handle multiple toasts with auto-removal', () => {
      const store = useToastStore()
      store.show('First')
      vi.advanceTimersByTime(1000)
      store.show('Second')
      vi.advanceTimersByTime(1000)
      store.show('Third')

      expect(store.toasts).toHaveLength(3)

      // After 1 more second (total 2s), first should be removed (3s total)
      vi.advanceTimersByTime(1000)
      expect(store.toasts).toHaveLength(2)
      expect(store.toasts[0].message).toBe('Second')

      // After 1 more second (total 3s), second should be removed
      vi.advanceTimersByTime(1000)
      expect(store.toasts).toHaveLength(1)
      expect(store.toasts[0].message).toBe('Third')

      // After 1 more second (total 4s), third should be removed
      vi.advanceTimersByTime(1000)
      expect(store.toasts).toHaveLength(0)
    })
  })

  describe('remove()', () => {
    it('should remove a toast by id', () => {
      const store = useToastStore()
      store.show('Test message')
      const toastId = store.toasts[0].id

      store.remove(toastId)

      expect(store.toasts).toHaveLength(0)
    })

    it('should only remove the specified toast', () => {
      const store = useToastStore()
      store.show('First')
      vi.advanceTimersByTime(1)
      store.show('Second')
      vi.advanceTimersByTime(1)
      store.show('Third')

      const secondToastId = store.toasts[1].id
      store.remove(secondToastId)

      expect(store.toasts).toHaveLength(2)
      expect(store.toasts[0].message).toBe('First')
      expect(store.toasts[1].message).toBe('Third')
    })

    it('should do nothing if toast id does not exist', () => {
      const store = useToastStore()
      store.show('Test')

      store.remove('non-existent-id')

      expect(store.toasts).toHaveLength(1)
    })

    it('should handle removing from empty array', () => {
      const store = useToastStore()

      expect(() => store.remove('some-id')).not.toThrow()
      expect(store.toasts).toHaveLength(0)
    })
  })
})
