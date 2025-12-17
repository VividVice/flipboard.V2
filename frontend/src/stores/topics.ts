import { defineStore } from 'pinia'
import { useToastStore } from './toast'

export interface Topic {
  name: string
  image: string
  isFollowed: boolean
}

const rawTopics = [
  "Actualités", "Carrières", "Défense", "Fact Checking", "Syrie", "Jeux Vidéo", "Agriculture", "Guerre en Ukraine", 
  "Intelligence Artificielle", "Droits de douane", "Musique", "Environnement", "Désinformation", "Israël", "Vélo", 
  "Retraite", "Histoire", "Maroc", "Familles Royales", "Espace", "Séries TV", "LGBT", "Livres", "IVG", "Gabon", 
  "Iran", "Sobriété Énergétique", "Bande Dessinée", "Langue Française", "Condition Féminine", "Immobilier", 
  "Architecture", "Démocratie", "Jardinage", "Do It Yourself", "Droits de l'Homme", "Parents", "Étudiants", 
  "Paris", "Métavers", "Voyages", "Marseille", "Nantes", "Strasbourg", "Grenoble", "Rennes", "Le Havre", 
  "Lille", "Toulouse", "Reims", "Montpellier", "Bordeaux", "Lyon", "Bretagne", "Normandie", "Cuisine", 
  "Musées", "Manga", "MOOC", "Décoration", "Horlogerie", "Psychologie", "Bruxelles", "Genève", "Montréal", 
  "Beyrouth", "Sports d'hiver", "Économie", "Sciences", "Technologie", "Idées", "Santé", "Animaux", "Art", 
  "People", "Politique", "Placements", "Automobile", "Cybersécurité", "Culture", "Sports Extrêmes", "Mode", 
  "Baskets", "Hip-Hop", "Aéronautique", "Société", "Afrique", "Algérie", "Bénin", "Burkina Faso", 
  "Côte d'Ivoire", "Guinée", "Liban", "Mali", "Niger", "Sénégal", "Togo", "Tunisie", "Android", "Apple", 
  "Photographie", "Beauté", "Street art", "Randonnée", "Football", "Cyclisme", "Formule 1", "Blockchain", 
  "Startup", "Domotique", "Actualités de Belgique", "Actualités de Suisse"
]

const placeholderImages = [
  'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1507413245164-6160d8298b31?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1603190287605-e6ade32fa852?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=800&q=80'
]

export const useTopicStore = defineStore('topics', {
  state: () => ({
    topics: rawTopics.map((name, index) => ({
      name,
      image: placeholderImages[index % placeholderImages.length],
      isFollowed: false
    })) as Topic[]
  }),
  
  getters: {
    followedTopics: (state) => state.topics.filter(t => t.isFollowed),
    followedCount: (state) => state.topics.filter(t => t.isFollowed).length
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
    },

    toggleSelection(name: string) {
        const topic = this.topics.find(t => t.name === name)
        if (topic) {
            topic.isFollowed = !topic.isFollowed
        }
    }
  }
})