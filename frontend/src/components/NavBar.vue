<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { storeToRefs } from 'pinia'

const authStore = useAuthStore()
const { isAuthenticated, user } = storeToRefs(authStore)

const scrollToTop = () => {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}
</script>

<template>
  <nav class="bg-black border-b border-gray-800 sticky top-0 z-50 h-[60px]">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full">
      <div class="flex justify-between items-center h-full">
        <!-- Left: Search (Placeholder) -->
        <div class="flex items-center w-1/3">
           <div class="text-gray-500 hover:text-gray-300 cursor-pointer transition-colors">
             <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
               <path stroke-linecap="round" stroke-linejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
             </svg>
           </div>
        </div>

        <!-- Center: Logo -->
        <div class="flex-shrink-0 flex items-center justify-center w-1/3">
            <RouterLink to="/" @click="scrollToTop" class="font-display font-bold text-3xl tracking-tighter text-white">
              FLIPBOARD
            </RouterLink>
        </div>

        <!-- Right: Navigation & Login -->
        <div class="flex items-center justify-end w-1/3 space-x-6">
          <div class="hidden sm:flex sm:space-x-6">
            <RouterLink to="/" @click="scrollToTop" active-class="text-flipboard-red" class="text-gray-400 hover:text-flipboard-red text-sm font-bold uppercase tracking-wide transition-colors duration-200">
              Home
            </RouterLink>
            <RouterLink to="/topics" active-class="text-flipboard-red" class="text-gray-400 hover:text-flipboard-red text-sm font-bold uppercase tracking-wide transition-colors duration-200">
              Topics
            </RouterLink>
            <RouterLink v-if="isAuthenticated" to="/profile" active-class="text-flipboard-red" class="text-gray-400 hover:text-flipboard-red text-sm font-bold uppercase tracking-wide transition-colors duration-200">
              Profile
            </RouterLink>
          </div>
          <div class="flex-shrink-0 border-l border-gray-800 pl-6">
            <template v-if="!isAuthenticated">
              <RouterLink to="/login" class="text-sm font-bold text-gray-300 hover:text-white transition-colors">
                Log In
              </RouterLink>
              <RouterLink to="/signup" class="ml-4 px-4 py-2 text-sm font-bold rounded bg-flipboard-red text-white hover:bg-red-700 transition-colors">
                Sign Up
              </RouterLink>
            </template>
            <template v-else>
               <div class="flex items-center space-x-3 group cursor-pointer relative">
                  <RouterLink to="/profile" class="flex items-center space-x-2">
                    <img v-if="user?.avatarUrl" :src="user.avatarUrl" class="h-8 w-8 rounded-full border border-gray-600" alt="User Avatar" />
                    <div v-else class="h-8 w-8 rounded-full bg-gray-700 flex items-center justify-center border border-gray-600 text-white font-bold">
                        {{ user?.name.charAt(0) }}
                    </div>
                  </RouterLink>
                  <button @click="authStore.logout()" class="text-xs font-bold text-gray-500 hover:text-white uppercase">Logout</button>
               </div>
            </template>
          </div>
        </div>
      </div>
    </div>
  </nav>
</template>
