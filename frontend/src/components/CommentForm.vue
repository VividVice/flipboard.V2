<script setup lang="ts">
import { ref, computed } from 'vue'
import { useAuthStore } from '../stores/auth'
import { useCommentsStore } from '../stores/comments'

interface Props {
  articleId?: string
  magazineId?: string
}

const props = defineProps<Props>()
const authStore = useAuthStore()
const commentsStore = useCommentsStore()

const commentText = ref('')
const isSubmitting = ref(false)

const canSubmit = computed(() => {
  return commentText.value.trim().length > 0 && !isSubmitting.value
})

const submitComment = async () => {
  if (!canSubmit.value) return

  isSubmitting.value = true
  try {
    if (props.articleId) {
      await commentsStore.createComment(props.articleId, commentText.value.trim())
    } else if (props.magazineId) {
      await commentsStore.createMagazineComment(props.magazineId, commentText.value.trim())
    }
    commentText.value = ''
  } finally {
    isSubmitting.value = false
  }
}

const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
    submitComment()
  }
}
</script>

<template>
  <div class="mb-6">
    <div v-if="authStore.isAuthenticated" class="space-y-3">
      <div class="flex items-start space-x-3">
        <!-- User Avatar -->
        <div class="flex-shrink-0">
          <div
            class="h-10 w-10 rounded-full bg-gray-700 flex items-center justify-center border border-gray-600 text-white font-bold overflow-hidden"
          >
            <img
              v-if="authStore.user?.avatarUrl"
              :src="authStore.user.avatarUrl"
              :alt="authStore.user.name"
              class="h-full w-full object-cover"
            />
            <span v-else>{{ authStore.user?.name.charAt(0).toUpperCase() }}</span>
          </div>
        </div>

        <!-- Comment Input -->
        <div class="flex-1">
          <textarea
            v-model="commentText"
            @keydown="handleKeydown"
            class="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-flipboard-red resize-none transition-colors"
            rows="3"
            placeholder="Share your thoughts..."
            :disabled="isSubmitting"
          ></textarea>

          <div class="flex items-center justify-between mt-2">
            <p class="text-xs text-gray-500">
              Press <kbd class="px-1 py-0.5 bg-gray-800 rounded text-xs">Ctrl+Enter</kbd> or <kbd class="px-1 py-0.5 bg-gray-800 rounded text-xs">Cmd+Enter</kbd> to submit
            </p>
            <button
              @click="submitComment"
              :disabled="!canSubmit"
              class="px-4 py-2 bg-flipboard-red text-white text-sm font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-flipboard-red focus:ring-offset-2 focus:ring-offset-gray-900"
            >
              <span v-if="!isSubmitting">Post Comment</span>
              <span v-else class="flex items-center space-x-2">
                <svg class="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Posting...</span>
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Not authenticated state -->
    <div v-else class="bg-gray-900 border border-gray-800 rounded-lg p-6 text-center">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        stroke-width="1.5"
        stroke="currentColor"
        class="w-10 h-10 mx-auto text-gray-600 mb-3"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z"
        />
      </svg>
      <p class="text-gray-400 text-sm mb-3">Please login to join the conversation</p>
      <RouterLink
        to="/login"
        class="inline-block px-4 py-2 bg-flipboard-red text-white text-sm font-semibold rounded-lg hover:bg-red-700 transition-colors"
      >
        Login to Comment
      </RouterLink>
    </div>
  </div>
</template>

<style scoped>
kbd {
  font-family: monospace;
}
</style>
