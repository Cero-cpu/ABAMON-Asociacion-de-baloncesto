from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.db.database import get_db
from app.models.partido import Partido, EstadoPartido
from app.schemas.partido import PartidoCreate, PartidoRead
from app.services import partido_service

router = APIRouter()

@router.get("", response_model=List[PartidoRead])
def listar_partidos(db: Session = Depends(get_db)):
    return db.query(Partido).all()

@router.post("", response_model=PartidoRead)
def crear_partido(data: PartidoCreate, db: Session = Depends(get_db)):
    partido = Partido(**data.model_dump())
    db.add(partido)
    db.commit()
    db.refresh(partido)
    return partido

@router.get("/{partido_id}", response_model=PartidoRead)
def obtener_partido(partido_id: int, db: Session = Depends(get_db)):
    return partido_service.obtener_partido_por_id(db, partido_id)

@router.put("/{partido_id}/estado", response_model=PartidoRead)
def cambiar_estado(partido_id: int, estado: EstadoPartido, db: Session = Depends(get_db)):
    partido = partido_service.obtener_partido_por_id(db, partido_id)
    partido.estado = estado
    db.commit()
    db.refresh(partido)
    return partido

@router.put("/{partido_id}/cuarto", response_model=PartidoRead)
def avanzar_cuarto(partido_id: int, db: Session = Depends(get_db)):
    partido = partido_service.obtener_partido_por_id(db, partido_id)
    # Al avanzar cuarto, se resetean las faltas de equipo (FIBA) y se para el reloj
    partido.faltas_equipo_local = 0
    partido.faltas_equipo_vis = 0
    partido.reloj_activo = False

    if partido.cuarto_actual < 4:
        partido.cuarto_actual += 1
        partido.tiempo_restante = 600  # Reset a 10 minutos
    elif partido.cuarto_actual == 4:
        # Permitir overtime pero avisar
        partido.cuarto_actual += 1
        partido.tiempo_restante = 300  # Overtime: 5 minutos
    else:
        # Overtime adicional: siempre 5 minutos
        partido.cuarto_actual += 1
        partido.tiempo_restante = 300
    db.commit()
    db.refresh(partido)
    return partido

@router.delete("/{partido_id}")
def eliminar_partido(partido_id: int, db: Session = Depends(get_db)):
    from app.models.stats_jugador import StatsJugador
    from app.models.evento import Evento
    from app.models.parcial import Parcial
    db.query(StatsJugador).filter_by(partido_id=partido_id).delete()
    db.query(Evento).filter_by(partido_id=partido_id).delete()
    db.query(Parcial).filter_by(partido_id=partido_id).delete()
    partido = partido_service.obtener_partido_por_id(db, partido_id)
    db.delete(partido)
    db.commit()
    return {"ok": True}

@router.put("/{partido_id}/finalizar", response_model=PartidoRead)
def finalizar_partido(partido_id: int, db: Session = Depends(get_db)):
    partido = partido_service.obtener_partido_por_id(db, partido_id)
    partido.estado = EstadoPartido.FINALIZADO
    partido.reloj_activo = False
    db.commit()
    db.refresh(partido)
    return partido

@router.put("/{partido_id}/iniciar", response_model=PartidoRead)
def iniciar_partido(partido_id: int, db: Session = Depends(get_db)):
    partido = partido_service.obtener_partido_por_id(db, partido_id)
    partido.estado = EstadoPartido.EN_JUEGO
    db.commit()
    db.refresh(partido)
    return partido

@router.get("/{partido_id}/resumen")
def resumen_partido(partido_id: int, db: Session = Depends(get_db)):
    return partido_service.obtener_resumen_partido(db, partido_id)

@router.put("/{partido_id}/reloj/toggle", response_model=PartidoRead)
def toggle_reloj(partido_id: int, db: Session = Depends(get_db)):
    partido = partido_service.obtener_partido_por_id(db, partido_id)
    partido.reloj_activo = not partido.reloj_activo
    db.commit()
    db.refresh(partido)
    return partido

@router.put("/{partido_id}/reloj/set", response_model=PartidoRead)
def set_reloj(partido_id: int, segundos: int, db: Session = Depends(get_db)):
    partido = partido_service.obtener_partido_por_id(db, partido_id)
    partido.tiempo_restante = segundos
    db.commit()
    db.refresh(partido)
    return partido
