<script setup lang="ts">
import { ref, computed } from 'vue'
import type { Comment } from '../data/articles'
import { useAuthStore } from '../stores/auth'
import { useCommentsStore } from '../stores/comments'
import ConfirmModal from './ConfirmModal.vue'

interface Props {
  comment: Comment
  articleId: string
}

const props = defineProps<Props>()
const authStore = useAuthStore()
const commentsStore = useCommentsStore()

const isEditing = ref(false)
const editedContent = ref(props.comment.content)
const showDeleteConfirm = ref(false)
const editError = ref('')

const isAuthor = computed(() => {
  return authStore.user?.id === props.comment.author.id
})

const formattedDate = computed(() => {
  const date = new Date(props.comment.createdAt)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString()
})

const startEdit = () => {
  isEditing.value = true
  editedContent.value = props.comment.content
  editError.value = ''
}

const cancelEdit = () => {
  isEditing.value = false
  editedContent.value = props.comment.content
  editError.value = ''
}

const saveEdit = async () => {
  const trimmedContent = editedContent.value.trim()
  
  if (trimmedContent.length === 0) {
    editError.value = 'Comment cannot be empty'
    return
  }
  
  editError.value = ''
  await commentsStore.updateComment(props.comment.id, props.articleId, trimmedContent)
  isEditing.value = false
}

const deleteComment = async () => {
  showDeleteConfirm.value = true
}

const confirmDelete = async () => {
  showDeleteConfirm.value = false
  await commentsStore.deleteComment(props.comment.id, props.articleId)
}

const cancelDelete = () => {
  showDeleteConfirm.value = false
}
</script>

<template>
  <div class="py-4 border-b border-gray-800 last:border-0">
    <div class="flex items-start space-x-3">
      <!-- Avatar -->
      <div class="flex-shrink-0">
        <div
          class="h-10 w-10 rounded-full bg-gray-700 flex items-center justify-center border border-gray-600 text-white font-bold overflow-hidden"
        >
          <img
            v-if="comment.author.avatarUrl"
            :src="comment.author.avatarUrl"
            :alt="comment.author.name"
            class="h-full w-full object-cover"
          />
          <span v-else>{{ comment.author.name.charAt(0).toUpperCase() }}</span>
        </div>
      </div>

      <!-- Comment Content -->
      <div class="flex-1 min-w-0">
        <!-- Article Context (shown in profile) -->
        <div v-if="comment.articleTitle" class="mb-4 bg-gray-900/50 p-3 rounded border border-gray-800">
          <span class="text-[9px] text-flipboard-red uppercase font-black tracking-[0.2em] block mb-1">Publié dans</span>
          <RouterLink :to="`/article/${comment.articleId}`" class="text-base font-serif font-bold text-white hover:text-flipboard-red transition-colors leading-tight block">
            {{ comment.articleTitle }}
          </RouterLink>
        </div>

        <!-- Meta Info (Name & Date) - Top for article view, Bottom for profile view -->
        <div v-if="!comment.articleTitle" class="flex items-center justify-between mb-1">
          <div class="flex items-center space-x-2">
            <RouterLink :to="`/user/${comment.author.name}`" class="text-sm font-bold text-gray-100 hover:text-flipboard-red transition-colors">
              {{ comment.author.name }}
            </RouterLink>
            <span class="text-xs text-gray-500">{{ formattedDate }}</span>
            <span v-if="comment.updatedAt" class="text-xs text-gray-500 italic">(modifié)</span>
          </div>

          <!-- Actions for author -->
          <div v-if="isAuthor && !isEditing" class="flex items-center space-x-2">
            <button
              @click="startEdit"
              class="text-xs text-gray-500 hover:text-white transition-colors"
            >
              Modifier
            </button>
            <button
              @click="deleteComment"
              class="text-xs text-gray-500 hover:text-flipboard-red transition-colors"
            >
              Supprimer
            </button>
          </div>
        </div>

        <!-- Comment text or edit form -->
        <div v-if="!isEditing" :class="[
          'text-gray-300 break-words',
          comment.articleTitle ? 'text-lg font-serif italic py-1' : 'text-sm'
        ]">
          "{{ comment.content }}"
        </div>

        <!-- Edit form -->
        <div v-else class="mt-2 space-y-2">
          <textarea
            v-model="editedContent"
            :class="[
              'w-full bg-gray-900 border rounded-lg px-3 py-2 text-sm text-gray-100 focus:outline-none resize-none',
              editError ? 'border-red-500 focus:border-red-500' : 'border-gray-700 focus:border-flipboard-red'
            ]"
            rows="3"
            placeholder="Modifier votre commentaire..."
          ></textarea>
          <div v-if="editError" class="text-xs text-red-500">
            {{ editError }}
          </div>
          <div class="flex items-center space-x-2">
            <button
              @click="saveEdit"
              class="px-3 py-1 bg-flipboard-red text-white text-xs font-semibold rounded hover:bg-red-700 transition-colors"
            >
              Enregistrer
            </button>
            <button
              @click="cancelEdit"
              class="px-3 py-1 bg-gray-700 text-white text-xs font-semibold rounded hover:bg-gray-600 transition-colors"
            >
              Annuler
            </button>
          </div>
        </div>

        <!-- Profile view footer meta -->
        <div v-if="comment.articleTitle && !isEditing" class="mt-3 flex items-center justify-between border-t border-gray-800/50 pt-2">
          <div class="flex items-center space-x-2">
            <RouterLink :to="`/user/${comment.author.name}`" class="text-[10px] font-black text-gray-500 hover:text-flipboard-red uppercase tracking-widest transition-colors">
              {{ comment.author.name }}
            </RouterLink>
            <span class="text-gray-700">•</span>
            <span class="text-[10px] text-gray-600 uppercase font-bold">{{ formattedDate }}</span>
          </div>
          
          <div v-if="isAuthor && !isEditing" class="flex items-center space-x-3">
            <button @click="startEdit" class="text-[10px] font-bold text-gray-500 hover:text-white uppercase tracking-wider">Modifier</button>
            <button @click="deleteComment" class="text-[10px] font-bold text-gray-500 hover:text-flipboard-red uppercase tracking-wider">Supprimer</button>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Delete confirmation modal -->
  <ConfirmModal
    :is-open="showDeleteConfirm"
    title="Delete Comment"
    message="Are you sure you want to delete this comment? This action cannot be undone."
    confirm-text="Delete"
    cancel-text="Cancel"
    @confirm="confirmDelete"
    @cancel="cancelDelete"
  />
</template>
