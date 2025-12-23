<script setup lang="ts">
import { ref } from 'vue'
import { useArticleStore } from '../stores/articles'
import { useMagazineStore } from '../stores/magazines'
import SaveModal from './SaveModal.vue'

const props = defineProps<{
  article: {
    id: string
    title: string
    excerpt: string
    image_url?: string
    publisher: string
    author: string
    liked?: boolean
    saved?: boolean
  }
}>()

const articleStore = useArticleStore()
const magazineStore = useMagazineStore()
const isSaveModalOpen = ref(false)

const toggleLike = (e: Event) => {
  e.preventDefault()
  e.stopPropagation()
  articleStore.toggleLike(props.article.id)
}

const toggleSave = (e: Event) => {
  e.preventDefault()
  e.stopPropagation()
  articleStore.toggleSave(props.article.id)
}

const openSaveModal = (e: Event) => {
  e.preventDefault()
  e.stopPropagation()
  magazineStore.fetchUserMagazines()
  isSaveModalOpen.value = true
}
</script>

<template>
  <div class="group flex flex-col bg-gray-900 h-full hover:bg-gray-800 transition-colors duration-200 cursor-pointer border border-gray-800 relative">
    <!-- Save Modal Portal -->
    <Teleport to="body">
      <SaveModal 
        :is-open="isSaveModalOpen" 
        :article-data="{ id: article.id }"
        :should-import="false"
        @close="isSaveModalOpen = false"
      />
    </Teleport>

    <!-- Image Container -->
    <div class="relative aspect-[4/3] overflow-hidden bg-gray-800">
      <img
        class="h-full w-full object-cover transform group-hover:scale-105 transition-transform duration-500 ease-out"
        :src="article.image_url || 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80'"
        :alt="article.title"
      />
    </div>
    
    <!-- Content -->
    <div class="flex-1 p-4 flex flex-col">
      <!-- Source & Time -->
      <div class="flex items-center justify-between mb-2">
         <div class="flex items-center space-x-2">
             <div class="h-5 w-5 rounded bg-gray-800 flex items-center justify-center text-[10px] font-bold text-gray-400 border border-gray-700">
                {{ article.publisher.charAt(0) }}
             </div>
             <span class="text-xs font-bold text-gray-300 uppercase tracking-wider">{{ article.publisher }}</span>
         </div>
         <span class="text-xs text-gray-500">3h</span>
      </div>

      <!-- Title -->
      <RouterLink :to="`/article/${article.id}`" class="block mb-2">
        <h3 class="text-xl font-serif font-bold text-white leading-tight group-hover:text-flipboard-red transition-colors">
          {{ article.title }}
        </h3>
      </RouterLink>

      <!-- Excerpt -->
      <p class="text-sm text-gray-400 line-clamp-3 mb-4 font-sans leading-relaxed">
        {{ article.excerpt }}
      </p>

      <!-- Footer -->
      <div class="mt-auto pt-4 flex items-center justify-between border-t border-gray-800">
        <div class="flex items-center space-x-3 text-gray-500">
           <button @click="toggleLike" class="transition-colors" :class="article.liked ? 'text-flipboard-red' : 'hover:text-flipboard-red'">
              <svg xmlns="http://www.w3.org/2000/svg" :fill="article.liked ? 'currentColor' : 'none'" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
              </svg>
           </button>
           <RouterLink :to="`/article/${article.id}`" class="hover:text-white transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
                 <path stroke-linecap="round" stroke-linejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 0 1 .865-.501 48.172 48.172 0 0 0 3.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
               </svg>
           </RouterLink>
        </div>
        <div class="flex items-center space-x-3">
          <button @click="openSaveModal" class="text-gray-500 hover:text-white transition-colors">
             <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
               <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
             </svg>
          </button>
          <button @click="toggleSave" class="transition-colors" :class="article.saved ? 'text-white' : 'text-gray-500 hover:text-white'">
            <svg xmlns="http://www.w3.org/2000/svg" :fill="article.saved ? 'currentColor' : 'none'" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0Z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
