# backend/schemas/schemas.py
from pydantic import BaseModel, Field
from datetime import datetime, date
from typing import List, Optional, Dict

# Clients
class BulkDeleteRequest(BaseModel):
    ids: List[int]

class ClientBase(BaseModel):
    full_name: str = Field(..., min_length=1, max_length=100)
    status: str = Field("member", pattern="^(member|non-member|subscriber)$")
    pt_sessions_remaining: int = 0
    face_descriptor: Optional[str] = None

class ClientCreate(ClientBase):
    pass

class ClientUpdate(BaseModel):
    full_name: Optional[str] = Field(None, min_length=1, max_length=100)
    status: Optional[str] = Field(None, pattern="^(member|non-member|subscriber)$")
    pt_sessions_remaining: Optional[int] = None
    face_descriptor: Optional[str] = None

class ClientResponse(ClientBase):
    id: int
    date_joined: datetime

    class Config:
        from_attributes = True

# Subscriptions
class SubscriptionBase(BaseModel):
    client_id: int
    start_date: date
    end_date: date
    amount_paid: float = Field(..., ge=0)
    pt_fee: float = 0.0
    payment_method: str = Field(..., pattern="^(cash|gcash)$")
    pt_sessions_added: int = 0

class SubscriptionCreate(SubscriptionBase):
    pass

class SubscriptionUpdate(BaseModel):
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    amount_paid: Optional[float] = None
    pt_fee: Optional[float] = None
    payment_method: Optional[str] = None
    status: Optional[str] = None
    pt_sessions_added: Optional[int] = None

class SubscriptionResponse(SubscriptionBase):
    id: int
    status: str

    class Config:
        from_attributes = True

# Daily Sessions
class DailySessionBase(BaseModel):
    client_name: str = Field(..., min_length=1, max_length=100)
    client_id: Optional[int] = None
    time_in: str = Field(..., min_length=1, max_length=20)
    date: date
    client_assist: str = Field(..., pattern="^(JAYSON|VINCENT|TIN|NONE)$")
    is_member: bool = False
    amount_paid: float = Field(..., ge=0)
    pt_fee: float = 0.0
    payment_method: str = Field(..., pattern="^(cash|gcash)$")
    deduct_coaching: bool = False
    pt_sessions_added: int = 0

class DailySessionCreate(DailySessionBase):
    pass

class DailySessionResponse(DailySessionBase):
    id: int

    class Config:
        from_attributes = True

# Product Sales
class ProductSaleBase(BaseModel):
    product_name: str = Field(..., min_length=1, max_length=100)
    quantity: int = Field(1, ge=1)
    date: date
    time_sold: str = Field(..., min_length=1, max_length=20)
    amount_paid: float = Field(..., ge=0)
    payment_method: str = Field(..., pattern="^(cash|gcash)$")

class ProductSaleCreate(ProductSaleBase):
    pass

class ProductSaleResponse(ProductSaleBase):
    id: int

    class Config:
        from_attributes = True

# Gym Rates Config
class GymRatesBase(BaseModel):
    rate_daily_member: float
    rate_daily_non_member: float
    rate_monthly_subscription_1m: float
    rate_monthly_subscription_6m: float
    rate_monthly_subscription_12m: float
    rate_pt_fee: float
    
    # New Fields
    rate_student_subscription_1m: float
    rate_student_subscription_3m: float
    rate_student_subscription_6m: float
    rate_student_subscription_12m: float
    rate_monthly_subscription_3m: float
    rate_daily_student: float
    rate_boxing_fee: float
    rate_12_sessions_fee: float
    rate_bottled_water: float
    rate_black_coffee: float
    rate_coffee_creamer: float
    rate_cucumber_lemonade: float
    rate_trainer_commission: float

class GymRatesUpdate(BaseModel):
    rate_daily_member: Optional[float] = None
    rate_daily_non_member: Optional[float] = None
    rate_monthly_subscription_1m: Optional[float] = None
    rate_monthly_subscription_6m: Optional[float] = None
    rate_monthly_subscription_12m: Optional[float] = None
    rate_pt_fee: Optional[float] = None
    
    # New Fields
    rate_student_subscription_1m: Optional[float] = None
    rate_student_subscription_3m: Optional[float] = None
    rate_student_subscription_6m: Optional[float] = None
    rate_student_subscription_12m: Optional[float] = None
    rate_monthly_subscription_3m: Optional[float] = None
    rate_daily_student: Optional[float] = None
    rate_boxing_fee: Optional[float] = None
    rate_12_sessions_fee: Optional[float] = None
    rate_bottled_water: Optional[float] = None
    rate_black_coffee: Optional[float] = None
    rate_coffee_creamer: Optional[float] = None
    rate_cucumber_lemonade: Optional[float] = None
    rate_trainer_commission: Optional[float] = None

class GymRatesResponse(GymRatesBase):
    id: int

    class Config:
        from_attributes = True

# Trainer Payroll
class TrainerPayrollMetrics(BaseModel):
    trainer_name: str
    total_assists: int
    total_commission: float

# Analytics
class DashboardMetrics(BaseModel):
    total_revenue: float
    pt_revenue: float
    cash_revenue: float
    gcash_revenue: float
    daily_session_revenue: float
    subscription_revenue_1m: float
    subscription_revenue_6m: float
    subscription_revenue_12m: float
    member_visits: int
    non_member_visits: int
    active_subscribers: int
    total_clients: int
    assist_breakdown: Dict[str, int]
    daily_sessions: List[DailySessionResponse]
    clients: List[ClientResponse]
    product_sales: List[ProductSaleResponse]
    product_revenue: float
