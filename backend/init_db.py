"""
Initialize PostgreSQL database
Run this script to create all tables in the database.
"""

from app.core.database import init_db, engine
from app.models.db_models import Base

if __name__ == "__main__":
    print("🔧 Initializing database...")
    print(f"📦 Database URL: {engine.url}")
    
    # Create all tables
    Base.metadata.create_all(bind=engine)
    
    print("✅ Database tables created successfully!")
    print("\n📋 Created tables:")
    for table_name in Base.metadata.tables.keys():
        print(f"   - {table_name}")

