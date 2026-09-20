from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from dotenv import load_dotenv
import os

load_dotenv()
if not os.getenv("DATABASE_URL"):
    env_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), ".env")
    if os.path.exists(env_path):
        load_dotenv(dotenv_path=env_path)

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./test.db")
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if DATABASE_URL.startswith("sqlite:///./"):
    db_rel = DATABASE_URL[len("sqlite:///./"):]
    DATABASE_URL = f"sqlite:///{os.path.join(backend_dir, db_rel).replace(os.sep, '/')}"

engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True
)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

Base = declarative_base()


def get_db():
    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()