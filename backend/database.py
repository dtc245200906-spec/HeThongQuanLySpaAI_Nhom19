
from pathlib import Path
import sqlite3

from sqlalchemy import create_engine, event
from sqlalchemy.orm import DeclarativeBase, sessionmaker


BASE_DIR = Path(__file__).resolve().parent
DATABASE_URL = f"sqlite:///{(BASE_DIR / 'spa_ai.db').as_posix()}"


engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False},
)


# Bật kiểm tra khóa ngoại cho mọi kết nối SQLite
@event.listens_for(engine, "connect")
def enable_foreign_keys(dbapi_connection, connection_record):
    if isinstance(dbapi_connection, sqlite3.Connection):
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()


SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)


class Base(DeclarativeBase):
    pass


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
