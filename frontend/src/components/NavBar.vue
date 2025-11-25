<script setup lang="ts">
import { RouterLink } from 'vue-router'
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
            <RouterLink to="/" class="font-display font-bold text-3xl tracking-tighter text-white">
              FLIPBOARD
            </RouterLink>
        </div>

        <!-- Right: Navigation & Login -->
        <div class="flex items-center justify-end w-1/3 space-x-6">
          <div class="hidden sm:flex sm:space-x-6">
            <RouterLink to="/" active-class="text-flipboard-red" class="text-gray-400 hover:text-flipboard-red text-sm font-bold uppercase tracking-wide transition-colors duration-200">
              Home
            </RouterLink>
            <RouterLink to="/topics" active-class="text-flipboard-red" class="text-gray-400 hover:text-flipboard-red text-sm font-bold uppercase tracking-wide transition-colors duration-200">
              Topics
            </RouterLink>
            <RouterLink to="/profile" active-class="text-flipboard-red" class="text-gray-400 hover:text-flipboard-red text-sm font-bold uppercase tracking-wide transition-colors duration-200">
              Profile
            </RouterLink>
          </div>
          <div class="flex-shrink-0 border-l border-gray-800 pl-6">
            <button type="button" class="text-sm font-bold text-gray-300 hover:text-white transition-colors">
              Log In
            </button>
            <button type="button" class="ml-4 px-4 py-2 text-sm font-bold rounded bg-flipboard-red text-white hover:bg-red-700 transition-colors">
              Sign Up
            </button>
          </div>
        </div>
      </div>
    </div>
  </nav>
</template>
