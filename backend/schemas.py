from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime

class UserBase(BaseModel):
    username: str
    email: EmailStr

class UserCreate(UserBase):
    password: str
    role_name: str = "client"

class UserResponse(UserBase):
    user_id: str
    role_id: int
    created_at: datetime

    class Config:
        from_attributes = True

class TicketBase(BaseModel):
    title: str
    description: Optional[str] = None
    priority_id: int

class TicketCreate(TicketBase):
    pass

class TicketUpdate(BaseModel):
    title: Optional[str] = None
    status_id: Optional[int] = None
    assignee_id: Optional[str] = None

class TicketResponse(TicketBase):
    ticket_id: str
    status_id: int
    creator_id: str
    assignee_id: Optional[str] = None
    created_at: datetime
    due_date: Optional[datetime] = None
    last_activity: Optional[datetime] = None
    last_author: Optional[str] = None

    class Config:
        from_attributes = True

class CommentBase(BaseModel):
    body: str

class CommentCreate(CommentBase):
    ticket_id: str

class CommentResponse(CommentBase):
    comment_id: str
    author_id: str
    author_name: str
    author_role: str
    created_at: datetime

    class Config:
        from_attributes = True

class KnowledgeBaseBase(BaseModel):
    question: str
    answer: str
    category: Optional[str] = None

class KnowledgeBaseCreate(KnowledgeBaseBase):
    pass

class KnowledgeBaseResponse(KnowledgeBaseBase):
    kb_id: int

    class Config:
        from_attributes = True
