import os
import sys
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    print("DATABASE_URL not found!")
    sys.exit(1)

engine = create_engine(DATABASE_URL)

alter_cmds = [
    "ALTER TABLE system_settings ADD COLUMN IF NOT EXISTS rate_pt_fee FLOAT DEFAULT 500.0;",
    "ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS pt_fee FLOAT DEFAULT 0.0;",
    "ALTER TABLE daily_sessions ADD COLUMN IF NOT EXISTS pt_fee FLOAT DEFAULT 0.0;",
    "ALTER TABLE system_settings ADD COLUMN IF NOT EXISTS rate_student_subscription_1m FLOAT DEFAULT 1349.0;",
    "ALTER TABLE system_settings ADD COLUMN IF NOT EXISTS rate_student_subscription_3m FLOAT DEFAULT 3500.0;",
    "ALTER TABLE system_settings ADD COLUMN IF NOT EXISTS rate_student_subscription_6m FLOAT DEFAULT 7000.0;",
    "ALTER TABLE system_settings ADD COLUMN IF NOT EXISTS rate_student_subscription_12m FLOAT DEFAULT 14000.0;",
    "ALTER TABLE system_settings ADD COLUMN IF NOT EXISTS rate_monthly_subscription_3m FLOAT DEFAULT 4000.0;",
    "ALTER TABLE system_settings ADD COLUMN IF NOT EXISTS rate_daily_student FLOAT DEFAULT 150.0;",
    "ALTER TABLE system_settings ADD COLUMN IF NOT EXISTS rate_boxing_fee FLOAT DEFAULT 4000.0;",
    "ALTER TABLE system_settings ADD COLUMN IF NOT EXISTS rate_12_sessions_fee FLOAT DEFAULT 4000.0;",
    "ALTER TABLE system_settings ADD COLUMN IF NOT EXISTS rate_bottled_water FLOAT DEFAULT 15.0;",
    "ALTER TABLE system_settings ADD COLUMN IF NOT EXISTS rate_black_coffee FLOAT DEFAULT 25.0;",
    "ALTER TABLE system_settings ADD COLUMN IF NOT EXISTS rate_coffee_creamer FLOAT DEFAULT 30.0;",
    "ALTER TABLE system_settings ADD COLUMN IF NOT EXISTS rate_cucumber_lemonade FLOAT DEFAULT 50.0;",
    "ALTER TABLE clients ADD COLUMN IF NOT EXISTS pt_sessions_remaining INTEGER DEFAULT 0;",
    "ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS pt_sessions_added INTEGER DEFAULT 0;",
    "ALTER TABLE daily_sessions ADD COLUMN IF NOT EXISTS deduct_coaching BOOLEAN DEFAULT FALSE;",
    "ALTER TABLE clients ADD COLUMN IF NOT EXISTS face_descriptor TEXT;",
    "ALTER TABLE daily_sessions ADD COLUMN IF NOT EXISTS pt_sessions_added INTEGER DEFAULT 0;",
    "CREATE TABLE IF NOT EXISTS product_sales (id SERIAL PRIMARY KEY, product_name VARCHAR NOT NULL, quantity INTEGER NOT NULL DEFAULT 1, date DATE NOT NULL, time_sold VARCHAR NOT NULL, amount_paid FLOAT NOT NULL, payment_method VARCHAR NOT NULL);",
    "ALTER TABLE system_settings ADD COLUMN IF NOT EXISTS rate_trainer_commission FLOAT DEFAULT 200.0;"
]

with engine.begin() as conn:
    for cmd in alter_cmds:
        try:
            conn.execute(text(cmd))
            print(f"Success: {cmd}")
        except Exception as e:
            print(f"Error on {cmd}: {e}")

print("Database altered successfully.")
