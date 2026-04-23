from sqlalchemy import Column, Integer, String, DateTime, Enum, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from app.db.database import Base
from datetime import datetime
import enum

class EstadoPartido(str, enum.Enum):
    PENDIENTE  = "pendiente"
    EN_JUEGO   = "en_juego"
    DESCANSO   = "descanso"
    FINALIZADO = "finalizado"

class Partido(Base):
    __tablename__ = "partidos"

    id                 = Column(Integer, primary_key=True, index=True)
    fecha              = Column(DateTime, default=datetime.utcnow)
    local_id           = Column(Integer, ForeignKey("equipos.id"))
    visitante_id       = Column(Integer, ForeignKey("equipos.id"))
    competicion        = Column(String)
    cancha             = Column(String)
    arbitro_principal  = Column(String)
    arbitro_asistente1 = Column(String)
    arbitro_asistente2 = Column(String)
    cuarto_actual      = Column(Integer, default=1)
    estado             = Column(Enum(EstadoPartido), default=EstadoPartido.PENDIENTE)
    pts_local          = Column(Integer, default=0)
    pts_visitante      = Column(Integer, default=0)
    faltas_equipo_local = Column(Integer, default=0)
    faltas_equipo_vis   = Column(Integer, default=0)
    timeouts_local     = Column(Integer, default=0)
    timeouts_vis       = Column(Integer, default=0)
    tiempo_restante    = Column(Integer, default=600)  # Segundos restantes (10 min)
    reloj_activo       = Column(Boolean, default=False)

    equipo_local     = relationship("Equipo", foreign_keys=[local_id])
    equipo_visitante = relationship("Equipo", foreign_keys=[visitante_id])
