<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useArticleStore } from '../stores/articles'
import { storeToRefs } from 'pinia'

const authStore = useAuthStore()
const articleStore = useArticleStore()
const { isAuthenticated, user } = storeToRefs(authStore)
const { searchQuery } = storeToRefs(articleStore)

const isMenuOpen = ref(false)

const toggleMenu = () => {
  isMenuOpen.value = !isMenuOpen.value
}

const closeMenu = () => {
  isMenuOpen.value = false
}

const scrollToTop = () => {
  window.scrollTo({ top: 0, behavior: 'smooth' })
  closeMenu()
}
</script>

<template>
  <nav class="bg-black border-b border-gray-800 sticky top-0 z-50 h-[60px]">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full">
      <div class="flex justify-between items-center h-full">
        <!-- Left: Search & Mobile Menu Button -->
        <div class="flex items-center w-1/3">
           <!-- Mobile Menu Button -->
           <button @click="toggleMenu" class="sm:hidden text-gray-400 hover:text-white mr-4 focus:outline-none">
             <svg v-if="!isMenuOpen" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
               <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
             </svg>
             <svg v-else xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
               <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
             </svg>
           </button>

           <div class="relative w-full max-w-xs group hidden sm:block">
             <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
               <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5 text-gray-500 group-focus-within:text-white transition-colors">
                 <path stroke-linecap="round" stroke-linejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
               </svg>
             </div>
             <input 
               type="text" 
               v-model="searchQuery"
               placeholder="Search stories..." 
               class="block w-full pl-10 pr-3 py-1.5 border border-gray-800 rounded-md leading-5 bg-black text-gray-300 placeholder-gray-500 focus:outline-none focus:bg-gray-900 focus:border-gray-600 focus:text-white sm:text-sm transition-colors"
             />
           </div>
        </div>

        <!-- Center: Logo -->
        <div class="flex-shrink-0 flex items-center justify-center w-1/3">
            <RouterLink to="/" @click="scrollToTop" class="font-display font-bold text-3xl tracking-tighter text-white">
              FLIPBOARD
            </RouterLink>
        </div>

        <!-- Right: Navigation & Login (Desktop) -->
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
          <div class="hidden sm:flex flex-shrink-0 border-l border-gray-800 pl-6">
            <template v-if="!isAuthenticated">
              <RouterLink to="/login" class="ml-1 px-1 py-2 text-sm font-bold text-gray-300 hover:text-white transition-colors">
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

    <!-- Mobile Menu -->
    <transition enter-active-class="transition duration-200 ease-out" enter-from-class="transform -translate-y-2 opacity-0" enter-to-class="transform translate-y-0 opacity-100" leave-active-class="transition duration-150 ease-in" leave-from-class="transform translate-y-0 opacity-100" leave-to-class="transform -translate-y-2 opacity-0">
      <div v-if="isMenuOpen" class="sm:hidden bg-gray-900 border-b border-gray-800 absolute top-[60px] left-0 w-full z-40 shadow-xl">
        <div class="px-2 pt-2 pb-3 space-y-1">
           <!-- Mobile Search -->
           <div class="px-3 py-2">
             <input 
               type="text" 
               v-model="searchQuery"
               placeholder="Search stories..." 
               class="block w-full px-3 py-2 border border-gray-700 rounded-md leading-5 bg-black text-gray-300 placeholder-gray-500 focus:outline-none focus:border-gray-600 focus:text-white sm:text-sm"
             />
           </div>

           <RouterLink to="/" @click="closeMenu" active-class="bg-gray-800 text-white" class="block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:text-white hover:bg-gray-800">Home</RouterLink>
           <RouterLink to="/topics" @click="closeMenu" active-class="bg-gray-800 text-white" class="block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:text-white hover:bg-gray-800">Topics</RouterLink>
           <RouterLink v-if="isAuthenticated" to="/profile" @click="closeMenu" active-class="bg-gray-800 text-white" class="block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:text-white hover:bg-gray-800">Profile</RouterLink>
           
           <div class="border-t border-gray-800 mt-2 pt-2">
              <template v-if="!isAuthenticated">
                <RouterLink to="/login" @click="closeMenu" class="block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:text-white hover:bg-gray-800">Log In</RouterLink>
                <RouterLink to="/signup" @click="closeMenu" class="block px-3 py-2 rounded-md text-base font-medium text-flipboard-red hover:text-red-400">Sign Up</RouterLink>
              </template>
              <template v-else>
                 <button @click="authStore.logout(); closeMenu()" class="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:text-white hover:bg-gray-800">Logout</button>
              </template>
           </div>
        </div>
      </div>
    </transition>
  </nav>
</template>
