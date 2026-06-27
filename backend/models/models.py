# backend/models/models.py
from sqlalchemy import Column, Integer, String, Float, DateTime, Date, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
from backend.core.database import Base

class Client(Base):
    __tablename__ = "clients"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String, unique=True, index=True, nullable=False)
    status = Column(String, default="member")  # member, non-member, subscriber
    date_joined = Column(DateTime, default=datetime.utcnow, nullable=False)
    pt_sessions_remaining = Column(Integer, default=0, nullable=False)
    face_descriptor = Column(String, nullable=True)

    subscriptions = relationship("Subscription", back_populates="client", cascade="all, delete-orphan")

class Subscription(Base):
    __tablename__ = "subscriptions"

    id = Column(Integer, primary_key=True, index=True)
    client_id = Column(Integer, ForeignKey("clients.id", ondelete="CASCADE"), nullable=False)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    amount_paid = Column(Float, nullable=False)
    pt_fee = Column(Float, default=0.0)
    payment_method = Column(String, nullable=False)  # cash, gcash
    status = Column(String, default="active")  # active, expired
    pt_sessions_added = Column(Integer, default=0, nullable=False)

    client = relationship("Client", back_populates="subscriptions")

class DailySession(Base):
    __tablename__ = "daily_sessions"

    id = Column(Integer, primary_key=True, index=True)
    client_name = Column(String, nullable=False)
    client_id = Column(Integer, ForeignKey("clients.id", ondelete="SET NULL"), nullable=True)
    time_in = Column(String, nullable=False)  # e.g., "7:45 AM"
    date = Column(Date, nullable=False)
    client_assist = Column(String, nullable=False)  # JAYSON, VINCENT, TIN
    is_member = Column(Boolean, default=False)
    amount_paid = Column(Float, nullable=False)
    pt_fee = Column(Float, default=0.0)
    payment_method = Column(String, nullable=False)  # cash, gcash
    deduct_coaching = Column(Boolean, default=False, nullable=False)
    pt_sessions_added = Column(Integer, default=0, nullable=False)

class SystemSettings(Base):
    __tablename__ = "system_settings"

    id = Column(Integer, primary_key=True, index=True)
    rate_pt_fee = Column(Float, nullable=False, default=500.0)
    rate_daily_member = Column(Float, nullable=False, default=150.0)
    rate_daily_non_member = Column(Float, nullable=False, default=200.0)
    rate_monthly_subscription_1m = Column(Float, nullable=False, default=1500.0)
    rate_monthly_subscription_6m = Column(Float, nullable=False, default=8000.0)
    rate_monthly_subscription_12m = Column(Float, nullable=False, default=15000.0)
    
    # New Pricing Fields
    rate_student_subscription_1m = Column(Float, nullable=False, default=1349.0)
    rate_student_subscription_3m = Column(Float, nullable=False, default=3500.0)
    rate_student_subscription_6m = Column(Float, nullable=False, default=7000.0)
    rate_student_subscription_12m = Column(Float, nullable=False, default=14000.0)
    rate_monthly_subscription_3m = Column(Float, nullable=False, default=4000.0)
    rate_daily_student = Column(Float, nullable=False, default=150.0)
    rate_boxing_fee = Column(Float, nullable=False, default=4000.0)
    rate_12_sessions_fee = Column(Float, nullable=False, default=4000.0)
    rate_bottled_water = Column(Float, nullable=False, default=15.0)
    rate_black_coffee = Column(Float, nullable=False, default=25.0)
    rate_coffee_creamer = Column(Float, nullable=False, default=30.0)
    rate_cucumber_lemonade = Column(Float, nullable=False, default=50.0)
    rate_trainer_commission = Column(Float, nullable=False, default=200.0)

class ProductSale(Base):
    __tablename__ = "product_sales"

    id = Column(Integer, primary_key=True, index=True)
    product_name = Column(String, nullable=False)
    quantity = Column(Integer, default=1, nullable=False)
    date = Column(Date, nullable=False)
    time_sold = Column(String, nullable=False)
    amount_paid = Column(Float, nullable=False)
    payment_method = Column(String, nullable=False)  # cash, gcash

class SongRequest(Base):
    __tablename__ = "song_requests"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    youtube_url = Column(String, nullable=True)
    requested_by = Column(String, nullable=False)
    status = Column(String, default="queued")  # queued, playing, played, skipped
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
