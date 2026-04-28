from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.api.routes import equipos, jugadores, partidos, stats, eventos, parciales, auth
from app.websockets.manager import router as ws_router
import asyncio
from app.db.database import SessionLocal, init_db
from app.models.partido import Partido, EstadoPartido
from app.models.user import User
from app.core.security import get_password_hash
from app.websockets.manager import broadcast_update
from sqlalchemy import text

async def clock_worker():
    """Background task to decrement active clocks every second."""
    while True:
        await asyncio.sleep(1)
        db = SessionLocal()
        try:
            # Query ONLY active games that need a tick
            active_games = db.query(Partido).filter(
                Partido.reloj_activo == True,
                Partido.tiempo_restante > 0
            ).all()
            
            if not active_games:
                continue

            for p in active_games:
                p.tiempo_restante -= 1
                if p.tiempo_restante <= 0:
                    p.reloj_activo = False
                
                # Broadcast immediately
                await broadcast_update(p.id, {
                    "event": "clock_tick",
                    "tiempo_restante": p.tiempo_restante,
                    "reloj_activo": p.reloj_activo
                })
            
            db.commit()
        except Exception as e:
            print(f"Error in clock worker: {e}")
            db.rollback()
        finally:
            db.close()

async def keepalive_worker():
    """Background task to keep the database connection alive (prevent Render spin down)."""
    while True:
        await asyncio.sleep(240)  # Every 4 minutes
        db = SessionLocal()
        try:
            db.execute(text("SELECT 1"))
            db.commit()
            print("Keepalive ping to DB sent")
        except Exception as e:
            print(f"Error in keepalive worker: {e}")
            db.rollback()
        finally:
            db.close()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Initialize the database
    init_db()
    
    # Create default admin if not exists
    db = SessionLocal()
    try:
        if db.query(User).count() == 0:
            admin_user = User(
                username="admin",
                hashed_password=get_password_hash("fiba2025"),
                is_admin=True
            )
            db.add(admin_user)
            db.commit()
            print("Default admin user created: admin / fiba2025")
    except Exception as e:
        print(f"Error creating default user: {e}")
    finally:
        db.close()

    # Start the clock background worker
    asyncio.create_task(clock_worker())
    
    # Start the keepalive worker to prevent DB from sleeping
    asyncio.create_task(keepalive_worker())
    
    yield
    # Shutdown: Add cleanup logic if needed

app = FastAPI(
    title="FIBA Stats API",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(equipos.router,   prefix="/api/equipos",   tags=["Equipos"])
app.include_router(jugadores.router, prefix="/api/jugadores", tags=["Jugadores"])
app.include_router(partidos.router,  prefix="/api/partidos",  tags=["Partidos"])
app.include_router(stats.router,     prefix="/api/stats",     tags=["Stats"])
app.include_router(eventos.router,   prefix="/api/eventos",   tags=["Eventos"])
app.include_router(parciales.router, prefix="/api/parciales", tags=["Parciales"])
app.include_router(auth.router,      prefix="/api/auth",      tags=["Auth"])
app.include_router(ws_router)

from fastapi.staticfiles import StaticFiles
import os

# Configuración para servir el frontend (dist) en producción
# Si existe la carpeta dist (después de npm run build), la servimos
base_dir = os.path.dirname(os.path.abspath(__file__))
frontend_dist = os.path.join(os.path.dirname(os.path.dirname(base_dir)), "frontend", "dist")

if os.path.exists(frontend_dist):
    app.mount("/assets", StaticFiles(directory=os.path.join(frontend_dist, "assets")), name="assets")
    
    @app.get("/{rest_of_path:path}")
    async def serve_frontend(rest_of_path: str):
        # Si la ruta empieza por api/, la dejamos pasar a los routers (aunque FastAPI ya lo hace por prioridad)
        if rest_of_path.startswith("api/"):
            raise HTTPException(status_code=404)
        
        # Servir index.html para cualquier otra ruta (Soporte para React Router)
        index_path = os.path.join(frontend_dist, "index.html")
        if os.path.exists(index_path):
            from fastapi.responses import FileResponse
            return FileResponse(index_path)
        return {"message": "Frontend build not found. Run npm run build."}
else:
    @app.get("/")
    def root():
        return {"status": "ok", "app": "FIBA Stats System v1.0"}
