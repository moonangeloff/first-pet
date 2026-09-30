import httpx
import asyncio
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
import models, database

OLLAMA_URL = "http://localhost:11434/api/generate"
MODEL_NAME = "qwen3.6" # or "mistral"

async def get_ai_response(prompt: str):
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                OLLAMA_URL,
                json={
                    "model": MODEL_NAME,
                    "prompt": f"You are a helpful customer support agent. Answer this request: {prompt}",
                    "stream": False
                },
                timeout=30.0
            )
            if response.status_code == 200:
                return response.json().get("response")
    except Exception as e:
        print(f"AI Error: {e}")
    return None

async def process_with_ai(ticket_id: str):
    print(f"ИИ обрабатывает тикет {ticket_id}...")
    async with database.AsyncSessionLocal() as session:
        # Get ticket
        result = await session.execute(select(models.Ticket).where(models.Ticket.ticket_id == ticket_id))
        ticket = result.scalar_one_or_none()
        if not ticket:
            return

        # 1. Search Knowledge Base with slightly better matching
        # In a real app we would use vector search, here we use keywords
        search_query = f"%{ticket.title}%"
        kb_result = await session.execute(
            select(models.KnowledgeBase).where(
                (models.KnowledgeBase.question.ilike(search_query))
            )
        )
        kb_entries = kb_result.scalars().all()
        
        response_body = ""
        # Only use KB if there's a strong match in the title
        if kb_entries:
            response_body = f"Ассистент ИИ (База Знаний): {kb_entries[0].answer}"
        else:
            # 2. Use LLM for more complex or unmatched queries
            system_instruction = (
                "Вы — интеллектуальный агент поддержки 'ClientServicePro'. "
                "Ваша задача: помогать пользователям с техническими проблемами. "
                "Если вопрос не касается ИТ-поддержки (настройка ПО, ошибки сайта, доступ), вежливо откажите. "
                "Отвечайте четко, профессионально и только на русском языке. "
                "Если вы не знаете точного ответа, предложите подождать оператора."
            )
            prompt = f"Тема: {ticket.title}\nОписание: {ticket.description}"
            llm_response = await get_ai_response(f"{system_instruction}\n\nЗапрос:\n{prompt}")
            
            if llm_response:
                response_body = f"Виртуальный ассистент ИИ: {llm_response}"
            else:
                return # Don't comment if LLM failed and no KB match

        if response_body:
            # Find/Create AI bot user
            user_result = await session.execute(select(models.User).where(models.User.username == "ai_bot"))
            ai_user = user_result.scalar_one_or_none()
            
            if not ai_user:
                role_result = await session.execute(select(models.Role).where(models.Role.name == "agent"))
                role = role_result.scalar_one()
                ai_user = models.User(
                    username="ai_bot",
                    email="ai@servicepro.ru",
                    password_hash="ai_secure_hash_v1",
                    role_id=role.role_id
                )
                session.add(ai_user)
                await session.flush()

            # Check if AI already commented to avoid duplication
            existing_comment = await session.execute(
                select(models.Comment).where(
                    models.Comment.ticket_id == ticket.ticket_id,
                    models.Comment.author_id == ai_user.user_id
                )
            )
            if existing_comment.scalar_one_or_none():
                print(f"ИИ уже ответил на тикет {ticket_id}, пропускаем.")
                return

            new_comment = models.Comment(
                ticket_id=ticket.ticket_id,
                author_id=ai_user.user_id,
                body=response_body
            )
            session.add(new_comment)
            await session.commit()
            print(f"ИИ успешно ответил на тикет {ticket_id}")
