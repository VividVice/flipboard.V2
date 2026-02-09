<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useNotificationStore } from '../stores/notifications'
import { storeToRefs } from 'pinia'

const router = useRouter()
const notificationStore = useNotificationStore()
const { notifications, loading, error } = storeToRefs(notificationStore)

onMounted(() => {
  notificationStore.fetchNotifications()
  notificationStore.fetchUnreadCount() // Update count after fetching all
})

const goBack = () => {
  router.back()
}

const markAsRead = async (notificationId: string) => {
  await notificationStore.markNotificationAsRead(notificationId)
}

const markAllAsRead = async () => {
  await notificationStore.markAllNotificationsAsRead()
}

const viewNotification = (notification: Notification) => {
  if (notification.article_id) {
    router.push({ name: 'article', params: { id: notification.article_id } })
  } else if (notification.magazine_id) {
    router.push({ name: 'magazine', params: { id: notification.magazine_id } })
  }
  markAsRead(notification.id)
}

// Helper to format date
const formattedDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleString()
}
</script>

<template>
  <div class="bg-black min-h-screen pb-20 pt-16">
    <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <button @click="goBack" class="mb-6 flex items-center text-gray-500 hover:text-white transition-colors">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clip-rule="evenodd" />
        </svg>
        Back
      </button>

      <div class="flex items-center justify-between border-b border-gray-800 mb-8 pb-4">
        <h1 class="text-4xl font-display font-bold text-white uppercase tracking-tighter">Notifications</h1>
        <button
          v-if="notifications.some(n => !n.read)"
          @click="markAllAsRead"
          class="text-sm font-bold text-gray-500 hover:text-white transition-colors"
        >
          Mark all as read
        </button>
      </div>

      <div v-if="loading" class="text-center py-12">
        <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-flipboard-red mx-auto"></div>
        <p class="text-gray-400 mt-4">Loading notifications...</p>
      </div>

      <div v-else-if="error" class="text-center py-12 text-red-500">
        <p>{{ error }}</p>
      </div>

      <div v-else-if="notifications.length === 0" class="text-center py-12 text-gray-500">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-16 h-16 mx-auto text-gray-600 mb-4">
          <path stroke-linecap="round" stroke-linejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.248 24.248 0 0 1-7.224 0m7.224 0a6.745 6.745 0 0 0 4.724-5.025C17.155 11.574 17.5 10.19 17.5 8.75c0-1.256-.079-2.502-.249-3.738C19.526 5.304 20.5 6.507 20.5 8a9.76 9.76 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31" />
        </svg>
        <p>You don't have any notifications yet.</p>
      </div>

      <div v-else class="space-y-4">
        <div
          v-for="notification in notifications"
          :key="notification.id"
          @click="viewNotification(notification)"
          class="flex items-center p-4 rounded-lg border transition-all cursor-pointer"
          :class="notification.read ? 'bg-gray-900 border-gray-800 hover:bg-gray-800' : 'bg-gray-800 border-gray-700 hover:bg-gray-700'"
        >
          <div class="flex-shrink-0 mr-4">
            <svg
              v-if="!notification.read"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              class="w-5 h-5 text-flipboard-red"
            >
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-11.25a.75.75 0 00-1.5 0v4.59L7.3 9.24a.75.75 0 00-1.06 1.06l3.5 3.5a.75.75 0 001.06 0l3.5-3.5a.75.75 0 00-1.06-1.06l-1.97 1.97V6.75z" clip-rule="evenodd" />
            </svg>
            <svg v-else xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5 text-gray-500">
              <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v4.875h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
            </svg>
          </div>
          <div class="flex-1">
            <p class="text-gray-200 font-medium">{{ notification.message }}</p>
            <p class="text-xs text-gray-500 mt-1">{{ formattedDate(notification.created_at) }}</p>
          </div>
          <button
            v-if="!notification.read"
            @click.stop="markAsRead(notification.id)"
            class="ml-4 flex-shrink-0 text-xs font-bold text-gray-500 hover:text-white transition-colors"
          >
            Mark as Read
          </button>
        </div>
      </div>
    </div>
  </div>
</template>