<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue'
import NewsCard from '../components/NewsCard.vue'
import SkeletonCard from '../components/SkeletonCard.vue'
import { useNewsStore } from '../stores/news'
import { useArticleStore } from '../stores/articles'
import { useTopicStore } from '../stores/topics'
import { storeToRefs } from 'pinia'
import type { NewsPost } from '../services/api'

const newsStore = useNewsStore()
const articleStore = useArticleStore()
const topicStore = useTopicStore()
const { posts, loading, totalResults, hasMoreResults, isPersonalizedFeed, currentCountry } = storeToRefs(newsStore)
const { searchQuery } = storeToRefs(articleStore)
const { followedTopics } = storeToRefs(topicStore)

// Search and filter states
const selectedTopic = ref<string | null>(null)
const selectedSentiment = ref<string | null>(null)

const sentiments = [
  { value: null, label: 'All' },
  { value: 'positive', label: 'Positive' },
  { value: 'negative', label: 'Negative' },
  { value: 'neutral', label: 'Neutral' }
]

const countries = [
  { code: 'US', label: 'US' },
  { code: 'FR', label: 'FR' },
  { code: 'GB', label: 'UK' },
  { code: 'DE', label: 'DE' },
  { code: 'IT', label: 'IT' },
  { code: 'ES', label: 'ES' },
  { code: 'CA', label: 'CA' }
]

onMounted(async () => {
  // Fetch followed topics first
  await topicStore.fetchFollowedTopics()
  
  // Set initial topic if available, otherwise fetch for-you feed
  if (followedTopics.value.length > 0) {
    await fetchNews()
  } else {
    // Default fallback if no topics followed
    selectedTopic.value = 'technology'
    await fetchNews()
  }

  if (loadMoreTrigger.value) {
    observer.observe(loadMoreTrigger.value)
  }
})

// Watch for global search query changes with debounce
let debounceTimer: ReturnType<typeof setTimeout> | null = null
watch(searchQuery, (newQuery) => {
  if (debounceTimer) clearTimeout(debounceTimer)
  
  debounceTimer = setTimeout(async () => {
    if (newQuery.trim()) {
      selectedTopic.value = null
    }
    await fetchNews()
  }, 500)
})

// Fetch news based on current filters
const fetchNews = async () => {
  layoutCache.clear() // Clear layout cache on new search
  if (searchQuery.value.trim()) {
    // Custom search query
    await newsStore.fetchNews({ q: searchQuery.value, size: 10 })
  } else if (selectedTopic.value) {
    // Fetch by topic and sentiment
    await newsStore.fetchNewsByTopic(selectedTopic.value, {
      sentiment: selectedSentiment.value || undefined,
      size: 10
    })
  } else {
    // Fetch personalized feed
    await newsStore.fetchNewsFeed({ size: 10 })
  }
}

// Handle topic change
const handleTopicChange = (topicName: string | null) => {
  selectedTopic.value = topicName
  articleStore.setSearchQuery('') // Clear global search when changing topic
  fetchNews()
}

// Handle sentiment change
const handleSentimentChange = (sentiment: string | null) => {
  selectedSentiment.value = sentiment
  // We don't clear search query here to allow sentiment filtering on search
  fetchNews()
}

// Handle country change
const handleCountryChange = (countryCode: string) => {
  newsStore.setCountry(countryCode)
  fetchNews()
}

// Dropdown state
const isCountryDropdownOpen = ref(false)

const toggleCountryDropdown = () => {
  isCountryDropdownOpen.value = !isCountryDropdownOpen.value
}

const handleCountrySelect = (countryCode: string) => {
  handleCountryChange(countryCode)
  isCountryDropdownOpen.value = false
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
  if (debounceTimer) clearTimeout(debounceTimer)
})


// Grid layout configuration
type CardVariant = 'default' | 'featured' | 'horizontal' | 'compact'
type CardConfig = { variant: CardVariant, class: string }

// Cache layout config to prevent shifts when appending
const layoutCache = new Map<string, CardConfig>()

const getCardConfig = (post: NewsPost, index: number): CardConfig => {
  if (layoutCache.has(post.uuid)) {
    return layoutCache.get(post.uuid)!
  }

  const i = index % 10 // Repeat pattern every 10 items
  let config: CardConfig

  // 3-column grid pattern (lg)
  // Row 1-2: [Featured 2x2] [Default] / [Default]
  // Row 3:   [Horizontal 2x1] [Default]
  // Row 4:   [Default] [Horizontal 2x1]
  // Row 5:   [Default] [Default] [Default]
  
  if (i === 0) config = { variant: 'featured', class: 'lg:col-span-2 lg:row-span-2' }
  else if (i === 1) config = { variant: 'default', class: 'lg:col-span-1 lg:row-span-1' }
  else if (i === 2) config = { variant: 'default', class: 'lg:col-span-1 lg:row-span-1' }
  
  else if (i === 3) config = { variant: 'horizontal', class: 'lg:col-span-2' }
  else if (i === 4) config = { variant: 'compact', class: 'lg:col-span-1' }
  
  else if (i === 5) config = { variant: 'default', class: 'lg:col-span-1' }
  else if (i === 6) config = { variant: 'horizontal', class: 'lg:col-span-2' }

  // Remaining 3 items (7, 8, 9) fill a row
  else config = { variant: 'default', class: 'lg:col-span-1' }

  layoutCache.set(post.uuid, config)
  return config
}
</script>

<template>
  <div class="bg-black min-h-screen pb-20">

    <!-- Filter Bars -->
    <div class="sticky top-[60px] z-40 bg-black/95 border-b border-gray-800 backdrop-blur supports-[backdrop-filter]:bg-black/60">
      <!-- Topic Filter -->
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex space-x-2 overflow-x-auto py-3 no-scrollbar border-b border-gray-800">
          <!-- Personalized Feed Button -->
          <button
            type="button"
            @click="() => handleTopicChange(null)"
            class="px-4 py-1 rounded-full text-sm font-bold whitespace-nowrap transition-all border flex items-center cursor-pointer select-none"
            :class="isPersonalizedFeed
              ? 'bg-flipboard-red text-white border-flipboard-red'
              : 'bg-gray-900 text-gray-400 border-gray-700 hover:border-gray-500 hover:text-gray-200'"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-4 h-4 mr-1">
              <path fill-rule="evenodd" d="M10.868 2.884c-.321-.772-1.415-.772-1.736 0l-1.83 4.401-4.753.381c-.833.067-1.171 1.107-.536 1.651l3.62 3.102-1.106 4.637c-.194.813.691 1.456 1.405 1.02L10 15.591l4.069 2.485c.713.436 1.598-.207 1.404-1.02l-1.106-4.637 3.62-3.102c.635-.544.297-1.584-.536-1.65l-4.752-.382-1.831-4.401z" clip-rule="evenodd" />
            </svg>
            For You
          </button>

          <button
            type="button"
            v-for="topic in followedTopics"
            :key="topic.id"
            @click="() => handleTopicChange(topic.name)"
            class="px-4 py-1 rounded-full text-sm font-bold whitespace-nowrap transition-all border capitalize cursor-pointer select-none"
            :class="selectedTopic === topic.name
              ? 'bg-white text-black border-white'
              : 'bg-gray-900 text-gray-400 border-gray-700 hover:border-gray-500 hover:text-gray-200'"
          >
            {{ topic.name }}
          </button>

          <!-- Fallback if no followed topics -->
          <router-link 
            v-if="followedTopics.length === 0"
            to="/topics" 
            class="px-4 py-1 rounded-full text-sm font-bold whitespace-nowrap bg-gray-900 text-flipboard-red border border-gray-700 hover:border-flipboard-red transition-all"
          >
            + Add Topics
          </router-link>
        </div>

        <!-- Sentiment & Country Filter -->
        <div class="flex items-center justify-between py-3">
          <div class="flex space-x-2 overflow-x-auto no-scrollbar flex-grow mr-4">
            <button
              v-for="sentiment in sentiments"
              :key="sentiment.value || 'all'"
              @click="handleSentimentChange(sentiment.value)"
              class="px-4 py-1 rounded-full text-sm font-bold whitespace-nowrap transition-all border cursor-pointer"
              :class="selectedSentiment === sentiment.value
                ? 'bg-flipboard-red text-white border-flipboard-red'
                : 'bg-gray-900 text-gray-400 border-gray-700 hover:border-gray-500 hover:text-gray-200'"
            >
              {{ sentiment.label }}
            </button>
          </div>

          <!-- Country Dropdown -->
          <div class="relative flex-shrink-0">
            <button
              @click="toggleCountryDropdown"
              class="flex items-center space-x-2 px-4 py-1 rounded-full text-sm font-bold bg-gray-900 text-white border border-gray-700 hover:border-gray-500 transition-all cursor-pointer"
            >
              <span>{{ countries.find(c => c.code === currentCountry)?.label || 'Select Country' }}</span>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-4 h-4 transition-transform" :class="{ 'rotate-180': isCountryDropdownOpen }">
                <path fill-rule="evenodd" d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z" clip-rule="evenodd" />
              </svg>
            </button>
            
            <transition
              enter-active-class="transition ease-out duration-100"
              enter-from-class="transform opacity-0 scale-95"
              enter-to-class="transform opacity-100 scale-100"
              leave-active-class="transition ease-in duration-75"
              leave-from-class="transform opacity-100 scale-100"
              leave-to-class="transform opacity-0 scale-95"
            >
              <div v-if="isCountryDropdownOpen" class="absolute right-0 mt-2 w-40 rounded-md shadow-lg bg-gray-900 border border-gray-800 z-50">
                <div class="py-1">
                  <button
                    v-for="country in countries"
                    :key="country.code"
                    @click="handleCountrySelect(country.code)"
                    class="block w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
                  >
                    {{ country.label }}
                  </button>
                </div>
              </div>
            </transition>
          </div>
        </div>
      </div>
    </div>

    <!-- Results Info -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4" v-if="totalResults > 0 && (!loading || posts.length > 0)">
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
          :variant="getCardConfig(post, index).variant"
          :class="getCardConfig(post, index).class"
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