export interface Article {
  id: string
  title: string
  description: string
  imageUrl: string
  source: string
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
    author: 'Roel Aufderehar',
    date: 'Nov 24, 2025',
    content: `
      <p>Conversion rate optimization (CRO) is the art and science of getting people to act once they arrive on your website. It's not enough to just get traffic; you need that traffic to convert into paying customers, subscribers, or leads.</p>
      
      <h3>1. Understand Your Audience</h3>
      <p>Before you can optimize, you must understand who you are talking to. Create detailed buyer personas. What are their pain points? What motivates them? Use tools like heatmaps and session recordings to see how users actually interact with your site.</p>
      
      <h3>2. Simplify Your Forms</h3>
      <p>Long forms are conversion killers. Ask for only the absolute minimum information you need. If you can get by with just an email address, do it. You can always ask for more details later once the relationship is established.</p>
      
      <h3>3. Use Strong Calls to Action (CTAs)</h3>
      <p>Your CTA buttons should be clear, contrasting, and action-oriented. Instead of "Submit," try "Get My Free Guide" or "Start Your Trial." Make it obvious what the user will get by clicking.</p>
      
      <h3>4. Improve Page Speed</h3>
      <p>A one-second delay in page response can result in a 7% reduction in conversions. Optimize your images, leverage browser caching, and consider using a Content Delivery Network (CDN) to ensure your site loads instantly.</p>
    `
  },
  {
    id: '2',
    title: 'Minimalism in Design: Less is More',
    description: 'Exploring the roots of minimalism and how it influences modern web and product design. A deep dive into whitespace.',
    imageUrl: 'https://images.unsplash.com/photo-1494438639946-1ebd1d20bf85?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=1679&q=80',
    source: 'Design Weekly',
    author: 'Brenna Goyette',
    date: 'Nov 23, 2025',
    content: `
      <p>Minimalism isn't just about stripping things away; it's about focusing on what's truly important. In a world of digital noise, clarity is the ultimate luxury. It allows the user to focus on the core message without distraction.</p>
      
      <h3>The Power of Whitespace</h3>
      <p>Whitespace, or negative space, is not empty space; it is an active design element. It provides breathing room for the eyes and helps to organize content. Proper use of whitespace increases readability and comprehension by up to 20%.</p>
      
      <h3>Typography as a Visual Element</h3>
      <p>In minimalist design, typography often takes center stage. Without heavy imagery or ornamentation, the choice of font, weight, and scale becomes critical. A bold headline paired with a clean sans-serif body font can create a striking visual hierarchy.</p>
      
      <h3>Function Over Decoration</h3>
      <p>Every element on the page must serve a purpose. If it doesn't help the user achieve their goal, it should be removed. This philosophy leads to faster loading times, easier navigation, and a more enjoyable user experience.</p>
    `
  },
  {
    id: '3',
    title: 'Urban Photography: Capturing the Soul of the City',
    description: 'Street photography tips for capturing the raw energy of urban environments. Lighting, composition, and timing.',
    imageUrl: 'https://images.unsplash.com/photo-1492724441997-5dc865305da7?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=1679&q=80',
    source: 'The Verge',
    author: 'Daniela Metz',
    date: 'Nov 22, 2025',
    content: `
      <p>The city never sleeps, and neither does a street photographer. Capturing the perfect moment requires patience, a keen eye, and the willingness to get lost. Urban environments offer a chaotic beauty that is waiting to be framed.</p>
      
      <h3>The Golden Hour</h3>
      <p>Just after sunrise and just before sunset, the light in the city is magical. Long shadows and warm tones can transform a mundane street corner into a cinematic scene. Use this light to create drama and depth in your images.</p>
      
      <h3>Finding Order in Chaos</h3>
      <p>Cities are messy. Your job as a photographer is to isolate a subject or find a pattern amidst the noise. Look for leading lines in architecture, reflections in puddles or windows, and contrasting colors.</p>
      
      <h3>The Human Element</h3>
      <p>Architecture is beautiful, but people breathe life into a city. Candid shots of commuters, street performers, or friends laughing can tell a powerful story about the human condition in a metropolis.</p>
    `
  },
  {
    id: '4',
    title: 'Sustainable Living: A Guide to Zero Waste',
    description: 'Practical tips for reducing your carbon footprint and living a more sustainable lifestyle starting today.',
    imageUrl: 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?ixlib=rb-1.2.1&auto=format&fit=crop&w=1500&q=80',
    source: 'EcoLife',
    author: 'Sarah Connor',
    date: 'Nov 21, 2025',
    content: `
      <p>Zero waste doesn't happen overnight. It's a journey of small choices: bringing your own bags, refusing straws, and choosing products with less packaging. It is about shifting our mindset from a disposable culture to a circular one.</p>
      
      <h3>Refuse what you do not need</h3>
      <p>The first rule of zero waste is to refuse. Say no to free promotional items, single-use plastics, and junk mail. If you don't bring it into your home, you don't have to deal with the waste later.</p>
      
      <h3>Reduce what you do need</h3>
      <p>Be mindful of your consumption. Do you really need that new gadget? Can you repair what you already have? Buying less is the most effective way to reduce your environmental impact.</p>
      
      <h3>Reuse and Rot</h3>
      <p>Switch to reusable alternatives for everyday items like water bottles, coffee cups, and napkins. Finally, compost your organic waste. Returning nutrients to the soil is the ultimate act of sustainability.</p>
    `
  },
  {
    id: '5',
    title: 'The Best Coffee Shops in Tokyo',
    description: 'A curated list of the must-visit cafes in Japan\'s bustling capital. From hidden gems to popular roasters.',
    imageUrl: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=1679&q=80',
    source: 'TravelMag',
    author: 'Kenji Sato',
    date: 'Nov 20, 2025',
    content: `
      <p>Tokyo's coffee scene is legendary. From the precise pour-overs of Omotesando to the cozy kissaten of Jimbocho, there's a cup for everyone. The city blends traditional tea-house aesthetics with modern third-wave coffee culture.</p>
      
      <h3>Omotesando Koffee</h3>
      <p>Once a pop-up in an old Japanese house, now a global brand. Their signature cube-shaped layout and meticulous barista craftsmanship make this a must-visit for any coffee lover.</p>
      
      <h3>Fuglen Tokyo</h3>
      <p>Located near Yoyogi Park, this Norwegian transplant offers a slice of Scandinavian design in the heart of Tokyo. By day, it serves exceptional light-roast coffee; by night, it transforms into a cocktail bar.</p>
      
      <h3>Glitch Coffee & Roasters</h3>
      <p>For those who take their beans seriously, Glitch is the place. They specialize in single-origin light roasts that highlight the unique terroir of each bean. The staff are incredibly knowledgeable and passionate.</p>
    `
  },
  {
    id: '6',
    title: 'Modern Architecture trends 2025',
    description: 'How sustainability and smart technology are shaping the skylines of the future.',
    imageUrl: 'https://images.unsplash.com/photo-1487958449943-2429e8be8625?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=1679&q=80',
    source: 'ArchDaily',
    author: 'Maria Garcia',
    date: 'Nov 19, 2025',
    content: `
      <p>Architecture is evolving. It's no longer just about form and function; it's about integration with the environment and the digital world. As we move towards 2025, several key trends are redefining our built environment.</p>
      
      <h3>Biophilic Design</h3>
      <p>Bringing the outdoors in is more than just a trend; it's a necessity for mental well-being. We are seeing more "living walls," rooftop gardens, and buildings designed to maximize natural light and ventilation.</p>
      
      <h3>Smart Cities</h3>
      <p>Buildings are becoming intelligent. IoT sensors monitor energy usage, occupancy, and air quality in real-time, adjusting systems automatically to optimize efficiency and comfort. The building of the future interacts with its inhabitants.</p>
      
      <h3>Adaptive Reuse</h3>
      <p>Instead of demolishing old structures, architects are finding creative ways to repurpose them. Transforming old factories into loft apartments or warehouses into creative offices preserves history while reducing the carbon footprint of construction.</p>
    `
  }
]
