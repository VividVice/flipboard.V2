<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useTopicStore } from '../stores/topics'
import { storeToRefs } from 'pinia'

const router = useRouter()
const topicStore = useTopicStore()
const { topics, followedTopics, loading } = storeToRefs(topicStore)

const MIN_SELECTION = 3

const followedCount = computed(() => followedTopics.value.length)
const remaining = computed(() => Math.max(0, MIN_SELECTION - followedCount.value))
const canContinue = computed(() => followedCount.value >= MIN_SELECTION)

const isTopicFollowed = (topicId: string) => {
  return followedTopics.value.some(t => t.id === topicId)
}

const handleContinue = async () => {
  if (canContinue.value) {
    // Bulk follow the selected topics
    const topicIds = followedTopics.value.map(t => t.id)
    await topicStore.bulkFollow(topicIds)
    router.push('/')
  }
}

// Fetch topics when component mounts
onMounted(async () => {
  await topicStore.fetchTopics()
})
</script>

<template>
  <div class="bg-black min-h-screen pb-24">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <!-- Header -->
      <div class="text-center mb-12 space-y-4">
        <h1 class="text-4xl md:text-5xl font-display font-bold text-white uppercase tracking-tight">
          Bienvenue sur Flipboard
        </h1>
        <p class="text-xl text-gray-400 max-w-2xl mx-auto">
          Suivez ce qui vous intéresse pour personnaliser Flipboard
        </p>
        <p class="text-flipboard-red font-bold uppercase tracking-wider text-sm">
          Suivez au moins 3 sujets avant de continuer
        </p>
      </div>
      
      <!-- Loading state -->
      <div v-if="loading" class="text-center text-gray-400">
        Loading topics...
      </div>

      <!-- Topics Grid -->
      <div v-else class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        <div 
          v-for="topic in topics" 
          :key="topic.id" 
          @click="topicStore.toggleSelection(topic.id)"
          class="relative aspect-square rounded-lg overflow-hidden cursor-pointer group border-2 transition-all duration-200 bg-gray-800"
          :class="isTopicFollowed(topic.id) ? 'border-flipboard-red ring-2 ring-flipboard-red ring-opacity-50' : 'border-transparent hover:border-gray-600'"
        >
          <!-- Icon if available -->
          <div v-if="topic.icon" class="absolute inset-0 flex items-center justify-center text-6xl opacity-20">
            {{ topic.icon }}
          </div>
          
          <!-- Overlay -->
          <div class="absolute inset-0 bg-gradient-to-t from-black/90 to-transparent"></div>
          
          <!-- Content -->
          <div class="absolute inset-0 flex flex-col justify-end p-4">
             <!-- Checkmark for selected -->
             <div v-if="isTopicFollowed(topic.id)" class="absolute top-2 right-2 bg-flipboard-red rounded-full p-1 shadow-lg">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-white" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                </svg>
             </div>
             
             <h3 class="text-white font-bold text-lg leading-tight break-words shadow-black drop-shadow-md">
               #{{ topic.name }}
             </h3>
             <p v-if="topic.description" class="text-gray-400 text-xs mt-1 line-clamp-2">
               {{ topic.description }}
             </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Fixed Bottom Bar -->
    <div class="fixed bottom-0 left-0 right-0 bg-gray-900/95 border-t border-gray-800 backdrop-blur-md p-4 z-50">
       <div class="max-w-3xl mx-auto flex items-center justify-between">
          <div class="text-white font-medium">
             <span v-if="remaining > 0" class="text-gray-400">
               Suivez-en encore <span class="text-flipboard-red font-bold">{{ remaining }}</span> pour continuer
             </span>
             <span v-else class="text-green-500 flex items-center">
               <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
               </svg>
               Prêt à continuer
             </span>
          </div>
          
          <button 
            @click="handleContinue"
            :disabled="!canContinue"
            class="px-8 py-3 rounded-md font-bold uppercase tracking-wider text-sm transition-all duration-300"
            :class="canContinue 
              ? 'bg-flipboard-red text-white hover:bg-red-700 shadow-lg shadow-red-900/20' 
              : 'bg-gray-800 text-gray-500 cursor-not-allowed'"
          >
            Continuer
          </button>
       </div>
    </div>
  </div>
</template>
