<script setup lang="ts">
import { useArticleStore } from '../stores/articles'
import ArticleCard from '../components/ArticleCard.vue'
import { storeToRefs } from 'pinia'

const articleStore = useArticleStore()
const { savedArticles } = storeToRefs(articleStore)

const user = {
  name: 'Jane Doe',
  username: '@janedoe',
  bio: 'Tech enthusiast, avid reader, and coffee lover. Curating the best stories on AI and Design.',
  followers: 1205,
  following: 45,
  avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80'
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
    
    <!-- User Content Tabs (Mock) -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
       <div class="flex space-x-8 border-b border-gray-800 mb-8">
          <button class="pb-4 border-b-2 border-flipboard-red text-white font-bold uppercase tracking-wide text-sm">Saved Stories</button>
          <button class="pb-4 border-b-2 border-transparent text-gray-500 hover:text-gray-300 font-bold uppercase tracking-wide text-sm transition-colors">Magazines</button>
          <button class="pb-4 border-b-2 border-transparent text-gray-500 hover:text-gray-300 font-bold uppercase tracking-wide text-sm transition-colors">Comments</button>
       </div>
       
       <!-- Saved Stories Grid -->
       <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          <ArticleCard v-for="article in savedArticles" :key="article.id" :article="article" />
       </div>
       
       <!-- Empty State -->
       <div v-if="savedArticles.length === 0" class="text-center py-20 text-gray-500">
          <p>No stories saved yet. Save articles to see them here.</p>
       </div>
    </div>
  </div>
</template>