<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useToastStore } from '../stores/toast'
import { apiServiceExtended, type User, type Magazine, type Comment } from '../services/api'
import CommentItem from '../components/CommentItem.vue'
import UserListModal from '../components/UserListModal.vue'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const toast = useToastStore()

const username = computed(() => route.params.username as string)
const targetUser = ref<User | null>(null)
const targetMagazines = ref<Magazine[]>([])
const targetComments = ref<Comment[]>([])
const loading = ref(true)
const commentsLoading = ref(false)

const isFollowing = computed(() => {
  if (!targetUser.value || !authStore.user) return false
  return authStore.user.following.includes(targetUser.value.id)
})

const isOwnProfile = computed(() => {
  return authStore.user?.name === username.value
})

const fetchUserData = async () => {
  loading.value = true
  try {
    const user = await apiServiceExtended.getUserByUsername(username.value)
    targetUser.value = user
    
    if (user.id) {
      const mags = await apiServiceExtended.getMagazinesByUserId(user.id)
      targetMagazines.value = mags
    }
  } catch (error: unknown) {
    console.error('Failed to fetch user profile:', error)
    const message = error instanceof Error ? error.message : 'User not found'
    toast.show(message, 'error')
    router.push({ name: 'home' })
  } finally {
    loading.value = false
  }
}

onMounted(fetchUserData)
watch(username, fetchUserData)

const activeTab = ref('magazines') // Default to magazines for public profiles

const handleTabChange = async (tab: string) => {
  activeTab.value = tab
  if (tab === 'comments' && targetUser.value) {
    commentsLoading.value = true
    try {
      const rawComments = await apiServiceExtended.getUserCommentsById(targetUser.value.id)
      // Transform raw backend data to Comment interface
      targetComments.value = rawComments.map((c: any) => ({
        id: c.id,
        articleId: c.article_id,
        articleTitle: c.article_title,
        author: {
          id: c.user?.id || c.user_id,
          name: c.user?.username || 'Unknown User',
          avatarUrl: c.user?.profile_pic || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
        },
        content: c.content,
        createdAt: c.created_at,
        updatedAt: c.updated_at,
      }))
    } catch (error) {
      console.error('Failed to fetch user comments:', error)
    } finally {
      commentsLoading.value = false
    }
  }
}

// User List Modal Logic
const isUserListModalOpen = ref(false)
const userListTitle = ref('')
const userListIds = ref<string[]>([])

const openUserList = (type: 'followers' | 'following') => {
  if (!targetUser.value) return
  userListTitle.value = type === 'followers' ? 'Followers' : 'Following'
  userListIds.value = type === 'followers' ? targetUser.value.followers : targetUser.value.following
  isUserListModalOpen.value = true
}

const displayUser = computed(() => {
  if (!targetUser.value) return null
  return {
    name: targetUser.value.username,
    username: `@${targetUser.value.username.toLowerCase().replace(/\s+/g, '')}`,
    bio: targetUser.value.bio || 'No bio provided.',
    followers: targetUser.value.followers?.length || 0,
    following: targetUser.value.following?.length || 0,
    avatarUrl: targetUser.value.profile_pic || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80'
  }
})

const handleFollow = async () => {
  if (!targetUser.value) return
  
  try {
    if (isFollowing.value) {
      await authStore.unfollowUser(targetUser.value.id)
      // Update local state for immediate feedback
      if (targetUser.value.followers) {
        targetUser.value.followers = targetUser.value.followers.filter(id => id !== authStore.user?.id)
      }
      toast.show(`Unfollowed ${targetUser.value.username}`)
    } else {
      await authStore.followUser(targetUser.value.id)
      // Update local state for immediate feedback
      if (!targetUser.value.followers) targetUser.value.followers = []
      if (authStore.user?.id) {
        targetUser.value.followers.push(authStore.user.id)
      }
      toast.show(`Following ${targetUser.value.username}`)
    }
  } catch (error) {
    console.error('Follow action failed:', error)
    const username = targetUser.value?.username ?? 'this user'
    toast.show(`Failed to update follow status for ${username}. Please try again.`)
  }
}

// Helper to get cover image for a magazine (first article image)
const getMagazineCover = (mag: Magazine) => {
  if (mag.cover_image_url) return mag.cover_image_url
  return 'https://images.unsplash.com/photo-1557683316-973673baf926?auto=format&fit=crop&w=800&q=80'
}
</script>

<template>
  <div class="bg-black min-h-screen pb-20">
    <div v-if="loading" class="flex items-center justify-center min-h-[60vh]">
       <div class="h-12 w-12 border-4 border-flipboard-red border-t-transparent rounded-full animate-spin"></div>
    </div>

    <template v-else-if="displayUser">
      <!-- Profile Header -->
      <div class="bg-gray-900 border-b border-gray-800">
        <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <div class="relative inline-block">
             <img class="h-32 w-32 rounded-full border-4 border-gray-800 object-cover mx-auto" :src="displayUser.avatarUrl" referrerpolicy="no-referrer" alt="" />
          </div>
          
          <h1 class="mt-4 text-4xl font-display font-bold text-white uppercase tracking-tight">{{ displayUser.name }}</h1>
          <p class="text-gray-500 font-medium">{{ displayUser.username }}</p>
          
          <p class="mt-4 max-w-lg mx-auto text-lg text-gray-300 font-serif leading-relaxed">
            {{ displayUser.bio }}
          </p>
          
          <div class="mt-8 flex justify-center space-x-8 text-sm font-bold uppercase tracking-widest">
             <button @click="openUserList('followers')" class="text-center group">
               <span class="block text-2xl text-white font-display group-hover:text-flipboard-red transition-colors">{{ displayUser.followers }}</span>
               <span class="text-gray-500 group-hover:text-gray-300 transition-colors">Followers</span>
             </button>
             <button @click="openUserList('following')" class="text-center group">
               <span class="block text-2xl text-white font-display group-hover:text-flipboard-red transition-colors">{{ displayUser.following }}</span>
               <span class="text-gray-500 group-hover:text-gray-300 transition-colors">Following</span>
             </button>
          </div>
          
          <div class="mt-8 flex justify-center space-x-4">
             <button 
              v-if="isOwnProfile"
              @click="router.push({ name: 'profile' })"
              class="bg-gray-800 border border-gray-700 text-white px-6 py-2 text-sm font-bold uppercase tracking-wider rounded hover:bg-gray-700 transition-colors"
             >
               Edit Profile
             </button>
             <button 
              v-else
              @click="handleFollow"
              :class="isFollowing ? 'bg-gray-800 border-gray-700 text-gray-300' : 'bg-flipboard-red border-flipboard-red text-white'"
              class="border px-8 py-2 text-sm font-bold uppercase tracking-wider rounded hover:opacity-90 transition-all"
             >
               {{ isFollowing ? 'Following' : 'Follow' }}
             </button>
          </div>
        </div>
      </div>

      <!-- User Content Tabs -->
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
         <div class="flex space-x-8 border-b border-gray-800 mb-8">
            <button 
              @click="handleTabChange('magazines')"
              class="pb-4 border-b-2 font-bold uppercase tracking-wide text-sm transition-colors"
              :class="activeTab === 'magazines' ? 'border-flipboard-red text-white' : 'border-transparent text-gray-500 hover:text-gray-300'"
            >
              Magazines
            </button>
            <button 
              @click="handleTabChange('comments')"
              class="pb-4 border-b-2 font-bold uppercase tracking-wide text-sm transition-colors"
              :class="activeTab === 'comments' ? 'border-flipboard-red text-white' : 'border-transparent text-gray-500 hover:text-gray-300'"
            >
              Comments
            </button>
         </div>

         <!-- Magazines Grid -->
         <div v-if="activeTab === 'magazines'">
            <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
               <div 
                 v-for="mag in targetMagazines" 
                 :key="mag.id" 
                 @click="router.push({ name: 'magazine', params: { id: mag.id } })"
                 class="group relative aspect-[3/4] bg-gray-800 rounded-lg overflow-hidden cursor-pointer border border-gray-700 hover:border-gray-500 transition-colors"
               >
                  <img :src="getMagazineCover(mag)" class="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-40 group-hover:scale-105 transition-all duration-500" />
                  
                  <div class="absolute inset-0 flex flex-col justify-end p-6">
                     <h3 class="text-2xl font-display font-bold text-white leading-tight mb-1 shadow-black drop-shadow-lg">{{ mag.name }}</h3>
                     <p class="text-sm text-gray-300 font-bold uppercase tracking-wider">{{ mag.article_ids.length }} Stories</p>
                  </div>
               </div>
               
               <div v-if="targetMagazines.length === 0" class="col-span-full text-center py-20 text-gray-500 border-2 border-dashed border-gray-800 rounded-lg">
                  <p>This user hasn't created any magazines yet.</p>
               </div>
            </div>
         </div>

         <!-- Comments List -->
         <div v-if="activeTab === 'comments'">
            <div v-if="commentsLoading" class="text-center py-20 text-gray-500">
               <p>Loading comments...</p>
            </div>
            <div v-else-if="targetComments.length > 0" class="max-w-3xl mx-auto">
               <CommentItem 
                 v-for="comment in targetComments" 
                 :key="comment.id" 
                 :comment="comment" 
                 :article-id="comment.articleId" 
               />
            </div>
            <div v-else class="text-center py-20 text-gray-500 border-2 border-dashed border-gray-800 rounded-lg">
               <p>No comments yet.</p>
            </div>
         </div>
      </div>
    </template>
    
    <UserListModal 
      v-if="isUserListModalOpen"
      :is-open="isUserListModalOpen"
      :title="userListTitle"
      :user-ids="userListIds"
      @close="isUserListModalOpen = false"
    />
  </div>
</template>
