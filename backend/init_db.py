import asyncio
from database import engine
from models import Base, Role, TicketStatus, TicketPriority, KnowledgeBase
from sqlalchemy import select

async def init_db():
    async with engine.begin() as conn:
        # Create all tables if not exist
        await conn.run_sync(Base.metadata.create_all)
    
    from sqlalchemy.ext.asyncio import AsyncSession
    async with AsyncSession(engine) as session:
        # 1. Seed Roles
        roles_data = ["client", "agent", "admin"]
        for role_name in roles_data:
            res = await session.execute(select(Role).where(Role.name == role_name))
            if not res.scalar_one_or_none():
                session.add(Role(name=role_name))

        # 2. Seed Statuses
        statuses_data = ["New", "Open", "Pending", "Resolved", "Closed"]
        for s_name in statuses_data:
            res = await session.execute(select(TicketStatus).where(TicketStatus.name == s_name))
            if not res.scalar_one_or_none():
                session.add(TicketStatus(name=s_name))

        # 3. Seed Priorities
        priorities_data = [
            ("Low", 72), ("Medium", 24), ("High", 4), ("Critical", 1)
        ]
        for p_name, p_sla in priorities_data:
            res = await session.execute(select(TicketPriority).where(TicketPriority.name == p_name))
            if not res.scalar_one_or_none():
                session.add(TicketPriority(name=p_name, sla_duration_hours=p_sla))
        
        # 4. Seed Initial Knowledge Base data
        kb_entries_data = [
            {
                "question": "Не удается войти на сайт",
                "answer": "Проверьте правильность ввода логина и пароля. Если вы забыли пароль, воспользуйтесь формой восстановления на главной странице. Также убедитесь, что ваш браузер поддерживает Cookies.",
                "category": "Доступ"
            },
            {
                "question": "Проблема с подключением к VPN",
                "answer": "Для подключения к корпоративному VPN используйте клиент Cisco AnyConnect. Убедитесь, что вы вводите актуальный токен из приложения Google Authenticator.",
                "category": "Сеть"
            },
            {
                "question": "Медленная работа системы",
                "answer": "Очистите кэш и историю вашего браузера. Если проблема сохраняется, проверьте скорость вашего интернет-соединения или обратитесь к системному администратору вашего отдела.",
                "category": "Техническая"
            },
            {
                "question": "Как сбросить пароль?",
                "answer": "Нажмите кнопку 'Забыли пароль?' на странице входа. Вам придет письмо с инструкциями на корпоративную почту.",
                "category": "Доступ"
            },
            {
                "question": "Ошибка 404 при открытии страниц",
                "answer": "Данная ошибка означает, что страница не найдена. Попробуйте вернуться на главную или обновить страницу. Если ошибка повторяется, пришлите ссылку оператору.",
                "category": "Сайт"
            }
        ]
        for kb_item in kb_entries_data:
            res = await session.execute(select(KnowledgeBase).where(KnowledgeBase.question == kb_item["question"]))
            if not res.scalar_one_or_none():
                session.add(KnowledgeBase(**kb_item))
        
        await session.commit()
    print("Database data synchronized.")

if __name__ == "__main__":
    asyncio.run(init_db())
