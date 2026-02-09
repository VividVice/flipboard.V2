<script setup lang="ts">
import { ref } from 'vue'
import { useMagazineStore } from '../stores/magazines'
import { useToastStore } from '../stores/toast'
import { storeToRefs } from 'pinia'
import { apiServiceExtended } from '../services/api'

const props = withDefaults(defineProps<{
  isOpen: boolean
  articleData: Record<string, unknown> & { id: string }
  shouldImport?: boolean
}>(), {
  shouldImport: true
})

const emit = defineEmits(['close'])

const magazineStore = useMagazineStore()
const toastStore = useToastStore()
const { magazines } = storeToRefs(magazineStore)

const newMagazineName = ref('')
const showCreateInput = ref(false)
const isSaving = ref(false)

const saveToMagazine = async (magazineId: string) => {
  if (isSaving.value) return
  isSaving.value = true
  try {
    let articleId = props.articleData.id
    
    // Ensure article is imported first if needed
    if (props.shouldImport) {
      const article = await apiServiceExtended.importArticle(props.articleData)
      articleId = article.id
    }
    
    await magazineStore.addToMagazine(magazineId, articleId)
    toastStore.show('Saved to magazine')
    emit('close')
  } catch (e) {
    console.error(e)
    toastStore.show('Failed to save to magazine')
  } finally {
    isSaving.value = false
  }
}

const createAndSave = async () => {
  if (newMagazineName.value.trim()) {
    isSaving.value = true
    try {
      const newMag = await magazineStore.createMagazine(newMagazineName.value.trim())
      if (newMag) {
        isSaving.value = false // Reset so saveToMagazine can run
        await saveToMagazine(newMag.id)
      }
      newMagazineName.value = ''
      showCreateInput.value = false
    } catch (e) {
      console.error(e)
      toastStore.show('Failed to create magazine')
      isSaving.value = false
    }
  }
}
</script>

<template>
  <div v-if="isOpen" @click.stop class="relative z-[200]" aria-labelledby="modal-title" role="dialog" aria-modal="true">
    <!-- Background overlay -->
    <div class="fixed inset-0 bg-gray-900/80 transition-opacity backdrop-blur-sm" aria-hidden="true" @click="emit('close')"></div>

    <div class="fixed inset-0 z-10 w-screen overflow-y-auto">
      <div class="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
        <!-- Modal panel -->
        <div class="relative transform overflow-hidden rounded-lg bg-gray-800 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg border border-gray-700">
          <div class="bg-gray-800 px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
            <div class="sm:flex sm:items-start">
              <div class="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left w-full">
                <h3 class="text-xl font-bold leading-6 text-white mb-6" id="modal-title">
                  Save to Magazine
                </h3>
                
                <div class="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto custom-scrollbar">
                   <button 
                     v-for="mag in magazines" 
                     :key="mag.id"
                     @click="saveToMagazine(mag.id)"
                     :disabled="isSaving"
                     class="w-full text-left px-4 py-3 bg-gray-700 hover:bg-gray-600 rounded text-gray-200 font-medium transition-colors flex justify-between items-center group disabled:opacity-50 disabled:cursor-not-allowed"
                   >
                     <span>{{ mag.name }}</span>
                     <span class="text-xs text-gray-500 group-hover:text-gray-300">{{ mag.article_ids.length }} stories</span>
                   </button>
                   
                   <div v-if="magazines.length === 0" class="text-gray-500 text-sm text-center py-4">
                      No magazines found. Create one below!
                   </div>
                </div>
  
                <!-- Create New Magazine -->
                <div class="mt-6 pt-4 border-t border-gray-700">
                   <button 
                     v-if="!showCreateInput" 
                     @click="showCreateInput = true"
                     class="text-flipboard-red font-bold text-sm hover:text-red-400 flex items-center"
                   >
                     <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                       <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                     </svg>
                     Create New Magazine
                   </button>
                   
                   <div v-else class="flex items-center space-x-2">
                      <input 
                        v-model="newMagazineName"
                        type="text" 
                        placeholder="Magazine Name"
                        class="flex-1 bg-gray-900 border border-gray-600 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-flipboard-red placeholder-gray-500"
                        @keyup.enter="createAndSave"
                      />
                      <button 
                        @click="createAndSave"
                        :disabled="isSaving"
                        class="bg-flipboard-red text-white px-3 py-2 rounded text-sm font-bold hover:bg-red-700 transition-colors disabled:opacity-50"
                      >
                        {{ isSaving ? '...' : 'Create' }}
                      </button>
                   </div>
                </div>
              </div>
            </div>
          </div>
          <div class="bg-gray-750 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6 border-t border-gray-700">
            <button @click="emit('close')" type="button" class="mt-3 inline-flex w-full justify-center rounded-md bg-gray-700 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-gray-600 sm:mt-0 sm:w-auto">
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: #1f2937; 
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #4b5563; 
  border-radius: 3px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: #6b7280; 
}
</style>