from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from sqlalchemy import func
from app.db.database import get_db
from app.models.stats_jugador import StatsJugador
from app.models.partido import Partido, EstadoPartido
from app.schemas.stats import StatsJugadorRead, GlobalStatsRead

router = APIRouter()

@router.get("/global", response_model=GlobalStatsRead)
def get_global_stats(db: Session = Depends(get_db)):
    # 1. Total matches terminados
    total_matches = db.query(Partido).filter(Partido.estado == EstadoPartido.FINALIZADO).count()
    
    # 2. Aggregations from StatsJugador
    stats = db.query(
        func.sum(StatsJugador.puntos).label("puntos"),
        func.sum(StatsJugador.asistencias).label("asistencias"),
        func.sum(StatsJugador.rebotes_totales).label("rebotes"),
        func.sum(StatsJugador.bloqueos).label("tapones"),
        func.avg(StatsJugador.eficiencia).label("eficiencia"),
        func.sum(StatsJugador.t2_convertidos).label("t2"),
        func.sum(StatsJugador.t3_convertidos).label("t3"),
        func.sum(StatsJugador.tl_convertidos).label("tl")
    ).first()

    # 3. Tendencia (últimos 6 partidos sumando ambos equipos)
    recent_matches = db.query(Partido).filter(
        Partido.estado == EstadoPartido.FINALIZADO
    ).order_by(Partido.fecha.desc()).limit(6).all()
    
    tendencia = []
    for m in reversed(recent_matches):
        tendencia.append(float(m.pts_local + m.pts_visitante))

    # Valores por defecto si no hay datos
    has_stats = stats and stats.puntos is not None
    p = stats.puntos if has_stats else 0
    a = stats.asistencias if has_stats else 0
    r = stats.rebotes if has_stats else 0
    t = stats.tapones if has_stats else 0
    e = float(stats.eficiencia or 0)
    
    return {
        "total_matches": total_matches,
        "total_punto_avg": float(p / (total_matches * 2)) if total_matches > 0 else 0,
        "total_puntos": p,
        "total_asistencias": a,
        "total_rebotes": r,
        "total_tapones": t,
        "total_eficiencia_avg": e,
        "pnt_pintura": ((stats.t2 if has_stats else 0) * 2),
        "pnt_triples": ((stats.t3 if has_stats else 0) * 3),
        "pnt_libres": (stats.tl if has_stats else 0),
        "tendencia_puntos": tendencia if tendencia else [0,0,0,0,0,0]
    }

@router.get("/partido/{partido_id}", response_model=List[StatsJugadorRead])
def stats_partido(partido_id: int, db: Session = Depends(get_db)):
    return db.query(StatsJugador).filter(
        StatsJugador.partido_id == partido_id
    ).all()

@router.get("/jugador/{jugador_id}", response_model=List[StatsJugadorRead])
def stats_jugador(jugador_id: int, db: Session = Depends(get_db)):
    return db.query(StatsJugador).filter(
        StatsJugador.jugador_id == jugador_id
    ).all()

@router.get("/rachas")
def get_team_streaks(db: Session = Depends(get_db)):
    from app.models.equipo import Equipo
    
    equipos = db.query(Equipo).all()
    result = []
    
    for eq in equipos:
        # Recuperar partidos terminados donde participó este equipo
        partidos = db.query(Partido).filter(
            Partido.estado == EstadoPartido.FINALIZADO,
            ((Partido.local_id == eq.id) | (Partido.visitante_id == eq.id))
        ).order_by(Partido.fecha.desc()).all()
        
        streak = 0
        for p in partidos:
            is_local = p.local_id == eq.id
            if is_local:
                won = p.pts_local > p.pts_visitante
            else:
                won = p.pts_visitante > p.pts_local
            
            if won:
                streak += 1
            else:
                break # Streak ended on first loss
        
        result.append({
            "equipo": eq.nombre,
            "abrev": eq.abrev,
            "color": eq.color_principal,
            "streak": streak
        })
    
    # Ordenar por racha descendente
    result.sort(key=lambda x: x["streak"], reverse=True)
    return result
