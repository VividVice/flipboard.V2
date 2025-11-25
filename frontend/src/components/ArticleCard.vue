<script setup lang="ts">
import { ref } from 'vue'
import { useArticleStore } from '../stores/articles'
import SaveModal from './SaveModal.vue'

const props = defineProps<{
  article: {
    id: string
    title: string
    description: string
    imageUrl: string
    source: string
    author: string
    liked?: boolean
    saved?: boolean
  }
}>()

const articleStore = useArticleStore()
const isSaveModalOpen = ref(false)

const toggleLike = (e: Event) => {
  e.preventDefault()
  e.stopPropagation()
  articleStore.toggleLike(props.article.id)
}

const openSaveModal = (e: Event) => {
  e.preventDefault()
  e.stopPropagation()
  // If already saved, just toggle it off (or could open modal to remove? For simplicity, toggle off directly)
  if (props.article.saved) {
    articleStore.toggleSave(props.article.id)
  } else {
    isSaveModalOpen.value = true
  }
}
</script>

<template>
  <div class="group flex flex-col bg-gray-900 h-full hover:bg-gray-800 transition-colors duration-200 cursor-pointer border border-gray-800 relative">
    <!-- Save Modal Portal -->
    <Teleport to="body">
      <SaveModal 
        :is-open="isSaveModalOpen" 
        :article-id="article.id"
        @close="isSaveModalOpen = false"
      />
    </Teleport>

    <!-- Image Container -->
    <div class="relative aspect-[4/3] overflow-hidden bg-gray-800">
      <img 
        class="h-full w-full object-cover transform group-hover:scale-105 transition-transform duration-500 ease-out" 
        :src="article.imageUrl" 
        :alt="article.title" 
      />
    </div>
    
    <!-- Content -->
    <div class="flex-1 p-4 flex flex-col">
      <!-- Source & Time -->
      <div class="flex items-center justify-between mb-2">
         <div class="flex items-center space-x-2">
             <div class="h-5 w-5 rounded bg-gray-800 flex items-center justify-center text-[10px] font-bold text-gray-400 border border-gray-700">
                {{ article.source.charAt(0) }}
             </div>
             <span class="text-xs font-bold text-gray-300 uppercase tracking-wider">{{ article.source }}</span>
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
        {{ article.description }}
      </p>

      <!-- Footer -->
      <div class="mt-auto pt-4 flex items-center justify-between border-t border-gray-800">
        <div class="flex items-center space-x-3 text-gray-500">
           <button @click="toggleLike" class="transition-colors" :class="article.liked ? 'text-flipboard-red' : 'hover:text-flipboard-red'">
              <svg xmlns="http://www.w3.org/2000/svg" :fill="article.liked ? 'currentColor' : 'none'" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
              </svg>
           </button>
           <button class="hover:text-white transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
                 <path stroke-linecap="round" stroke-linejoin="round" d="M7.217 10.907a2.25 2.25 0 1 0 0 2.186m0-2.186c.18.324.287.696.345 1.084m-3.13 1.61a2.25 2.25 0 1 0 2.25 2.25m-2.25-2.25c.34.056.689.103 1.038.14m5.714-4.567a2.25 2.25 0 1 0 0 2.186m0-2.186c.18.324.287.696.345 1.084m-3.13 1.61a2.25 2.25 0 1 0 2.25 2.25m-2.25-2.25c.34.056.689.103 1.038.14m5.714-4.567a2.25 2.25 0 1 0 0 2.186m0-2.186c.18.324.287.696.345 1.084m-3.13 1.61a2.25 2.25 0 1 0 2.25 2.25m-2.25-2.25c.34.056.689.103 1.038.14" />
               </svg>
           </button>
        </div>
        <button @click="openSaveModal" class="transition-colors" :class="article.saved ? 'text-white' : 'text-gray-500 hover:text-white'">
          <svg xmlns="http://www.w3.org/2000/svg" :fill="article.saved ? 'currentColor' : 'none'" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0Z" />
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>
