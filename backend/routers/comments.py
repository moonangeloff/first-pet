from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
import models, schemas, database
from dependencies import get_current_user

router = APIRouter(prefix="/comments", tags=["comments"])

@router.post("/", response_model=schemas.CommentResponse)
async def create_comment(
    comment_in: schemas.CommentCreate,
    current_user: models.User = Depends(get_current_user),
    db: AsyncSession = Depends(database.get_db)
):
    # Check ticket existence
    ticket_result = await db.execute(select(models.Ticket).where(models.Ticket.ticket_id == comment_in.ticket_id))
    if not ticket_result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Ticket not found")

    new_comment = models.Comment(
        ticket_id=comment_in.ticket_id,
        author_id=current_user.user_id,
        body=comment_in.body
    )
    db.add(new_comment)
    await db.commit()
    await db.refresh(new_comment)
    return new_comment

@router.get("/{ticket_id}", response_model=List[schemas.CommentResponse])
async def read_comments(
    ticket_id: str,
    db: AsyncSession = Depends(database.get_db)
):
    result = await db.execute(
        select(models.Comment, models.User.username, models.Role.name)
        .join(models.User, models.Comment.author_id == models.User.user_id)
        .join(models.Role, models.User.role_id == models.Role.role_id)
        .where(models.Comment.ticket_id == ticket_id)
        .order_by(models.Comment.created_at.asc())
    )
    comments = []
    for row in result.all():
        c, username, role = row
        comments.append({
            "comment_id": c.comment_id,
            "ticket_id": c.ticket_id,
            "author_id": c.author_id,
            "body": c.body,
            "created_at": c.created_at,
            "author_name": username,
            "author_role": role
        })
    return comments
