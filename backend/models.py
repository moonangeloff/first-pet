from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Text, Boolean, Table
from sqlalchemy.orm import relationship, declarative_base
from datetime import datetime
import uuid

Base = declarative_base()

class Role(Base):
    __tablename__ = "roles"
    role_id = Column(Integer, primary_key=True)
    name = Column(String, unique=True, nullable=False)  # client, agent, admin
    users = relationship("User", back_populates="role")

class User(Base):
    __tablename__ = "users"
    user_id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    username = Column(String, unique=True, nullable=False)
    email = Column(String, unique=True, nullable=False)
    password_hash = Column(String, nullable=False)
    role_id = Column(Integer, ForeignKey("roles.role_id"))
    created_at = Column(DateTime, default=datetime.utcnow)

    role = relationship("Role", back_populates="users")
    created_tickets = relationship("Ticket", foreign_keys="Ticket.creator_id", back_populates="creator")
    assigned_tickets = relationship("Ticket", foreign_keys="Ticket.assignee_id", back_populates="assignee")
    comments = relationship("Comment", back_populates="author")

class TicketStatus(Base):
    __tablename__ = "ticket_statuses"
    status_id = Column(Integer, primary_key=True)
    name = Column(String, unique=True, nullable=False)  # New, Open, Pending, Resolved, Closed
    tickets = relationship("Ticket", back_populates="status")

class TicketPriority(Base):
    __tablename__ = "ticket_priorities"
    priority_id = Column(Integer, primary_key=True)
    name = Column(String, unique=True, nullable=False)
    sla_duration_hours = Column(Integer, nullable=False)
    tickets = relationship("Ticket", back_populates="priority")

class Ticket(Base):
    __tablename__ = "tickets"
    ticket_id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    title = Column(String, nullable=False)
    description = Column(Text)
    status_id = Column(Integer, ForeignKey("ticket_statuses.status_id"))
    priority_id = Column(Integer, ForeignKey("ticket_priorities.priority_id"))
    creator_id = Column(String, ForeignKey("users.user_id"))
    assignee_id = Column(String, ForeignKey("users.user_id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    due_date = Column(DateTime)

    status = relationship("TicketStatus", back_populates="tickets")
    priority = relationship("TicketPriority", back_populates="tickets")
    creator = relationship("User", foreign_keys=[creator_id], back_populates="created_tickets")
    assignee = relationship("User", foreign_keys=[assignee_id], back_populates="assigned_tickets")
    comments = relationship("Comment", back_populates="ticket", cascade="all, delete-orphan")

class Comment(Base):
    __tablename__ = "comments"
    comment_id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    ticket_id = Column(String, ForeignKey("tickets.ticket_id"))
    author_id = Column(String, ForeignKey("users.user_id"))
    body = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    ticket = relationship("Ticket", back_populates="comments")
    author = relationship("User", back_populates="comments")

class KnowledgeBase(Base):
    __tablename__ = "knowledge_base"
    kb_id = Column(Integer, primary_key=True)
    question = Column(String, nullable=False)
    answer = Column(Text, nullable=False)
    category = Column(String)
