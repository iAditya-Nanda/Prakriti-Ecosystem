from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
import urllib

# -------------------------------------------
# ✅ SQL Server Connection (Windows Authentication)
# -------------------------------------------

# Your verified instance & database
server = r"LENOVOT470-WIND\SQLEXPRESS"   # instance name from SSMS
database = "Prakriti"                     # your database name

# Build connection string for pyodbc
connection_string = (
    f"DRIVER={{ODBC Driver 17 for SQL Server}};"
    f"SERVER={server};"
    f"DATABASE={database};"
    "Trusted_Connection=yes;"
    "TrustServerCertificate=yes;"
)

# Encode for SQLAlchemy
try:
    params = urllib.parse.quote_plus(connection_string)
    DATABASE_URL = f"mssql+pyodbc:///?odbc_connect={params}"
    # Test connection briefly
    test_engine = create_engine(DATABASE_URL)
    test_engine.connect().close()
except Exception:
    print("⚠️ SQL Server unavailable. Falling back to local SQLite (prakriti_local.db)")
    DATABASE_URL = "sqlite:///./prakriti_local.db"

# -------------------------------------------
# ✅ SQLAlchemy Engine and Session Setup
# -------------------------------------------
engine = create_engine(DATABASE_URL, echo=False, future=True)
SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)
Base = declarative_base()

# -------------------------------------------
# ✅ Optional: quick test when run directly
# -------------------------------------------
if __name__ == "__main__":
    import pyodbc
    try:
        conn = pyodbc.connect(connection_string)
        print("Connected successfully to SQL Server!")
        cursor = conn.cursor()
        cursor.execute("SELECT name FROM sys.databases;")
        print("Databases on this server:")
        for row in cursor.fetchall():
            print("   →", row[0])
        conn.close()
    except Exception as e:
        print("Connection failed:", e)
