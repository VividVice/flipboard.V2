<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useArticleStore } from '../stores/articles'
import { useNewsStore } from '../stores/news'
import { useMagazineStore } from '../stores/magazines'
import { apiServiceExtended } from '../services/api'
import { useToastStore } from '../stores/toast'
import CommentSection from '../components/CommentSection.vue'
import SaveModal from '../components/SaveModal.vue'

const route = useRoute()
const router = useRouter()
const articleStore = useArticleStore()
const newsStore = useNewsStore()
const magazineStore = useMagazineStore()
const toastStore = useToastStore()
const articleId = route.params.id as string

interface ViewArticle {
  id: string
  title: string
  content: string
  image_url?: string
  author?: string
  publisher?: string
  published_at?: string
  source_url?: string
  excerpt?: string
  topics?: string[]
  isExternal?: boolean
  liked?: boolean
  saved?: boolean
  isContentLoading?: boolean
  [key: string]: unknown
}

const article = ref<ViewArticle | null>(null)
const loading = ref(true)
const showComments = ref(true)
const scrollProgress = ref(0)
const isSaveModalOpen = ref(false)

// Scroll Progress Logic
const updateScrollProgress = () => {
  const winScroll = document.documentElement.scrollTop
  const height = document.documentElement.scrollHeight - document.documentElement.clientHeight

  if (height <= 0) {
    // No scrollable content; avoid division by zero and treat progress as 0%
    scrollProgress.value = 0
    return
  }
  scrollProgress.value = (winScroll / height) * 100
}

// Reading Time Calculation
const readingTime = computed(() => {
  if (!article.value?.content) return 0
  const wordsPerMinute = 200
  const noHtml = article.value.content.replace(/<[^>]*>/g, '')
  const words = noHtml.split(/\s+/).length
  return Math.ceil(words / wordsPerMinute)
})

// Content Cleaning Function
const cleanContent = computed(() => {
  if (!article.value?.content) return ''
  
  let content = article.value.content
  
  // Patterns to remove (headers, common footer junk, social bars, and credits)
  const junkPatterns = [
    /More from [^<\n]*/gi,
    /Go deeper with [^<\n]*/gi,
    /Enjoyed this\? [^<\n]*/gi,
    /In:[\s\S]*?(?=<|$)/gi,
    /Related:[\s\S]*?(?=<|$)/gi,
    /Tags:[\s\S]*?(?=<|$)/gi,
    /See all topics/gi,
    /Facebook TweetEmail Link/gi,
    /Link Copied!/gi,
    /Follow\s+(us|me)\s+on\s+(Facebook|Twitter|X|Instagram)[^<\n]*/gi,
    /.*\/Getty Images/gi,
    /.*\/Universal Images Group/gi,
    /.*\/GHI\/UCG/gi,
    /.*\/Plexi Images/gi,
    /Copyright \d{4} [^<\n]*/gi
  ]
  
  junkPatterns.forEach(pattern => {
    content = content.replace(pattern, '')
  })
  
  // Clean up remaining empty paragraphs or multiple line breaks caused by removal
  content = content.replace(/<p>\s*<\/p>/g, '')
  content = content.replace(/\n\s*\n/g, '\n')
  
  return content
})

onMounted(async () => {
  window.addEventListener('scroll', updateScrollProgress)
  // 1. Try local store (internal articles)
  const localArticle = articleStore.getArticleById(articleId)
  if (localArticle) {
    article.value = localArticle
    loading.value = false
    // If content is short (likely a snippet), try to fetch full content
    if (localArticle.source_url && (!localArticle.content || localArticle.content.length < 2000)) {
        fetchFullContent(localArticle.source_url)
    }
    return
  }

  // 2. Try fetching internal article from API (if direct link)
  try {
    const fetchedArticle = await apiServiceExtended.getArticle(articleId)
    article.value = { ...fetchedArticle }
    loading.value = false
    // If content is short, try to fetch full content
    if (fetchedArticle.source_url && (!fetchedArticle.content || fetchedArticle.content.length < 2000)) {
        fetchFullContent(fetchedArticle.source_url)
    }
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
        liked: newsPost.liked || false,
        saved: newsPost.saved || false,
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
          
          // If local content is longer/better than what we just imported (e.g. fetchFullContent finished first),
          // push the full content to the backend.
          if (article.value.content && article.value.content.length > (importedArticle.content?.length || 0) + 100) {
              apiServiceExtended.importArticle(article.value).catch(console.error)
          }
        }
      })
      .catch(e => console.error('Import failed', e))

    // 3. Fetch Full Content (Async)
    fetchFullContent(newsPost.url)
    return
  }
  
  loading.value = false
})

onUnmounted(() => {
  window.removeEventListener('scroll', updateScrollProgress)
})

const fetchFullContent = async (url: string) => {
    if (!article.value) return
    article.value.isContentLoading = true
    try {
      const fullContent = await apiServiceExtended.getArticleContent(url)
      if (article.value && fullContent.content && fullContent.content.length > (article.value.content?.length || 0)) {
        article.value.content = fullContent.content
        
        // If the article is already imported (not external), update the backend with the full content
        if (!article.value.isExternal && article.value.id) {
             apiServiceExtended.importArticle(article.value).catch(console.error)
        }
      }
    } catch (e) {
      console.error('Failed to fetch full content', e)
    } finally {
      if (article.value) {
        article.value.isContentLoading = false
      }
    }
}

const handleShare = async () => {
  const url = window.location.href
  const title = article.value?.title || 'Check out this article on Flipboard'
  
  if (navigator.share) {
    try {
      await navigator.share({
        title,
        url
      })
    } catch {
      // User cancelled or share failed
      copyToClipboard(url)
    }
  } else {
    copyToClipboard(url)
  }
}

const copyToClipboard = async (text: string) => {
  if (!navigator.clipboard || !navigator.clipboard.writeText) {
    console.error('Clipboard API is not available')
    toastStore.show('Unable to access clipboard')
    return
  }

  try {
    await navigator.clipboard.writeText(text)
    toastStore.show('Link copied to clipboard')
  } catch (err) {
    console.error('Failed to copy to clipboard', err)
    toastStore.show('Unable to copy link to clipboard')
  }
}

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
  
  const previousState = article.value.liked
  article.value.liked = !article.value.liked
  
  try {
    let id = article.value.id
    if (article.value.isExternal) {
      const imported = await apiServiceExtended.importArticle(article.value)
      id = imported.id
      article.value.id = id
      article.value.isExternal = false
    }
    const status = await apiServiceExtended.likeArticle(id)
    article.value.liked = status.is_liked
    
    // Sync stores
    newsStore.updatePostStatus(articleId, { liked: status.is_liked })
    const localArt = articleStore.getArticleById(id)
    if (localArt) localArt.liked = status.is_liked
  } catch (e) {
    console.error('Failed to like', e)
    article.value.liked = previousState
  }
}

const handleSave = async () => {
  if (!article.value) return
  
  const previousState = article.value.saved
  article.value.saved = !article.value.saved
  
  try {
    let id = article.value.id
    if (article.value.isExternal) {
      const imported = await apiServiceExtended.importArticle(article.value)
      id = imported.id
      article.value.id = id
      article.value.isExternal = false
    }
    const status = await apiServiceExtended.saveArticle(id)
    article.value.saved = status.is_saved
    
    // Sync stores
    newsStore.updatePostStatus(articleId, { saved: status.is_saved })
    const localArt = articleStore.getArticleById(id)
    if (localArt) localArt.saved = status.is_saved
  } catch (e) {
    console.error('Failed to save', e)
    article.value.saved = previousState
  }
}

const openSaveModal = () => {
  if (!article.value) return
  magazineStore.fetchUserMagazines()
  isSaveModalOpen.value = true
}
</script>

<template>
  <div class="bg-black min-h-screen text-gray-100 pb-20">
    <!-- Save Modal Portal -->
    <Teleport to="body">
      <SaveModal 
        v-if="article"
        :is-open="isSaveModalOpen" 
        :article-data="article"
        :should-import="article.isExternal"
        @close="isSaveModalOpen = false"
      />
    </Teleport>

    <!-- Reading Progress Bar -->
    <div 
      class="fixed top-[60px] left-0 h-1 bg-flipboard-red z-[60] transition-all duration-150" 
      :style="{ width: scrollProgress + '%' }"
    ></div>

    <div v-if="article" class="animate-fade-in">
        <!-- Article Hero -->
        <div class="relative min-h-[60vh] md:min-h-[70vh] w-full flex flex-col justify-end">
            <!-- Back Button -->
            <button 
              @click="router.back()" 
              class="absolute top-8 left-6 md:left-12 z-50 bg-black/40 hover:bg-black/60 backdrop-blur-md text-white p-3 rounded-full transition-all group"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-6 h-6 transform group-hover:-translate-x-1 transition-transform">
                <path stroke-linecap="round" stroke-linejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
              </svg>
            </button>

            <img :src="article.image_url || 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=800&q=80'" :alt="article.title" class="w-full h-full object-cover absolute inset-0" />
            <div class="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-transparent"></div>
            <div class="relative w-full p-6 md:p-12 pt-24 pb-16 md:pb-24 max-w-4xl mx-auto animate-fade-in-up">
                <span class="bg-flipboard-red text-white px-3 py-1 text-xs font-bold uppercase tracking-widest mb-4 inline-block">
                    {{ article.publisher }}
                </span>
                <h1 class="text-3xl md:text-5xl lg:text-7xl font-serif font-bold text-white leading-tight mb-6 shadow-black drop-shadow-lg">
                    {{ article.title }}
                </h1>
                <div class="flex items-center space-x-4 text-gray-300 text-sm md:text-base font-medium">
                    <div class="flex items-center space-x-2">
                        <div class="h-10 w-10 rounded-full bg-gray-700 flex items-center justify-center border border-gray-600 text-white font-bold text-lg">
                            {{ article.author ? article.author.charAt(0) : 'A' }}
                        </div>
                        <div class="flex flex-col">
                          <span class="text-white font-bold">{{ article.author || article.publisher }}</span>
                          <span class="text-xs text-gray-500 uppercase tracking-wider">Author</span>
                        </div>
                    </div>
                    <span class="h-8 w-px bg-gray-800 hidden sm:block"></span>
                    <div class="hidden sm:flex flex-col">
                      <span class="text-white font-bold">{{ article.published_at ? new Date(article.published_at).toLocaleDateString() : 'Just now' }}</span>
                      <span class="text-xs text-gray-500 uppercase tracking-wider">Published</span>
                    </div>
                    <span v-if="readingTime > 0" class="h-8 w-px bg-gray-800 hidden sm:block"></span>
                    <div v-if="readingTime > 0" class="hidden sm:flex flex-col">
                      <span class="text-white font-bold">{{ readingTime }} min read</span>
                      <span class="text-xs text-gray-500 uppercase tracking-wider">Reading Time</span>
                    </div>
                </div>
            </div>
        </div>

        <!-- Article Content -->
        <article class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 animate-fade-in-up delay-200">
             <p v-if="article.excerpt" class="text-xl md:text-3xl text-gray-200 font-serif italic leading-relaxed mb-12 border-l-8 border-flipboard-red pl-8">
                 {{ article.excerpt }}
             </p>
             
             <div v-if="article.isContentLoading" class="flex flex-col items-center justify-center py-12 space-y-4">
               <div class="w-12 h-12 border-4 border-flipboard-red border-t-transparent rounded-full animate-spin"></div>
               <p class="text-gray-500 animate-pulse font-serif italic">Curating the full story for you...</p>
             </div>
             
             <!-- Content / Snippet -->
             <div 
               class="prose prose-xl prose-invert prose-red max-w-none font-serif text-gray-300 leading-loose mb-16 drop-cap" 
               v-html="cleanContent"
             ></div>

             <!-- Article Topics -->
             <div v-if="article.topics && article.topics.length > 0" class="mb-12 flex flex-wrap gap-2">
                <span v-for="topic in article.topics" :key="topic" class="bg-gray-800 text-gray-400 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest hover:bg-gray-700 transition-colors cursor-pointer">
                  #{{ topic }}
                </span>
             </div>

             <!-- View Original Source Button -->
             <div v-if="article.source_url" class="mt-16 text-center border-t border-gray-800 pt-16">
                <a 
                  :href="article.source_url" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  class="inline-flex items-center space-x-3 px-10 py-5 bg-white text-black hover:bg-gray-200 font-bold rounded-full transition-all transform hover:scale-105 shadow-2xl uppercase tracking-widest text-sm"
                >
                  <span>{{ article.isExternal ? 'Read Full Story' : 'View Original' }}</span>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-5 h-5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                  </svg>
                </a>
             </div>
        </article>

        <!-- Comments Section -->
        <div id="comments-section" v-if="!article.isExternal" class="max-w-4xl mx-auto px-4 mb-20">
          <CommentSection v-if="showComments" :article-id="articleId" />
        </div>
        <div v-else class="max-w-3xl mx-auto px-4 py-12 text-center text-gray-500 border-t border-gray-800">
          Comments are disabled for external news.
        </div>

        <!-- Interaction Bar -->
        <div class="fixed bottom-0 left-0 w-full bg-gray-900/95 backdrop-blur-md border-t border-gray-800 p-4 z-40">
            <div class="max-w-4xl mx-auto flex items-center justify-between px-4">
                <div class="flex items-center space-x-8">
                    <button 
                      @click="handleLike"
                      class="flex flex-col items-center group transition-colors"
                      :class="article.liked ? 'text-flipboard-red' : 'text-gray-400 hover:text-flipboard-red'"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" :fill="article.liked ? 'currentColor' : 'none'" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-7 h-7 transform group-hover:scale-110 transition-transform">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
                        </svg>
                        <span class="text-[10px] font-bold uppercase mt-1">{{ article.liked ? 'Liked' : 'Like' }}</span>
                    </button>

                    <button
                      v-if="!article.isExternal"
                      @click="scrollToComments"
                      class="flex flex-col items-center group text-gray-400 hover:text-white transition-colors"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-7 h-7 transform group-hover:scale-110 transition-transform">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 0 1 .865-.501 48.172 48.172 0 0 0 3.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
                        </svg>
                        <span class="text-[10px] font-bold uppercase mt-1">Comment</span>
                    </button>

                    <button 
                      @click="handleShare"
                      class="flex flex-col items-center group text-gray-400 hover:text-white transition-colors"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-7 h-7 transform group-hover:scale-110 transition-transform">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M7.217 10.907a2.25 2.25 0 1 0 0 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186 9.566-5.314m-9.566 7.5 9.566 5.314m0-10.628a2.25 2.25 0 1 0 0-4.5 2.25 2.25 0 0 0 0 4.5m0 10.628a2.25 2.25 0 1 0 0-4.5 2.25 2.25 0 0 0 0 4.5" />
                        </svg>
                        <span class="text-[10px] font-bold uppercase mt-1">Share</span>
                    </button>

                    <button 
                      @click="openSaveModal"
                      class="flex flex-col items-center group text-gray-400 hover:text-white transition-colors"
                      title="Add to Magazine"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-7 h-7 transform group-hover:scale-110 transition-transform">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                        </svg>
                        <span class="text-[10px] font-bold uppercase mt-1">Flip</span>
                    </button>
                </div>
                
                 <button 
                    @click="handleSave"
                    class="flex flex-col items-center group transition-colors"
                    :class="article.saved ? 'text-white' : 'text-gray-400 hover:text-white'"
                 >
                        <svg xmlns="http://www.w3.org/2000/svg" :fill="article.saved ? 'currentColor' : 'none'" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-7 h-7 transform group-hover:scale-110 transition-transform">
                           <path stroke-linecap="round" stroke-linejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0Z" />
                        </svg>
                        <span class="text-[10px] font-bold uppercase mt-1">{{ article.saved ? 'Saved' : 'Save' }}</span>
                 </button>
            </div>
        </div>
    </div>
    
    <!-- Not Found State -->
    <div v-else-if="!loading" class="flex flex-col items-center justify-center min-h-[50vh] text-center p-8">
        <div class="h-24 w-24 bg-gray-900 rounded-full flex items-center justify-center mb-8 border border-gray-800">
           <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-12 h-12 text-gray-500">
             <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
           </svg>
        </div>
        <h1 class="text-4xl font-display font-bold mb-4 uppercase tracking-tighter text-white">Article not found</h1>
        <p class="text-gray-500 mb-8 max-w-md mx-auto">The article you are looking for does not exist, has been removed, or has expired.</p>
        <RouterLink to="/" class="bg-flipboard-red text-white px-8 py-3 font-bold uppercase tracking-widest text-sm hover:bg-red-700 transition-colors">Go back home</RouterLink>
    </div>
    
    <!-- Loading State -->
    <div v-else class="min-h-screen flex flex-col items-center justify-center bg-black">
        <div class="w-16 h-16 border-4 border-flipboard-red border-t-transparent rounded-full animate-spin mb-6"></div>
        <p class="text-gray-500 font-display font-bold uppercase tracking-[0.3em] animate-pulse">Loading Story</p>
    </div>
  </div>
</template>

<style scoped>
.prose p {
    margin-bottom: 1.5em;
}
</style>
