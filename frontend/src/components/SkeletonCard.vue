<template>
  <div class="flex flex-col h-full bg-gray-900 border border-gray-800 animate-pulse">
    <!-- Image Placeholder -->
    <div class="aspect-[4/3] bg-gray-800"></div>
    
    <!-- Content -->
    <div class="flex-1 p-4 flex flex-col">
      <!-- Source & Time -->
      <div class="flex items-center justify-between mb-2">
         <div class="flex items-center space-x-2">
             <div class="h-5 w-5 rounded bg-gray-800"></div>
             <div class="h-3 w-20 bg-gray-800 rounded"></div>
         </div>
         <div class="h-3 w-8 bg-gray-800 rounded"></div>
      </div>

      <!-- Title -->
      <div class="h-6 w-full bg-gray-800 rounded mb-2"></div>
      <div class="h-6 w-3/4 bg-gray-800 rounded mb-4"></div>

      <!-- Excerpt -->
      <div class="h-3 w-full bg-gray-800 rounded mb-1"></div>
      <div class="h-3 w-full bg-gray-800 rounded mb-1"></div>
      <div class="h-3 w-2/3 bg-gray-800 rounded mb-4"></div>

      <!-- Footer -->
      <div class="mt-auto pt-4 flex items-center justify-between border-t border-gray-800">
        <div class="flex items-center space-x-3">
           <div class="h-5 w-5 bg-gray-800 rounded"></div>
           <div class="h-5 w-5 bg-gray-800 rounded"></div>
        </div>
        <div class="h-5 w-5 bg-gray-800 rounded"></div>
      </div>
    </div>
  </div>
</template>
