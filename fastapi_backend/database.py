from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from fastapi_backend.config import settings

# Create database engine
# check_same_thread=False is required only for SQLite to allow multiple threads to interact with it
if settings.database_url.startswith("sqlite"):
    engine = create_engine(
        settings.database_url, connect_args={"check_same_thread": False}
    )
else:
    engine = create_engine(settings.database_url)

# Create SessionLocal class for database transactions
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Declarative base class for models
Base = declarative_base()

def get_db():
    """
    Database session dependency provider.
    Ensures that database connections are properly closed after request completes.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
