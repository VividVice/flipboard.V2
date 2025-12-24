<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter, RouterLink } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { apiServiceExtended, type Magazine, type Article, type User } from '../services/api'
import ArticleCard from '../components/ArticleCard.vue'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const magazine = ref<Magazine | null>(null)
const owner = ref<User | null>(null)
const articles = ref<Article[]>([])
const loading = ref(true)
const error = ref<string | null>(null)

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
    
  } catch (err: any) {
    console.error(err)
    error.value = err.message || 'Failed to load magazine'
  } finally {
    loading.value = false
  }
}

const goBack = () => {
  router.back()
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
        </div>
      </div>
      
      <!-- Articles Grid -->
      <div v-if="articles.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        <ArticleCard v-for="article in articles" :key="article.id" :article="article" />
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
    </div>
  </div>
</template>
