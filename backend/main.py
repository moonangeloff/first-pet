from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import timedelta

from fastapi.middleware.cors import CORSMiddleware
import models, schemas, auth, database
from routers import tickets, comments, admin
import worker
from dependencies import get_current_user

app = FastAPI(title="HelpDesk API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_event():
    worker.start_sla_worker()

app.include_router(tickets.router)
app.include_router(comments.router)
app.include_router(admin.router)

@app.get("/")
async def root():
    return {"message": "HelpDesk API is running"}

@app.post("/register", response_model=schemas.UserResponse)
async def register(user_in: schemas.UserCreate, db: AsyncSession = Depends(database.get_db)):
    # Check if user exists
    result = await db.execute(select(models.User).where(models.User.username == user_in.username.lower()))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Username already registered")
    
    # Get role
    role_result = await db.execute(select(models.Role).where(models.Role.name == user_in.role_name))
    role = role_result.scalar_one_or_none()
    if not role:
        raise HTTPException(status_code=400, detail="Invalid role")
    
    hashed_password = auth.get_password_hash(user_in.password)
    new_user = models.User(
        username=user_in.username.lower(),
        email=user_in.email,
        password_hash=hashed_password,
        role_id=role.role_id
    )
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)
    return new_user

@app.post("/token", response_model=auth.Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: AsyncSession = Depends(database.get_db)):
    result = await db.execute(select(models.User).where(models.User.username == form_data.username.lower()))
    user = result.scalar_one_or_none()
    if not user or not auth.verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Get role name for token
    role_result = await db.execute(select(models.Role).where(models.Role.role_id == user.role_id))
    role = role_result.scalar_one()
    
    access_token_expires = timedelta(minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = auth.create_access_token(
        data={"sub": user.username, "role": role.name}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/users/me", response_model=schemas.UserResponse)
async def read_users_me(current_user: models.User = Depends(get_current_user)):
    return current_user
