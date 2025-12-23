<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { apiServiceExtended, type Magazine, type Article } from '../services/api'
import ArticleCard from '../components/ArticleCard.vue'

const route = useRoute()
const router = useRouter()
const magazine = ref<Magazine | null>(null)
const articles = ref<Article[]>([])
const loading = ref(true)
const error = ref<string | null>(null)

const magazineId = computed(() => route.params.id as string)

onMounted(async () => {
  await fetchMagazineData()
})

const fetchMagazineData = async () => {
  loading.value = true
  error.value = null
  try {
    // Fetch magazine details (we might want a getMagazineById method in store or api)
    // Currently relying on a direct API call for now to keep it simple or we can add to store
    // Let's assume we can get it via the list for now or fetch individual if we add that endpoint
    // Actually we added getMagazine(id) in backend, let's add it to frontend API
    
    // 1. Get Magazine Details
    // We need to add getMagazineById to apiServiceExtended first or use the list if already loaded? 
    // Best to fetch fresh.
    const apiBaseUrl =
      import.meta.env.VITE_API_URL ||
      (import.meta.env.DEV ? 'http://localhost:8000' : null)
    
    if (!apiBaseUrl) {
      throw new Error('API base URL is not configured (VITE_API_URL is missing)')
    }
    
    const magResponse = await fetch(`${apiBaseUrl}/magazines/${magazineId.value}`, {
       headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    })
    
    if (!magResponse.ok) throw new Error('Magazine not found')
    magazine.value = await magResponse.json()
    
    // 2. Get Articles
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
        <p v-if="magazine.description" class="text-xl text-gray-400 font-serif max-w-3xl">{{ magazine.description }}</p>
        <div class="mt-6 flex items-center text-gray-500 text-sm font-bold uppercase tracking-wider">
          <span>{{ articles.length }} Stories</span>
          <span class="mx-2">•</span>
          <span>Updated {{ new Date(magazine.updated_at).toLocaleDateString() }}</span>
        </div>
      </div>
      
      <!-- Articles Grid -->
      <div v-if="articles.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        <ArticleCard v-for="article in articles" :key="article.id" :article="article" />
      </div>
      
      <div v-else class="text-center py-20 border border-dashed border-gray-800 rounded-lg">
        <p class="text-gray-500 text-lg">No stories in this magazine yet.</p>
        <p class="text-gray-600 mt-2">Add stories from your feed or search.</p>
      </div>
    </div>
  </div>
</template>
