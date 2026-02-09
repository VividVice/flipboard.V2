from typing import List

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.crud import notification as crud_notification
from app.dependencies import get_current_user
from app.schemas.notification import Notification, NotificationUpdate

router = APIRouter()


@router.get("/", response_model=List[Notification])
async def get_notifications(
    current_user: dict = Depends(get_current_user),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    read: bool = Query(None, description="Filter by read status"),
):
    notifications = await crud_notification.get_notifications_for_user(
        user_id=current_user["id"], skip=skip, limit=limit, read=read
    )
    return notifications


@router.get("/count", response_model=int)
async def get_unread_notifications_count(
    current_user: dict = Depends(get_current_user),
):
    count = await crud_notification.get_unread_notifications_count(
        user_id=current_user["id"]
    )
    return count


@router.put("/{notification_id}", response_model=Notification)
async def update_notification(
    notification_id: str,
    notification_update: NotificationUpdate,
    current_user: dict = Depends(get_current_user),
):
    notification = await crud_notification.mark_notification_as_read(
        notification_id=notification_id, user_id=current_user["id"]
    )
    if not notification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found or not authorized",
        )
    # Return the updated notification (or fetch it to confirm)
    updated_notification = (
        await crud_notification.db.notifications.find_one({"id": notification_id})
    )
    return updated_notification


@router.post("/mark_all_read")
async def mark_all_notifications_as_read(
    current_user: dict = Depends(get_current_user),
):
    modified_count = await crud_notification.mark_all_notifications_as_read(
        user_id=current_user["id"]
    )
    return {"message": f"Marked {modified_count} notifications as read"}
