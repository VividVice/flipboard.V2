from typing import List

from fastapi import APIRouter, Depends, HTTPException, status

from app.crud import user as user_crud
from app.dependencies import get_current_user
from app.schemas.user import User, UserPublic, UserUpdate
from app.utils.newsletter import process_weekly_newsletter

router = APIRouter()


@router.get("/{username}", response_model=UserPublic)
async def get_user_by_username(username: str):
    user = await user_crud.get_user_by_username(username)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    return user


@router.get("/id/{user_id}", response_model=UserPublic)
async def get_user_by_id(user_id: str):
    user = await user_crud.get_user_by_id(user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    return user


@router.post("/list", response_model=List[UserPublic])
async def get_users_list(user_ids: List[str]):
    users = await user_crud.get_users_by_ids(user_ids)
    return users


@router.post("/{user_id}/follow")
async def follow_user(user_id: str, current_user: dict = Depends(get_current_user)):
    if user_id == current_user["id"]:
        raise HTTPException(status_code=400, detail="You cannot follow yourself")

    target_user = await user_crud.get_user_by_id(user_id)
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")

    await user_crud.follow_user(current_user["id"], user_id)
    return {"message": "Successfully followed user"}


@router.post("/{user_id}/unfollow")
async def unfollow_user(user_id: str, current_user: dict = Depends(get_current_user)):
    target_user = await user_crud.get_user_by_id(user_id)
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")

    await user_crud.unfollow_user(current_user["id"], user_id)
    return {"message": "Successfully unfollowed user"}


@router.post("/newsletter/trigger")
async def trigger_newsletter(current_user: dict = Depends(get_current_user)):
    # In a real app, this should be restricted to admins
    await process_weekly_newsletter()
    return {"message": "Newsletter process triggered"}


@router.put("/me", response_model=User)
async def update_user_me(
    user_update: UserUpdate, current_user: dict = Depends(get_current_user)
):
    update_data = user_update.dict(exclude_unset=True)

    # Ensure new username (if provided) is unique
    if "username" in update_data:
        existing_user = await user_crud.get_user_by_username(update_data["username"])
        if existing_user and existing_user["id"] != current_user["id"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username is already taken",
            )

    success = await user_crud.update_user(current_user["id"], update_data)
    if not success:
        # If nothing was modified, we can still return the current user
        pass

    updated_user = await user_crud.get_user_by_id(current_user["id"])
    return updated_user
