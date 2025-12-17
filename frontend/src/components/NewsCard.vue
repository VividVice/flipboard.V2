<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { apiServiceExtended, type NewsPost } from '../services/api'

const props = defineProps<{
  post: NewsPost
}>()

const router = useRouter()
const isLiked = ref(props.post.liked ?? false)
const isSaved = ref(props.post.saved ?? false)

// Format date to relative time
const formatPublishedDate = (dateString: string) => {
  const date = new Date(dateString)
  const now = new Date()
  const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))

  if (diffInHours < 1) return 'Just now'
  if (diffInHours < 24) return `${diffInHours}h`
  const diffInDays = Math.floor(diffInHours / 24)
  if (diffInDays < 7) return `${diffInDays}d`
  return date.toLocaleDateString()
}

// Get sentiment badge color
const sentimentColor = computed(() => {
  switch (props.post.sentiment) {
    case 'positive':
      return 'bg-green-500/20 text-green-400 border-green-500/30'
    case 'negative':
      return 'bg-red-500/20 text-red-400 border-red-500/30'
    case 'neutral':
      return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    default:
      return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
  }
})

// Get excerpt from highlightText or regular text
const excerpt = computed(() => {
  const text = props.post.highlightText || props.post.text
  if (text.length > 150) {
    return text.substring(0, 150) + '...'
  }
  return text
})

const openArticle = () => {
  router.push({ name: 'article', params: { id: props.post.uuid } })
}

const toggleLike = async () => {
  const previousState = isLiked.value
  isLiked.value = !isLiked.value

  try {
    const articleToImport = {
      id: props.post.uuid,
      title: props.post.title,
      excerpt: (props.post.highlightText || props.post.text).substring(0, 300),
      content: props.post.text,
      author: props.post.author || props.post.thread.site,
      publisher: props.post.thread.site,
      source_url: props.post.url,
      image_url: props.post.thread.main_image,
      published_at: props.post.published,
      topics: props.post.categories
    }

    const article = await apiServiceExtended.importArticle(articleToImport)
    const status = await apiServiceExtended.likeArticle(article.id)
    isLiked.value = status.is_liked
  } catch (e) {
    console.error('Failed to like', e)
    isLiked.value = previousState
  }
}

const toggleSave = async () => {
  const previousState = isSaved.value
  isSaved.value = !isSaved.value

  try {
    const articleToImport = {
      id: props.post.uuid,
      title: props.post.title,
      excerpt: (props.post.highlightText || props.post.text).substring(0, 300),
      content: props.post.text,
      author: props.post.author || props.post.thread.site,
      publisher: props.post.thread.site,
      source_url: props.post.url,
      image_url: props.post.thread.main_image,
      published_at: props.post.published,
      topics: props.post.categories
    }

    const article = await apiServiceExtended.importArticle(articleToImport)
    const status = await apiServiceExtended.saveArticle(article.id)
    isSaved.value = status.is_saved
  } catch (e) {
    console.error('Failed to save', e)
    isSaved.value = previousState
  }
}
</script>

<template>
  <div
    @click="openArticle"
    class="group flex flex-col bg-gray-900 h-full hover:bg-gray-800 transition-colors duration-200 cursor-pointer border border-gray-800 relative"
  >
    <!-- Image Container -->
    <div class="relative aspect-[4/3] overflow-hidden bg-gray-800">
      <img
        class="h-full w-full object-cover transform group-hover:scale-105 transition-transform duration-500 ease-out"
        :src="post.thread.main_image || 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=800&q=80'"
        :alt="post.title"
      />
      <!-- Sentiment Badge -->
      <div
        v-if="post.sentiment"
        class="absolute top-3 right-3 px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border backdrop-blur-sm"
        :class="sentimentColor"
      >
        {{ post.sentiment }}
      </div>
    </div>

    <!-- Content -->
    <div class="flex-1 p-4 flex flex-col">
      <!-- Source & Time -->
      <div class="flex items-center justify-between mb-2">
         <div class="flex items-center space-x-2">
             <div class="h-5 w-5 rounded bg-gray-800 flex items-center justify-center text-[10px] font-bold text-gray-400 border border-gray-700">
                {{ post.thread.site.charAt(0).toUpperCase() }}
             </div>
             <span class="text-xs font-bold text-gray-300 uppercase tracking-wider">{{ post.thread.site }}</span>
         </div>
         <span class="text-xs text-gray-500">{{ formatPublishedDate(post.published) }}</span>
      </div>

      <!-- Title -->
      <h3 class="text-xl font-serif font-bold text-white leading-tight group-hover:text-flipboard-red transition-colors mb-2">
        {{ post.title }}
      </h3>

      <!-- Excerpt with HTML highlighting -->
      <div
        v-if="post.highlightText"
        class="text-sm text-gray-400 line-clamp-3 mb-4 font-sans leading-relaxed"
        v-html="post.highlightText.replace(/<em>/g, '<em class=&quot;text-yellow-400 not-italic font-semibold&quot;>')"
      />
      <p v-else class="text-sm text-gray-400 line-clamp-3 mb-4 font-sans leading-relaxed">
        {{ excerpt }}
      </p>

      <!-- Categories/Topics -->
      <div v-if="post.categories.length > 0" class="flex flex-wrap gap-1 mb-3">
        <span
          v-for="category in post.categories.slice(0, 2)"
          :key="category"
          class="px-2 py-1 text-[10px] font-semibold text-gray-400 bg-gray-800 rounded uppercase tracking-wide"
        >
          {{ category }}
        </span>
      </div>

      <!-- Footer -->
      <div class="mt-auto pt-4 flex items-center justify-between border-t border-gray-800">
        <div class="flex items-center space-x-4 text-gray-500">
           <!-- Like Button -->
           <button @click.stop="toggleLike" class="flex items-center space-x-1 hover:text-flipboard-red transition-colors" :class="{'text-flipboard-red': isLiked}">
             <svg xmlns="http://www.w3.org/2000/svg" :fill="isLiked ? 'currentColor' : 'none'" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
               <path stroke-linecap="round" stroke-linejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
             </svg>
             <span class="text-xs">{{ (post.thread.social?.facebook?.likes || 0) + (isLiked ? 1 : 0) }}</span>
           </button>
           
           <!-- Comment Button -->
           <button class="flex items-center space-x-1 hover:text-white transition-colors">
             <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
               <path stroke-linecap="round" stroke-linejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 0 1 .865-.501 48.172 48.172 0 0 0 3.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
             </svg>
             <span class="text-xs">{{ post.thread.social?.facebook?.comments || 0 }}</span>
           </button>
           
           <!-- Save Button -->
           <button @click.stop="toggleSave" class="flex items-center space-x-1 hover:text-white transition-colors" :class="{'text-white': isSaved}">
             <svg xmlns="http://www.w3.org/2000/svg" :fill="isSaved ? 'currentColor' : 'none'" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
               <path stroke-linecap="round" stroke-linejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0Z" />
             </svg>
           </button>
        </div>
        <div class="flex items-center space-x-2">
          <!-- Country flag or indicator -->
          <span v-if="post.thread.country" class="text-xs text-gray-500 uppercase font-bold">
            {{ post.thread.country }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>
