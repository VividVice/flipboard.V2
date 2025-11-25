import { defineStore } from 'pinia'
import { useToastStore } from './toast'

export interface Topic {
  name: string
  image: string
  isFollowed: boolean
}

export const useTopicStore = defineStore('topics', {
  state: () => ({
    topics: [
      { name: 'Technology', image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80', isFollowed: false },
      { name: 'Science', image: 'https://images.unsplash.com/photo-1507413245164-6160d8298b31?auto=format&fit=crop&w=800&q=80', isFollowed: false },
      { name: 'Health', image: 'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?auto=format&fit=crop&w=800&q=80', isFollowed: false },
      { name: 'Business', image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=800&q=80', isFollowed: false },
      { name: 'Entertainment', image: 'https://images.unsplash.com/photo-1603190287605-e6ade32fa852?auto=format&fit=crop&w=800&q=80', isFollowed: false },
      { name: 'Sports', image: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=800&q=80', isFollowed: false },
      { name: 'Travel', image: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=800&q=80', isFollowed: false },
      { name: 'Food', image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=800&q=80', isFollowed: false },
    ] as Topic[]
  }),
  
  getters: {
    followedTopics: (state) => state.topics.filter(t => t.isFollowed)
  },
  
  actions: {
    toggleFollow(name: string) {
      const topic = this.topics.find(t => t.name === name)
      if (topic) {
        topic.isFollowed = !topic.isFollowed
        const toast = useToastStore()
        if (topic.isFollowed) {
           toast.show(`Following ${name}`)
        } else {
           toast.show(`Unfollowed ${name}`, 'info')
        }
      }
    }
  }
})
