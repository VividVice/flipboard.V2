<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter, RouterLink } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { apiServiceExtended, type Magazine, type Article, type User } from '../services/api'
import ArticleCard from '../components/ArticleCard.vue'
import CommentSection from '../components/CommentSection.vue'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const magazine = ref<Magazine | null>(null)
const owner = ref<User | null>(null)
const articles = ref<Article[]>([])
const loading = ref(true)
const error = ref<string | null>(null)
const isEditModalOpen = ref(false)
const isDeleteModalOpen = ref(false)
const editName = ref('')
const editDescription = ref('')
const editLoading = ref(false)
const deleteLoading = ref(false)

const magazineId = computed(() => route.params.id as string)

const isOwner = computed(() => {
  return magazine.value?.user_id === authStore.user?.id
})

const isFollowed = computed(() => {
  return authStore.user?.followed_magazines.includes(magazineId.value)
})

const handleFollowToggle = async () => {
  if (!magazine.value) return
  
  try {
    if (isFollowed.value) {
      await authStore.unfollowMagazine(magazineId.value)
    } else {
      await authStore.followMagazine(magazineId.value)
    }
  } catch (err) {
    console.error('Failed to toggle magazine follow:', err)
  }
}

onMounted(async () => {
  await fetchMagazineData()
})

const fetchMagazineData = async () => {
  loading.value = true
  error.value = null
  try {
    // 1. Get Magazine Details
    magazine.value = await apiServiceExtended.getMagazineById(magazineId.value)
    
    // 2. Get Owner Details
    if (magazine.value?.user_id) {
      owner.value = await apiServiceExtended.getUserById(magazine.value.user_id)
    }

    // 3. Get Articles
    articles.value = await apiServiceExtended.getMagazineArticles(magazineId.value)
    
  } catch (err: unknown) {
    console.error(err)
    error.value = err instanceof Error ? err.message : 'Failed to load magazine'
  } finally {
    loading.value = false
  }
}

const goBack = () => {
  router.back()
}

const openEditModal = () => {
  if (!magazine.value) return
  editName.value = magazine.value.name
  editDescription.value = magazine.value.description || ''
  isEditModalOpen.value = true
}

const handleUpdateMagazine = async () => {
  if (!magazine.value) return
  const nextName = editName.value.trim()
  if (!nextName) return
  editLoading.value = true
  try {
    const updated = await apiServiceExtended.updateMagazine(magazine.value.id, {
      name: nextName,
      description: editDescription.value.trim() || undefined
    })
    magazine.value = updated
    isEditModalOpen.value = false
  } catch (err) {
    console.error('Failed to update magazine:', err)
  } finally {
    editLoading.value = false
  }
}

const handleDeleteMagazine = async () => {
  if (!magazine.value) return
  deleteLoading.value = true
  try {
    await apiServiceExtended.deleteMagazine(magazine.value.id)
    isDeleteModalOpen.value = false
    router.push('/profile')
  } catch (err) {
    console.error('Failed to delete magazine:', err)
  } finally {
    deleteLoading.value = false
  }
}

const handleRemoveArticle = async (articleId: string) => {
  if (!magazine.value) return
  try {
    await apiServiceExtended.removeArticleFromMagazine(magazine.value.id, articleId)
    articles.value = articles.value.filter(article => article.id !== articleId)
  } catch (err) {
    console.error('Failed to remove article from magazine:', err)
  }
}
</script>

<template>
  <div class="bg-black min-h-screen pb-20 pt-16">
    <div v-if="loading" class="flex justify-center items-center h-64">
      <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-flipboard-red"></div>
    </div>
    
    <div v-else-if="error" class="text-center py-20">
      <h2 class="text-2xl text-white font-bold mb-4">Error</h2>
      <p class="text-gray-400 mb-6">{{ error }}</p>
      <button @click="goBack" class="text-flipboard-red hover:underline">Go Back</button>
    </div>
    
    <div v-else-if="magazine" class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <!-- Header -->
      <div class="mb-12 border-b border-gray-800 pb-8">
        <button @click="goBack" class="mb-6 flex items-center text-gray-500 hover:text-white transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clip-rule="evenodd" />
          </svg>
          Back to Profile
        </button>
        
        <h1 class="text-4xl md:text-6xl font-display font-bold text-white mb-4">{{ magazine.name }}</h1>
        <p v-if="magazine.description" class="text-xl text-gray-400 font-serif max-w-3xl mb-6">{{ magazine.description }}</p>
        
        <div class="flex flex-wrap items-center gap-y-4">
          <div v-if="owner" class="flex items-center mr-8">
            <span class="text-gray-500 text-xs font-bold uppercase tracking-wider mr-2">Par</span>
            <RouterLink :to="`/user/${owner.username}`" class="flex items-center group">
              <img :src="owner.profile_pic || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80'" class="h-6 w-6 rounded-full mr-2 border border-gray-700 group-hover:border-flipboard-red transition-colors" />
              <span class="text-white text-sm font-bold hover:text-flipboard-red transition-colors">{{ owner.username }}</span>
            </RouterLink>
          </div>

          <div class="flex items-center text-gray-500 text-sm font-bold uppercase tracking-wider mr-8">
            <span>{{ articles.length }} Stories</span>
            <span class="mx-2">•</span>
            <span>Updated {{ new Date(magazine.updated_at).toLocaleDateString() }}</span>
          </div>

          <button 
            v-if="!isOwner"
            @click="handleFollowToggle"
            :class="isFollowed ? 'bg-gray-800 border-gray-700 text-gray-300' : 'bg-flipboard-red border-flipboard-red text-white'"
            class="border px-6 py-1.5 text-xs font-bold uppercase tracking-wider rounded hover:opacity-90 transition-all"
          >
            {{ isFollowed ? 'Following Magazine' : 'Follow Magazine' }}
          </button>

          <div v-if="isOwner" class="flex items-center gap-3">
            <button
              @click="openEditModal"
              class="bg-gray-800 border border-gray-700 text-white px-4 py-1.5 text-xs font-bold uppercase tracking-wider rounded hover:bg-gray-700 transition-colors"
            >
              Edit Magazine
            </button>
            <button
              @click="isDeleteModalOpen = true"
              class="bg-transparent border border-red-600 text-red-400 px-4 py-1.5 text-xs font-bold uppercase tracking-wider rounded hover:bg-red-600 hover:text-white transition-colors"
            >
              Delete Magazine
            </button>
          </div>
        </div>
      </div>

      <!-- Edit Magazine Modal -->
      <div v-if="isEditModalOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
        <div class="bg-gray-900 border border-gray-800 rounded-lg w-full max-w-md overflow-hidden shadow-2xl">
          <div class="p-6 border-b border-gray-800 flex justify-between items-center">
            <h2 class="text-xl font-display font-bold text-white uppercase tracking-tight">Edit Magazine</h2>
            <button @click="isEditModalOpen = false" class="text-gray-500 hover:text-white transition-colors" aria-label="Close modal">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form @submit.prevent="handleUpdateMagazine" class="p-6 space-y-4">
            <div>
              <label for="magazine-name" class="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Magazine Title</label>
              <input
                id="magazine-name"
                v-model="editName"
                type="text"
                class="w-full bg-gray-800 border border-gray-700 rounded px-4 py-2 text-white focus:outline-none focus:border-flipboard-red transition-colors"
                required
                minlength="2"
                maxlength="100"
              />
            </div>

            <div>
              <label for="magazine-description" class="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Description (Optional)</label>
              <textarea
                id="magazine-description"
                v-model="editDescription"
                rows="3"
                maxlength="300"
                class="w-full bg-gray-800 border border-gray-700 rounded px-4 py-2 text-white focus:outline-none focus:border-flipboard-red transition-colors resize-none"
              ></textarea>
            </div>

            <div class="pt-4 flex space-x-4">
              <button
                type="button"
                @click="isEditModalOpen = false"
                class="flex-1 bg-transparent border border-gray-700 text-gray-400 px-6 py-3 text-xs font-bold uppercase tracking-widest rounded hover:bg-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                :disabled="editLoading"
                class="flex-1 bg-flipboard-red border border-flipboard-red text-white px-6 py-3 text-xs font-bold uppercase tracking-widest rounded hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                <span v-if="editLoading" class="inline-block h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></span>
                {{ editLoading ? 'Saving...' : 'Save Changes' }}
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- Delete Magazine Modal -->
      <div v-if="isDeleteModalOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
        <div class="bg-gray-900 border border-gray-800 rounded-lg w-full max-w-md overflow-hidden shadow-2xl">
          <div class="p-6 border-b border-gray-800">
            <h2 class="text-xl font-display font-bold text-white uppercase tracking-tight">Delete Magazine</h2>
          </div>
          <div class="p-6 space-y-4">
            <p class="text-gray-400">This action cannot be undone. Are you sure you want to delete this magazine?</p>
            <div class="flex space-x-4">
              <button
                type="button"
                @click="isDeleteModalOpen = false"
                class="flex-1 bg-transparent border border-gray-700 text-gray-400 px-6 py-3 text-xs font-bold uppercase tracking-widest rounded hover:bg-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                @click="handleDeleteMagazine"
                :disabled="deleteLoading"
                class="flex-1 bg-red-600 border border-red-600 text-white px-6 py-3 text-xs font-bold uppercase tracking-widest rounded hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                <span v-if="deleteLoading" class="inline-block h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></span>
                {{ deleteLoading ? 'Deleting...' : 'Delete' }}
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Articles Grid -->
      <div v-if="articles.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        <ArticleCard
          v-for="article in articles"
          :key="article.id"
          :article="article"
          :removable="isOwner"
          @remove="handleRemoveArticle"
        />
      </div>
      
      <div v-else class="text-center py-20 border border-dashed border-gray-800 rounded-lg max-w-2xl mx-auto px-6">
        <div class="h-16 w-16 bg-gray-900 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        </div>
        <h2 class="text-2xl text-white font-display font-bold mb-4 uppercase tracking-tight">Add your first story</h2>
        <p class="text-gray-400 mb-8 max-w-md mx-auto leading-relaxed">
          This magazine is currently empty. Start curating by adding stories from your personalized feed or search for topics that interest you.
        </p>
        <RouterLink 
          to="/" 
          class="inline-block bg-flipboard-red text-white px-8 py-3 font-bold uppercase tracking-widest text-xs hover:bg-red-700 transition-all transform hover:scale-105 active:scale-95 shadow-lg shadow-flipboard-red/20"
        >
          Go to Home Feed
        </RouterLink>
      </div>

      <!-- Magazine Comments -->
      <div class="mt-20">
        <CommentSection :magazine-id="magazineId" />
      </div>
    </div>
  </div>
</template>
