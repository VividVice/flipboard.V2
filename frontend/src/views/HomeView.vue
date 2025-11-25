<script setup lang="ts">
import { computed } from 'vue'
import ArticleCard from '../components/ArticleCard.vue'

interface Article {
  id: string
  title: string
  description: string
  imageUrl: string
  source: string
  author: string
}

const heroArticle: Article = {
    id: '0',
    title: 'The Future of Artificial Intelligence: What to Expect in 2030',
    description: 'As AI continues to evolve at a rapid pace, experts predict a world where automation and human creativity merge in unprecedented ways. From healthcare to creative arts, the landscape is shifting.',
    imageUrl: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80',
    source: 'MIT Tech Review',
    author: 'Alice Johnson'
}

const articles: Article[] = [
  {
    id: '1',
    title: 'Boost your conversion rate with these simple steps',
    description: 'Optimizing your website for conversions is crucial for business growth. Learn the key strategies that top marketers use.',
    imageUrl: 'https://images.unsplash.com/photo-1496128858413-b36217c2ce36?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=1679&q=80',
    source: 'TechCrunch',
    author: 'Roel Aufderehar'
  },
  {
    id: '2',
    title: 'Minimalism in Design: Less is More',
    description: 'Exploring the roots of minimalism and how it influences modern web and product design. A deep dive into whitespace.',
    imageUrl: 'https://images.unsplash.com/photo-1494438639946-1ebd1d20bf85?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=1679&q=80',
    source: 'Design Weekly',
    author: 'Brenna Goyette'
  },
  {
    id: '3',
    title: 'Urban Photography: Capturing the Soul of the City',
    description: 'Street photography tips for capturing the raw energy of urban environments. Lighting, composition, and timing.',
    imageUrl: 'https://images.unsplash.com/photo-1492724441997-5dc865305da7?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=1679&q=80',
    source: 'The Verge',
    author: 'Daniela Metz'
  },
  {
    id: '4',
    title: 'Sustainable Living: A Guide to Zero Waste',
    description: 'Practical tips for reducing your carbon footprint and living a more sustainable lifestyle starting today.',
    imageUrl: 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?ixlib=rb-1.2.1&auto=format&fit=crop&w=1500&q=80',
    source: 'EcoLife',
    author: 'Sarah Connor'
  },
  {
    id: '5',
    title: 'The Best Coffee Shops in Tokyo',
    description: 'A curated list of the must-visit cafes in Japan\'s bustling capital. From hidden gems to popular roasters.',
    imageUrl: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=1679&q=80',
    source: 'TravelMag',
    author: 'Kenji Sato'
  },
  {
    id: '6',
    title: 'Modern Architecture trends 2025',
    description: 'How sustainability and smart technology are shaping the skylines of the future.',
    imageUrl: 'https://images.unsplash.com/photo-1487958449943-2429e8be8625?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=1679&q=80',
    source: 'ArchDaily',
    author: 'Maria Garcia'
  }
]

const featuredArticle = computed(() => articles[0]!)
const remainingArticles = computed(() => articles.slice(1))
</script>

<template>

  <div class="bg-black min-h-screen pb-20">

    

    <!-- Hero Section -->

    <div class="bg-gray-900 text-white border-b border-gray-800">

        <div class="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 min-h-[500px]">

            <div class="relative h-64 lg:h-auto">

                <img :src="heroArticle.imageUrl" class="absolute inset-0 w-full h-full object-cover opacity-80" />

                <div class="absolute inset-0 bg-gradient-to-r from-gray-900/80 to-transparent lg:hidden"></div>

            </div>

            <div class="p-8 lg:p-16 flex flex-col justify-center">

                <span class="text-flipboard-red font-bold uppercase tracking-widest text-sm mb-4">{{ heroArticle.source }}</span>

                <h1 class="text-4xl lg:text-6xl font-serif font-bold leading-tight mb-6 text-white">{{ heroArticle.title }}</h1>

                <p class="text-lg text-gray-300 mb-8 max-w-md">{{ heroArticle.description }}</p>

                <div class="flex items-center space-x-4">

                     <button class="bg-flipboard-red text-white px-8 py-3 font-bold uppercase tracking-wider text-sm hover:bg-red-700 transition-colors">Read Story</button>

                     <button class="text-white border border-gray-600 px-8 py-3 font-bold uppercase tracking-wider text-sm hover:bg-white hover:text-black transition-colors">Save</button>

                </div>

            </div>

        </div>

    </div>



    <!-- Main Feed -->

    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

      <div class="border-b border-gray-800 mb-8 pb-2 flex items-end justify-between">

          <h2 class="text-4xl font-display font-bold text-white uppercase tracking-tighter">For You</h2>

          <a href="#" class="text-sm font-bold text-gray-500 hover:text-flipboard-red uppercase tracking-wide mb-1">See All</a>

      </div>



      <!-- Grid Layout -->

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" v-if="articles.length > 0">

        <!-- Featured Item (Spans 2 cols on large screens) -->

        <div class="col-span-1 md:col-span-2 row-span-2">

            <ArticleCard :article="featuredArticle" class="h-full" />

        </div>

        

        <!-- Standard Items -->

        <ArticleCard v-for="article in remainingArticles" :key="article.id" :article="article" />

      </div>

    </div>

  </div>

</template>
