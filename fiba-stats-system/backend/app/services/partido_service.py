from sqlalchemy.orm import Session
from app.models.evento import Evento
from app.models.stats_jugador import StatsJugador
from app.models.partido import Partido, EstadoPartido
from app.models.jugador import Jugador
from app.services.stats_service import recalcular_stats
from fastapi import HTTPException
from typing import Dict, Any

INCREMENTOS = {
    "T2_CONV":    {"t2_convertidos": 1, "t2_intentados": 1},
    "T2_FALL":    {"t2_intentados": 1},
    "T3_CONV":    {"t3_convertidos": 1, "t3_intentados": 1},
    "T3_FALL":    {"t3_intentados": 1},
    "TL_CONV":    {"tl_convertidos": 1, "tl_intentados": 1},
    "TL_FALL":    {"tl_intentados": 1},
    "REB_OF":     {"rebotes_ofensivos": 1},
    "REB_DEF":    {"rebotes_defensivos": 1},
    "ASISTENCIA": {"asistencias": 1},
    "PERDIDA":    {"perdidas": 1},
    "RECUPERO":   {"recuperos": 1},
    "BLOQUEO":    {"bloqueos": 1},
    "FALTA":      {"faltas": 1},
    "FALTA_REC":  {"faltas_recibidas": 1},
    "BLOQUEO_REC":{"bloqueos_recibidos": 1},
    "NO_JUGO":    {"nj": 1},
}

PUNTOS_EVENTO = {
    "T2_CONV": 2,
    "T3_CONV": 3,
    "TL_CONV": 1,
}

def registrar_evento(db: Session, partido_id: int, jugador_id: int,
                     equipo_id: int, tipo: str, cuarto: int, tiempo: str):
    evento = Evento(
        partido_id=partido_id, jugador_id=jugador_id,
        equipo_id=equipo_id, tipo=tipo,
        cuarto=cuarto, tiempo=tiempo
    )
    db.add(evento)

    if tipo in INCREMENTOS and jugador_id:
        stats = db.query(StatsJugador).filter_by(
            partido_id=partido_id, jugador_id=jugador_id
        ).first()
        if not stats:
            stats = StatsJugador(partido_id=partido_id, jugador_id=jugador_id)
            db.add(stats)
            db.flush()

        for campo, valor in INCREMENTOS[tipo].items():
            setattr(stats, campo, getattr(stats, campo) + valor)

        s = {c.name: getattr(stats, c.name) for c in stats.__table__.columns}
        s = recalcular_stats(s)
        for campo, valor in s.items():
            setattr(stats, campo, valor)

    # Lógica de Equipo (Faltas y Timeouts) - Independiente de si hay jugador o no
    if tipo == "FALTA":
        partido = db.query(Partido).filter(Partido.id == partido_id).first()
        if partido:
            if equipo_id == partido.local_id:
                partido.faltas_equipo_local += 1
            elif equipo_id == partido.visitante_id:
                partido.faltas_equipo_vis += 1
    elif tipo == "TIMEOUT":
        partido = db.query(Partido).filter(Partido.id == partido_id).first()
        if partido:
            if equipo_id == partido.local_id:
                partido.timeouts_local += 1
            elif equipo_id == partido.visitante_id:
                partido.timeouts_vis += 1

    if tipo in PUNTOS_EVENTO:
        partido = db.query(Partido).filter(Partido.id == partido_id).first()
        if partido and equipo_id:
            puntos = PUNTOS_EVENTO[tipo]
            if equipo_id == partido.local_id:
                partido.pts_local += puntos
            elif equipo_id == partido.visitante_id:
                partido.pts_visitante += puntos

    db.commit()
    return evento

def deshacer_ultimo_evento(db: Session, partido_id: int):
    ultimo = db.query(Evento).filter_by(
        partido_id=partido_id, deshecho=0
    ).order_by(Evento.id.desc()).first()

    if not ultimo:
        return None

    if ultimo.tipo in INCREMENTOS and ultimo.jugador_id:
        stats = db.query(StatsJugador).filter_by(
            partido_id=partido_id, jugador_id=ultimo.jugador_id
        ).first()
        if stats:
            for campo, valor in INCREMENTOS[ultimo.tipo].items():
                setattr(stats, campo, max(0, getattr(stats, campo) - valor))
            
            s = {c.name: getattr(stats, c.name) for c in stats.__table__.columns}
            s = recalcular_stats(s)
            for campo, valor in s.items():
                setattr(stats, campo, valor)

    # Deshacer lógica de equipo
    if ultimo.tipo == "FALTA":
        partido = db.query(Partido).filter(Partido.id == partido_id).first()
        if partido:
            if ultimo.equipo_id == partido.local_id:
                partido.faltas_equipo_local = max(0, partido.faltas_equipo_local - 1)
            elif ultimo.equipo_id == partido.visitante_id:
                partido.faltas_equipo_vis = max(0, partido.faltas_equipo_vis - 1)
    elif ultimo.tipo == "TIMEOUT":
        partido = db.query(Partido).filter(Partido.id == partido_id).first()
        if partido:
            if ultimo.equipo_id == partido.local_id:
                partido.timeouts_local = max(0, partido.timeouts_local - 1)
            elif ultimo.equipo_id == partido.visitante_id:
                partido.timeouts_vis = max(0, partido.timeouts_vis - 1)

    if ultimo.tipo in PUNTOS_EVENTO:
        partido = db.query(Partido).filter(Partido.id == partido_id).first()
        if partido and ultimo.equipo_id:
            puntos = PUNTOS_EVENTO[ultimo.tipo]
            if ultimo.equipo_id == partido.local_id:
                partido.pts_local = max(0, partido.pts_local - puntos)
            elif ultimo.equipo_id == partido.visitante_id:
                partido.pts_visitante = max(0, partido.pts_visitante - puntos)

    ultimo.deshecho = 1
    db.commit()
    return ultimo

def rehacer_ultimo_evento(db: Session, partido_id: int):
    ultimo_deshecho = db.query(Evento).filter_by(
        partido_id=partido_id, deshecho=1
    ).order_by(Evento.id.desc()).first()

    if not ultimo_deshecho:
        return None

    if ultimo_deshecho.tipo in INCREMENTOS and ultimo_deshecho.jugador_id:
        stats = db.query(StatsJugador).filter_by(
            partido_id=partido_id, jugador_id=ultimo_deshecho.jugador_id
        ).first()
        if not stats:
            stats = StatsJugador(partido_id=partido_id, jugador_id=ultimo_deshecho.jugador_id)
            db.add(stats)
            db.flush()

        for campo, valor in INCREMENTOS[ultimo_deshecho.tipo].items():
            setattr(stats, campo, getattr(stats, campo) + valor)

        s = {c.name: getattr(stats, c.name) for c in stats.__table__.columns}
        s = recalcular_stats(s)
        for campo, valor in s.items():
            setattr(stats, campo, valor)

    # Rehacer lógica de equipo
    if ultimo_deshecho.tipo == "FALTA":
        partido = db.query(Partido).filter(Partido.id == partido_id).first()
        if partido:
            if ultimo_deshecho.equipo_id == partido.local_id:
                partido.faltas_equipo_local += 1
            elif ultimo_deshecho.equipo_id == partido.visitante_id:
                partido.faltas_equipo_vis += 1
    elif ultimo_deshecho.tipo == "TIMEOUT":
        partido = db.query(Partido).filter(Partido.id == partido_id).first()
        if partido:
            if ultimo_deshecho.equipo_id == partido.local_id:
                partido.timeouts_local += 1
            elif ultimo_deshecho.equipo_id == partido.visitante_id:
                partido.timeouts_vis += 1

    if ultimo_deshecho.tipo in PUNTOS_EVENTO:
        partido = db.query(Partido).filter(Partido.id == partido_id).first()
        if partido and ultimo_deshecho.equipo_id:
            puntos = PUNTOS_EVENTO[ultimo_deshecho.tipo]
            if ultimo_deshecho.equipo_id == partido.local_id:
                partido.pts_local += puntos
            elif ultimo_deshecho.equipo_id == partido.visitante_id:
                partido.pts_visitante += puntos

    ultimo_deshecho.deshecho = 0
    db.commit()
    return ultimo_deshecho

def obtener_partido_por_id(db: Session, partido_id: int) -> Partido:
    partido = db.query(Partido).filter(Partido.id == partido_id).first()
    if not partido:
        raise HTTPException(status_code=404, detail="Partido no encontrado")
    return partido

def _tiempo_a_segundos(tiempo_str: str) -> int:
    """Convierte 'M:SS' a segundos totales de juego transcurridos en ese cuarto."""
    try:
        partes = tiempo_str.strip().split(':')
        if len(partes) == 2:
            mins = int(partes[0])
            segs = int(partes[1])
            # El reloj cuenta regresivamente desde 10:00 (600s)
            # Tiempo transcurrido = 600 - tiempo_restante
            restante = mins * 60 + segs
            return max(0, 600 - restante)
        return 0
    except:
        return 0

def obtener_resumen_partido(db: Session, partido_id: int) -> Dict[str, Any]:
    partido = obtener_partido_por_id(db, partido_id)

    eventos = db.query(Evento).filter_by(
        partido_id=partido_id, deshecho=0
    ).order_by(Evento.timestamp).all()

    jugadores_local     = db.query(Jugador).filter_by(equipo_id=partido.local_id).all()
    jugadores_visitante = db.query(Jugador).filter_by(equipo_id=partido.visitante_id).all()
    ids_local           = {j.id for j in jugadores_local}
    ids_visitante       = {j.id for j in jugadores_visitante}
    titulares_local     = {j.id for j in jugadores_local     if j.es_titular}
    titulares_visitante = {j.id for j in jugadores_visitante if j.es_titular}

    PUNTOS = {"T2_CONV": 2, "T3_CONV": 3, "TL_CONV": 1}

    pts_l = 0
    pts_v = 0
    max_ventaja_l = 0
    max_ventaja_v = 0
    empates = 0
    cambios_liderazgo = 0
    lider_actual = None

    # Tiempo liderando en segundos de juego (no datetime)
    tiempo_liderando_l = 0
    tiempo_liderando_v = 0
    ultimo_cuarto = 1
    ultimo_seg_juego = 0  # segundos transcurridos en el juego hasta el último evento

    pts_perdidas_l = 0
    pts_perdidas_v = 0
    ultima_perdida_eq = None

    pts_fastbreak_l = 0
    pts_fastbreak_v = 0
    ultimo_recupero_eq = None

    racha_l = 0
    racha_v = 0
    max_racha_l = 0
    max_racha_v = 0

    puntos_banca_l = 0
    puntos_banca_v = 0
    pts_segunda_opp_l = 0
    pts_segunda_opp_v = 0
    ultimo_reb_of_equipo = None
    
    progresion_puntos = []

    SEGUNDOS_POR_CUARTO = 600  # 10 minutos

    for ev in eventos:
        es_local = ev.equipo_id == partido.local_id
        es_visit = ev.equipo_id == partido.visitante_id

        # Calcular segundos de juego transcurridos hasta este evento
        cuarto_ev = ev.cuarto or 1
        segs_en_cuarto = _tiempo_a_segundos(ev.tiempo or '10:00')
        seg_juego_actual = (cuarto_ev - 1) * SEGUNDOS_POR_CUARTO + segs_en_cuarto

        # Acumular tiempo liderando
        delta = max(0, seg_juego_actual - ultimo_seg_juego)
        if pts_l > pts_v:
            tiempo_liderando_l += delta
        elif pts_v > pts_l:
            tiempo_liderando_v += delta

        ultimo_seg_juego = seg_juego_actual

        # Puntos de banca
        if ev.tipo in PUNTOS and ev.jugador_id:
            pts = PUNTOS[ev.tipo]
            if es_local and ev.jugador_id not in titulares_local:
                puntos_banca_l += pts
            if es_visit and ev.jugador_id not in titulares_visitante:
                puntos_banca_v += pts

        # Segunda oportunidad
        if ev.tipo == "REB_OF":
            ultimo_reb_of_equipo = ev.equipo_id
        elif ev.tipo in PUNTOS and ultimo_reb_of_equipo == ev.equipo_id:
            if es_local: pts_segunda_opp_l += PUNTOS[ev.tipo]
            else: pts_segunda_opp_v += PUNTOS[ev.tipo]
            ultimo_reb_of_equipo = None
        elif ev.tipo not in ["T2_FALL", "T3_FALL", "TL_FALL"]:
            ultimo_reb_of_equipo = None

        # Puntos tras pérdidas
        if ev.tipo == "PERDIDA":
            ultima_perdida_eq = ev.equipo_id
        elif ev.tipo in PUNTOS and ultima_perdida_eq and ultima_perdida_eq != ev.equipo_id:
            if es_local: pts_perdidas_l += PUNTOS[ev.tipo]
            else: pts_perdidas_v += PUNTOS[ev.tipo]
            ultima_perdida_eq = None
        elif ev.tipo not in ["T2_FALL", "T3_FALL", "TL_FALL"]:
            ultima_perdida_eq = None

        # Contraataque
        if ev.tipo == "RECUPERO":
            ultimo_recupero_eq = ev.equipo_id
        elif ev.tipo in PUNTOS and ultimo_recupero_eq == ev.equipo_id:
            if es_local: pts_fastbreak_l += PUNTOS[ev.tipo]
            else: pts_fastbreak_v += PUNTOS[ev.tipo]
            ultimo_recupero_eq = None
        elif ev.tipo not in ["T2_FALL", "T3_FALL", "TL_FALL"]:
            ultimo_recupero_eq = None

        # Actualizar marcador y rachas
        if ev.tipo in PUNTOS:
            pts = PUNTOS[ev.tipo]
            
            jugador_num = ""
            for j in jugadores_local + jugadores_visitante:
                if j.id == ev.jugador_id:
                    jugador_num = j.numero
                    break
                    
            if es_local:
                pts_l += pts
                racha_l += pts
                racha_v = 0
                max_racha_l = max(max_racha_l, racha_l)
            elif es_visit:
                pts_v += pts
                racha_v += pts
                racha_l = 0
                max_racha_v = max(max_racha_v, racha_v)
                
            progresion_puntos.append({
                "equipo": "local" if es_local else "visitante",
                "puntos_anotados": pts,
                "numero": jugador_num,
                "total_local": pts_l,
                "total_visitante": pts_v
            })

            diff = pts_l - pts_v
            if diff > 0:
                max_ventaja_l = max(max_ventaja_l, diff)
                if lider_actual == 'visitante': cambios_liderazgo += 1
                lider_actual = 'local'
            elif diff < 0:
                max_ventaja_v = max(max_ventaja_v, abs(diff))
                if lider_actual == 'local': cambios_liderazgo += 1
                lider_actual = 'visitante'
            else:
                empates += 1
                lider_actual = 'empate'

    # Stats de pintura
    stats_l = db.query(StatsJugador).filter_by(partido_id=partido_id).filter(StatsJugador.jugador_id.in_(ids_local)).all()
    stats_v = db.query(StatsJugador).filter_by(partido_id=partido_id).filter(StatsJugador.jugador_id.in_(ids_visitante)).all()

    pintura_conv_l = sum(s.t2_convertidos for s in stats_l)
    pintura_conv_v = sum(s.t2_convertidos for s in stats_v)

    def format_time(seconds):
        seconds = int(max(0, seconds))
        m = seconds // 60
        s = seconds % 60
        return f"{m:02d}:{s:02d}"

    def map_stats_player(jugador, stats_obj):
        return {
            "id": jugador.id,
            "nombre": jugador.nombre,
            "numero": jugador.numero,
            "es_titular": jugador.es_titular,
            "minutos": stats_obj.minutos if stats_obj else 0,
            "t2_conv": stats_obj.t2_convertidos if stats_obj else 0,
            "t2_total": stats_obj.t2_intentados if stats_obj else 0,
            "t3_conv": stats_obj.t3_convertidos if stats_obj else 0,
            "t3_total": stats_obj.t3_intentados if stats_obj else 0,
            "tl_conv": stats_obj.tl_convertidos if stats_obj else 0,
            "tl_total": stats_obj.tl_intentados if stats_obj else 0,
            "rebotes_ofensivos": stats_obj.rebotes_ofensivos if stats_obj else 0,
            "rebotes_defensivos": stats_obj.rebotes_defensivos if stats_obj else 0,
            "rebotes_totales": stats_obj.rebotes_totales if stats_obj else 0,
            "asistencias": stats_obj.asistencias if stats_obj else 0,
            "perdidas": stats_obj.perdidas if stats_obj else 0,
            "recuperos": stats_obj.recuperos if stats_obj else 0,
            "bloqueos": stats_obj.bloqueos if stats_obj else 0,
            "bloqueos_recibidos": stats_obj.bloqueos_recibidos if stats_obj else 0,
            "faltas": stats_obj.faltas if stats_obj else 0,
            "faltas_recibidas": stats_obj.faltas_recibidas if stats_obj else 0,
            "mas_menos": stats_obj.mas_menos if stats_obj else 0,
            "puntos": stats_obj.puntos if stats_obj else 0,
            "eficiencia": stats_obj.eficiencia if stats_obj else 0,
            "nj": stats_obj.nj if stats_obj else 0
        }

    stats_dict = {s.jugador_id: s for s in db.query(StatsJugador).filter_by(partido_id=partido_id).all()}

    list_stats_local     = [map_stats_player(j, stats_dict.get(j.id)) for j in jugadores_local]
    list_stats_visitante = [map_stats_player(j, stats_dict.get(j.id)) for j in jugadores_visitante]

    return {
        "partido_id": partido_id,
        "pts_local": partido.pts_local,
        "pts_visitante": partido.pts_visitante,
        "ganador": "local" if partido.pts_local > partido.pts_visitante else "visitante" if partido.pts_visitante > partido.pts_local else "empate",
        "cuadro_izquierdo": {
            "mayor_ventaja":      {"local": str(max_ventaja_l), "visitante": str(max_ventaja_v)},
            "mayor_racha":        {"local": str(max_racha_l),   "visitante": str(max_racha_v)},
            "cambios_liderazgo":  cambios_liderazgo,
            "empates":            empates,
            "tiempo_con_ventaja": {"local": format_time(tiempo_liderando_l), "visitante": format_time(tiempo_liderando_v)}
        },
        "cuadro_derecho": {
            "pts_tras_perdida":        {"local": pts_perdidas_l,    "visitante": pts_perdidas_v},
            "pts_pintura":             {"local": pintura_conv_l * 2, "visitante": pintura_conv_v * 2},
            "pts_segunda_oportunidad": {"local": pts_segunda_opp_l, "visitante": pts_segunda_opp_v},
            "pts_contraataque":        {"local": pts_fastbreak_l,   "visitante": pts_fastbreak_v},
            "pts_banquillo":           {"local": puntos_banca_l,    "visitante": puntos_banca_v},
        },
        "estadisticas": {
            "local":     list_stats_local,
            "visitante": list_stats_visitante
        },
        "progresion_puntos": progresion_puntos
    }
