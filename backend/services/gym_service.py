# backend/services/gym_service.py
from datetime import datetime, date, timedelta
from sqlalchemy.orm import Session
from backend.models.models import Client, Subscription, DailySession, ProductSale
from backend.core.config import settings

def seed_gym_data(db: Session):
    # The database will start empty and will not automatically seed dummy data.
    pass

def get_dashboard_metrics(db: Session):
    today_val = date.today()
    sessions = db.query(DailySession).filter(DailySession.date == today_val).all()
    subscriptions = db.query(Subscription).filter(Subscription.start_date == today_val).all()
    product_sales = db.query(ProductSale).filter(ProductSale.date == today_val).all()
    clients = db.query(Client).all()
    
    # Calculate daily session revenue
    daily_session_revenue = sum(s.amount_paid for s in sessions)
    
    # Calculate subscription revenue by duration (approximated by amount paid mapping to current rates)
    # We don't save exact duration enum in DB, so we bucket based on amount ranges roughly, 
    # or just assume 1m, 6m, 12m. Actually, we can check the difference between start and end date.
    subscription_revenue_1m = 0
    subscription_revenue_6m = 0
    subscription_revenue_12m = 0
    
    for sub in subscriptions:
        duration_days = (sub.end_date - sub.start_date).days
        if duration_days > 300:
            subscription_revenue_12m += sub.amount_paid
        elif duration_days > 100:
            subscription_revenue_6m += sub.amount_paid
        else:
            subscription_revenue_1m += sub.amount_paid

    total_sub_rev = subscription_revenue_1m + subscription_revenue_6m + subscription_revenue_12m
    
    pt_revenue = sum(getattr(s, "pt_fee", 0.0) for s in sessions) + \
                 sum(getattr(s, "pt_fee", 0.0) for s in subscriptions)

    product_revenue = sum(p.amount_paid for p in product_sales)

    total_rev = daily_session_revenue + total_sub_rev + pt_revenue + product_revenue
    
    cash_rev = sum(s.amount_paid + getattr(s, "pt_fee", 0.0) for s in sessions if s.payment_method == "cash") + \
               sum(s.amount_paid + getattr(s, "pt_fee", 0.0) for s in subscriptions if s.payment_method == "cash") + \
               sum(p.amount_paid for p in product_sales if p.payment_method == "cash")
               
    gcash_rev = sum(s.amount_paid + getattr(s, "pt_fee", 0.0) for s in sessions if s.payment_method == "gcash") + \
                sum(s.amount_paid + getattr(s, "pt_fee", 0.0) for s in subscriptions if s.payment_method == "gcash") + \
                sum(p.amount_paid for p in product_sales if p.payment_method == "gcash")

    # Counter states
    member_visits = sum(1 for s in sessions if s.is_member)
    non_member_visits = sum(1 for s in sessions if not s.is_member)
    active_subscribers = db.query(Subscription).filter(Subscription.status == "active").count()

    # Client Assist breakdown
    assist_counts = {"JAYSON": 0, "VINCENT": 0, "TIN": 0, "NONE": 0}
    for s in sessions:
        assist = s.client_assist.upper()
        if assist in assist_counts:
            assist_counts[assist] += 1
        else:
            assist_counts["NONE"] += 1

    return {
        "total_revenue": total_rev,
        "pt_revenue": pt_revenue,
        "cash_revenue": cash_rev,
        "gcash_revenue": gcash_rev,
        "daily_session_revenue": daily_session_revenue,
        "subscription_revenue_1m": subscription_revenue_1m,
        "subscription_revenue_6m": subscription_revenue_6m,
        "subscription_revenue_12m": subscription_revenue_12m,
        "member_visits": member_visits,
        "non_member_visits": non_member_visits,
        "active_subscribers": active_subscribers,
        "total_clients": len(clients),
        "assist_breakdown": assist_counts,
        "daily_sessions": sessions,
        "clients": clients,
        "product_sales": product_sales,
        "product_revenue": product_revenue
    }
