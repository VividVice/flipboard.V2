import { defineStore } from 'pinia'
import { apiServiceExtended, type Notification } from '../services/api'
import { useToastStore } from './toast'

export const useNotificationStore = defineStore('notifications', {
  state: () => ({
    notifications: [] as Notification[],
    unreadCount: 0,
    loading: false,
    error: null as string | null,
    pollingInterval: null as ReturnType<typeof setInterval> | null,
  }),

  actions: {
    async fetchNotifications(params?: { skip?: number; limit?: number; read?: boolean }) {
      this.loading = true
      this.error = null
      try {
        const fetchedNotifications = await apiServiceExtended.getNotifications(params)
        this.notifications = fetchedNotifications.map((n) => ({ ...n }))
      } catch (error: unknown) {
        this.error = error instanceof Error ? error.message : 'Failed to fetch notifications'
        useToastStore().show(this.error, 'error')
      } finally {
        this.loading = false
      }
    },

    async fetchUnreadCount() {
      try {
        this.unreadCount = await apiServiceExtended.getUnreadNotificationsCount()
      } catch (error: unknown) {
        console.error('Failed to fetch unread notification count:', error)
      }
    },

    async markNotificationAsRead(notificationId: string) {
      try {
        const updatedNotification = await apiServiceExtended.markNotificationAsRead(notificationId)
        const index = this.notifications.findIndex((n) => n.id === notificationId)
        if (index !== -1) {
          this.notifications[index].read = updatedNotification.read
        }
        this.fetchUnreadCount() // Update unread count
      } catch (error: unknown) {
        useToastStore().show(error instanceof Error ? error.message : 'Failed to mark notification as read', 'error')
      }
    },

    async markAllNotificationsAsRead() {
      try {
        await apiServiceExtended.markAllNotificationsAsRead()
        this.notifications.forEach((n) => (n.read = true))
        this.unreadCount = 0
        useToastStore().show('All notifications marked as read', 'success')
      } catch (error: unknown) {
        useToastStore().show(error instanceof Error ? error.message : 'Failed to mark all notifications as read', 'error')
      }
    },

    startPolling() {
      // Clear any existing polling interval to prevent duplicates
      this.stopPolling();
      
      this.pollingInterval = setInterval(async () => {
        await this.fetchUnreadCount();
        // Optionally fetch latest unread notifications if the count changes,
        // but for now, just the count is enough for the navbar indicator.
      }, 30000); // Poll every 30 seconds
    },

    stopPolling() {
      if (this.pollingInterval) {
        clearInterval(this.pollingInterval);
        this.pollingInterval = null;
      }
    },

    $reset() {
      this.notifications = [];
      this.unreadCount = 0;
      this.loading = false;
      this.error = null;
      this.stopPolling();
    }
  },
})
