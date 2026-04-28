from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.services.partido_service import registrar_evento, deshacer_ultimo_evento, rehacer_ultimo_evento, obtener_estado_ligero
from app.websockets.manager import broadcast_update
from app.schemas.evento import EventoCreate, EventoRead

router = APIRouter()

@router.post("", response_model=EventoRead)
async def nuevo_evento(data: EventoCreate, db: Session = Depends(get_db)):
    evento = registrar_evento(
        db, data.partido_id, data.jugador_id,
        data.equipo_id, data.tipo, data.cuarto, data.tiempo
    )
    # Enviamos el estado actualizado para que el frontend no tenga que pedirlo
    estado = obtener_estado_ligero(db, data.partido_id)
    await broadcast_update(data.partido_id, {
        "tipo": "NUEVO_EVENTO",
        "evento": data.tipo,
        "jugador_id": data.jugador_id,
        "partido_id": data.partido_id,
        "estado_partido": estado
    })
    return evento

@router.post("/deshacer/{partido_id}")
async def deshacer(partido_id: int, db: Session = Depends(get_db)):
    evento = deshacer_ultimo_evento(db, partido_id)
    estado = obtener_estado_ligero(db, partido_id)
    await broadcast_update(partido_id, {
        "tipo": "DESHACER", 
        "partido_id": partido_id,
        "estado_partido": estado
    })
    return evento

@router.post("/rehacer/{partido_id}")
async def rehacer(partido_id: int, db: Session = Depends(get_db)):
    evento = rehacer_ultimo_evento(db, partido_id)
    estado = obtener_estado_ligero(db, partido_id)
    await broadcast_update(partido_id, {
        "tipo": "REHACER", 
        "partido_id": partido_id,
        "estado_partido": estado
    })
    return evento
