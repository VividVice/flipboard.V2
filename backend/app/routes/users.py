from fastapi import APIRouter, Depends, HTTPException, status
from app.schemas.user import User, UserUpdate
from app.crud import user as user_crud
from app.dependencies import get_current_user
from app.utils.newsletter import process_weekly_newsletter

router = APIRouter()

@router.post("/newsletter/trigger")
async def trigger_newsletter(current_user: dict = Depends(get_current_user)):
    # In a real app, this should be restricted to admins
    await process_weekly_newsletter()
    return {"message": "Newsletter process triggered"}

@router.put("/me", response_model=User)
async def update_user_me(
    user_update: UserUpdate,
    current_user: dict = Depends(get_current_user)
):
    # Convert to dict and ensure all objects (like HttpUrl) are converted to serializable types
    update_data = user_update.dict(exclude_unset=True)
    
    # Manually convert HttpUrl to string if present
    if "profile_pic" in update_data and update_data["profile_pic"]:
        update_data["profile_pic"] = str(update_data["profile_pic"])
        
    success = await user_crud.update_user(current_user["id"], update_data)
    if not success:
        # If nothing was modified, we can still return the current user
        pass
    
    updated_user = await user_crud.get_user_by_id(current_user["id"])
    return updated_user
