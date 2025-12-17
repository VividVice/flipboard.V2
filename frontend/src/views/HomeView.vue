<script setup lang="ts">
import { onMounted, onUnmounted, ref, computed } from 'vue'
import NewsCard from '../components/NewsCard.vue'
import SkeletonCard from '../components/SkeletonCard.vue'
import { useNewsStore } from '../stores/news'
import { storeToRefs } from 'pinia'

const newsStore = useNewsStore()
const { posts, loading, totalResults, requestsLeft, hasMoreResults } = storeToRefs(newsStore)

// Search and filter states
const searchQuery = ref('')
const selectedTopic = ref('financial and economic news')
const selectedSentiment = ref<string | null>(null)

const topics = [
  'financial and economic news',
  'technology',
  'politics',
  'sports',
  'entertainment',
  'health',
  'science',
  'weather',
  'education',
  'environment',
  'crime'
]

const sentiments = [
  { value: null, label: 'All' },
  { value: 'positive', label: 'Positive' },
  { value: 'negative', label: 'Negative' },
  { value: 'neutral', label: 'Neutral' }
]

onMounted(async () => {
  // Fetch initial news by topic
  await fetchNews()

  if (loadMoreTrigger.value) {
    observer.observe(loadMoreTrigger.value)
  }
})

// Fetch news based on current filters
const fetchNews = async () => {
  if (searchQuery.value.trim()) {
    // Custom search query
    await newsStore.fetchNews({ q: searchQuery.value, size: 10 })
  } else {
    // Fetch by topic and sentiment
    await newsStore.fetchNewsByTopic(selectedTopic.value, {
      sentiment: selectedSentiment.value || undefined,
      size: 10
    })
  }
}

// Handle search
const handleSearch = () => {
  if (searchQuery.value.trim()) {
    fetchNews()
  }
}

// Handle topic change
const handleTopicChange = (topic: string) => {
  selectedTopic.value = topic
  searchQuery.value = '' // Clear search when changing topic
  fetchNews()
}

// Handle sentiment change
const handleSentimentChange = (sentiment: string | null) => {
  selectedSentiment.value = sentiment
  searchQuery.value = '' // Clear search when changing sentiment
  fetchNews()
}

// Infinite Scroll Logic
const loadMoreTrigger = ref<HTMLElement | null>(null)

const observer = new IntersectionObserver((entries) => {
  const entry = entries[0]
  if (entry && entry.isIntersecting && !loading.value && hasMoreResults.value) {
    newsStore.loadMoreNews()
  }
}, {
  root: null,
  rootMargin: '100px',
  threshold: 0.1
})

onUnmounted(() => {
  observer.disconnect()
})

// API usage warning color
const apiUsageColor = computed(() => {
  if (requestsLeft.value < 50) return 'text-red-400'
  if (requestsLeft.value < 200) return 'text-yellow-400'
  return 'text-green-400'
})
</script>

<template>
  <div class="bg-black min-h-screen pb-20">

    <!-- Header Section -->
    <div class="bg-gradient-to-r from-gray-900 to-black border-b border-gray-800 py-8">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between mb-4">
          <div>
            <h1 class="text-4xl font-serif font-bold text-white mb-2">Global News</h1>
          </div>
          <div class="text-right">
            <p class="text-sm text-gray-500">API Requests Left</p>
            <p class="text-2xl font-bold" :class="apiUsageColor">{{ requestsLeft }}</p>
          </div>
        </div>

        <!-- Search Bar -->
        <div class="max-w-2xl">
          <form @submit.prevent="handleSearch" class="relative">
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Search news... (e.g., 'Bitcoin' or 'topic:technology sentiment:positive')"
              class="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-flipboard-red focus:border-transparent"
            />
            <button
              type="submit"
              class="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-2 bg-flipboard-red text-white rounded-lg font-bold hover:bg-red-700 transition-colors"
            >
              Search
            </button>
          </form>
        </div>
      </div>
    </div>

    <!-- Filter Bars -->
    <div class="sticky top-[60px] z-40 bg-black/95 border-b border-gray-800 backdrop-blur supports-[backdrop-filter]:bg-black/60">
      <!-- Topic Filter -->
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex space-x-2 overflow-x-auto py-3 no-scrollbar border-b border-gray-800">
          <button
            v-for="topic in topics"
            :key="topic"
            @click="handleTopicChange(topic)"
            class="px-4 py-1 rounded-full text-sm font-bold whitespace-nowrap transition-all border capitalize"
            :class="selectedTopic === topic
              ? 'bg-white text-black border-white'
              : 'bg-gray-900 text-gray-400 border-gray-700 hover:border-gray-500 hover:text-gray-200'"
          >
            {{ topic }}
          </button>
        </div>

        <!-- Sentiment Filter -->
        <div class="flex space-x-2 overflow-x-auto py-3 no-scrollbar">
          <button
            v-for="sentiment in sentiments"
            :key="sentiment.value || 'all'"
            @click="handleSentimentChange(sentiment.value)"
            class="px-4 py-1 rounded-full text-sm font-bold whitespace-nowrap transition-all border"
            :class="selectedSentiment === sentiment.value
              ? 'bg-flipboard-red text-white border-flipboard-red'
              : 'bg-gray-900 text-gray-400 border-gray-700 hover:border-gray-500 hover:text-gray-200'"
          >
            {{ sentiment.label }}
          </button>
        </div>
      </div>
    </div>

    <!-- Results Info -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4" v-if="!loading && totalResults > 0">
      <p class="text-gray-400 text-sm">
        Found <span class="text-white font-bold">{{ totalResults.toLocaleString() }}</span> results
        <span v-if="hasMoreResults" class="text-gray-500"> (showing {{ posts.length }})</span>
      </p>
    </div>

    <!-- News Grid -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Loading Skeletons -->
      <div v-if="loading && posts.length === 0" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <SkeletonCard v-for="n in 9" :key="n" />
      </div>

      <!-- News Posts -->
      <div v-else-if="posts.length > 0" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <NewsCard
          v-for="post in posts"
          :key="post.uuid"
          :post="post"
        />
      </div>

      <!-- No Results -->
      <div v-else class="text-center py-16">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-16 h-16 mx-auto text-gray-600 mb-4">
          <path stroke-linecap="round" stroke-linejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
        </svg>
        <h3 class="text-xl font-bold text-gray-400 mb-2">No news found</h3>
        <p class="text-gray-500">Try adjusting your search or filters</p>
      </div>

      <!-- Loading More -->
      <div v-if="loading && posts.length > 0" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
        <SkeletonCard v-for="n in 3" :key="n" />
      </div>

      <!-- Load More Trigger -->
      <div ref="loadMoreTrigger" class="h-10"></div>
    </div>

    <!-- API Info Footer -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 border-t border-gray-800">
      <div class="text-center text-gray-500 text-sm">
        <p class="mb-2">
          This page uses the Webz.io News API Lite - Free for non-commercial use
        </p>
        <p class="text-xs">
          Limited to 1,000 monthly API calls | Up to 10 results per request | 30 days historical data
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.no-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
.no-scrollbar::-webkit-scrollbar {
  display: none;
}
</style>