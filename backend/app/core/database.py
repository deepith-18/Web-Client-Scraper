import uuid
from sqlalchemy import create_engine, text
from sqlalchemy.orm import declarative_base, sessionmaker
from backend.app.core.config import settings

# If using sqlite, check_same_thread needs to be False
connect_args = {}
if settings.DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

engine = create_engine(
    settings.DATABASE_URL,
    connect_args=connect_args,
    echo=False
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def run_migrations():
    """Lightweight SQLite schema synchronization for newly added model columns."""
    try:
        with engine.connect() as conn:
            if settings.DATABASE_URL.startswith("sqlite"):
                result = conn.execute(text("PRAGMA table_info(outreach_records)")).fetchall()
                col_names = [r[1] for r in result]
                if col_names:
                    if "stage_step" not in col_names:
                        conn.execute(text("ALTER TABLE outreach_records ADD COLUMN stage_step INTEGER DEFAULT 1"))
                    if "template_id" not in col_names:
                        conn.execute(text("ALTER TABLE outreach_records ADD COLUMN template_id VARCHAR(36)"))
                conn.commit()
    except Exception as e:
        pass

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


