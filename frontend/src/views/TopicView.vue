<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h2 class="text-2xl font-bold mb-6">Explore Topics</h2>
      <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          <div v-for="topic in ['Technology', 'Science', 'Health', 'Business', 'Entertainment', 'Sports']" :key="topic" class="bg-white rounded-lg shadow p-6 flex flex-col items-center justify-center h-40 cursor-pointer hover:bg-red-50 transition-colors">
              <h3 class="text-xl font-semibold text-gray-900">{{ topic }}</h3>
              <button class="mt-4 px-4 py-1 border border-red-600 text-red-600 rounded-full text-sm hover:bg-red-600 hover:text-white transition-colors">Follow</button>
          </div>
      </div>
  </div>
</template>
