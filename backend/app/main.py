from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routes import (
    articles,
    auth,
    comments,
    interactions,
    magazines,
    news,
    topics,
    users,
)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(users.router, prefix="/users", tags=["users"])
app.include_router(topics.router, prefix="/topics", tags=["topics"])
app.include_router(articles.router, prefix="/articles", tags=["articles"])
app.include_router(comments.router, tags=["comments"])
app.include_router(interactions.router, tags=["interactions"])
app.include_router(news.router, prefix="/news", tags=["news"])
app.include_router(magazines.router, prefix="/magazines", tags=["magazines"])


@app.get("/")
def read_root():
    return {"Hello": "World"}
