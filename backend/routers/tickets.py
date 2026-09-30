from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc
from typing import List
from datetime import datetime, timedelta

import models, schemas, database, ai_agent
from dependencies import get_current_user

router = APIRouter(prefix="/tickets", tags=["tickets"])

@router.post("/", response_model=schemas.TicketResponse)
async def create_ticket(
    ticket_in: schemas.TicketCreate,
    background_tasks: BackgroundTasks,
    current_user: models.User = Depends(get_current_user),
    db: AsyncSession = Depends(database.get_db)
):
    status_result = await db.execute(select(models.TicketStatus).where(models.TicketStatus.name == "New"))
    new_status = status_result.scalar_one()
    
    priority_result = await db.execute(select(models.TicketPriority).where(models.TicketPriority.priority_id == ticket_in.priority_id))
    priority = priority_result.scalar_one_or_none()
    if not priority:
        raise HTTPException(status_code=400, detail="Неверный приоритет")
    
    due_date = datetime.utcnow() + timedelta(hours=priority.sla_duration_hours)
    
    new_ticket = models.Ticket(
        title=ticket_in.title,
        description=ticket_in.description,
        status_id=new_status.status_id,
        priority_id=ticket_in.priority_id,
        creator_id=current_user.user_id,
        due_date=due_date
    )
    db.add(new_ticket)
    await db.commit()
    await db.refresh(new_ticket)
    
    background_tasks.add_task(ai_agent.process_with_ai, new_ticket.ticket_id)
    return new_ticket

@router.get("/", response_model=List[schemas.TicketResponse])
async def read_tickets(
    current_user: models.User = Depends(get_current_user),
    db: AsyncSession = Depends(database.get_db)
):
    # Base query
    query = select(models.Ticket)
    
    role_result = await db.execute(select(models.Role).where(models.Role.role_id == current_user.role_id))
    role = role_result.scalar_one()
    
    if role.name == "client":
        query = query.where(models.Ticket.creator_id == current_user.user_id)
    
    result = await db.execute(query.order_by(desc(models.Ticket.created_at)))
    tickets = result.scalars().all()
    
    response = []
    for t in tickets:
        # Get last comment info
        comment_query = (
            select(models.Comment, models.User.username)
            .join(models.User, models.Comment.author_id == models.User.user_id)
            .where(models.Comment.ticket_id == t.ticket_id)
            .order_by(desc(models.Comment.created_at))
            .limit(1)
        )
        last_comment_res = await db.execute(comment_query)
        last_comment_data = last_comment_res.first()
        
        last_activity = t.created_at
        last_author = "Система"
        if last_comment_data:
            last_activity = last_comment_data[0].created_at
            last_author = last_comment_data[1]
            
        t_dict = schemas.TicketResponse.from_orm(t).dict()
        t_dict["last_activity"] = last_activity
        t_dict["last_author"] = last_author
        response.append(t_dict)
        
    return response

@router.post("/{ticket_id}/ai-help")
async def trigger_ai_help(
    ticket_id: str,
    background_tasks: BackgroundTasks,
    current_user: models.User = Depends(get_current_user)
):
    background_tasks.add_task(ai_agent.process_with_ai, ticket_id)
    return {"message": "Обработка ИИ запущена"}

@router.delete("/{ticket_id}")
async def delete_ticket(
    ticket_id: str,
    current_user: models.User = Depends(get_current_user),
    db: AsyncSession = Depends(database.get_db)
):
    role_result = await db.execute(select(models.Role).where(models.Role.role_id == current_user.role_id))
    role = role_result.scalar_one()
    if role.name not in ["agent", "admin"]:
        raise HTTPException(status_code=403, detail="Недостаточно прав для удаления тикета")

    result = await db.execute(select(models.Ticket).where(models.Ticket.ticket_id == ticket_id))
    ticket = result.scalar_one_or_none()
    if not ticket:
        raise HTTPException(status_code=404, detail="Тикет не найден")

    await db.delete(ticket)
    await db.commit()
    return {"message": "Тикет удален"}

@router.patch("/{ticket_id}", response_model=schemas.TicketResponse)
async def update_ticket(
    ticket_id: str,
    ticket_update: schemas.TicketUpdate,
    current_user: models.User = Depends(get_current_user),
    db: AsyncSession = Depends(database.get_db)
):
    role_result = await db.execute(select(models.Role).where(models.Role.role_id == current_user.role_id))
    role = role_result.scalar_one()
    
    result = await db.execute(select(models.Ticket).where(models.Ticket.ticket_id == ticket_id))
    ticket = result.scalar_one_or_none()
    if not ticket:
        raise HTTPException(status_code=404, detail="Тикет не найден")
    
    if role.name not in ["agent", "admin"] and ticket.creator_id != current_user.user_id:
        raise HTTPException(status_code=403, detail="Недостаточно прав для обновления этого тикета")

    if ticket_update.status_id is not None:
        # Allow client to CLOSE their own ticket, but nothing else
        if role.name == "client":
            if ticket_update.status_id != 5:
                raise HTTPException(status_code=403, detail="Клиенты могут только закрывать свои тикеты")
        elif role.name not in ["agent", "admin"]:
            raise HTTPException(status_code=403, detail="Только агенты/админы могут менять статус")
            
        ticket.status_id = ticket_update.status_id
    
    if ticket_update.title is not None:
        ticket.title = ticket_update.title
        
    if ticket_update.assignee_id is not None:
        if role.name not in ["agent", "admin"]:
            raise HTTPException(status_code=403, detail="Только агенты/админы могут назначать тикеты")
        ticket.assignee_id = ticket_update.assignee_id

    await db.commit()
    await db.refresh(ticket)
    return ticket
