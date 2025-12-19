from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import List
from app.schemas.comment import Comment, CommentCreate, CommentUpdate, CommentWithUser
from app.crud import comment as comment_crud
from app.crud import article as article_crud
from app.dependencies import get_current_user

router = APIRouter()

@router.get("/articles/{article_id}/comments", response_model=List[CommentWithUser])
async def get_article_comments(
    article_id: str,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100)
):
    article = await article_crud.get_article_by_id(article_id)
    if not article:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Article not found"
        )

    comments = await comment_crud.get_comments_by_article(article_id, skip=skip, limit=limit)
    return comments

@router.get("/users/me/comments", response_model=List[CommentWithUser])
async def get_my_comments(
    current_user: dict = Depends(get_current_user),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100)
):
    comments = await comment_crud.get_comments_by_user(current_user["id"], skip=skip, limit=limit)
    return comments

@router.post("/articles/{article_id}/comments", response_model=CommentWithUser, status_code=status.HTTP_201_CREATED)
async def create_comment(
    article_id: str,
    comment_in: CommentCreate,
    current_user: dict = Depends(get_current_user)
):
    article = await article_crud.get_article_by_id(article_id)
    if not article:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Article not found"
        )

    comment = await comment_crud.create_comment(article_id, current_user["id"], comment_in)

    await article_crud.increment_comment_count(article_id, 1)

    return comment

@router.put("/comments/{comment_id}", response_model=Comment)
async def update_comment(
    comment_id: str,
    comment_in: CommentUpdate,
    current_user: dict = Depends(get_current_user)
):
    comment = await comment_crud.get_comment_by_id(comment_id)
    if not comment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Comment not found"
        )

    if comment["user_id"] != current_user["id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this comment"
        )

    updated_comment = await comment_crud.update_comment(comment_id, comment_in)
    return updated_comment

@router.delete("/comments/{comment_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_comment(
    comment_id: str,
    current_user: dict = Depends(get_current_user)
):
    comment = await comment_crud.get_comment_by_id(comment_id)
    if not comment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Comment not found"
        )

    if comment["user_id"] != current_user["id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this comment"
        )

    await comment_crud.delete_comment(comment_id)

    await article_crud.increment_comment_count(comment["article_id"], -1)

    return None
