<script setup lang="ts">
import { onMounted, onUnmounted, ref, computed, watch } from 'vue'
import NewsCard from '../components/NewsCard.vue'
import SkeletonCard from '../components/SkeletonCard.vue'
import { useNewsStore } from '../stores/news'
import { useArticleStore } from '../stores/articles'
import { storeToRefs } from 'pinia'

const newsStore = useNewsStore()
const articleStore = useArticleStore()
const { posts, loading, totalResults, requestsLeft, hasMoreResults } = storeToRefs(newsStore)
const { searchQuery } = storeToRefs(articleStore)

// Search and filter states
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

// Watch for global search query changes
watch(searchQuery, async (newQuery) => {
  await fetchNews()
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

// Handle topic change
const handleTopicChange = (topic: string) => {
  selectedTopic.value = topic
  articleStore.setSearchQuery('') // Clear global search when changing topic
  fetchNews()
}

// Handle sentiment change
const handleSentimentChange = (sentiment: string | null) => {
  selectedSentiment.value = sentiment
  articleStore.setSearchQuery('') // Clear global search when changing sentiment
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

// Grid layout configuration
const getCardConfig = (index: number) => {
  const i = index % 10 // Repeat pattern every 10 items
  
  // 3-column grid pattern (lg)
  // Row 1-2: [Featured 2x2] [Default] / [Default]
  // Row 3:   [Horizontal 2x1] [Default]
  // Row 4:   [Default] [Horizontal 2x1]
  // Row 5:   [Default] [Default] [Default]
  
  if (i === 0) return { variant: 'featured', class: 'lg:col-span-2 lg:row-span-2' }
  if (i === 1) return { variant: 'default', class: 'lg:col-span-1 lg:row-span-1' }
  if (i === 2) return { variant: 'default', class: 'lg:col-span-1 lg:row-span-1' }
  
  if (i === 3) return { variant: 'horizontal', class: 'lg:col-span-2' }
  if (i === 4) return { variant: 'compact', class: 'lg:col-span-1' }
  
  if (i === 5) return { variant: 'default', class: 'lg:col-span-1' }
  if (i === 6) return { variant: 'horizontal', class: 'lg:col-span-2' }

  // Remaining 3 items (7, 8, 9) fill a row
  return { variant: 'default', class: 'lg:col-span-1' }
}
</script>

<template>
  <div class="bg-black min-h-screen pb-20">

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
      <div v-else-if="posts.length > 0" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-fr" style="grid-auto-flow: dense;">
        <NewsCard
          v-for="(post, index) in posts"
          :key="post.uuid"
          :post="post"
          :variant="getCardConfig(index).variant"
          :class="getCardConfig(index).class"
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