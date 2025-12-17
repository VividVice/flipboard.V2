<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import ArticleCard from '../components/ArticleCard.vue'
import SkeletonCard from '../components/SkeletonCard.vue'
import SaveModal from '../components/SaveModal.vue'
import { useArticleStore } from '../stores/articles'
import { storeToRefs } from 'pinia'

const articleStore = useArticleStore()
const { gridArticles, heroArticle, categories, selectedCategory, searchQuery, loading } = storeToRefs(articleStore)

// Loading state for initial load
const isLoading = ref(true)
const isSaveModalOpen = ref(false)

onMounted(async () => {
  // Fetch articles and hero article
  await Promise.all([
    articleStore.fetchArticles({ limit: 20 }),
    articleStore.fetchHeroArticle()
  ])
  isLoading.value = false
  
  if (loadMoreTrigger.value) {
    observer.observe(loadMoreTrigger.value)
  }
})

// Infinite Scroll Logic
const loadMoreTrigger = ref<HTMLElement | null>(null)

const observer = new IntersectionObserver((entries) => {
  const entry = entries[0]
  if (entry && entry.isIntersecting && !loading.value) {
    articleStore.loadMoreArticles()
  }
}, {
  root: null,
  rootMargin: '100px',
  threshold: 0.1
})

onUnmounted(() => {
  observer.disconnect()
})

// Computed properties for grid layout
const isFiltered = computed(() => searchQuery.value.length > 0 || (selectedCategory.value !== 'All' && selectedCategory.value !== 'For You'))

const featuredGridArticle = computed(() => {
  if (isFiltered.value) return null
  return gridArticles.value[0]
})

const standardGridArticles = computed(() => {
  if (isFiltered.value) return gridArticles.value
  return gridArticles.value.slice(1)
})
</script>

<template>
  <div class="bg-black min-h-screen pb-20">
    
    <!-- Category Filter Bar -->
    <div class="sticky top-[60px] z-40 bg-black/95 border-b border-gray-800 backdrop-blur supports-[backdrop-filter]:bg-black/60">
       <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="flex space-x-2 overflow-x-auto py-3 no-scrollbar">
             <button 
               v-for="cat in categories" 
               :key="cat"
               @click="articleStore.setCategory(cat)"
               class="px-4 py-1 rounded-full text-sm font-bold whitespace-nowrap transition-all border"
               :class="selectedCategory === cat 
                 ? 'bg-white text-black border-white' 
                 : 'bg-gray-900 text-gray-400 border-gray-700 hover:border-gray-500 hover:text-gray-200'"
             >
               {{ cat }}
             </button>
          </div>
       </div>
    </div>

    <!-- Hero Section (Hidden when filtering/searching) -->
    <div class="bg-gray-900 text-white border-b border-gray-800" v-if="heroArticle && !isFiltered">
        <!-- Save Modal Portal for Hero -->
        <Teleport to="body">
          <SaveModal 
            :is-open="isSaveModalOpen" 
            :article-id="heroArticle.id"
            @close="isSaveModalOpen = false"
          />
        </Teleport>

        <div class="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 min-h-[500px]">
            <div class="relative h-64 lg:h-auto">
                <img :src="heroArticle.image_url || 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80'" class="absolute inset-0 w-full h-full object-cover opacity-80" />
                <div class="absolute inset-0 bg-gradient-to-r from-gray-900/80 to-transparent lg:hidden"></div>
            </div>
            <div class="p-8 lg:p-16 flex flex-col justify-center">
                <span class="text-flipboard-red font-bold uppercase tracking-widest text-sm mb-4">{{ heroArticle.publisher }}</span>
                <RouterLink :to="`/article/${heroArticle.id}`">
                  <h1 class="text-4xl lg:text-6xl font-serif font-bold leading-tight mb-6 text-white hover:text-flipboard-red transition-colors">{{ heroArticle.title }}</h1>
                </RouterLink>
                <p class="text-gray-300 text-lg mb-8 line-clamp-3">{{ heroArticle.excerpt }}</p>
                <div class="flex space-x-4">
                    <button @click="articleStore.toggleLike(heroArticle.id)" class="flex items-center space-x-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-md transition-colors">
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" :class="heroArticle.liked ? 'fill-flipboard-red text-flipboard-red' : 'fill-none'" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                      <span>{{ heroArticle.like_count }}</span>
                    </button>
                    <button @click="articleStore.toggleSave(heroArticle.id)" class="flex items-center space-x-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-md transition-colors">
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" :class="heroArticle.saved ? 'fill-flipboard-red' : 'fill-none'" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                      </svg>
                      <span>Save</span>
                    </button>
                    <button class="flex items-center space-x-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-md transition-colors">
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                      <span>{{ heroArticle.comment_count }}</span>
                    </button>
                </div>
            </div>
        </div>
    </div>

    <!-- Main Content -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      
      <!-- Loading Skeletons for initial load -->
      <div v-if="isLoading" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <SkeletonCard v-for="n in 6" :key="n" />
      </div>

      <!-- Articles Grid (After Loading) -->
      <div v-else>
        
        <!-- Featured Article (if not filtered) -->
        <div v-if="featuredGridArticle" class="mb-8">
          <ArticleCard :article="featuredGridArticle" :is-featured="true" />
        </div>

        <!-- Standard Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <ArticleCard 
            v-for="article in standardGridArticles" 
            :key="article.id" 
            :article="article"
          />
        </div>

        <!-- Load More Trigger -->
        <div ref="loadMoreTrigger" class="h-20 flex items-center justify-center mt-8">
          <div v-if="loading" class="text-gray-400">Loading more articles...</div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.no-scrollbar::-webkit-scrollbar {
  display: none;
}

.no-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>
