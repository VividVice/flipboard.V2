<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import ArticleCard from '../components/ArticleCard.vue'
import SkeletonCard from '../components/SkeletonCard.vue'
import { useArticleStore } from '../stores/articles'
import { storeToRefs } from 'pinia'

const articleStore = useArticleStore()
const { gridArticles, heroArticle } = storeToRefs(articleStore)

// Loading state for initial load
const isLoading = ref(true)

onMounted(() => {
  // Simulate initial data fetch latency
  setTimeout(() => {
    isLoading.value = false
  }, 1500)
})

// Infinite Scroll Logic
const loadMoreTrigger = ref<HTMLElement | null>(null)
// ... (rest of the code remains the same until template)

const observer = new IntersectionObserver((entries) => {
  const entry = entries[0]
  if (entry && entry.isIntersecting) {
    articleStore.loadMoreArticles()
  }
}, {
  root: null,
  rootMargin: '100px',
  threshold: 0.1
})

onMounted(() => {
  if (loadMoreTrigger.value) {
    observer.observe(loadMoreTrigger.value)
  }
})

onUnmounted(() => {
  observer.disconnect()
})

// Computed properties for grid layout
// If we have search results, we don't want a "featured" layout, just a clean grid.
// If it's the default view, we keep the featured layout.
const hasSearch = computed(() => articleStore.searchQuery.length > 0)

const featuredGridArticle = computed(() => {
  if (hasSearch.value) return null
  return gridArticles.value[0]
})

const standardGridArticles = computed(() => {
  if (hasSearch.value) return gridArticles.value
  return gridArticles.value.slice(1)
})
</script>

<template>
  <div class="bg-black min-h-screen pb-20">
    
    <!-- Hero Section (Hidden when searching) -->
    <div class="bg-gray-900 text-white border-b border-gray-800" v-if="heroArticle">
        <div class="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 min-h-[500px]">
            <div class="relative h-64 lg:h-auto">
                <img :src="heroArticle.imageUrl" class="absolute inset-0 w-full h-full object-cover opacity-80" />
                <div class="absolute inset-0 bg-gradient-to-r from-gray-900/80 to-transparent lg:hidden"></div>
            </div>
            <div class="p-8 lg:p-16 flex flex-col justify-center">
                <span class="text-flipboard-red font-bold uppercase tracking-widest text-sm mb-4">{{ heroArticle.source }}</span>
                <RouterLink :to="`/article/${heroArticle.id}`">
                  <h1 class="text-4xl lg:text-6xl font-serif font-bold leading-tight mb-6 text-white hover:text-flipboard-red transition-colors">{{ heroArticle.title }}</h1>
                </RouterLink>
                <p class="text-lg text-gray-300 mb-8 max-w-md">{{ heroArticle.description }}</p>
                <div class="flex items-center space-x-4">
                     <RouterLink :to="`/article/${heroArticle.id}`" class="bg-flipboard-red text-white px-8 py-3 font-bold uppercase tracking-wider text-sm hover:bg-red-700 transition-colors">Read Story</RouterLink>
                     <button 
                       @click="articleStore.toggleSave(heroArticle.id)"
                       class="border border-gray-600 px-8 py-3 font-bold uppercase tracking-wider text-sm transition-colors"
                       :class="heroArticle.saved ? 'bg-white text-black' : 'text-white hover:bg-white hover:text-black'"
                     >
                       {{ heroArticle.saved ? 'Saved' : 'Save' }}
                     </button>
                </div>
            </div>
        </div>
    </div>

    <!-- Main Feed -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div class="border-b border-gray-800 mb-8 pb-2 flex items-end justify-between">
          <h2 class="text-4xl font-display font-bold text-white uppercase tracking-tighter">
            {{ hasSearch ? 'Search Results' : 'For You' }}
          </h2>
          <a href="#" v-if="!hasSearch" class="text-sm font-bold text-gray-500 hover:text-flipboard-red uppercase tracking-wide mb-1">See All</a>
      </div>

      <!-- Grid Layout -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" v-if="isLoading">
         <!-- Skeleton Loading State -->
         <div class="col-span-1 md:col-span-2 row-span-2">
            <SkeletonCard class="h-full" />
         </div>
         <SkeletonCard v-for="n in 8" :key="n" />
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" v-else-if="gridArticles.length > 0">
        <!-- Featured Item (Only shown if NOT searching and data exists) -->
        <div class="col-span-1 md:col-span-2 row-span-2" v-if="featuredGridArticle">
            <ArticleCard :article="featuredGridArticle" class="h-full" />
        </div>
        
        <!-- Standard Items -->
        <ArticleCard v-for="article in standardGridArticles" :key="article.id" :article="article" />
      </div>
      
      <!-- Empty State for Search -->
      <div v-else class="text-center py-20">
         <p class="text-gray-500 text-xl">No stories found matching "{{ articleStore.searchQuery }}"</p>
      </div>

      <!-- Infinite Scroll Trigger -->
      <div ref="loadMoreTrigger" class="h-20 w-full flex items-center justify-center mt-12" v-if="!hasSearch">
         <!-- Loading Spinner -->
         <div class="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-flipboard-red"></div>
      </div>
    </div>
  </div>
</template>

