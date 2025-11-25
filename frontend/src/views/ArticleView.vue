<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useArticleStore } from '../stores/articles'

const route = useRoute()
const articleStore = useArticleStore()
const articleId = route.params.id as string

const article = computed(() => {
  return articleStore.getArticleById(articleId)
})
</script>

<template>
  <div class="bg-black min-h-screen text-gray-100 pb-20">
    <div v-if="article" class="animate-fade-in">
        <!-- Article Hero -->
        <div class="relative h-[50vh] w-full">
            <img :src="article.imageUrl" :alt="article.title" class="w-full h-full object-cover" />
            <div class="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent"></div>
            <div class="absolute bottom-0 left-0 w-full p-6 md:p-12 max-w-4xl mx-auto">
                <span class="bg-flipboard-red text-white px-3 py-1 text-xs font-bold uppercase tracking-widest mb-4 inline-block">
                    {{ article.source }}
                </span>
                <h1 class="text-3xl md:text-5xl lg:text-6xl font-serif font-bold text-white leading-tight mb-4 shadow-black drop-shadow-lg">
                    {{ article.title }}
                </h1>
                <div class="flex items-center space-x-4 text-gray-300 text-sm md:text-base font-medium">
                    <div class="flex items-center space-x-2">
                        <div class="h-8 w-8 rounded-full bg-gray-700 flex items-center justify-center border border-gray-600 text-white font-bold">
                            {{ article.author.charAt(0) }}
                        </div>
                        <span>{{ article.author }}</span>
                    </div>
                    <span>&bull;</span>
                    <span>{{ article.date || 'Nov 25, 2025' }}</span>
                    <span>&bull;</span>
                    <span>6 min read</span>
                </div>
            </div>
        </div>

        <!-- Article Content -->
        <article class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
             <p class="text-xl md:text-2xl text-gray-300 font-serif italic leading-relaxed mb-10 border-l-4 border-flipboard-red pl-6">
                 {{ article.description }}
             </p>
             
             <!-- Typography Plugin usage -->
             <div class="prose prose-lg prose-invert prose-red max-w-none font-serif text-gray-300 leading-loose" v-html="article.content"></div>
        </article>

        <!-- Interaction Bar -->
        <div class="fixed bottom-0 left-0 w-full bg-gray-900 border-t border-gray-800 p-4 z-40">
            <div class="max-w-3xl mx-auto flex items-center justify-between">
                <div class="flex items-center space-x-6">
                    <button 
                      @click="articleStore.toggleLike(article.id)"
                      class="flex items-center space-x-2 transition-colors"
                      :class="article.liked ? 'text-flipboard-red' : 'text-gray-400 hover:text-flipboard-red'"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" :fill="article.liked ? 'currentColor' : 'none'" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
                        </svg>
                        <span class="hidden sm:inline font-bold text-sm">{{ article.liked ? 'Liked' : 'Like' }}</span>
                    </button>
                    <button class="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M7.217 10.907a2.25 2.25 0 1 0 0 2.186m0-2.186c.18.324.287.696.345 1.084m-3.13 1.61a2.25 2.25 0 1 0 2.25 2.25m-2.25-2.25c.34.056.689.103 1.038.14m5.714-4.567a2.25 2.25 0 1 0 0 2.186m0-2.186c.18.324.287.696.345 1.084m-3.13 1.61a2.25 2.25 0 1 0 2.25 2.25m-2.25-2.25c.34.056.689.103 1.038.14m5.714-4.567a2.25 2.25 0 1 0 0 2.186m0-2.186c.18.324.287.696.345 1.084m-3.13 1.61a2.25 2.25 0 1 0 2.25 2.25m-2.25-2.25c.34.056.689.103 1.038.14m5.714-4.567a2.25 2.25 0 1 0 0 2.186m0-2.186c.18.324.287.696.345 1.084m-3.13 1.61a2.25 2.25 0 1 0 2.25 2.25m-2.25-2.25c.34.056.689.103 1.038.14" />
                        </svg>
                        <span class="hidden sm:inline font-bold text-sm">Comment</span>
                    </button>
                </div>
                
                 <button 
                    @click="articleStore.toggleSave(article.id)"
                    class="flex items-center space-x-2 transition-colors"
                    :class="article.saved ? 'text-white' : 'text-gray-400 hover:text-white'"
                 >
                        <svg xmlns="http://www.w3.org/2000/svg" :fill="article.saved ? 'currentColor' : 'none'" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
                           <path stroke-linecap="round" stroke-linejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0Z" />
                        </svg>
                        <span class="hidden sm:inline font-bold text-sm">{{ article.saved ? 'Saved' : 'Save' }}</span>
                 </button>
            </div>
        </div>
    </div>
    
    <!-- Not Found State -->
    <div v-else class="flex flex-col items-center justify-center min-h-[50vh] text-center p-8">
        <h1 class="text-4xl font-bold mb-4">Article not found</h1>
        <p class="text-gray-500 mb-8">The article you are looking for does not exist.</p>
        <RouterLink to="/" class="text-flipboard-red font-bold hover:underline">Go back home</RouterLink>
    </div>
  </div>
</template>

<style scoped>
.prose p {
    margin-bottom: 1.5em;
}
</style>
