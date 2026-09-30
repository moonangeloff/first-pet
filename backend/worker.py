import asyncio
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime
import models, database

async def monitor_sla():
    while True:
        print("Checking SLA...")
        async with database.AsyncSessionLocal() as session:
            # Find tickets where now > due_date and status is not Resolved/Closed
            now = datetime.utcnow()
            
            # Get terminal status IDs
            status_result = await session.execute(
                select(models.TicketStatus.status_id).where(
                    models.TicketStatus.name.in_(["Resolved", "Closed"])
                )
            )
            terminal_ids = [r for r in status_result.scalars().all()]
            
            # Get Critical priority ID
            priority_result = await session.execute(
                select(models.TicketPriority.priority_id).where(
                    models.TicketPriority.name == "Critical"
                )
            )
            critical_id = priority_result.scalar_one()

            # Update overdue tickets
            await session.execute(
                update(models.Ticket)
                .where(
                    models.Ticket.due_date < now,
                    models.Ticket.status_id.notin_(terminal_ids),
                    models.Ticket.priority_id != critical_id
                )
                .values(priority_id=critical_id)
            )
            await session.commit()
            
        await asyncio.sleep(60) # Check every minute

def start_sla_worker():
    asyncio.create_task(monitor_sla())
