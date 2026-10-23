import sqlite3
from pathlib import Path

# Database file will be created inside backend/data
BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data"
DATA_DIR.mkdir(exist_ok=True)

DATABASE_PATH = DATA_DIR / "scheduler.db"


def get_db_connection():
    """
    Create and return a SQLite database connection.
    """
    connection = sqlite3.connect(DATABASE_PATH)
    connection.row_factory = sqlite3.Row
    return connection


def init_db():
    """
    Create the jobs table if it does not already exist.
    """

    connection = get_db_connection()

    connection.execute("""
        CREATE TABLE IF NOT EXISTS jobs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,

            job_id TEXT UNIQUE NOT NULL,
            name TEXT NOT NULL,
            type TEXT NOT NULL,

            estimated_runtime INTEGER NOT NULL,
            actual_runtime INTEGER,

            deadline TEXT NOT NULL,
            selected_time TEXT NOT NULL,
            completion_time TEXT,

            region TEXT NOT NULL,
            carbon_intensity REAL NOT NULL,

            estimated_energy REAL NOT NULL,
            estimated_co2 REAL NOT NULL,
            co2_saved REAL DEFAULT 0,

            status TEXT NOT NULL,
            priority TEXT NOT NULL,

            file_name TEXT,
            file_size_bytes INTEGER,
            file_type TEXT,

            created_at TEXT NOT NULL,
            completed_at TEXT
        )
    """)

    # Safe, backward-compatible migration for existing SQLite databases
    cursor = connection.execute("PRAGMA table_info(jobs)")
    existing_columns = {row["name"] for row in cursor.fetchall()}

    columns_to_add = [
        ("file_name", "TEXT"),
        ("file_size_bytes", "INTEGER"),
        ("file_type", "TEXT")
    ]

    for col_name, col_type in columns_to_add:
        if col_name not in existing_columns:
            connection.execute(f"ALTER TABLE jobs ADD COLUMN {col_name} {col_type}")

    connection.commit()
    connection.close()


if __name__ == "__main__":
    init_db()
    print("Database initialized successfully.")
    print(f"Database location: {DATABASE_PATH}")
