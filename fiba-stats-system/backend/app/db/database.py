from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from app.core.config import settings

# Render provides 'postgres://', but SQLAlchemy requires 'postgresql://'
db_url = settings.DATABASE_URL
if db_url.startswith("postgres://"):
    db_url = db_url.replace("postgres://", "postgresql://", 1)

# SQLite uses 'check_same_thread: False', but it triggers errors in Postgres
connect_args = {}
if db_url.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

# Pooling options (only for Postgres/production)
engine_args = {
    "connect_args": connect_args
}

if not db_url.startswith("sqlite"):
    engine_args.update({
        "pool_size": 20,
        "max_overflow": 10,
        "pool_timeout": 30,
        "pool_recycle": 1800
    })

engine = create_engine(db_url, **engine_args)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def init_db():
    from app.models import equipo, jugador, partido, stats_jugador, evento, parcial, user
    Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
