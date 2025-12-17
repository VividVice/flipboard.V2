import asyncio
import sys
from pathlib import Path

sys.path.append(str(Path(__file__).parent.parent))

from app.db.database import db
from app.security.password import get_password_hash
from datetime import datetime, timedelta
import uuid
import random

TOPICS_FR = [
    {"name": "Actualités", "description": "Les dernières nouvelles", "icon": "📰"},
    {"name": "Technologie", "description": "Innovation et tech", "icon": "💻"},
    {"name": "Science", "description": "Découvertes scientifiques", "icon": "🔬"},
    {"name": "Sport", "description": "Actualités sportives", "icon": "⚽"},
    {"name": "Culture", "description": "Arts et culture", "icon": "🎭"},
    {"name": "Économie", "description": "Business et finance", "icon": "💼"},
    {"name": "Santé", "description": "Santé et bien-être", "icon": "🏥"},
    {"name": "Environnement", "description": "Écologie et climat", "icon": "🌍"},
    {"name": "Politique", "description": "Actualité politique", "icon": "🏛️"},
    {"name": "Gastronomie", "description": "Cuisine et restaurants", "icon": "🍽️"},
    {"name": "Voyage", "description": "Tourisme et destinations", "icon": "✈️"},
    {"name": "Mode", "description": "Tendances et style", "icon": "👗"},
    {"name": "Automobile", "description": "Voitures et mobilité", "icon": "🚗"},
    {"name": "Immobilier", "description": "Marché immobilier", "icon": "🏠"},
    {"name": "Éducation", "description": "Enseignement et formation", "icon": "📚"},
    {"name": "Musique", "description": "Actualité musicale", "icon": "🎵"},
    {"name": "Cinéma", "description": "Films et séries", "icon": "🎬"},
    {"name": "Jeux vidéo", "description": "Gaming et esports", "icon": "🎮"},
    {"name": "Livres", "description": "Littérature et lecture", "icon": "📖"},
    {"name": "Photographie", "description": "Art photographique", "icon": "📷"},
    {"name": "Design", "description": "Design et créativité", "icon": "🎨"},
    {"name": "Architecture", "description": "Architecture moderne", "icon": "🏗️"},
    {"name": "Intelligence Artificielle", "description": "IA et machine learning", "icon": "🤖"},
    {"name": "Cryptomonnaie", "description": "Bitcoin et blockchain", "icon": "💰"},
    {"name": "Startups", "description": "Entrepreneuriat", "icon": "🚀"},
    {"name": "Marketing", "description": "Stratégies marketing", "icon": "📊"},
    {"name": "Réseaux sociaux", "description": "Social media", "icon": "📱"},
    {"name": "Cybersécurité", "description": "Sécurité informatique", "icon": "🔒"},
    {"name": "Espace", "description": "Exploration spatiale", "icon": "🚀"},
    {"name": "Histoire", "description": "Événements historiques", "icon": "📜"},
]

ARTICLES_FR = [
    {
        "title": "L'intelligence artificielle transforme le monde du travail",
        "excerpt": "Les entreprises françaises adoptent massivement l'IA pour automatiser leurs processus",
        "content": "Une révolution silencieuse est en cours dans le monde professionnel. L'intelligence artificielle, autrefois réservée aux géants de la tech, se démocratise rapidement dans les PME françaises. Cette transformation promet d'augmenter la productivité de 40% dans les cinq prochaines années.",
        "author": "Marie Dubois",
        "publisher": "Le Monde",
        "topics": ["Intelligence Artificielle", "Technologie", "Économie"],
        "image_url": "https://images.unsplash.com/photo-1677442136019-21780ecad995"
    },
    {
        "title": "Paris accueillera les Jeux Olympiques 2024",
        "excerpt": "La capitale française se prépare pour le plus grand événement sportif mondial",
        "content": "À quelques mois de l'ouverture, Paris finalise les préparatifs pour accueillir des millions de visiteurs. Les infrastructures sont prêtes et la ville s'apprête à offrir un spectacle inoubliable.",
        "author": "Jean Martin",
        "publisher": "L'Équipe",
        "topics": ["Sport", "Actualités"],
        "image_url": "https://images.unsplash.com/photo-1461896836934-ffe607ba8211"
    },
    {
        "title": "Découverte majeure en physique quantique",
        "excerpt": "Des chercheurs français percent les secrets de l'intrication quantique",
        "content": "Une équipe du CNRS vient de publier des résultats révolutionnaires sur l'intrication quantique. Cette découverte pourrait révolutionner l'informatique et les télécommunications dans les décennies à venir.",
        "author": "Sophie Laurent",
        "publisher": "Sciences et Avenir",
        "topics": ["Science", "Technologie"],
        "image_url": "https://images.unsplash.com/photo-1635070041078-e363dbe005cb"
    },
    {
        "title": "Le marché immobilier parisien en hausse",
        "excerpt": "Les prix de l'immobilier continuent leur ascension dans la capitale",
        "content": "Malgré les incertitudes économiques, le marché immobilier parisien reste dynamique. Les prix au mètre carré ont augmenté de 5% cette année, avec une demande toujours soutenue.",
        "author": "Pierre Renard",
        "publisher": "Les Échos",
        "topics": ["Immobilier", "Économie"],
        "image_url": "https://images.unsplash.com/photo-1560518883-ce09059eeffa"
    },
    {
        "title": "La cuisine végétale conquiert les restaurants français",
        "excerpt": "De plus en plus de chefs étoilés adoptent une approche végétale",
        "content": "La tendance est claire : les grands chefs français intègrent de plus en plus de plats végétariens et végans à leurs menus. Cette évolution reflète une demande croissante des consommateurs pour une alimentation plus durable.",
        "author": "Émilie Bernard",
        "publisher": "Le Figaro",
        "topics": ["Gastronomie", "Environnement"],
        "image_url": "https://images.unsplash.com/photo-1546069901-ba9599a7e63c"
    },
    {
        "title": "Tesla ouvre une nouvelle usine en France",
        "excerpt": "Le géant américain investit massivement dans l'Hexagone",
        "content": "Tesla annonce la construction d'une gigafactory près de Lyon. Cette usine créera 5000 emplois et produira des batteries pour véhicules électriques destinées au marché européen.",
        "author": "Thomas Leroy",
        "publisher": "TechCrunch France",
        "topics": ["Automobile", "Technologie", "Économie"],
        "image_url": "https://images.unsplash.com/photo-1560958089-b8a1929cea89"
    },
    {
        "title": "Le changement climatique accélère en Europe",
        "excerpt": "Les scientifiques alertent sur une hausse des températures plus rapide que prévu",
        "content": "Un nouveau rapport du GIEC révèle que l'Europe se réchauffe deux fois plus vite que la moyenne mondiale. Les experts appellent à des actions urgentes pour limiter les dégâts.",
        "author": "Claire Moreau",
        "publisher": "Libération",
        "topics": ["Environnement", "Science", "Actualités"],
        "image_url": "https://images.unsplash.com/photo-1569163139394-de4798aa62b6"
    },
    {
        "title": "La France leader européen de la cybersécurité",
        "excerpt": "Les entreprises françaises de cyber défense en pleine croissance",
        "content": "Le secteur de la cybersécurité français connaît une croissance exceptionnelle. Avec plus de 500 entreprises spécialisées, la France s'impose comme un acteur majeur de la protection des données en Europe.",
        "author": "Alexandre Petit",
        "publisher": "01net",
        "topics": ["Cybersécurité", "Technologie", "Économie"],
        "image_url": "https://images.unsplash.com/photo-1550751827-4bd374c3f58b"
    },
    {
        "title": "Record historique pour le bitcoin",
        "excerpt": "La cryptomonnaie atteint de nouveaux sommets",
        "content": "Le bitcoin franchit la barre symbolique des 100 000 dollars. Les investisseurs institutionnels continuent d'affluer vers les cryptomonnaies, alimentant cette hausse spectaculaire.",
        "author": "Julien Blanc",
        "publisher": "La Tribune",
        "topics": ["Cryptomonnaie", "Économie", "Technologie"],
        "image_url": "https://images.unsplash.com/photo-1621761191319-c6fb62004040"
    },
    {
        "title": "Le Louvre lance sa collection NFT",
        "excerpt": "Le musée parisien entre dans l'ère du numérique",
        "content": "Le Louvre annonce la création de NFTs représentant ses œuvres les plus célèbres. Cette initiative vise à démocratiser l'accès à l'art et à créer de nouvelles sources de revenus pour le musée.",
        "author": "Isabelle Roux",
        "publisher": "Le Monde",
        "topics": ["Culture", "Technologie", "Art"],
        "image_url": "https://images.unsplash.com/photo-1499781350541-7783f6c6a0c8"
    },
    {
        "title": "La 5G couvre désormais 80% du territoire français",
        "excerpt": "Les opérateurs télécoms accélèrent le déploiement",
        "content": "Orange, SFR, Bouygues et Free ont intensifié le déploiement de la 5G. Cette nouvelle technologie promet des débits 10 fois supérieurs à la 4G et ouvre la voie aux objets connectés.",
        "author": "Marc Durand",
        "publisher": "Les Numériques",
        "topics": ["Technologie", "Réseaux sociaux"],
        "image_url": "https://images.unsplash.com/photo-1528747045269-390fe33c19f2"
    },
    {
        "title": "Les startups françaises lèvent 14 milliards d'euros",
        "excerpt": "Année record pour l'écosystème entrepreneurial français",
        "content": "2024 marque une année exceptionnelle pour les startups françaises. Les levées de fonds explosent, portées par l'attractivité de la French Tech et les mesures gouvernementales favorables.",
        "author": "Nathalie Girard",
        "publisher": "Maddyness",
        "topics": ["Startups", "Économie", "Technologie"],
        "image_url": "https://images.unsplash.com/photo-1559136555-9303baea8ebd"
    },
    {
        "title": "Découverte d'une exoplanète habitable",
        "excerpt": "Des astronomes détectent une planète potentiellement habitable à 40 années-lumière",
        "content": "Une équipe internationale d'astronomes annonce la découverte d'une exoplanète dans la zone habitable de son étoile. Cette découverte relance l'espoir de trouver une vie extraterrestre.",
        "author": "Vincent Lefevre",
        "publisher": "Sciences et Avenir",
        "topics": ["Espace", "Science"],
        "image_url": "https://images.unsplash.com/photo-1614732414444-096e5f1122d5"
    },
    {
        "title": "Le streaming musical génère 15 milliards d'euros",
        "excerpt": "L'industrie musicale en pleine révolution numérique",
        "content": "Spotify, Deezer et Apple Music dominent le marché du streaming musical. Les revenus explosent tandis que les artistes réclament une meilleure rémunération de leur travail.",
        "author": "Laura Martin",
        "publisher": "Rolling Stone France",
        "topics": ["Musique", "Technologie", "Économie"],
        "image_url": "https://images.unsplash.com/photo-1511379938547-c1f69419868d"
    },
    {
        "title": "Netflix annonce 50 nouveaux films français",
        "excerpt": "La plateforme investit massivement dans le cinéma français",
        "content": "Netflix renforce sa présence en France avec un investissement de 200 millions d'euros dans la production de films et séries françaises. Une aubaine pour les créateurs locaux.",
        "author": "Paul Rousseau",
        "publisher": "Première",
        "topics": ["Cinéma", "Culture", "Technologie"],
        "image_url": "https://images.unsplash.com/photo-1574267432553-4b4628081c31"
    },
]

SAMPLE_USERS = [
    {
        "username": "marie_paris",
        "email": "marie@example.com",
        "password": "password123",
        "bio": "Passionnée de technologie et d'innovation",
        "profile_pic": "https://i.pravatar.cc/150?img=1"
    },
    {
        "username": "jean_lyon",
        "email": "jean@example.com",
        "password": "password123",
        "bio": "Amateur de sport et de culture",
        "profile_pic": "https://i.pravatar.cc/150?img=2"
    },
    {
        "username": "sophie_marseille",
        "email": "sophie@example.com",
        "password": "password123",
        "bio": "Journaliste freelance",
        "profile_pic": "https://i.pravatar.cc/150?img=3"
    },
    {
        "username": "pierre_toulouse",
        "email": "pierre@example.com",
        "password": "password123",
        "bio": "Développeur et entrepreneur",
        "profile_pic": "https://i.pravatar.cc/150?img=4"
    },
    {
        "username": "claire_nice",
        "email": "claire@example.com",
        "password": "password123",
        "bio": "Chef de projet digital",
        "profile_pic": "https://i.pravatar.cc/150?img=5"
    },
]

SAMPLE_COMMENTS = [
    "Excellent article, très informatif !",
    "Je ne suis pas d'accord avec cette analyse.",
    "Merci pour ces informations précieuses.",
    "Très intéressant, j'attends la suite avec impatience.",
    "Cela mérite d'être partagé largement.",
    "Perspective unique sur le sujet.",
    "Bien écrit et bien documenté.",
    "Je pense qu'il manque certains aspects importants.",
    "Bravo pour ce travail de recherche !",
    "Article qui fait réfléchir.",
]

async def clear_database():
    print("🗑️  Clearing existing data...")
    await db.topics.delete_many({})
    await db.articles.delete_many({})
    await db.users.delete_many({})
    await db.comments.delete_many({})
    await db.user_interactions.delete_many({})
    print("✅ Database cleared")

async def seed_topics():
    print("🌱 Seeding topics...")
    topics = []
    for topic_data in TOPICS_FR:
        topic = {
            "id": str(uuid.uuid4()),
            "name": topic_data["name"],
            "description": topic_data["description"],
            "icon": topic_data["icon"],
            "follower_count": random.randint(100, 10000),
            "created_at": datetime.utcnow()
        }
        topics.append(topic)

    await db.topics.insert_many(topics)
    print(f"✅ Created {len(topics)} topics")
    return topics

async def seed_users():
    print("🌱 Seeding users...")
    users = []
    for user_data in SAMPLE_USERS:
        user = {
            "id": str(uuid.uuid4()),
            "username": user_data["username"],
            "email": user_data["email"],
            "hashed_password": get_password_hash(user_data["password"][:72]),
            "bio": user_data["bio"],
            "profile_pic": user_data["profile_pic"],
            "followed_topics": [],
            "created_at": datetime.utcnow()
        }
        users.append(user)

    await db.users.insert_many(users)
    print(f"✅ Created {len(users)} users")
    return users

async def seed_articles(topics):
    print("🌱 Seeding articles...")
    topic_map = {topic["name"]: topic["id"] for topic in topics}
    articles = []

    for i, article_data in enumerate(ARTICLES_FR):
        topic_ids = [topic_map[topic_name] for topic_name in article_data["topics"] if topic_name in topic_map]

        days_ago = i * 3
        published_at = datetime.utcnow() - timedelta(days=days_ago)

        article = {
            "id": str(uuid.uuid4()),
            "title": article_data["title"],
            "excerpt": article_data["excerpt"],
            "content": article_data["content"],
            "author": article_data["author"],
            "publisher": article_data["publisher"],
            "source_url": f"https://example.com/article-{i+1}",
            "image_url": article_data.get("image_url"),
            "published_at": published_at,
            "topics": topic_ids,
            "view_count": random.randint(100, 10000),
            "like_count": random.randint(10, 500),
            "comment_count": random.randint(0, 50),
            "created_at": datetime.utcnow()
        }
        articles.append(article)

    await db.articles.insert_many(articles)
    print(f"✅ Created {len(articles)} articles")
    return articles

async def seed_comments(users, articles):
    print("🌱 Seeding comments...")
    comments = []

    for _ in range(30):
        user = random.choice(users)
        article = random.choice(articles)
        comment_text = random.choice(SAMPLE_COMMENTS)

        comment = {
            "id": str(uuid.uuid4()),
            "article_id": article["id"],
            "user_id": user["id"],
            "content": comment_text,
            "created_at": datetime.utcnow() - timedelta(days=random.randint(0, 30)),
            "updated_at": None
        }
        comments.append(comment)

    await db.comments.insert_many(comments)
    print(f"✅ Created {len(comments)} comments")
    return comments

async def seed_interactions(users, articles):
    print("🌱 Seeding user interactions...")
    interactions = []

    for user in users:
        num_likes = random.randint(3, 10)
        num_saves = random.randint(2, 8)

        liked_articles = random.sample(articles, num_likes)
        saved_articles = random.sample(articles, num_saves)

        for article in liked_articles:
            interaction = {
                "id": str(uuid.uuid4()),
                "user_id": user["id"],
                "article_id": article["id"],
                "is_liked": True,
                "is_saved": article in saved_articles,
                "liked_at": datetime.utcnow() - timedelta(days=random.randint(0, 30)),
                "saved_at": datetime.utcnow() - timedelta(days=random.randint(0, 30)) if article in saved_articles else None
            }
            interactions.append(interaction)

        for article in saved_articles:
            if article not in liked_articles:
                interaction = {
                    "id": str(uuid.uuid4()),
                    "user_id": user["id"],
                    "article_id": article["id"],
                    "is_liked": False,
                    "is_saved": True,
                    "liked_at": None,
                    "saved_at": datetime.utcnow() - timedelta(days=random.randint(0, 30))
                }
                interactions.append(interaction)

    await db.user_interactions.insert_many(interactions)
    print(f"✅ Created {len(interactions)} user interactions")

async def assign_topics_to_users(users, topics):
    print("🌱 Assigning topics to users...")

    for user in users:
        num_topics = random.randint(3, 8)
        selected_topics = random.sample(topics, num_topics)
        topic_ids = [topic["id"] for topic in selected_topics]

        await db.users.update_one(
            {"id": user["id"]},
            {"$set": {"followed_topics": topic_ids}}
        )

    print(f"✅ Assigned topics to {len(users)} users")

async def main():
    print("🚀 Starting database seeding...")
    print("=" * 50)

    await clear_database()

    topics = await seed_topics()
    users = await seed_users()
    articles = await seed_articles(topics)
    await seed_comments(users, articles)
    await seed_interactions(users, articles)
    await assign_topics_to_users(users, topics)

    print("=" * 50)
    print("✅ Database seeding completed successfully!")
    print(f"\n📊 Summary:")
    print(f"  - Topics: {len(topics)}")
    print(f"  - Users: {len(users)}")
    print(f"  - Articles: {len(articles)}")
    print(f"  - Comments: 30")
    print(f"  - Interactions: ~{len(users) * 10}")
    print(f"\n🔑 Test user credentials:")
    print(f"  Email: marie@example.com")
    print(f"  Password: password123")

if __name__ == "__main__":
    asyncio.run(main())
