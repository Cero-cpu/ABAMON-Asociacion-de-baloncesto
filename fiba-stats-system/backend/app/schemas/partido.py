from pydantic import BaseModel
from datetime import datetime
from typing import Optional
from app.models.partido import EstadoPartido

class PartidoBase(BaseModel):
    local_id: int
    visitante_id: int
    competicion: Optional[str] = None
    cancha: Optional[str] = None
    arbitro_principal: Optional[str] = None
    arbitro_asistente1: Optional[str] = None
    arbitro_asistente2: Optional[str] = None

class PartidoCreate(PartidoBase):
    pass

class PartidoUpdate(BaseModel):
    local_id: Optional[int] = None
    visitante_id: Optional[int] = None
    competicion: Optional[str] = None
    cancha: Optional[str] = None
    arbitro_principal: Optional[str] = None
    arbitro_asistente1: Optional[str] = None
    arbitro_asistente2: Optional[str] = None
    cuarto_actual: Optional[int] = None
    estado: Optional[EstadoPartido] = None
    pts_local: Optional[int] = None
    pts_visitante: Optional[int] = None
    faltas_equipo_local: Optional[int] = None
    faltas_equipo_vis: Optional[int] = None
    timeouts_local: Optional[int] = None
    timeouts_vis: Optional[int] = None
    tiempo_restante: Optional[int] = None
    reloj_activo: Optional[bool] = None

class EquipoMin(BaseModel):
    nombre: str
    abrev: Optional[str]
    color_principal: Optional[str]
    entrenador: Optional[str] = None
    asistente1: Optional[str] = None
    asistente2: Optional[str] = None

    class Config:
        from_attributes = True

class PartidoRead(BaseModel):
    id: int
    fecha: datetime
    cuarto_actual: int
    estado: EstadoPartido
    pts_local: int
    pts_visitante: int
    faltas_equipo_local: int
    faltas_equipo_vis: int
    timeouts_local: int
    timeouts_vis: int
    tiempo_restante: int
    reloj_activo: bool
    local_id: int
    visitante_id: int
    competicion: Optional[str] = None
    cancha: Optional[str]
    arbitro_principal: Optional[str]
    arbitro_asistente1: Optional[str]
    arbitro_asistente2: Optional[str]
    equipo_local: Optional[EquipoMin]
    equipo_visitante: Optional[EquipoMin]

    class Config:
        from_attributes = True
