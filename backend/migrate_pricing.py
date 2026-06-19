import sqlite3
import os

def migrate_db():
    db_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "musclecheck.db")
    if not os.path.exists(db_path):
        print(f"Database not found at {db_path}")
        return

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    columns_to_add = [
        ("rate_student_subscription_1m", "REAL NOT NULL DEFAULT 1349.0"),
        ("rate_student_subscription_3m", "REAL NOT NULL DEFAULT 3500.0"),
        ("rate_student_subscription_6m", "REAL NOT NULL DEFAULT 7000.0"),
        ("rate_student_subscription_12m", "REAL NOT NULL DEFAULT 14000.0"),
        ("rate_monthly_subscription_3m", "REAL NOT NULL DEFAULT 4000.0"),
        ("rate_daily_student", "REAL NOT NULL DEFAULT 150.0"),
        ("rate_boxing_fee", "REAL NOT NULL DEFAULT 4000.0"),
        ("rate_12_sessions_fee", "REAL NOT NULL DEFAULT 4000.0"),
        ("rate_bottled_water", "REAL NOT NULL DEFAULT 15.0"),
        ("rate_black_coffee", "REAL NOT NULL DEFAULT 25.0"),
        ("rate_coffee_creamer", "REAL NOT NULL DEFAULT 30.0"),
        ("rate_cucumber_lemonade", "REAL NOT NULL DEFAULT 50.0"),
    ]

    for col_name, col_def in columns_to_add:
        try:
            cursor.execute(f"ALTER TABLE system_settings ADD COLUMN {col_name} {col_def}")
            print(f"Added column {col_name}")
        except sqlite3.OperationalError as e:
            if "duplicate column name" in str(e).lower():
                print(f"Column {col_name} already exists.")
            else:
                print(f"Error adding {col_name}: {e}")

    conn.commit()
    conn.close()
    print("Migration complete.")

if __name__ == "__main__":
    migrate_db()
