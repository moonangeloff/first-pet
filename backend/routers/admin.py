from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import List

import models, schemas, database
from dependencies import get_current_user

router = APIRouter(prefix="/admin", tags=["admin"])

async def check_admin(current_user: models.User = Depends(get_current_user), db: AsyncSession = Depends(database.get_db)):
    result = await db.execute(select(models.Role).where(models.Role.role_id == current_user.role_id))
    role = result.scalar_one()
    if role.name != "admin":
        raise HTTPException(status_code=403, detail="Только администраторы имеют доступ к этому ресурсу")
    return current_user

@router.get("/users", response_model=List[schemas.UserResponse])
async def list_users(
    admin: models.User = Depends(check_admin),
    db: AsyncSession = Depends(database.get_db)
):
    result = await db.execute(select(models.User))
    return result.scalars().all()

@router.patch("/users/{user_id}/role")
async def update_user_role(
    user_id: str,
    role_name: str,
    admin: models.User = Depends(check_admin),
    db: AsyncSession = Depends(database.get_db)
):
    user_result = await db.execute(select(models.User).where(models.User.user_id == user_id))
    user = user_result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
    
    role_result = await db.execute(select(models.Role).where(models.Role.name == role_name))
    role = role_result.scalar_one_or_none()
    if not role:
        raise HTTPException(status_code=400, detail="Неверное имя роли")
    
    user.role_id = role.role_id
    await db.commit()
    return {"message": "Роль пользователя успешно обновлена"}

@router.get("/roles")
async def list_roles(
    admin: models.User = Depends(check_admin),
    db: AsyncSession = Depends(database.get_db)
):
    result = await db.execute(select(models.Role))
    return result.scalars().all()

@router.get("/kb", response_model=List[schemas.KnowledgeBaseResponse])
async def list_kb(
    admin: models.User = Depends(check_admin),
    db: AsyncSession = Depends(database.get_db)
):
    result = await db.execute(select(models.KnowledgeBase))
    return result.scalars().all()

@router.post("/kb", response_model=schemas.KnowledgeBaseResponse)
async def create_kb_entry(
    kb_in: schemas.KnowledgeBaseCreate,
    admin: models.User = Depends(check_admin),
    db: AsyncSession = Depends(database.get_db)
):
    new_entry = models.KnowledgeBase(**kb_in.dict())
    db.add(new_entry)
    await db.commit()
    await db.refresh(new_entry)
    return new_entry

@router.delete("/kb/{kb_id}")
async def delete_kb_entry(
    kb_id: int,
    admin: models.User = Depends(check_admin),
    db: AsyncSession = Depends(database.get_db)
):
    result = await db.execute(select(models.KnowledgeBase).where(models.KnowledgeBase.kb_id == kb_id))
    entry = result.scalar_one_or_none()
    if not entry:
        raise HTTPException(status_code=404, detail="Запись не найдена")
    await db.delete(entry)
    await db.commit()
    return {"message": "Запись БЗ удалена"}

@router.get("/analytics")
async def get_analytics(
    admin: models.User = Depends(check_admin),
    db: AsyncSession = Depends(database.get_db)
):
    # Total counts
    total_tickets = await db.execute(func.count(models.Ticket.ticket_id))
    total_users = await db.execute(func.count(models.User.user_id))
    
    # Status distribution
    status_query = select(models.TicketStatus.name, func.count(models.Ticket.ticket_id)).join(models.Ticket).group_by(models.TicketStatus.name)
    status_dist = await db.execute(status_query)
    
    # Priority distribution
    priority_query = select(models.TicketPriority.name, func.count(models.Ticket.ticket_id)).join(models.Ticket).group_by(models.TicketPriority.name)
    priority_dist = await db.execute(priority_query)
    
    return {
        "total_tickets": total_tickets.scalar(),
        "total_users": total_users.scalar(),
        "status_distribution": dict(status_dist.all()),
        "priority_distribution": dict(priority_dist.all())
    }
