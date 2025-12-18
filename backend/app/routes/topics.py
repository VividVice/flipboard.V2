from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import Optional, List
from app.schemas.topic import Topic, TopicCreate, TopicBulkFollow
from app.crud import topic as topic_crud
from app.crud import user as user_crud
from app.dependencies import get_current_user

router = APIRouter()

@router.get("/", response_model=List[Topic])
async def get_topics(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    search: Optional[str] = None
):
    topics = await topic_crud.get_topics(skip=skip, limit=limit, search=search)
    return topics

@router.get("/{topic_id}", response_model=Topic)
async def get_topic(topic_id: str):
    topic = await topic_crud.get_topic_by_id(topic_id)
    if not topic:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Topic not found"
        )
    return topic

@router.post("/", response_model=Topic, status_code=status.HTTP_201_CREATED)
async def create_topic(topic_in: TopicCreate):
    existing_topic = await topic_crud.get_topic_by_name(topic_in.name)
    if existing_topic:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Topic with this name already exists"
        )
    topic = await topic_crud.create_topic(topic_in)
    return topic

@router.post("/bulk-follow")
async def bulk_follow_topics(
    input_data: TopicBulkFollow,
    current_user: dict = Depends(get_current_user)
):
    topic_ids = input_data.topic_ids
    if len(topic_ids) < 3:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Minimum 3 topics required"
        )

    for topic_id in topic_ids:
        topic = await topic_crud.get_topic_by_id(topic_id)
        if not topic:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Topic {topic_id} not found"
            )

    await user_crud.update_followed_topics(current_user["id"], topic_ids)

    for topic_id in topic_ids:
        await topic_crud.increment_follower_count(topic_id)

    return {"message": "Topics followed successfully", "followed_topics": topic_ids}

@router.post("/{topic_id}/follow")
async def toggle_follow_topic(
    topic_id: str,
    current_user: dict = Depends(get_current_user)
):
    topic = await topic_crud.get_topic_by_id(topic_id)
    if not topic:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Topic not found"
        )

    user_followed_topics = current_user.get("followed_topics", [])
    is_following = topic_id in user_followed_topics

    if is_following:
        await user_crud.remove_followed_topic(current_user["id"], topic_id)
        await topic_crud.increment_follower_count(topic_id, -1)
        return {"message": "Topic unfollowed", "is_following": False}
    else:
        await user_crud.add_followed_topic(current_user["id"], topic_id)
        await topic_crud.increment_follower_count(topic_id, 1)
        return {"message": "Topic followed", "is_following": True}

@router.get("/me/followed", response_model=List[Topic])
async def get_user_followed_topics(current_user: dict = Depends(get_current_user)):
    followed_topic_ids = current_user.get("followed_topics", [])
    if not followed_topic_ids:
        return []

    topics = await topic_crud.get_topics_by_ids(followed_topic_ids)
    return topics
