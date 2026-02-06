<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useArticleStore } from '../stores/articles'
import { useMagazineStore } from '../stores/magazines'
import type { Magazine } from '../services/api'
import { useAuthStore } from '../stores/auth'
import { useCommentsStore } from '../stores/comments'
import ArticleCard from '../components/ArticleCard.vue'
import CommentItem from '../components/CommentItem.vue'
import UserListModal from '../components/UserListModal.vue'
import { storeToRefs } from 'pinia'

const router = useRouter()
const articleStore = useArticleStore()
const magazineStore = useMagazineStore()
const authStore = useAuthStore()
const commentsStore = useCommentsStore()
const { savedArticles } = storeToRefs(articleStore)
const { magazines, followedMagazines, exploreMagazines, exploreMagazinesLoading } = storeToRefs(magazineStore)
const { user } = storeToRefs(authStore)
const { userComments, loading: commentsLoading } = storeToRefs(commentsStore)

const toggleNewsletter = async () => {
  if (user.value) {
    await authStore.updateNewsletterSubscription(!user.value.newsletter_subscribed)
  }
}

const triggerNewsletter = async () => {
  await authStore.triggerNewsletter()
}

onMounted(() => {
  articleStore.fetchSavedArticles()
  magazineStore.fetchUserMagazines()
  magazineStore.fetchFollowedMagazines()
})

const activeTab = ref('saved') // 'saved', 'magazines', 'community', 'comments', 'settings'

const handleTabChange = (tab: string) => {
  activeTab.value = tab
  if (tab === 'comments') {
    commentsStore.fetchUserComments()
  } else if (tab === 'community') {
    magazineStore.fetchExploreMagazines()
  }
}

// User List Modal Logic
const isUserListModalOpen = ref(false)
const userListTitle = ref('')
const userListIds = ref<string[]>([])

const openUserList = (type: 'followers' | 'following') => {
  if (!user.value) return
  userListTitle.value = type === 'followers' ? 'Followers' : 'Following'
  userListIds.value = type === 'followers' ? user.value.followers : user.value.following
  isUserListModalOpen.value = true
}

// Create Magazine Logic
const isCreateMagazineModalOpen = ref(false)
const createMagazineLoading = ref(false)
const createMagazineName = ref('')
const createMagazineDescription = ref('')

const openCreateMagazineModal = () => {
  createMagazineName.value = ''
  createMagazineDescription.value = ''
  isCreateMagazineModalOpen.value = true
}

const handleCreateMagazine = async () => {
  if (!createMagazineName.value) return
  
  createMagazineLoading.value = true
  try {
    await magazineStore.createMagazine(createMagazineName.value, createMagazineDescription.value)
    isCreateMagazineModalOpen.value = false
  } catch (error) {
    console.error('Failed to create magazine:', error)
  } finally {
    createMagazineLoading.value = false
  }
}

// Edit Profile Modal Logic
const isEditModalOpen = ref(false)
const editLoading = ref(false)
const editForm = ref({
  name: '',
  bio: '',
  avatarUrl: ''
})

const openEditModal = () => {
  if (user.value) {
    editForm.value = {
      name: user.value.name,
      bio: user.value.bio || 'Salut tout le monde.',
      avatarUrl: user.value.avatarUrl
    }
    isEditModalOpen.value = true
  }
}

const handleUpdateProfile = async () => {
  editLoading.value = true
  try {
    await authStore.updateProfile({
      name: editForm.value.name,
      bio: editForm.value.bio,
      avatarUrl: editForm.value.avatarUrl
    })
    // Only close modal on success
    isEditModalOpen.value = false
  } catch (error: any) {
    // The auth store's updateProfile already shows error toasts for API failures
    // Modal remains open on error so user can retry or correct their input
    console.error('Profile update failed:', error)
  } finally {
    editLoading.value = false
  }
}

const displayUser = computed(() => {
  return {
    name: user.value?.name || 'User',
    username: user.value?.name ? `@${user.value.name.toLowerCase().replace(/\s+/g, '')}` : '@user',
    bio: user.value?.bio || 'Salut tout le monde.',
    followers: user.value?.followers?.length || 0,
    following: user.value?.following?.length || 0,
    avatarUrl: user.value?.avatarUrl || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80'
  }
})


// Helper to get cover image for a magazine (first article image)
const getMagazineCover = (mag: Magazine) => {
  if (mag.cover_image_url) return mag.cover_image_url
  return 'https://images.unsplash.com/photo-1557683316-973673baf926?auto=format&fit=crop&w=800&q=80'
}
</script>

<template>
  <div class="bg-black min-h-screen pb-20">
    <!-- Profile Header -->
    <div class="bg-gray-900 border-b border-gray-800">
      <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <div class="relative inline-block">
           <img class="h-32 w-32 rounded-full border-4 border-gray-800 object-cover mx-auto" :src="displayUser.avatarUrl" alt="" />
           <div class="absolute bottom-2 right-2 h-6 w-6 rounded-full bg-green-500 border-4 border-gray-900"></div>
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
        
        <div class="mt-8">
           <button 
            @click="openEditModal"
            class="bg-gray-800 border border-gray-700 text-white px-6 py-2 text-sm font-bold uppercase tracking-wider rounded hover:bg-gray-700 transition-colors"
           >
             Edit Profile
           </button>
        </div>
      </div>
    </div>

    <!-- Edit Profile Modal -->
    <div v-if="isEditModalOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div class="bg-gray-900 border border-gray-800 rounded-lg w-full max-w-md overflow-hidden shadow-2xl">
        <div class="p-6 border-b border-gray-800 flex justify-between items-center">
          <h2 class="text-xl font-display font-bold text-white uppercase tracking-tight">Edit Profile</h2>
          <button @click="isEditModalOpen = false" class="text-gray-500 hover:text-white transition-colors" aria-label="Close modal">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <form @submit.prevent="handleUpdateProfile" class="p-6 space-y-4">
          <div>
            <label class="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Display Name</label>
            <input 
              v-model="editForm.name" 
              type="text" 
              class="w-full bg-gray-800 border border-gray-700 rounded px-4 py-2 text-white focus:outline-none focus:border-flipboard-red transition-colors"
              placeholder="Your name"
              required
              minlength="2"
              maxlength="100"
            />
          </div>
          
          <div>
            <label class="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Bio</label>
            <textarea 
              v-model="editForm.bio" 
              rows="3"
              maxlength="300"
              class="w-full bg-gray-800 border border-gray-700 rounded px-4 py-2 text-white focus:outline-none focus:border-flipboard-red transition-colors resize-none"
              placeholder="Tell us about yourself"
            ></textarea>
            <div class="mt-1 text-xs text-gray-500 text-right">
              {{ (editForm.bio ? editForm.bio.length : 0) }} / 300
            </div>
          </div>
          
          <div>
            <label class="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Avatar URL</label>
            <input 
              v-model="editForm.avatarUrl" 
              type="url" 
              class="w-full bg-gray-800 border border-gray-700 rounded px-4 py-2 text-white focus:outline-none focus:border-flipboard-red transition-colors"
              placeholder="https://..."
              pattern="https?://.+"
              title="Please enter a valid URL starting with http:// or https://"
            />
          </div>
          
          <div class="pt-4 flex space-x-4">
            <button 
              type="button"
              @click="isEditModalOpen = false"
              class="flex-1 bg-transparent border border-gray-700 text-gray-400 px-6 py-3 text-xs font-bold uppercase tracking-widest rounded hover:bg-gray-800 transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit"
              :disabled="editLoading"
              class="flex-1 bg-flipboard-red border border-flipboard-red text-white px-6 py-3 text-xs font-bold uppercase tracking-widest rounded hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              <span v-if="editLoading" class="inline-block h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></span>
              {{ editLoading ? 'Saving...' : 'Save Changes' }}
            </button>
          </div>
        </form>
      </div>
    </div>
    
    <!-- Create Magazine Modal -->
    <div v-if="isCreateMagazineModalOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div class="bg-gray-900 border border-gray-800 rounded-lg w-full max-w-md overflow-hidden shadow-2xl">
        <div class="p-6 border-b border-gray-800 flex justify-between items-center">
          <h2 class="text-xl font-display font-bold text-white uppercase tracking-tight">New Magazine</h2>
          <button @click="isCreateMagazineModalOpen = false" class="text-gray-500 hover:text-white transition-colors" aria-label="Close modal">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <form @submit.prevent="handleCreateMagazine" class="p-6 space-y-4">
          <div>
            <label class="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Magazine Title</label>
            <input 
              v-model="createMagazineName" 
              type="text" 
              class="w-full bg-gray-800 border border-gray-700 rounded px-4 py-2 text-white focus:outline-none focus:border-flipboard-red transition-colors"
              placeholder="For later, Tech, Design..."
              required
              minlength="2"
              maxlength="100"
            />
          </div>
          
          <div>
            <label class="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Description (Optional)</label>
            <textarea 
              v-model="createMagazineDescription" 
              rows="3"
              maxlength="300"
              class="w-full bg-gray-800 border border-gray-700 rounded px-4 py-2 text-white focus:outline-none focus:border-flipboard-red transition-colors resize-none"
              placeholder="What is this magazine about?"
            ></textarea>
          </div>
          
          <div class="pt-4 flex space-x-4">
            <button 
              type="button"
              @click="isCreateMagazineModalOpen = false"
              class="flex-1 bg-transparent border border-gray-700 text-gray-400 px-6 py-3 text-xs font-bold uppercase tracking-widest rounded hover:bg-gray-800 transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit"
              :disabled="createMagazineLoading"
              class="flex-1 bg-flipboard-red border border-flipboard-red text-white px-6 py-3 text-xs font-bold uppercase tracking-widest rounded hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              <span v-if="createMagazineLoading" class="inline-block h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></span>
              {{ createMagazineLoading ? 'Creating...' : 'Create' }}
            </button>
          </div>
        </form>
      </div>
    </div>
    
    <!-- User Content Tabs -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
       <div class="flex space-x-8 border-b border-gray-800 mb-8">
          <button 
            @click="handleTabChange('saved')"
            class="pb-4 border-b-2 font-bold uppercase tracking-wide text-sm transition-colors"
            :class="activeTab === 'saved' ? 'border-flipboard-red text-white' : 'border-transparent text-gray-500 hover:text-gray-300'"
          >
            Saved Stories
          </button>
          <button 
            @click="handleTabChange('magazines')"
            class="pb-4 border-b-2 font-bold uppercase tracking-wide text-sm transition-colors"
            :class="activeTab === 'magazines' ? 'border-flipboard-red text-white' : 'border-transparent text-gray-500 hover:text-gray-300'"
          >
            Magazines
          </button>
          <button 
            @click="handleTabChange('community')"
            class="pb-4 border-b-2 font-bold uppercase tracking-wide text-sm transition-colors"
            :class="activeTab === 'community' ? 'border-flipboard-red text-white' : 'border-transparent text-gray-500 hover:text-gray-300'"
          >
            Community
          </button>
          <button 
            @click="handleTabChange('comments')"
            class="pb-4 border-b-2 font-bold uppercase tracking-wide text-sm transition-colors"
            :class="activeTab === 'comments' ? 'border-flipboard-red text-white' : 'border-transparent text-gray-500 hover:text-gray-300'"
          >
            Comments
          </button>
          <button 
            @click="handleTabChange('settings')"
            class="pb-4 border-b-2 font-bold uppercase tracking-wide text-sm transition-colors"
            :class="activeTab === 'settings' ? 'border-flipboard-red text-white' : 'border-transparent text-gray-500 hover:text-gray-300'"
          >
            Settings
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
          <!-- My Magazines Section -->
          <h2 class="text-xs font-bold text-gray-500 uppercase tracking-[0.2em] mb-6">My Magazines</h2>
          <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-16">
             <div 
               v-for="mag in magazines" 
               :key="mag.id" 
               @click="router.push({ name: 'magazine', params: { id: mag.id } })"
               class="group relative aspect-[3/4] bg-gray-800 rounded-lg overflow-hidden cursor-pointer border border-gray-700 hover:border-gray-500 transition-colors"
             >
                <!-- Cover Image (First article or default) -->
                <img :src="getMagazineCover(mag)" class="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-40 group-hover:scale-105 transition-all duration-500" />
                
                <!-- Content -->
                <div class="absolute inset-0 flex flex-col justify-end p-6">
                   <h3 class="text-2xl font-display font-bold text-white leading-tight mb-1 shadow-black drop-shadow-lg">{{ mag.name }}</h3>
                   <p class="text-sm text-gray-300 font-bold uppercase tracking-wider">{{ mag.article_ids.length }} Stories</p>
                </div>
             </div>
             
             <!-- Create New Magazine Card -->
             <div 
               @click="openCreateMagazineModal"
               class="flex flex-col items-center justify-center aspect-[3/4] bg-gray-900 border-2 border-dashed border-gray-700 rounded-lg hover:border-flipboard-red hover:bg-gray-800 transition-all cursor-pointer group"
             >
                <div class="h-12 w-12 rounded-full bg-gray-800 flex items-center justify-center mb-4 group-hover:bg-flipboard-red transition-colors">
                   <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-6 h-6 text-gray-400 group-hover:text-white">
                     <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                   </svg>
                </div>
                <span class="font-bold text-gray-400 group-hover:text-white uppercase tracking-wide text-sm">Create Magazine</span>
             </div>
          </div>

          <!-- Followed Magazines Section -->
          <template v-if="followedMagazines.length > 0">
            <h2 class="text-xs font-bold text-gray-500 uppercase tracking-[0.2em] mb-6">Followed Magazines</h2>
            <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              <div 
                v-for="mag in followedMagazines" 
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
            </div>
          </template>
       </div>

       <!-- Community Grid -->
       <div v-if="activeTab === 'community'">
          <div v-if="exploreMagazinesLoading" class="text-center py-20 text-gray-500">
             <p>Loading community magazines...</p>
          </div>
          <div v-else class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
             <div 
               v-for="mag in exploreMagazines" 
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
             
             <div v-if="exploreMagazines.length === 0" class="col-span-full text-center py-20 text-gray-500 border-2 border-dashed border-gray-800 rounded-lg">
                <p>No community magazines found yet.</p>
             </div>
          </div>
       </div>
       
       <!-- Comments List -->
       <div v-if="activeTab === 'comments'">
          <div v-if="commentsLoading" class="text-center py-20 text-gray-500">
             <p>Loading comments...</p>
          </div>
          <div v-else-if="userComments.length > 0" class="max-w-3xl mx-auto">
             <CommentItem 
               v-for="comment in userComments" 
               :key="comment.id" 
               :comment="comment" 
               :article-id="comment.articleId" 
             />
          </div>
          <div v-else class="text-center py-20 text-gray-500">
             <p>No comments yet.</p>
          </div>
       </div>

       <!-- Settings Tab -->
       <div v-if="activeTab === 'settings'" class="max-w-2xl mx-auto">
          <div class="bg-gray-900 border border-gray-800 rounded-lg p-8">
             <h2 class="text-2xl font-display font-bold text-white uppercase tracking-tight mb-6">Email Preferences</h2>
             
             <div class="flex items-center justify-between py-4 border-b border-gray-800">
                <div>
                   <h3 class="text-white font-bold uppercase tracking-wide text-sm">Weekly Newsletter</h3>
                   <p class="text-gray-500 text-sm mt-1">Receive a digest of the best stories from your followed topics every week.</p>
                </div>
                <button 
                  @click="toggleNewsletter"
                  :class="user?.newsletter_subscribed ? 'bg-green-600 border-green-500' : 'bg-gray-800 border-gray-700'"
                  class="border text-white px-6 py-2 text-xs font-bold uppercase tracking-wider rounded hover:opacity-90 transition-colors whitespace-nowrap"
                >
                  {{ user?.newsletter_subscribed ? 'Subscribed' : 'Subscribe' }}
                </button>
             </div>

             <div class="mt-8 pt-8 border-t border-gray-800">
                <h3 class="text-white font-bold uppercase tracking-wide text-sm mb-4">Development Tools</h3>
                <p class="text-gray-500 text-sm mb-4">Use this button to immediately trigger a newsletter based on your current preferences.</p>
                <button 
                  @click="triggerNewsletter"
                  class="bg-flipboard-red border border-flipboard-red text-white px-6 py-2 text-xs font-bold uppercase tracking-wider rounded hover:bg-red-700 transition-colors"
                >
                  Send Test Newsletter Now
                </button>
             </div>
          </div>
       </div>
     </div>

     <UserListModal
       v-if="isUserListModalOpen"
       :is-open="isUserListModalOpen"
       :title="userListTitle"
       :user-ids="userListIds"
       @close="isUserListModalOpen = false"
     />

  </div>
</template>