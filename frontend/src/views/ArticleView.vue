<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import { useArticleStore } from '../stores/articles'
import { useNewsStore } from '../stores/news'
import { apiServiceExtended } from '../services/api'
import CommentSection from '../components/CommentSection.vue'

const route = useRoute()
const articleStore = useArticleStore()
const newsStore = useNewsStore()
const articleId = route.params.id as string

const article = ref<any>(null)
const loading = ref(true)
const showComments = ref(true)

onMounted(async () => {
  // 1. Try local store (internal articles)
  const localArticle = articleStore.getArticleById(articleId)
  if (localArticle) {
    article.value = localArticle
    loading.value = false
    return
  }

  // 2. Try fetching internal article from API (if direct link)
  try {
    const fetchedArticle = await apiServiceExtended.getArticle(articleId)
    article.value = { ...fetchedArticle, liked: false, saved: false }
    loading.value = false
    return
  } catch {
    // Ignore error, try external
  }

  // 3. Try external news store
  const newsPost = newsStore.getPostById(articleId)
  if (newsPost) {
    // Prepare for import
    const articleToImport = {
      id: newsPost.uuid,
      title: newsPost.title,
      excerpt: (newsPost.highlightText || newsPost.text).substring(0, 300),
      content: newsPost.text, // Snippet as fallback content
      author: newsPost.author || newsPost.thread.site,
      publisher: newsPost.thread.site,
      source_url: newsPost.url,
      image_url: newsPost.thread.main_image,
      published_at: newsPost.published,
      topics: newsPost.categories
    }

    loading.value = false
    
    // 1. Render immediate snippet
    article.value = {
        ...articleToImport,
        isExternal: true, // Temporary while importing
        liked: false,
        saved: false,
        isContentLoading: true
    }

    // 2. Import to Backend (Async, don't block content fetch)
    apiServiceExtended.importArticle(articleToImport)
      .then(importedArticle => {
        // Update local state with real DB article (ID, interactions)
        // BUT exclude content to avoid overwriting the full scraped content if it arrives first/later
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { content, ...rest } = importedArticle
        if (article.value) {
          article.value = {
            ...article.value,
            ...rest,
            isExternal: false
          }
        }
      })
      .catch(e => console.error('Import failed', e))

    // 3. Fetch Full Content (Async)
    try {
      const fullContent = await apiServiceExtended.getArticleContent(newsPost.url)
      if (article.value) {
        article.value.content = fullContent.content
      }
    } catch (e) {
      console.error('Failed to fetch full content', e)
    } finally {
      if (article.value) {
        article.value.isContentLoading = false
      }
    }
    return
  }
  
  loading.value = false
})

const scrollToComments = async () => {
  showComments.value = true
  await nextTick()
  const commentsSection = document.getElementById('comments-section')
  if (commentsSection) {
    commentsSection.scrollIntoView({ behavior: 'smooth' })
  }
}

const handleLike = async () => {
  if (!article.value) return
  if (article.value.isExternal) {
    article.value.liked = !article.value.liked
    return
  }
  try {
    const status = await apiServiceExtended.likeArticle(article.value.id)
    article.value.liked = status.is_liked
  } catch (e) {
    console.error('Failed to like', e)
  }
}

const handleSave = async () => {
  if (!article.value) return
  if (article.value.isExternal) {
    article.value.saved = !article.value.saved
    return
  }
  try {
    const status = await apiServiceExtended.saveArticle(article.value.id)
    article.value.saved = status.is_saved
  } catch (e) {
    console.error('Failed to save', e)
  }
}
</script>

<template>
  <div class="bg-black min-h-screen text-gray-100 pb-20">
    <div v-if="article" class="animate-fade-in">
        <!-- Article Hero -->
        <div class="relative h-[50vh] w-full">
            <img :src="article.image_url || 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=800&q=80'" :alt="article.title" class="w-full h-full object-cover" />
            <div class="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent"></div>
            <div class="absolute bottom-0 left-0 w-full p-6 md:p-12 max-w-4xl mx-auto">
                <span class="bg-flipboard-red text-white px-3 py-1 text-xs font-bold uppercase tracking-widest mb-4 inline-block">
                    {{ article.publisher }}
                </span>
                <h1 class="text-3xl md:text-5xl lg:text-6xl font-serif font-bold text-white leading-tight mb-4 shadow-black drop-shadow-lg">
                    {{ article.title }}
                </h1>
                <div class="flex items-center space-x-4 text-gray-300 text-sm md:text-base font-medium">
                    <div class="flex items-center space-x-2">
                        <div class="h-8 w-8 rounded-full bg-gray-700 flex items-center justify-center border border-gray-600 text-white font-bold">
                            {{ article.author ? article.author.charAt(0) : 'A' }}
                        </div>
                        <span>{{ article.author || article.publisher }}</span>
                    </div>
                    <span>&bull;</span>
                    <span>{{ article.published_at ? new Date(article.published_at).toLocaleDateString() : 'Just now' }}</span>
                </div>
            </div>
        </div>

        <!-- Article Content -->
        <article class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
             <p class="text-xl md:text-2xl text-gray-300 font-serif italic leading-relaxed mb-10 border-l-4 border-flipboard-red pl-6">
                 {{ article.excerpt }}
             </p>
             
             <div v-if="article.isContentLoading" class="text-center py-4 text-gray-500 animate-pulse font-serif">
               Fetching full article content...
             </div>
             
             <!-- Content / Snippet -->
             <div class="prose prose-lg prose-invert prose-red max-w-none font-serif text-gray-300 leading-loose mb-8" v-html="article.content"></div>

             <!-- Read Full Story Link for External News -->
             <div v-if="article.isExternal" class="mt-8 text-center border-t border-gray-800 pt-8">
                <p class="text-gray-400 mb-4">This is a preview. Read the full story at the source.</p>
                <a :href="article.url" target="_blank" rel="noopener noreferrer" class="inline-block px-6 py-3 bg-gray-800 hover:bg-gray-700 text-white font-bold rounded-lg transition-colors">
                  Read Full Story on {{ article.publisher }}
                </a>
             </div>
        </article>

        <!-- Comments Section -->
        <div id="comments-section" v-if="!article.isExternal">
          <CommentSection v-if="showComments" :article-id="articleId" />
        </div>
        <div v-else class="max-w-3xl mx-auto px-4 py-8 text-center text-gray-500 border-t border-gray-800">
          Comments are disabled for external news.
        </div>

        <!-- Interaction Bar -->
        <div class="fixed bottom-0 left-0 w-full bg-gray-900 border-t border-gray-800 p-4 z-40">
            <div class="max-w-3xl mx-auto flex items-center justify-between">
                <div class="flex items-center space-x-6">
                    <button 
                      @click="handleLike"
                      class="flex items-center space-x-2 transition-colors"
                      :class="article.liked ? 'text-flipboard-red' : 'text-gray-400 hover:text-flipboard-red'"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" :fill="article.liked ? 'currentColor' : 'none'" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
                        </svg>
                        <span class="hidden sm:inline font-bold text-sm">{{ article.liked ? 'Liked' : 'Like' }}</span>
                    </button>
                    <button
                      v-if="!article.isExternal"
                      @click="scrollToComments"
                      class="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 0 1 .865-.501 48.172 48.172 0 0 0 3.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
                        </svg>
                        <span class="hidden sm:inline font-bold text-sm">Comment</span>
                    </button>
                </div>
                
                 <button 
                    @click="handleSave"
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
    <div v-else-if="!loading" class="flex flex-col items-center justify-center min-h-[50vh] text-center p-8">
        <h1 class="text-4xl font-bold mb-4">Article not found</h1>
        <p class="text-gray-500 mb-8">The article you are looking for does not exist or has expired.</p>
        <RouterLink to="/" class="text-flipboard-red font-bold hover:underline">Go back home</RouterLink>
    </div>
    
    <!-- Loading State -->
    <div v-else class="min-h-screen flex items-center justify-center">
        <div class="animate-pulse text-gray-500">Loading article...</div>
    </div>
  </div>
</template>

<style scoped>
.prose p {
    margin-bottom: 1.5em;
}
</style>
