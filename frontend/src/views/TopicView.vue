<script setup lang="ts">
import { useTopicStore } from '../stores/topics'
import { storeToRefs } from 'pinia'
import { onMounted } from 'vue'

const topicStore = useTopicStore()
const { topics } = storeToRefs(topicStore)

onMounted(async () => {
  await Promise.all([
    topicStore.fetchTopics(),
    topicStore.fetchFollowedTopics()
  ])
})
</script>

<template>
  <div class="bg-black min-h-screen pb-20">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div class="border-b border-gray-800 mb-8 pb-2">
             <h2 class="text-4xl font-display font-bold text-white uppercase tracking-tighter">Explore Topics</h2>
             <p class="text-gray-400 mt-2 text-lg">Follow topics to personalize your feed.</p>
          </div>
          
          <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              <div 
                v-for="topic in topics" 
                :key="topic.name" 
                class="group relative aspect-[4/3] rounded-lg overflow-hidden cursor-pointer"
                @click="topicStore.toggleFollow(topic.id)"
              >
                  <!-- Background Image -->
                  <img :src="topic.icon" :alt="topic.name" class="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                  
                  <!-- Overlay -->
                  <div class="absolute inset-0 bg-black/40 group-hover:bg-black/50 transition-colors duration-300"></div>
                  
                  <!-- Content -->
                  <div class="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
                      <h3 class="text-2xl font-display font-bold text-white uppercase tracking-wide mb-4 drop-shadow-lg">{{ topic.name }}</h3>
                      
                      <!-- Follow Button (Changes based on state) -->
                      <button 
                        class="px-6 py-2 text-sm font-bold uppercase tracking-wider rounded transition-all duration-300"
                        :class="topicStore.isTopicFollowed(topic.id) ? 'bg-white text-black' : 'bg-flipboard-red text-white opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0'"
                      >
                          {{ topicStore.isTopicFollowed(topic.id) ? 'Following' : 'Follow' }}
                      </button>
                  </div>
              </div>
          </div>
      </div>
  </div>
</template>