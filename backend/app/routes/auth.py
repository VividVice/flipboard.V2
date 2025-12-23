from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from app.schemas.user import UserCreate, User
from app.schemas.token import Token
from app.crud import user as user_crud
from app.security import token as security_token
from app.dependencies import get_current_user
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
from app.core.config import settings
from pydantic import BaseModel

class GoogleToken(BaseModel):
    token: str

router = APIRouter()

@router.post("/google", response_model=Token)
async def login_google(token_data: GoogleToken):
    try:
        client_id = settings.GOOGLE_CLIENT_ID
        if not client_id:
            # Fail fast if Google OAuth is not properly configured.
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Google OAuth client ID is not configured on the server.",
            )

        idinfo = id_token.verify_oauth2_token(
            token_data.token,
            google_requests.Request(),
            client_id,
        )

        email = idinfo['email']
        name = idinfo.get('name', '')
        picture = idinfo.get('picture', '')

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid Google token: {str(e)}",
        )

    user = await user_crud.get_user_by_email(email)
    
    if not user:
        base_username = email.split('@')[0]
        username = base_username
        counter = 1
        while await user_crud.get_user_by_username(username):
            username = f"{base_username}{counter}"
            counter += 1
            
        user_data = {
            "email": email,
            "username": username,
            "profile_pic": picture,
            "bio": "Joined via Google",
            "followed_topics": [],
            "newsletter_subscribed": False
        }
        user = await user_crud.create_social_user(user_data)
        
    access_token = security_token.create_access_token(
        data={"sub": user["id"]}
    )
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/signup", response_model=User, status_code=status.HTTP_201_CREATED)
async def signup(user_in: UserCreate):
    db_user_by_email = await user_crud.get_user_by_email(email=user_in.email)
    if db_user_by_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )
    db_user_by_username = await user_crud.get_user_by_username(username=user_in.username)
    if db_user_by_username:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already registered",
        )
    created_user = await user_crud.create_user(user=user_in)
    return created_user

@router.post("/login", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    user = await user_crud.authenticate_user(
        username=form_data.username, password=form_data.password
    )
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token = security_token.create_access_token(
        data={"sub": user["id"]}
    )
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/me", response_model=User)
async def get_current_user_info(current_user: dict = Depends(get_current_user)):
    return current_user
