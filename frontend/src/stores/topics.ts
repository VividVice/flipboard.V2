import { defineStore } from 'pinia'
import { useToastStore } from './toast'
import { apiServiceExtended, type Topic } from '../services/api'

export const useTopicStore = defineStore('topics', {
  state: () => ({
    topics: [] as Topic[],
    followedTopics: [] as Topic[],
    loading: false,
    error: null as string | null
  }),
  
  getters: {
    followedCount: (state) => state.followedTopics.length,
    isTopicFollowed: (state) => {
      return (topicId: string) => {
        return state.followedTopics.some(t => t.id === topicId)
      }
    }
  },
  
  actions: {
    async fetchTopics() {
      this.loading = true
      this.error = null
      try {
        this.topics = await apiServiceExtended.getTopics()
      } catch (error: unknown) {
        this.error = error instanceof Error ? error.message : 'Failed to fetch topics'
        console.error('Error fetching topics:', error)
      } finally {
        this.loading = false
      }
    },

    async fetchFollowedTopics() {
      this.loading = true
      this.error = null
      try {
        this.followedTopics = await apiServiceExtended.getFollowedTopics()
      } catch (error: unknown) {
        this.error = error instanceof Error ? error.message : 'Failed to fetch followed topics'
        console.error('Error fetching followed topics:', error)
      } finally {
        this.loading = false
      }
    },

    async toggleFollow(topicId: string) {
      const toast = useToastStore()
      const topic = this.topics.find(t => t.id === topicId)
      if (!topic) return

      try {
        await apiServiceExtended.followTopic(topicId)
        
        // Check if already followed
        const isFollowed = this.followedTopics.some(t => t.id === topicId)
        
        if (isFollowed) {
          // Unfollow
          this.followedTopics = this.followedTopics.filter(t => t.id !== topicId)
          toast.show(`Unfollowed ${topic.name}`, 'info')
        } else {
          // Follow
          this.followedTopics.push(topic)
          toast.show(`Following ${topic.name}`)
        }
      } catch (error: unknown) {
        toast.show(error instanceof Error ? error.message : 'Failed to toggle topic', 'error')
      }
    },

    async bulkFollow(topicIds: string[]) {
      const toast = useToastStore()
      try {
        await apiServiceExtended.bulkFollowTopics(topicIds)
        await this.fetchFollowedTopics()
        toast.show(`Following ${topicIds.length} topics`)
      } catch (error: unknown) {
        toast.show(error instanceof Error ? error.message : 'Failed to follow topics', 'error')
      }
    },

    toggleSelection(topicId: string) {
      // For topic selection during signup
      const topic = this.topics.find(t => t.id === topicId)
      if (!topic) return

      const isFollowed = this.followedTopics.some(t => t.id === topicId)
      if (isFollowed) {
        this.followedTopics = this.followedTopics.filter(t => t.id !== topicId)
      } else {
        this.followedTopics.push(topic)
      }
    }
  }
})
