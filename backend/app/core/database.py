import os
from dotenv import load_dotenv
from sqlalchemy import create_engine, inspect, text
from sqlalchemy.orm import sessionmaker, declarative_base

# Load variables from .env into the environment
load_dotenv()

# Change this to your actual PostgreSQL connection string
# Example: postgresql://username:password@localhost:5432/alumnilaunch
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://postgres:password@localhost:5432/alumnilaunch"
)

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def sync_missing_columns():
    """Base.metadata.create_all only creates tables that don't exist yet — it
    never ALTERs an existing table when a new column is added to a model.
    There's no Alembic here, so a column added to models.py silently never
    reaches an already-existing table in production, and inserts start
    failing with an unhandled 500. Add any missing columns on startup so the
    live schema always matches models.py."""
    inspector = inspect(engine)
    existing_tables = set(inspector.get_table_names())
    with engine.begin() as conn:
        for table in Base.metadata.sorted_tables:
            if table.name not in existing_tables:
                continue  # create_all will make brand-new tables; nothing to sync
            existing_cols = {c["name"] for c in inspector.get_columns(table.name)}
            for column in table.columns:
                if column.name in existing_cols:
                    continue
                col_type = column.type.compile(dialect=engine.dialect)
                conn.execute(text(
                    f'ALTER TABLE "{table.name}" ADD COLUMN IF NOT EXISTS "{column.name}" {col_type}'
                ))


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
        