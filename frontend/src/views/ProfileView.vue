<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useArticleStore } from '../stores/articles'
import { useMagazineStore } from '../stores/magazines'
import ArticleCard from '../components/ArticleCard.vue'
import { storeToRefs } from 'pinia'

const articleStore = useArticleStore()
const magazineStore = useMagazineStore()
const { savedArticles } = storeToRefs(articleStore)
const { magazines } = storeToRefs(magazineStore)

onMounted(() => {
  articleStore.fetchSavedArticles()
})

const activeTab = ref('saved') // 'saved', 'magazines', 'comments'

const user = {
  name: 'June Doe',
  username: '@junedoe',
  bio: 'Tech enthusiast, avid reader, and coffee lover. Curating the best stories on AI and Design.',
  followers: 1205,
  following: 45,
  avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80'
}

// Helper to get cover image for a magazine (first article image)
const getMagazineCover = (articleIds: string[]) => {
  const firstId = articleIds[0]
  if (!firstId) return 'https://images.unsplash.com/photo-1557683316-973673baf926?auto=format&fit=crop&w=800&q=80' // Default gradient
  
  const firstArticle = articleStore.getArticleById(firstId)
  return firstArticle?.image_url || 'https://images.unsplash.com/photo-1557683316-973673baf926?auto=format&fit=crop&w=800&q=80'
}
</script>

<template>
  <div class="bg-black min-h-screen pb-20">
    <!-- Profile Header -->
    <div class="bg-gray-900 border-b border-gray-800">
      <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <div class="relative inline-block">
           <img class="h-32 w-32 rounded-full border-4 border-gray-800 object-cover mx-auto" :src="user.avatarUrl" alt="" />
           <div class="absolute bottom-2 right-2 h-6 w-6 rounded-full bg-green-500 border-4 border-gray-900"></div>
        </div>
        
        <h1 class="mt-4 text-4xl font-display font-bold text-white uppercase tracking-tight">{{ user.name }}</h1>
        <p class="text-gray-500 font-medium">{{ user.username }}</p>
        
        <p class="mt-4 max-w-lg mx-auto text-lg text-gray-300 font-serif leading-relaxed">
          {{ user.bio }}
        </p>
        
        <div class="mt-8 flex justify-center space-x-8 text-sm font-bold uppercase tracking-widest">
           <div class="text-center">
             <span class="block text-2xl text-white font-display">{{ user.followers }}</span>
             <span class="text-gray-500">Followers</span>
           </div>
           <div class="text-center">
             <span class="block text-2xl text-white font-display">{{ user.following }}</span>
             <span class="text-gray-500">Following</span>
           </div>
        </div>
        
        <div class="mt-8">
           <button class="bg-gray-800 border border-gray-700 text-white px-6 py-2 text-sm font-bold uppercase tracking-wider rounded hover:bg-gray-700 transition-colors">
             Edit Profile
           </button>
        </div>
      </div>
    </div>
    
    <!-- User Content Tabs -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
       <div class="flex space-x-8 border-b border-gray-800 mb-8">
          <button 
            @click="activeTab = 'saved'"
            class="pb-4 border-b-2 font-bold uppercase tracking-wide text-sm transition-colors"
            :class="activeTab === 'saved' ? 'border-flipboard-red text-white' : 'border-transparent text-gray-500 hover:text-gray-300'"
          >
            Saved Stories
          </button>
          <button 
            @click="activeTab = 'magazines'"
            class="pb-4 border-b-2 font-bold uppercase tracking-wide text-sm transition-colors"
            :class="activeTab === 'magazines' ? 'border-flipboard-red text-white' : 'border-transparent text-gray-500 hover:text-gray-300'"
          >
            Magazines
          </button>
          <button 
            @click="activeTab = 'comments'"
            class="pb-4 border-b-2 font-bold uppercase tracking-wide text-sm transition-colors"
            :class="activeTab === 'comments' ? 'border-flipboard-red text-white' : 'border-transparent text-gray-500 hover:text-gray-300'"
          >
            Comments
          </button>
       </div>
       
       <!-- Saved Stories Grid -->
       <div v-if="activeTab === 'saved'">
         <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            <ArticleCard v-for="article in savedArticles" :key="article.id" :article="article" />
         </div>
         <div v-if="savedArticles.length === 0" class="text-center py-20 text-gray-500">
            <p>No stories saved yet. Save articles to see them here.</p>
         </div>
       </div>

       <!-- Magazines Grid -->
       <div v-if="activeTab === 'magazines'">
          <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
             <div v-for="mag in magazines" :key="mag.id" class="group relative aspect-[3/4] bg-gray-800 rounded-lg overflow-hidden cursor-pointer border border-gray-700 hover:border-gray-500 transition-colors">
                <!-- Cover Image (First article or default) -->
                <img :src="getMagazineCover(mag.articleIds)" class="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-40 group-hover:scale-105 transition-all duration-500" />
                
                <!-- Content -->
                <div class="absolute inset-0 flex flex-col justify-end p-6">
                   <h3 class="text-2xl font-display font-bold text-white leading-tight mb-1 shadow-black drop-shadow-lg">{{ mag.name }}</h3>
                   <p class="text-sm text-gray-300 font-bold uppercase tracking-wider">{{ mag.articleIds.length }} Stories</p>
                </div>
             </div>
             
             <!-- Create New Magazine Card -->
             <div class="flex flex-col items-center justify-center aspect-[3/4] bg-gray-900 border-2 border-dashed border-gray-700 rounded-lg hover:border-flipboard-red hover:bg-gray-800 transition-all cursor-pointer group">
                <div class="h-12 w-12 rounded-full bg-gray-800 flex items-center justify-center mb-4 group-hover:bg-flipboard-red transition-colors">
                   <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-6 h-6 text-gray-400 group-hover:text-white">
                     <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                   </svg>
                </div>
                <span class="font-bold text-gray-400 group-hover:text-white uppercase tracking-wide text-sm">Create Magazine</span>
             </div>
          </div>
       </div>
       
       <!-- Comments Placeholder -->
       <div v-if="activeTab === 'comments'" class="text-center py-20 text-gray-500">
          <p>No comments yet.</p>
       </div>
    </div>
  </div>
</template>