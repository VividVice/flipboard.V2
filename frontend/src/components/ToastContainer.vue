<script setup lang="ts">
import { useToastStore } from '../stores/toast'
import { storeToRefs } from 'pinia'

const toastStore = useToastStore()
const { toasts } = storeToRefs(toastStore)
</script>

<template>
  <div class="fixed bottom-5 right-5 z-[100] flex flex-col space-y-2 pointer-events-none">
    <TransitionGroup name="toast">
      <div 
        v-for="toast in toasts" 
        :key="toast.id" 
        class="pointer-events-auto px-6 py-3 rounded shadow-lg text-white font-bold text-sm uppercase tracking-wide flex items-center min-w-[250px]"
        :class="{
          'bg-flipboard-red': toast.type === 'success',
          'bg-red-800': toast.type === 'error',
          'bg-gray-800': toast.type === 'info'
        }"
      >
        <span>{{ toast.message }}</span>
        <button @click="toastStore.remove(toast.id)" class="ml-auto text-white/80 hover:text-white">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}
.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateX(30px);
}
</style>
