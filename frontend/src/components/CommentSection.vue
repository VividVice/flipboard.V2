<script setup lang="ts">
import { onMounted, computed, ref } from 'vue'
import CommentForm from './CommentForm.vue'
import CommentList from './CommentList.vue'
import { useCommentsStore } from '../stores/comments'

interface Props {
  articleId?: string
  magazineId?: string
  showComments?: boolean
}

const props = defineProps<Props>()
const commentsStore = useCommentsStore()
const isVisible = ref(props.showComments !== undefined ? props.showComments : true)

const commentsCount = computed(() => {
  if (props.articleId) return commentsStore.getCommentsCount(props.articleId)
  if (props.magazineId) return commentsStore.getMagazineCommentsCount(props.magazineId)
  return 0
})

onMounted(() => {
  if (props.articleId) {
    commentsStore.fetchComments(props.articleId)
  } else if (props.magazineId) {
    commentsStore.fetchMagazineComments(props.magazineId)
  }
})

const toggleSection = () => {
  isVisible.value = !isVisible.value
}
</script>

<template>
  <div class="bg-black border-t border-gray-800">
    <div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Section Header -->
      <div class="flex items-center justify-between mb-6">
        <h2 class="text-2xl font-bold text-white flex items-center space-x-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke-width="1.5"
            stroke="currentColor"
            class="w-6 h-6 text-flipboard-red"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 0 1 .865-.501 48.172 48.172 0 0 0 3.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z"
            />
          </svg>
          <span>Comments</span>
          <span class="text-sm text-gray-400 font-normal">({{ commentsCount }})</span>
        </h2>

        <button
          @click="toggleSection"
          class="text-gray-400 hover:text-white transition-colors p-2"
          :aria-label="isVisible ? 'Collapse comments' : 'Expand comments'"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke-width="1.5"
            stroke="currentColor"
            class="w-5 h-5 transition-transform"
            :class="{ 'rotate-180': !isVisible }"
          >
            <path stroke-linecap="round" stroke-linejoin="round" d="m4.5 15.75 7.5-7.5 7.5 7.5" />
          </svg>
        </button>
      </div>

      <transition
        enter-active-class="transition-all duration-300 ease-out"
        leave-active-class="transition-all duration-200 ease-in"
        enter-from-class="opacity-0 max-h-0"
        enter-to-class="opacity-100 max-h-[2000px]"
        leave-from-class="opacity-100 max-h-[2000px]"
        leave-to-class="opacity-0 max-h-0"
      >
        <div v-show="isVisible" class="overflow-hidden">
          <CommentForm :article-id="articleId" :magazine-id="magazineId" />
          <CommentList :article-id="articleId" :magazine-id="magazineId" />
        </div>
      </transition>
    </div>
  </div>
</template>
