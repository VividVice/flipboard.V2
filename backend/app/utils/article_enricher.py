from app.crud import interaction as interaction_crud

async def enrich_article(article, user):
    if not user:
        return article
    
    # Check interaction
    interaction = await interaction_crud.get_interaction(user["id"], article["id"])
    if interaction:
        article["liked"] = interaction.get("is_liked", False)
        article["saved"] = interaction.get("is_saved", False)
    return article

async def enrich_articles(articles, user):
    if not user:
        return articles
    
    ids = [a["id"] for a in articles]
    interactions_map = await interaction_crud.get_user_interactions_for_articles(user["id"], ids)
    
    for a in articles:
        status = interactions_map.get(a["id"], {})
        a["liked"] = status.get("is_liked", False)
        a["saved"] = status.get("is_saved", False)
    return articles
