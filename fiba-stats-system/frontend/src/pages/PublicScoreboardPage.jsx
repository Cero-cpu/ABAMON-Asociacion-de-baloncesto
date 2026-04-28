import React, { memo, useMemo } from 'react'
import { motion } from 'framer-motion'
import { useSearchParams } from 'react-router-dom'
import { usePartido } from '../hooks/usePartido'
import AnimatedNumber from '../components/AnimatedNumber'

const pad = (n) => String(n).padStart(2, '0')
const fmt = (s) => `${Math.floor(s / 60)}:${pad(s % 60)}`

const TeamPanel = memo(({ nombre, puntos, color = '#0078D4', side = 'left' }) => {
  const isLeft = side === 'left'
  return (
    <div
      className="flex-1 flex flex-col justify-between h-full px-12 py-10 relative overflow-hidden"
      style={{ borderLeft: isLeft ? `6px solid ${color}` : 'none', borderRight: !isLeft ? `6px solid ${color}` : 'none' }}
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: `radial-gradient(ellipse at ${isLeft ? '0% 100%' : '100% 100%'}, ${color}18 0%, transparent 65%)` }}
      />
      <div className={`relative z-10 ${isLeft ? 'text-left' : 'text-right'}`}>
        <p className="text-[11px] font-black tracking-[0.5em] text-white/20 uppercase mb-2">
          {isLeft ? 'LOCAL' : 'VISITANTE'}
        </p>
        <h2 className="text-[3.8vw] font-black uppercase leading-none tracking-tight" style={{ color }}>
          {nombre}
        </h2>
      </div>
      <div className={`relative z-10 ${isLeft ? 'text-left' : 'text-right'}`}>
        <div
          className="font-black leading-none tabular-nums"
          style={{ fontSize: 'clamp(100px, 22vw, 280px)', color: 'white', textShadow: `0 0 120px ${color}55`, fontVariantNumeric: 'tabular-nums' }}
        >
          <AnimatedNumber value={puntos} />
        </div>
      </div>
    </div>
  )
})

const CenterHUD = memo(({ partido }) => {
  const isLive = partido.estado === 'en_juego'
  const isFinal = partido.estado === 'finalizado'
  return (
    <div className="flex flex-col items-center justify-between py-10 px-4 min-w-[220px] z-10 relative">
      <div className="flex flex-col items-center gap-1">
        <span className="text-[9px] font-black tracking-[0.6em] text-white/15 uppercase">FIBA STATS</span>
        <div className="w-12 h-px bg-white/10" />
      </div>
      <div className="flex flex-col items-center gap-6">
        {isLive && (
          <div className="flex items-center gap-2 bg-emerald-500/15 border border-emerald-500/30 px-4 py-1.5 rounded-full">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[10px] font-black tracking-[0.3em] text-emerald-400 uppercase">EN VIVO</span>
          </div>
        )}
        {isFinal && (
          <div className="flex items-center gap-2 bg-[#f43f5e]/15 border border-[#f43f5e]/30 px-5 py-2 rounded-full mb-2">
            <span className="text-[11px] font-black tracking-[0.4em] text-[#f43f5e] uppercase">FINALIZADO</span>
          </div>
        )}
        {!isLive && !isFinal && (
          <div className="flex items-center gap-2 border border-white/10 px-4 py-1.5 rounded-full">
            <span className="text-[10px] font-black tracking-[0.3em] text-white/20 uppercase">PENDIENTE</span>
          </div>
        )}
        <div className="flex flex-col items-center">
          <span className="text-[9px] font-black tracking-[0.5em] text-white/20 uppercase mb-1">PER.</span>
          <div className="font-black leading-none tabular-nums" style={{ fontSize: 'clamp(56px,8vw,96px)', color: '#FFB900' }}>
            {partido.cuarto_actual}
          </div>
        </div>
        <div className="w-px h-8 bg-white/10" />
        <div className="flex flex-col items-center">
          <span className="text-[9px] font-black tracking-[0.5em] text-white/20 uppercase mb-1">TIEMPO</span>
          <div className="font-black leading-none tabular-nums tracking-tighter" style={{ fontSize: 'clamp(36px, 5vw, 64px)', color: 'white' }}>
            {fmt(partido.tiempo_restante)}
          </div>
        </div>
      </div>
      <div className="flex flex-col items-center gap-1">
        {partido.competicion && (
          <span className="text-[9px] font-black tracking-widest text-white/20 uppercase text-center max-w-[180px] leading-relaxed">
            {partido.competicion}
          </span>
        )}
        <div className="w-12 h-px bg-white/10" />
      </div>
    </div>
  )
})

const ParcialesBar = memo(({ parciales, partido }) => {
  const quarters = useMemo(() => {
    return [1, 2, 3, 4].map(q => {
      const qParciales = parciales?.filter(p => p.cuarto === q) || []
      const isActive = partido.cuarto_actual === q

      // Para cuartos pasados, sumamos los intervalos guardados
      let local = qParciales.reduce((sum, p) => sum + (p.pts_local || 0), 0)
      let visitor = qParciales.reduce((sum, p) => sum + (p.pts_visitante || 0), 0)
      let hasData = qParciales.length > 0

      // Para el cuarto activo, calculamos los puntos actuales del cuarto basándonos en el total del partido
      if (isActive) {
        const parcialesPrevios = parciales?.filter(p => p.cuarto < q) || []
        const sumaPreviosLocal = parcialesPrevios.reduce((acc, p) => acc + (p.pts_local || 0), 0)
        const sumaPreviosVis = parcialesPrevios.reduce((acc, p) => acc + (p.pts_visitante || 0), 0)

        local = partido.pts_local - sumaPreviosLocal
        visitor = partido.pts_visitante - sumaPreviosVis
        hasData = true
      }

      return { q, local, visitor, isActive, hasData }
    })
  }, [parciales, partido.cuarto_actual, partido.pts_local, partido.pts_visitante])

  const totalLocal = quarters.reduce((s, q) => s + (q.local ?? 0), 0)
  const totalVisitor = quarters.reduce((s, q) => s + (q.visitor ?? 0), 0)

  return (
    <div className="w-full border-t border-white/[0.08] bg-black/60 backdrop-blur-xl relative z-20">
      <div className="w-full flex items-stretch divide-x divide-white/[0.08]">
        <div className="flex flex-col justify-center px-[3vw] py-[1.5vh] min-w-[12vw]">
          <span className="text-[0.7vw] font-black tracking-[0.6em] text-white/30 uppercase">INTERVALOS</span>
          <span className="text-[0.55vw] font-bold text-white/10 uppercase mt-0.5">FIBA STANDARDS</span>
        </div>

        {quarters.map(({ q, local, visitor, isActive, hasData }) => (
          <div
            key={q}
            className={`flex-1 flex flex-col items-center justify-center py-[2vh] transition-all duration-500 relative ${isActive ? 'bg-white/[0.06] shadow-[inset_0_0_40px_rgba(255,255,255,0.03)]' : ''
              }`}
          >
            {isActive && (
              <motion.div
                layoutId="activeQuarter"
                className="absolute inset-x-0 top-0 h-1 bg-[#0078D4] shadow-[0_0_15px_#0078D4]"
              />
            )}
            <span className={`text-[0.8vw] font-black tracking-[0.4em] uppercase mb-[1vh] ${isActive ? 'text-[#0078D4] drop-shadow-[0_0_8px_rgba(0,120,212,0.4)]' : 'text-white/20'
              }`}>
              CUARTO {q}
            </span>
            <div className={`flex items-center gap-[1.5vw] font-black tabular-nums transition-scale duration-300 ${isActive ? 'scale-110' : ''}`}>
              <span className={`text-[2.2vw] ${isActive || hasData ? 'text-white' : 'text-white/10'}`}>
                {local}
              </span>
              <span className="text-[1.2vw] text-white/10 font-light">—</span>
              <span className={`text-[2.2vw] ${isActive || hasData ? 'text-white' : 'text-white/10'}`}>
                {visitor}
              </span>
            </div>
          </div>
        ))}

        <div className="flex flex-col items-center justify-center py-[2vh] px-[4vw] bg-white/[0.04] border-l-2 border-white/5 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent pointer-events-none" />
          <span className="text-[0.8vw] font-black tracking-[0.8em] text-white/40 uppercase mb-[1vh] relative z-10">TOTAL</span>
          <div className="flex items-center gap-[1.5vw] font-black tabular-nums text-white relative z-10">
            <span className="text-[2.5vw] drop-shadow-[0_0_30px_rgba(255,255,255,0.2)]">{totalLocal}</span>
            <span className="text-[1.5vw] text-white/20 font-thin">—</span>
            <span className="text-[2.5vw] drop-shadow-[0_0_30px_rgba(255,255,255,0.2)]">{totalVisitor}</span>
          </div>
        </div>
      </div>
    </div>
  )
})

export default function PublicScoreboardPage() {
  const [searchParams] = useSearchParams()
  const id = searchParams.get('id')

  const { partido, equipoLocal, equipoVisitante, parciales } = usePartido(id, {
    pollInterval: 2500,
    withParciales: true,
  })

  if (!partido) {
    return (
      <div className="h-screen bg-[#080808] flex flex-col items-center justify-center gap-6 select-none">
        <div className="w-12 h-12 border-2 border-white/10 border-t-white/40 rounded-full animate-spin" />
        <span className="text-[10px] font-black tracking-[0.8em] text-white/20 uppercase">Conectando...</span>
      </div>
    )
  }

  const colorLocal = equipoLocal?.color_principal || '#0078D4'
  const colorVisitante = equipoVisitante?.color_principal || '#ef4444'

  return (
    <div className="h-screen w-screen bg-[#080808] flex flex-col font-sans text-white overflow-hidden select-none">
      <main className="flex-1 flex items-stretch overflow-hidden">
        <motion.div className="flex-1 flex" initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, ease: 'easeOut' }}>
          <TeamPanel nombre={equipoLocal?.nombre || 'LOCAL'} puntos={partido.pts_local} color={colorLocal} side="left" />
        </motion.div>
        <div className="w-px bg-white/[0.05] self-stretch" />
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}>
          <CenterHUD partido={partido} />
        </motion.div>
        <div className="w-px bg-white/[0.05] self-stretch" />
        <motion.div className="flex-1 flex flex-row-reverse" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, ease: 'easeOut' }}>
          <TeamPanel nombre={equipoVisitante?.nombre || 'VISITANTE'} puntos={partido.pts_visitante} color={colorVisitante} side="right" />
        </motion.div>
      </main>
      <ParcialesBar parciales={parciales} partido={partido} />
      <footer className="h-8 bg-black/40 border-t border-white/[0.04] flex items-center justify-between px-10">
        <span className="text-[8px] font-black tracking-[0.5em] text-white/10 uppercase">FIBA Stats System</span>
        {partido.cancha && <span className="text-[8px] font-black tracking-[0.4em] text-white/10 uppercase">{partido.cancha}</span>}
        <span className="text-[8px] font-black tracking-[0.5em] text-white/10 uppercase">
          {partido.estado === 'en_juego' ? '● En juego' : partido.estado === 'finalizado' ? 'Finalizado' : 'Pendiente'}
        </span>
      </footer>
    </div>
  )
}
