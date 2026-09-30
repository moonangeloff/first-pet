import asyncio
import sys
import os

# Add the current directory to sys.path to import backend modules
sys.path.append(os.path.join(os.getcwd(), 'backend'))

try:
    import database
    import models
    from sqlalchemy import select
except ImportError as e:
    print(f"Import Error: {e}")
    sys.exit(1)

async def check():
    async with database.AsyncSessionLocal() as session:
        result = await session.execute(select(models.KnowledgeBase))
        items = result.scalars().all()
        print(f"COUNT:{len(items)}")
        for i in items:
            print(f"ITEM:{i.kb_id}|{i.question}")

if __name__ == "__main__":
    asyncio.run(check())
