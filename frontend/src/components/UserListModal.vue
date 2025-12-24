<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { apiServiceExtended, type User } from '../services/api'
import { useAuthStore } from '../stores/auth'

const props = defineProps<{
  isOpen: boolean
  title: string
  userIds: string[]
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

const router = useRouter()
const authStore = useAuthStore()
const users = ref<User[]>([])
const loading = ref(true)

const fetchUsers = async () => {
  if (props.userIds.length === 0) {
    users.value = []
    loading.value = false
    return
  }

  loading.value = true
  try {
    users.value = await apiServiceExtended.getUsersByIds(props.userIds)
  } catch (error) {
    console.error('Failed to fetch users:', error)
    window.alert('Failed to load users. Please try again.')
  } finally {
    loading.value = false
  }
}

onMounted(fetchUsers)

const navigateToProfile = (username: string) => {
  emit('close')
  router.push({ name: 'user-profile', params: { username } })
}

const isFollowing = (userId: string) => {
  return authStore.user?.following.includes(userId)
}

const handleFollow = async (userId: string) => {
  try {
    if (isFollowing(userId)) {
      await authStore.unfollowUser(userId)
    } else {
      await authStore.followUser(userId)
    }
  } catch (error) {
    console.error('Follow action failed:', error)
  }
}
</script>

<template>
  <div v-if="isOpen" class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
    <div class="bg-gray-900 border border-gray-800 rounded-lg w-full max-w-md overflow-hidden shadow-2xl flex flex-col max-h-[80vh]">
      <div class="p-4 border-b border-gray-800 flex justify-between items-center">
        <h2 class="text-lg font-display font-bold text-white uppercase tracking-tight">{{ title }}</h2>
        <button @click="emit('close')" class="text-gray-500 hover:text-white transition-colors" aria-label="Close modal">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      
      <div class="flex-1 overflow-y-auto p-2">
        <div v-if="loading" class="flex justify-center py-8">
          <div class="h-8 w-8 border-2 border-flipboard-red border-t-transparent rounded-full animate-spin"></div>
        </div>
        
        <div v-else-if="users.length > 0" class="space-y-1">
          <div v-for="user in users" :key="user.id" class="flex items-center justify-between p-2 hover:bg-gray-800 rounded-md transition-colors group">
            <div @click="navigateToProfile(user.username)" class="flex items-center space-x-3 cursor-pointer flex-1">
              <img 
                :src="user.profile_pic || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80'" 
                class="h-10 w-10 rounded-full border border-gray-700 object-cover" 
              />
              <div>
                <div class="text-sm font-bold text-white">{{ user.username }}</div>
                <div class="text-xs text-gray-500 line-clamp-1">{{ user.bio || 'No bio' }}</div>
              </div>
            </div>
            
            <button 
              v-if="authStore.user?.id !== user.id"
              @click="handleFollow(user.id)"
              :class="isFollowing(user.id) ? 'bg-gray-800 border-gray-700 text-gray-400' : 'bg-flipboard-red text-white'"
              class="px-3 py-1 text-xs font-bold uppercase tracking-wider rounded border border-transparent transition-all"
            >
              {{ isFollowing(user.id) ? 'Following' : 'Follow' }}
            </button>
          </div>
        </div>
        
        <div v-else class="text-center py-12 text-gray-500 italic">
          No users found.
        </div>
      </div>
    </div>
  </div>
</template>
