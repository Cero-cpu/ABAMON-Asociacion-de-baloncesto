import { useState, useEffect, memo, useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  registrarEvento, deshacerEvento, rehacerEvento, avanzarCuarto,
  guardarParcial, iniciarPartido, finalizarPartido, getPartido,
  toggleReloj, setReloj, actualizarPartido
} from '../services/api'
import {
  RotateCcw, RotateCw, Shield, Terminal, Zap, Cpu, Database,
  ChevronLeft, ChevronRight, Layout, Info, Server, Play, Pause, Timer,
  Edit3, Save
} from 'lucide-react'
import { usePartido } from '../hooks/usePartido'
import HistoryControls from '../components/HistoryControls'

// Componentes Memoizados para alto rendimiento
const StatItem = memo(({ label, value, color }) => (
  <div className="bg-black border border-white/5 px-4 h-12 flex flex-col items-center justify-center min-w-[70px]">
    <span className="text-[8px] font-black text-[#333] uppercase mb-1">{label}</span>
    <span className="text-xl font-oswald font-black italic" style={{ color }}>{value}</span>
  </div>
))

const ActionButton = memo(({ accion, disabled, onClick }) => (
  <button onClick={() => onClick(accion)} disabled={disabled}
    className={`group h-32 border flex flex-col items-center justify-center gap-3 transition-all relative overflow-hidden
    ${disabled ? 'opacity-10 cursor-not-allowed' : 'hover:bg-white/[0.03] active:scale-[0.98]'}
    `}
    style={{ borderColor: accion.dim ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.08)' }}>
    <span className="text-[10px] font-black uppercase tracking-widest text-center px-2" style={{ color: accion.color, opacity: accion.dim ? 0.6 : 1 }}>{accion.label}</span>
    <div className={`w-8 h-[1px] ${accion.dim ? 'bg-[#333]' : ''}`} style={{ backgroundColor: !accion.dim ? accion.color : undefined, opacity: 0.3 }} />
    <div className="absolute top-0 right-0 p-1 opacity-10 group-hover:opacity-100 transition-opacity"><Zap size={10} style={{ color: accion.color }} /></div>
  </button>
))

const PlayerRow = memo(({ j, stats, isSelected, onClick }) => (
  <button onClick={onClick}
    className={`w-full p-3 border text-left flex items-center gap-4 transition-all ${isSelected ? 'bg-[#0078D4]/10 border-[#0078D4]/30' : 'bg-transparent border-transparent hover:bg-white/[0.02]'}`}>
    <span className={`text-2xl font-oswald font-black italic w-8 text-center ${isSelected ? 'text-[#0078D4]' : 'text-[#333]'}`}>#{j.numero}</span>
    <div className="overflow-hidden">
      <p className={`text-[11px] font-black uppercase truncate ${isSelected ? 'text-white' : 'text-[#666]'}`}>{j.nombre}</p>
      <div className="flex gap-3 text-[8px] font-bold text-[#444] tracking-widest">
        <span>{stats.puntos || 0}P</span>
        <span>{stats.rebotes_totales || 0}R</span>
        <span>{stats.faltas || 0}F</span>
      </div>
    </div>
  </button>
))

const ClockDisplay = memo(({ tiempo, activo, formatTime, isEditing, fManual, setFManual }) => {
  if (isEditing) {
    return (
      <div className="flex items-center gap-1">
        <input
          type="number"
          className="w-14 bg-transparent text-center border-b border-white/20"
          value={Math.floor(fManual.tiempo_restante / 60)}
          onChange={e => setFManual({ ...fManual, tiempo_restante: (parseInt(e.target.value) || 0) * 60 + (fManual.tiempo_restante % 60) })}
        />
        <span>:</span>
        <input
          type="number"
          className="w-14 bg-transparent text-center border-b border-white/20"
          value={fManual.tiempo_restante % 60}
          onChange={e => setFManual({ ...fManual, tiempo_restante: (Math.floor(fManual.tiempo_restante / 60) * 60) + (parseInt(e.target.value) || 0) })}
        />
      </div>
    )
  }
  return <>{formatTime(tiempo)}</>
})

const ACCIONES = [
  { grupo: 'TIROS', tipo: 'T2_CONV', label: '2P CONV', color: '#0078D4' },
  { grupo: 'TIROS', tipo: 'T2_FALL', label: '2P FALL', color: '#ff4d4d' },
  { grupo: 'TIROS', tipo: 'T3_CONV', label: '3P CONV', color: '#0078D4' },
  { grupo: 'TIROS', tipo: 'T3_FALL', label: '3P FALL', color: '#ff4d4d' },
  { grupo: 'TIROS', tipo: 'TL_CONV', label: 'TL CONV', color: '#fbbf24' },
  { grupo: 'TIROS', tipo: 'TL_FALL', label: 'TL FALL', color: '#fbbf24' },
  { grupo: 'JUEGO', tipo: 'REB_OF', label: 'REB OF', color: '#a78bfa' },
  { grupo: 'JUEGO', tipo: 'REB_DEF', label: 'REB DEF', color: '#a78bfa' },
  { grupo: 'JUEGO', tipo: 'ASISTENCIA', label: 'ASIST', color: '#2dd4bf' },
  { grupo: 'JUEGO', tipo: 'PERDIDA', label: 'PERDIDA', color: '#f97316' },
  { grupo: 'JUEGO', tipo: 'RECUPERO', label: 'ROBO', color: '#2dd4bf' },
  { grupo: 'DEFENSA', tipo: 'BLOQUEO', label: 'TAPA', color: '#818cf8' },
  { grupo: 'DEFENSA', tipo: 'BLOQUEO_REC', label: 'TAPA REC', color: '#818cf8', dim: true },
  { grupo: 'DEFENSA', tipo: 'FALTA', label: 'FALTA', color: '#f43f5e' },
  { grupo: 'DEFENSA', tipo: 'FALTA_REC', label: 'FALTA REC', color: '#f43f5e', dim: true },
  { grupo: 'ESTADO', tipo: 'NO_JUGO', label: 'NJ', color: '#555' },
]

const STATS_MAP = [
  { key: 'puntos', label: 'PTS', color: '#0078D4' },
  { key: 'rebotes_totales', label: 'REB', color: '#a78bfa' },
  { key: 'asistencias', label: 'AST', color: '#2dd4bf' },
  { key: 'faltas', label: 'PF', color: '#f43f5e' },
  { key: 'eficiencia', label: 'EFF', color: '#fbbf24' },
]

export default function ElectronicoPage() {
  const [inputId, setInputId] = useState('')
  const [partidoId, setPartidoId] = useState(null)
  const [jugadorSel, setJugadorSel] = useState(null)
  const [equipoSel, setEquipoSel] = useState(null)
  const [msg, setMsg] = useState(null)
  const [tab, setTab] = useState('local')

  const [searchParams] = useSearchParams()
  const idFromUrl = searchParams.get('id')

  useEffect(() => {
    if (idFromUrl) { setInputId(idFromUrl); setPartidoId(idFromUrl) }
  }, [idFromUrl])

  const {
    partido, equipoLocal, equipoVisitante,
    jugadoresLocal, jugadoresVisitante, stats,
    tiempo_restante, reloj_activo, parciales,
    refreshPartido, refreshData, refreshJugadores
  } = usePartido(partidoId, { pollInterval: 10000, withParciales: true })

  // Optimización: Mapa de estadísticas para búsqueda O(1)
  const statsMap = useMemo(() => {
    const map = {}
    stats.forEach(s => { map[s.jugador_id] = s })
    return map
  }, [stats])

  const getStats = (jugadorId) => statsMap[jugadorId] || {}
  const [editManual, setEditManual] = useState(false)
  const [fManual, setFManual] = useState({})

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const handleToggleReloj = async () => {
    try {
      await toggleReloj(partidoId)
      refreshPartido()
    } catch (e) {
      flash('ERROR_RELOJ_CONTROL', '#f43f5e')
    }
  }

  const handleSetReloj = async (sec) => {
    try {
      await setReloj(partidoId, sec)
      refreshPartido()
      flash(`TIEMPO_AJUSTADO: ${formatTime(sec)}`, '#0078D4')
    } catch (e) {
      flash('ERROR_RELOJ_SET', '#f43f5e')
    }
  }

  const flash = (text, color = '#0078D4') => {
    setMsg({ text, color })
    setTimeout(() => setMsg(null), 2000)
  }

  // --- Lógica de Intervalos (C1-C4) ---

  const handleTimeout = async (teamId) => {
    if (!partido) return
    try {
      await registrarEvento({
        partido_id: parseInt(partidoId),
        jugador_id: null,
        equipo_id: teamId,
        tipo: 'TIMEOUT',
        cuarto: partido.cuarto_actual,
        tiempo: formatTime(tiempo_restante)
      })
      refreshPartido()
      flash(`TIEMPO MUERTO REGISTRADO`, '#0078D4')
    } catch (e) {
      flash('ERROR AL REGISTRAR TIMEOUT', '#f43f5e')
    }
  }

  const handleAvanzarIntervalo = async () => {
    if (!partido) return
    const q = partido.cuarto_actual

    const p1 = parciales.find(p => p.cuarto === q && p.intervalo === 1)
    const p2 = parciales.find(p => p.cuarto === q && p.intervalo === 2)

    const parcialesPrevios = parciales.filter(p => p.cuarto < q)
    const sumaPreviosLocal = parcialesPrevios.reduce((acc, p) => acc + (p.pts_local || 0), 0)
    const sumaPreviosVis = parcialesPrevios.reduce((acc, p) => acc + (p.pts_visitante || 0), 0)

    const ptsCuartoLocal = partido.pts_local - sumaPreviosLocal
    const ptsCuartoVis = partido.pts_visitante - sumaPreviosVis

    try {
      if (!p1) {
        // Guardar intervalo 1 (5 min)
        if (!confirm(`¿GUARDAR PUNTUACIÓN DE MITAD DEL CUARTO (${q})?`)) return
        await guardarParcial(partidoId, { cuarto: q, intervalo: 1, pts_local: ptsCuartoLocal, pts_visitante: ptsCuartoVis })
        flash(`PUNTOS MITAD C${q} REGISTRADOS`, '#0078D4')
      } else if (!p2) {
        // Guardar intervalo 2 y avanzar
        const isTie = partido.pts_local === partido.pts_visitante;
        let msgConfirm;
        if (q < 4) {
          msgConfirm = `¿FINALIZAR CUARTO ${q} Y AVANZAR AL SIGUIENTE PERIODO?`;
        } else if (isTie) {
          msgConfirm = `¡EMPATE! ¿INICIAR TIEMPO EXTRA (PRÓRROGA)?`;
        } else {
          msgConfirm = `¿FINALIZAR PARTIDO Y CERRAR EL MARCADOR DEFINITIVAMENTE?`;
        }

        if (!confirm(msgConfirm)) return

        const ptsIntervalo2Local = ptsCuartoLocal - (p1.pts_local || 0)
        const ptsIntervalo2Vis = ptsCuartoVis - (p1.pts_visitante || 0)
        await guardarParcial(partidoId, { cuarto: q, intervalo: 2, pts_local: ptsIntervalo2Local, pts_visitante: ptsIntervalo2Vis })

        if (q < 4) {
          await avanzarCuarto(partidoId)
          await handleSetReloj(600) // 10:00
          flash(`CUARTO ${q} CERRADO - INICIANDO C${q + 1}`, '#2ea043')
        } else if (isTie) {
          await avanzarCuarto(partidoId)
          await handleSetReloj(300) // 5:00
          flash(`EMPATE - INICIANDO TIEMPO EXTRA`, '#fbbf24')
        } else {
          await finalizarPartido(partidoId)
          flash(`PARTIDO FINALIZADO DEFINITIVAMENTE`, '#f43f5e')
        }
      }
      refreshPartido()
    } catch (e) {
      flash('ERROR AL PROCESAR CIERRE', '#f43f5e')
    }
  }

  const handleAccion = async (accion) => {
    if (!jugadorSel) { flash('SELECCIONE_ACTIVO_PRIMERO', '#fbbf24'); return }
    await registrarEvento({
      partido_id: parseInt(partidoId),
      jugador_id: jugadorSel.id,
      equipo_id: equipoSel,
      tipo: accion.tipo,
      cuarto: partido.cuarto_actual,
      tiempo: formatTime(tiempo_restante)
    })
    refreshStats()
    refreshPartido()
    flash(`${accion.label} COMPLETADO`, accion.color)
  }

  const handleDeshacer = async () => {
    try {
      await deshacerEvento(partidoId)
      refreshStats()
      refreshPartido()
      flash('ACCIÓN DESHECHA', '#888')
    } catch (e) {
      flash('ERROR: NADA QUE DESHACER', '#f43f5e')
    }
  }

  const handleRehacer = async () => {
    await rehacerEvento(partidoId)
    refreshStats()
    refreshPartido()
    flash('CAMBIO REHECHO', '#0078D4')
  }

  const handleToggleManual = () => {
    if (!partido) return
    if (!editManual) {
      setFManual({
        pts_local: partido.pts_local,
        pts_visitante: partido.pts_visitante,
        faltas_equipo_local: partido.faltas_equipo_local,
        faltas_equipo_vis: partido.faltas_equipo_vis,
        timeouts_local: partido.timeouts_local,
        timeouts_vis: partido.timeouts_vis,
        cuarto_actual: partido.cuarto_actual,
        tiempo_restante: partido.tiempo_restante
      })
    }
    setEditManual(!editManual)
  }

  const handleSaveManual = async () => {
    if (!partidoId || !partido) {
      flash('ID_PARTIDO_NO_ENCONTRADO', '#f43f5e')
      return
    }
    try {
      const dataToSend = {
        ...fManual,
        reloj_activo: reloj_activo // Incluimos el estado actual del reloj
      }
      console.log("Enviando actualización manual:", dataToSend)
      
      await actualizarPartido(parseInt(partidoId), dataToSend)
      setEditManual(false)
      flash('DATOS_GUARDADOS_MANUALMENTE', '#10b981')
      refreshPartido()
    } catch (e) {
      console.error("Error detallado:", e)
      const detail = e.response?.data?.detail
      const fullError = typeof detail === 'object' ? JSON.stringify(detail) : (detail || e.message)
      alert("ERROR AL GUARDAR: " + fullError)
      flash(`ERROR: ${fullError}`, '#f43f5e')
    }
  }

  const handleIniciar = async () => {
    await iniciarPartido(partidoId)
    refreshPartido()
    flash('PARTIDO INICIADO', '#2ea043')
  }

  const handleFinalizar = async () => {
    if (!confirm("¿ESTÁS SEGURO DE FINALIZAR EL PARTIDO?")) return
    await finalizarPartido(partidoId)
    refreshPartido()
    flash('PARTIDO FINALIZADO', '#f43f5e')
  }

  const jugadores = tab === 'local' ? jugadoresLocal : jugadoresVisitante
  const eqActivo = tab === 'local' ? equipoLocal : equipoVisitante

  if (!partido) {
    return (
      <div className="h-screen bg-[#0a0a0a] flex items-center justify-center font-sans overflow-hidden">
        <div className="w-full max-w-sm bg-[#111] p-10 border border-white/5 shadow-2xl relative z-10 text-center">
          <Server size={40} className="text-[#0078D4] mx-auto mb-8 animate-pulse" />
          <h1 className="text-xl font-black tracking-[0.1em] uppercase mb-10 italic text-white">INGRESAR <span className="text-[#0078D4]">ID PARTIDO</span></h1>
          <input
            type="number"
            placeholder="ID DEL PARTIDO"
            value={inputId}
            onChange={e => setInputId(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && inputId && (setPartidoId(inputId))}
            className="control-input w-full h-14 text-2xl font-oswald text-center mb-6"
          />
          <button
            onClick={() => { if (inputId) setPartidoId(inputId) }}
            className="control-button control-button-accent w-full h-12 text-[10px] font-black uppercase tracking-[0.3em]"
          >
            CARGAR PARTIDO
          </button>
          <Link to="/admin" className="block mt-10 text-[#333] hover:text-white transition-colors text-[9px] font-black uppercase tracking-widest">VOLVER AL PANEL</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen bg-[#0a0a0a] flex flex-col font-sans overflow-hidden text-white relative">
      <div className="scanline" />

      {/* ── TOOLBAR SUPERIOR (FIRMWARE STYLE) ── */}
      <header className="h-10 bg-[#161616] border-b border-white/5 flex items-center px-6 justify-between flex-shrink-0 z-50">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <Shield size={14} className="text-[#0078D4]" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] italic">FIBA_CONSOLE_v3.0.4</span>
          </div>
          <div className="h-4 w-px bg-white/5" />
          <HistoryControls />
          <div className="h-4 w-px bg-white/5" />

          <div className="flex items-center gap-1 ml-2">
            <button
              onClick={handleDeshacer}
              className="flex items-center gap-2 px-3 py-1 rounded bg-white/5 border border-white/5 hover:bg-[#f43f5e]/10 hover:border-[#f43f5e]/30 hover:text-[#f43f5e] transition-all text-[10px] font-black uppercase tracking-widest group"
              title="Deshacer último cambio"
            >
              <RotateCcw size={14} className="group-active:-rotate-180 transition-transform duration-500" />
              <span>Deshacer</span>
            </button>
            <button
              onClick={handleRehacer}
              className="flex items-center gap-2 px-3 py-1 rounded bg-white/5 border border-white/5 hover:bg-[#0078D4]/10 hover:border-[#0078D4]/30 hover:text-[#0078D4] transition-all text-[10px] font-black uppercase tracking-widest group"
              title="Rehacer cambio"
            >
              <span>Rehacer</span>
              <RotateCw size={14} className="group-active:rotate-180 transition-transform duration-500" />
            </button>
          </div>

          <div className="h-4 w-px bg-white/5" />

          <button
            onClick={handleToggleManual}
            className={`flex items-center gap-2 px-4 py-1 rounded transition-all text-[10px] font-black uppercase tracking-widest ${editManual ? 'bg-[#fbbf24] text-black shadow-[0_0_15px_rgba(251,191,36,0.3)]' : 'bg-white/5 border border-white/5 text-[#fbbf24] hover:bg-[#fbbf24]/10'}`}
          >
            <Edit3 size={14} />
            <span>{editManual ? 'CANCELAR EDICIÓN' : 'EDICIÓN MANUAL'}</span>
          </button>

          {editManual && (
            <button
              onClick={handleSaveManual}
              className="flex items-center gap-2 px-4 py-1 rounded bg-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.3)] text-[10px] font-black uppercase tracking-widest animate-pulse"
            >
              <Save size={14} />
              <span>GUARDAR CAMBIOS</span>
            </button>
          )}
        </div>

        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2">
            <Cpu size={12} className="text-[#444]" />
            <span className="text-[9px] font-bold text-[#444] tracking-widest uppercase font-mono">ID PARTIDO: {partido.id}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            <span className="text-[9px] font-black text-[#555] uppercase tracking-widest">CONEXIÓN ESTABLE</span>
          </div>
        </div>
      </header>

      {/* ── SCORE BANNER ── */}
      <div className="h-24 bg-[#111] border-b border-white/5 flex items-center justify-between px-10 flex-shrink-0">

        {/* Local Team Info */}
        <div className="flex-1 flex items-center gap-6 overflow-hidden">
          <div className="w-3 h-12" style={{ backgroundColor: equipoLocal?.color_principal }} />
          <div className="overflow-hidden">
            <h2 className="text-2xl font-black italic uppercase tracking-tighter truncate">{equipoLocal?.nombre}</h2>
            <div className="flex items-center gap-6 mt-1">
              <p className="text-[9px] font-black text-[#444] tracking-widest uppercase">EQUIPO LOCAL</p>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-black text-white/40">FALTAS:</span>
                  {editManual ? (
                    <input
                      type="number"
                      className="w-12 bg-black/40 border border-[#0078D4]/40 text-[#0078D4] font-oswald text-center text-sm"
                      value={fManual.faltas_equipo_local}
                      onChange={e => setFManual({ ...fManual, faltas_equipo_local: parseInt(e.target.value) || 0 })}
                    />
                  ) : (
                    <span className={`text-[12px] font-oswald font-black ${partido.faltas_equipo_local >= 4 ? 'text-red-500' : 'text-[#0078D4]'}`}>
                      {partido.faltas_equipo_local}
                    </span>
                  )}
                  {partido.faltas_equipo_local >= 4 && (
                    <span className="px-1.5 py-0.5 bg-red-600 text-white text-[7px] font-black rounded-sm animate-pulse shadow-[0_0_10px_rgba(220,38,38,0.5)]">BONUS</span>
                  )}
                </div>
                <div className="h-3 w-px bg-white/10" />
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black text-white/40">T.O.:</span>
                  {editManual ? (
                    <input
                      type="number"
                      className="w-10 bg-black/40 border border-[#0078D4]/40 text-[#0078D4] font-oswald text-center text-sm"
                      max={3}
                      min={0}
                      value={fManual.timeouts_local}
                      onChange={e => setFManual({ ...fManual, timeouts_local: parseInt(e.target.value) || 0 })}
                    />
                  ) : (
                    <div className="flex gap-1">
                      {[1, 2, 3].map(i => (
                        <div key={i} className={`w-2 h-2 rounded-full ${i <= partido.timeouts_local ? 'bg-[#0078D4]' : 'bg-white/10'}`} />
                      ))}
                    </div>
                  )}
                  {!editManual && (
                    <button
                      onClick={() => handleTimeout(partido.local_id)}
                      className="ml-1 w-6 h-6 bg-white/5 border border-white/5 hover:bg-[#0078D4]/20 hover:border-[#0078D4]/50 flex items-center justify-center rounded-sm transition-all"
                      title="Registrar Tiempo Muerto"
                    >
                      <Timer size={12} className="text-[#0078D4]" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
          {editManual ? (
            <input
              type="number"
              className="w-28 h-16 bg-black/60 border border-[#0078D4] text-white font-oswald font-black text-5xl text-center italic ml-auto mr-10 tabular-nums"
              value={fManual.pts_local}
              onChange={e => setFManual({ ...fManual, pts_local: parseInt(e.target.value) || 0 })}
            />
          ) : (
            <div className="text-6xl font-oswald font-black text-white italic ml-auto mr-10 tabular-nums">{partido.pts_local}</div>
          )}
        </div>

        <div className="flex flex-col items-center gap-2 min-w-[340px] border-x border-white/5 h-full justify-center bg-white/[0.01]">
          {/* Cronómetro y Periodo */}
          <div className="flex items-center gap-6">
            <div className="flex flex-col items-center">
              <span className="text-[7px] font-black text-white/20 uppercase tracking-[0.3em] mb-1">RELOJ</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleToggleReloj}
                  className={`w-10 h-10 flex items-center justify-center rounded border transition-all ${reloj_activo ? 'bg-red-500/20 border-red-500/50 text-red-500' : 'bg-emerald-500/20 border-emerald-500/50 text-emerald-500'}`}
                >
                  {reloj_activo ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}
                </button>
                <div className="bg-black/40 border border-white/5 text-white font-oswald text-4xl text-center w-32 h-12 flex items-center justify-center tabular-nums shadow-inner">
                  <ClockDisplay 
                    tiempo={tiempo_restante} 
                    activo={reloj_activo} 
                    formatTime={formatTime} 
                    isEditing={editManual} 
                    fManual={fManual} 
                    setFManual={setFManual} 
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <button onClick={() => handleSetReloj(600)} className="w-8 h-5 bg-white/5 hover:bg-white/10 flex items-center justify-center rounded text-[8px] font-bold">10</button>
                  <button onClick={() => handleSetReloj(tiempo_restante + 60)} className="w-8 h-5 bg-white/5 hover:bg-white/10 flex items-center justify-center rounded text-[8px] font-bold">+1</button>
                </div>
              </div>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-[7px] font-black text-white/20 uppercase tracking-[0.3em] mb-1">PERIODO</span>
              {editManual ? (
                <input
                  type="number"
                  className="bg-[#0078D4]/10 border border-[#0078D4]/30 text-[#0078D4] font-oswald font-black text-3xl w-16 h-12 text-center"
                  value={fManual.cuarto_actual}
                  onChange={e => setFManual({ ...fManual, cuarto_actual: parseInt(e.target.value) || 1 })}
                />
              ) : (
                <div className="bg-[#0078D4]/10 border border-[#0078D4]/30 text-[#0078D4] font-oswald font-black text-3xl w-16 h-12 flex items-center justify-center shadow-[0_0_15_rgba(0,120,212,0.1)]">P{partido.cuarto_actual}</div>
              )}
            </div>
          </div>

          {/* Acciones de Control Maestro */}
          <div className="flex gap-2 w-full px-4">
            {partido.estado === 'finalizado' ? (
              <div
                className="w-full h-10 bg-[#f43f5e]/20 border border-[#f43f5e]/40 text-[#f43f5e] text-[10px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-2 shadow-[0_5px_15px_rgba(244,63,94,0.1)] cursor-not-allowed"
              >
                <Shield size={12} fill="currentColor" /> PARTIDO FINALIZADO
              </div>
            ) : partido.estado !== 'en_juego' ? (
              <button
                onClick={handleIniciar}
                className="w-full h-10 bg-[#2ea043] border border-[#2ea043]/40 text-white text-[10px] font-black uppercase tracking-[0.2em] hover:bg-[#3fb950] transition-all flex items-center justify-center gap-2 shadow-[0_5px_15px_rgba(46,160,67,0.2)]"
              >
                <Zap size={12} fill="currentColor" /> INICIAR PARTIDO
              </button>
            ) : (
              <>
                <button
                  onClick={handleAvanzarIntervalo}
                  className={`flex-1 h-10 border text-white text-[9px] font-black uppercase tracking-[0.15em] transition-all shadow-[0_5px_15px_rgba(0,120,212,0.3)] flex items-center justify-center text-center px-2 ${parciales.find(p => p.cuarto === partido.cuarto_actual && p.intervalo === 1) && partido.cuarto_actual >= 4 && partido.pts_local !== partido.pts_visitante
                      ? 'bg-[#f43f5e] border-[#f43f5e]/50 hover:bg-[#e11d48] shadow-[0_5px_15px_rgba(244,63,94,0.3)]'
                      : 'bg-[#0078D4] border-[#0078D4]/50 hover:bg-[#0086F0]'
                    }`}
                >
                  {!parciales.find(p => p.cuarto === partido.cuarto_actual && p.intervalo === 1)
                    ? `GUARDAR PUNTOS @5:00`
                    : (partido.cuarto_actual >= 4 && partido.pts_local !== partido.pts_visitante)
                      ? 'FINALIZAR PARTIDO'
                      : (partido.cuarto_actual >= 4 && partido.pts_local === partido.pts_visitante)
                        ? 'IR A PRÓRROGA'
                        : `CERRAR CUARTO ${partido.cuarto_actual}`
                  }
                </button>
                <button
                  onClick={handleFinalizar}
                  className="w-10 h-10 bg-red-500/10 border border-red-500/30 text-red-500 hover:bg-red-500 hover:text-white transition-all flex items-center justify-center flex-shrink-0"
                  title="Detener Sesión"
                >
                  <RotateCcw size={16} />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Visitor Team Info */}
        <div className="flex-1 flex items-center gap-6 overflow-hidden flex-row-reverse">
          <div className="w-3 h-12" style={{ backgroundColor: equipoVisitante?.color_principal }} />
          <div className="overflow-hidden text-right">
            <h2 className="text-2xl font-black italic uppercase tracking-tighter truncate">{equipoVisitante?.nombre}</h2>
            <div className="flex items-center justify-end gap-6 mt-1">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  {editManual ? (
                    <input
                      type="number"
                      className="w-10 bg-black/40 border border-[#0078D4]/40 text-[#0078D4] font-oswald text-center text-sm"
                      max={3}
                      min={0}
                      value={fManual.timeouts_vis}
                      onChange={e => setFManual({ ...fManual, timeouts_vis: parseInt(e.target.value) || 0 })}
                    />
                  ) : (
                    <div className="flex gap-1">
                      {[1, 2, 3].map(i => (
                        <div key={i} className={`w-2 h-2 rounded-full ${i <= partido.timeouts_vis ? 'bg-[#0078D4]' : 'bg-white/10'}`} />
                      ))}
                    </div>
                  )}
                  {!editManual && (
                    <button
                      onClick={() => handleTimeout(partido.visitante_id)}
                      className="mr-1 w-6 h-6 bg-white/5 border border-white/5 hover:bg-[#0078D4]/20 hover:border-[#0078D4]/50 flex items-center justify-center rounded-sm transition-all"
                      title="Registrar Tiempo Muerto"
                    >
                      <Timer size={12} className="text-[#0078D4]" />
                    </button>
                  )}
                  <span className="text-[10px] font-black text-white/40">T.O.:</span>
                </div>
                <div className="h-3 w-px bg-white/10" />
                <div className="flex items-center gap-2">
                  {partido.faltas_equipo_vis >= 4 && (
                    <span className="px-1.5 py-0.5 bg-red-600 text-white text-[7px] font-black rounded-sm animate-pulse shadow-[0_0_10px_rgba(220,38,38,0.5)]">BONUS</span>
                  )}
                  <span className="text-[10px] font-black text-white/40">FALTAS:</span>
                  {editManual ? (
                    <input
                      type="number"
                      className="w-12 bg-black/40 border border-[#0078D4]/40 text-[#0078D4] font-oswald text-center text-sm"
                      value={fManual.faltas_equipo_vis}
                      onChange={e => setFManual({ ...fManual, faltas_equipo_vis: parseInt(e.target.value) || 0 })}
                    />
                  ) : (
                    <span className={`text-[12px] font-oswald font-black ${partido.faltas_equipo_vis >= 4 ? 'text-red-500' : 'text-[#0078D4]'}`}>
                      {partido.faltas_equipo_vis}
                    </span>
                  )}
                </div>
              </div>
              <p className="text-[9px] font-black text-[#444] tracking-widest uppercase">EQUIPO VISITANTE</p>
            </div>
          </div>
          {editManual ? (
            <input
              type="number"
              className="w-28 h-16 bg-black/60 border border-[#0078D4] text-white font-oswald font-black text-5xl text-center italic mr-auto ml-10 tabular-nums"
              value={fManual.pts_visitante}
              onChange={e => setFManual({ ...fManual, pts_visitante: parseInt(e.target.value) || 0 })}
            />
          ) : (
            <div className="text-6xl font-oswald font-black text-white italic mr-auto ml-10 tabular-nums">{partido.pts_visitante}</div>
          )}
        </div>
      </div>

      {/* ── CORE LAYOUT ── */}
      <div className="flex-1 flex overflow-hidden">

        {/* SIDEBAR: ACTIVE UNITS */}
        <aside className="w-72 bg-[#121212] border-r border-white/5 flex flex-col flex-shrink-0">
          <div className="p-1 flex bg-black border-b border-white/5">
            {['local', 'visitante'].map(t => (
              <button key={t} onClick={() => setTab(t)} className={`flex-1 py-2 text-[9px] font-black uppercase tracking-widest ${tab === t ? 'bg-[#1a1a1a] text-[#0078D4]' : 'text-[#444]'}`}>
                {t === 'local' ? 'LOCAL' : 'VISITANTE'}
              </button>
            ))}
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
            {jugadores.map(j => (
              <PlayerRow 
                key={j.id} 
                j={j} 
                stats={getStats(j.id)} 
                isSelected={jugadorSel?.id === j.id} 
                onClick={() => { setJugadorSel(j); setEquipoSel(tab === 'local' ? partido.local_id : partido.visitante_id) }}
              />
            ))}
          </div>
        </aside>

        {/* MAIN DECK: ACTION MATRIX */}
        <main className="flex-1 flex flex-col p-6 gap-6 relative">

          {/* CURRENT ACTIVE FOCUS */}
          <div className="h-24 bg-[#111] border border-white/5 flex items-center px-8 justify-between relative overflow-hidden flex-shrink-0">
            <div className="absolute top-0 right-0 w-32 h-full bg-[#0078D4] blur-[80px] opacity-[0.03]" />
            {!jugadorSel ? (
              <span className="text-[10px] font-black text-[#333] tracking-[0.6em] italic animate-pulse">POR FAVOR, SELECCIONA UN JUGADOR</span>
            ) : (
              <>
                <div className="flex items-center gap-6">
                  <h3 className="text-4xl font-oswald font-black italic text-white tracking-widest">
                    <span className="text-[#0078D4] mr-4">#{jugadorSel.numero}</span>
                    {jugadorSel.nombre.toUpperCase()}
                  </h3>
                </div>
                <div className="flex gap-1">
                  {STATS_MAP.map(s => (
                    <StatItem 
                      key={s.key} 
                      label={s.label} 
                      value={getStats(jugadorSel.id)[s.key] || 0} 
                      color={s.color} 
                    />
                  ))}
                </div>
              </>
            )}
          </div>

          {/* ACTION GRID - Grouped for Logic */}
          <div className="flex-1 grid grid-cols-4 xl:grid-cols-6 gap-2 content-start overflow-y-auto custom-scrollbar pr-2">
            {ACCIONES.map(a => (
              <ActionButton 
                key={a.tipo} 
                accion={a} 
                disabled={!jugadorSel} 
                onClick={handleAccion} 
              />
            ))}
          </div>

          {/* FLASH NOTIFIER */}
          <AnimatePresence>
            {msg && (
              <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }}
                className="absolute bottom-10 left-10 right-10 z-50 pointer-events-none flex justify-center">
                <div className="bg-[#161616] border-l-4 px-8 py-4 shadow-2xl flex items-center gap-4 min-w-[300px]" style={{ borderColor: msg.color }}>
                  <div className="w-2 h-2 rounded-full animate-ping" style={{ backgroundColor: msg.color }} />
                  <span className="text-[11px] font-black uppercase tracking-widest" style={{ color: msg.color }}>{msg.text}</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>

      {/* ── STATUS BAR ── */}
      <footer className="h-8 bg-[#161616] border-t border-white/5 flex items-center px-10 justify-between flex-shrink-0 z-50">
        <div className="flex gap-8 items-center">
          <div className="flex items-center gap-2 text-[9px] font-bold text-[#444]">
            <Database size={12} />
            <span>DATABASE: READ/WRITE</span>
          </div>
        </div>
        <div className="text-[10px] font-black italic tracking-[0.4em] text-[#222] uppercase">INTERFAZ DE CONTROL FIBA v3.0</div>
      </footer>
    </div>
  )
}
