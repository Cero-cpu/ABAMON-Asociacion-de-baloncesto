import sqlite3
import os

db_path = '/home/julian/Documentos/FIBA/fiba-stats-system/backend/fiba_stats.db'
if os.path.exists(db_path):
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    columns_to_add = [
        ("faltas_equipo_local", "INTEGER DEFAULT 0"),
        ("faltas_equipo_vis", "INTEGER DEFAULT 0"),
        ("timeouts_local", "INTEGER DEFAULT 0"),
        ("timeouts_vis", "INTEGER DEFAULT 0")
    ]
    
    for col_name, col_type in columns_to_add:
        try:
            cursor.execute(f"ALTER TABLE partidos ADD COLUMN {col_name} {col_type}")
            print(f"Column {col_name} added.")
        except Exception as e:
            print(f"Skipping {col_name}: {e}")
            
    conn.commit()
    conn.close()
    print("Migration finished.")
else:
    print("DB file not found.")
