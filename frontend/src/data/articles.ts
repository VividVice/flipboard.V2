export interface Article {
  id: string
  title: string
  description: string
  imageUrl: string
  source: string
  category: string
  author: string
  date?: string
  content?: string
}

export const heroArticle: Article = {
    id: '0',
    title: 'The Future of Artificial Intelligence: What to Expect in 2030',
    description: 'As AI continues to evolve at a rapid pace, experts predict a world where automation and human creativity merge in unprecedented ways. From healthcare to creative arts, the landscape is shifting.',
    imageUrl: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80',
    source: 'MIT Tech Review',
    category: 'Technology',
    author: 'Alice Johnson',
    date: 'Nov 25, 2025',
    content: `
      <p>Artificial Intelligence is no longer just a buzzword; it is the fundamental shifting force of our generation. As we look toward 2030, the integration of AI into daily life will move from assistive to transformative.</p>
      
      <h3>The Healthcare Revolution</h3>
      <p>One of the most promising areas is healthcare. Personalized medicine, powered by AI analysis of genetic data, will allow doctors to prescribe treatments tailored specifically to an individual's biology, drastically reducing side effects and increasing efficacy. Predictive algorithms are already detecting diseases like cancer at stages earlier than humanly possible.</p>
      
      <h3>Creative Renaissance or Redundancy?</h3>
      <p>Generative AI has sparked a debate about the future of creativity. By 2030, we expect to see AI not as a replacement for human artists, but as a collaborator. Tools that can generate code, images, and music in seconds will lower the barrier to entry for creation, leading to an explosion of new content forms we haven't even imagined yet.</p>
      
      <h3>Ethical Considerations</h3>
      <p>However, this progress comes with risks. The displacement of jobs, algorithmic bias, and data privacy remain critical challenges that governments and corporations must address. The next decade will be defined not just by what AI can do, but by how we choose to govern it.</p>
    `
}

export const articles: Article[] = [
  heroArticle,
  {
    id: '1',
    title: 'Boost your conversion rate with these simple steps',
    description: 'Optimizing your website for conversions is crucial for business growth. Learn the key strategies that top marketers use.',
    imageUrl: 'https://images.unsplash.com/photo-1496128858413-b36217c2ce36?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=1679&q=80',
    source: 'TechCrunch',
    category: 'Technology',
    author: 'Roel Aufderehar',
    date: 'Nov 24, 2025',
    content: `<p>Conversion rate optimization (CRO) is the art and science of getting people to act once they arrive on your website. It's not enough to just get traffic; you need that traffic to convert into paying customers, subscribers, or leads.</p>`
  },
  {
    id: '2',
    title: 'Minimalism in Design: Less is More',
    description: 'Exploring the roots of minimalism and how it influences modern web and product design. A deep dive into whitespace.',
    imageUrl: 'https://images.unsplash.com/photo-1494438639946-1ebd1d20bf85?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=1679&q=80',
    source: 'Design Weekly',
    category: 'Design',
    author: 'Brenna Goyette',
    date: 'Nov 23, 2025',
    content: `<p>Minimalism isn't just about stripping things away; it's about focusing on what's truly important. In a world of digital noise, clarity is the ultimate luxury.</p>`
  },
  {
    id: '3',
    title: 'Urban Photography: Capturing the Soul of the City',
    description: 'Street photography tips for capturing the raw energy of urban environments. Lighting, composition, and timing.',
    imageUrl: 'https://images.unsplash.com/photo-1492724441997-5dc865305da7?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=1679&q=80',
    source: 'The Verge',
    category: 'Technology', // Or Photography if added
    author: 'Daniela Metz',
    date: 'Nov 22, 2025',
    content: `<p>The city never sleeps, and neither does a street photographer. Capturing the perfect moment requires patience, a keen eye, and the willingness to get lost.</p>`
  },
  {
    id: '4',
    title: 'Sustainable Living: A Guide to Zero Waste',
    description: 'Practical tips for reducing your carbon footprint and living a more sustainable lifestyle starting today.',
    imageUrl: 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?ixlib=rb-1.2.1&auto=format&fit=crop&w=1500&q=80',
    source: 'EcoLife',
    category: 'Environment',
    author: 'Sarah Connor',
    date: 'Nov 21, 2025',
    content: `<p>Zero waste doesn't happen overnight. It's a journey of small choices: bringing your own bags, refusing straws, and choosing products with less packaging.</p>`
  },
  {
    id: '5',
    title: 'The Best Coffee Shops in Tokyo',
    description: 'A curated list of the must-visit cafes in Japan\'s bustling capital. From hidden gems to popular roasters.',
    imageUrl: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=1679&q=80',
    source: 'TravelMag',
    category: 'Travel',
    author: 'Kenji Sato',
    date: 'Nov 20, 2025',
    content: `<p>Tokyo's coffee scene is legendary. From the precise pour-overs of Omotesando to the cozy kissaten of Jimbocho, there's a cup for everyone.</p>`
  },
  {
    id: '6',
    title: 'Modern Architecture trends 2025',
    description: 'How sustainability and smart technology are shaping the skylines of the future.',
    imageUrl: 'https://images.unsplash.com/photo-1487958449943-2429e8be8625?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=1679&q=80',
    source: 'ArchDaily',
    category: 'Architecture',
    author: 'Maria Garcia',
    date: 'Nov 19, 2025',
    content: `<p>Architecture is evolving. It's no longer just about form and function; it's about integration with the environment and the digital world.</p>`
  }
]
