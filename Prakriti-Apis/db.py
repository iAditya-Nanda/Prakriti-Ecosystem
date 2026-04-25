import os
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, declarative_base
from dotenv import load_dotenv

# -------------------------------------------
# ✅ Load environment variables
# -------------------------------------------
load_dotenv()

# -------------------------------------------
# 🐘 PostgreSQL Connection
# -------------------------------------------

# Check for full DATABASE_URL first (e.g., from Supabase or Railway)
DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    # Build from individual components
    pg_host = os.getenv("POSTGRES_HOST", "localhost")
    pg_port = os.getenv("POSTGRES_PORT", "5432")
    pg_db = os.getenv("POSTGRES_DB", "prakriti")
    pg_user = os.getenv("POSTGRES_USER", "postgres")
    pg_pass = os.getenv("POSTGRES_PASSWORD", "postgres")

    DATABASE_URL = f"postgresql+psycopg2://{pg_user}:{pg_pass}@{pg_host}:{pg_port}/{pg_db}"

# -------------------------------------------
# ✅ SQLAlchemy Engine and Session Setup
# -------------------------------------------
try:
    engine = create_engine(DATABASE_URL, echo=False, future=True, pool_pre_ping=True)
    # Quick connection test
    with engine.connect() as conn:
        conn.execute(text("SELECT 1"))
    print("✅ Connected to PostgreSQL successfully!")
except Exception as e:
    print(f"❌ PostgreSQL connection failed: {e}")
    print("⚠️  Please ensure PostgreSQL is running and the 'prakriti' database exists.")
    print("   To create it: psql -U postgres -c 'CREATE DATABASE prakriti;'")
    raise SystemExit(1)

SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)
Base = declarative_base()

# -------------------------------------------
# ✅ Optional: quick test when run directly
# -------------------------------------------
if __name__ == "__main__":
    try:
        with engine.connect() as conn:
            result = conn.execute(text("SELECT version();"))
            version = result.scalar()
            print(f"PostgreSQL Version: {version}")

            result = conn.execute(text(
                "SELECT datname FROM pg_database WHERE datistemplate = false;"
            ))
            print("Databases on this server:")
            for row in result:
                print(f"   → {row[0]}")
    except Exception as e:
        print("Connection failed:", e)
