import React, { useMemo, memo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSearchParams, Link } from 'react-router-dom'
import { Shield, Radio, Clock } from 'lucide-react'
import { usePartido } from '../hooks/usePartido'
import AnimatedNumber from '../components/AnimatedNumber'
import { pct, calculateTeamTotals, getScoreToInterval } from '../utils/stats'

const MeshBackground = memo(() => (
  <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden bg-[#020202]">
    <div className="absolute top-[-5%] left-[-5%] w-[30%] h-[30%] bg-[#0078D4]/10 rounded-full blur-[80px] will-change-transform" />
    <div className="absolute bottom-[-5%] right-[-5%] w-[30%] h-[30%] bg-red-600/5 rounded-full blur-[80px] will-change-transform" />
  </div>
))

const PlayerRow = memo(({ player, stats, colorPrincipal }) => {
  const tc_c = (stats.t2_convertidos || 0) + (stats.t3_convertidos || 0)
  const tc_i = (stats.t2_intentados || 0) + (stats.t3_intentados || 0)
  const esNJ = stats.nj === 1

  return (
    <tr className="hover:bg-white/[0.03] transition-colors border-b border-white/[0.06] group">
      {/* # */}
      <td className="text-center border-r border-white/[0.08] py-1.5 px-1 font-black text-sm" style={{ color: colorPrincipal }}>
        {player.numero}
      </td>
      {/* Nombre */}
      <td className="border-r border-white/[0.08] py-1.5 px-3 min-w-[180px]">
        <div className="flex items-center gap-2">
          {player.es_titular && <span className="text-[#FFB900] text-[10px] font-black">★</span>}
          <span className="text-[12px] font-bold uppercase tracking-tight text-white/80 group-hover:text-white truncate">
            {player.nombre}
          </span>
        </div>
      </td>
      {/* MIN */}
      <td className="text-center border-r border-white/[0.08] py-1.5 px-1 text-[11px] font-mono text-white/40">
        {esNJ ? <span className="text-red-400/60 font-black text-[10px]">NJ</span> : (stats.minutos || '0:00')}
      </td>

      {esNJ ? (
        <>
          {Array(19).fill(null).map((_, i) => (
            <td key={i} className="text-center border-r border-white/[0.08] py-1.5 px-1 text-white/10 text-[11px]">—</td>
          ))}
        </>
      ) : (
        <>
          {/* TC */}
          <td className="text-center border-r border-white/[0.08] py-1.5 px-1 text-[11px] text-white/50">{tc_c}/{tc_i}</td>
          <td className="text-center border-r border-white/[0.08] py-1.5 px-1 text-[10px] text-white/30">{pct(tc_c, tc_i)}</td>
          {/* 2P */}
          <td className="text-center border-r border-white/[0.08] py-1.5 px-1 text-[11px] text-[#0078D4]">{stats.t2_convertidos || 0}/{stats.t2_intentados || 0}</td>
          <td className="text-center border-r border-white/[0.08] py-1.5 px-1 text-[10px] text-[#0078D4]/50">{pct(stats.t2_convertidos, stats.t2_intentados)}</td>
          {/* 3P */}
          <td className="text-center border-r border-white/[0.08] py-1.5 px-1 text-[11px] text-[#fbbf24]">{stats.t3_convertidos || 0}/{stats.t3_intentados || 0}</td>
          <td className="text-center border-r border-white/[0.08] py-1.5 px-1 text-[10px] text-[#fbbf24]/50">{pct(stats.t3_convertidos, stats.t3_intentados)}</td>
          {/* TL */}
          <td className="text-center border-r border-white/[0.08] py-1.5 px-1 text-[11px] text-[#a78bfa]">{stats.tl_convertidos || 0}/{stats.tl_intentados || 0}</td>
          <td className="text-center border-r border-white/[0.08] py-1.5 px-1 text-[10px] text-[#a78bfa]/50">{pct(stats.tl_convertidos, stats.tl_intentados)}</td>
          {/* REB */}
          <td className="text-center border-r border-white/[0.08] py-1.5 px-1 text-[11px] text-white/40">{stats.rebotes_ofensivos || 0}</td>
          <td className="text-center border-r border-white/[0.08] py-1.5 px-1 text-[11px] text-white/40">{stats.rebotes_defensivos || 0}</td>
          <td className="text-center border-r border-white/[0.08] py-1.5 px-1 text-[12px] font-black text-white">{stats.rebotes_totales || 0}</td>
          {/* AS / TO / ST */}
          <td className="text-center border-r border-white/[0.08] py-1.5 px-1 text-[12px] font-bold text-emerald-400">{stats.asistencias || 0}</td>
          <td className="text-center border-r border-white/[0.08] py-1.5 px-1 text-[12px] font-bold text-red-400/60">{stats.perdidas || 0}</td>
          <td className="text-center border-r border-white/[0.08] py-1.5 px-1 text-[12px] font-bold text-cyan-400">{stats.recuperos || 0}</td>
          {/* BS/BA */}
          <td className="text-center border-r border-white/[0.08] py-1.5 px-1 text-[11px] text-white/50">
            {stats.bloqueos || 0}/{stats.bloqueos_recibidos || 0}
          </td>
          {/* FC/FR */}
          <td className="text-center border-r border-white/[0.08] py-1.5 px-1 text-[11px] text-orange-400">
            {stats.faltas || 0}/{stats.faltas_recibidas || 0}
          </td>
          {/* +/- */}
          <td className={`text-center border-r border-white/[0.08] py-1.5 px-1 text-[12px] font-bold ${(stats.mas_menos || 0) > 0 ? 'text-emerald-400' : (stats.mas_menos || 0) < 0 ? 'text-red-400' : 'text-white/20'}`}>
            {stats.mas_menos || 0}
          </td>
          {/* VAL */}
          <td className="text-center border-r border-white/[0.08] py-1.5 px-1 text-[12px] font-bold text-[#fbbf24]">
            {Math.round(stats.eficiencia || 0)}
          </td>
          {/* PTS */}
          <td className="text-center py-1.5 px-2 text-[16px] font-black text-white bg-white/[0.04]">
            <AnimatedNumber value={stats.puntos || 0} />
          </td>
        </>
      )}
    </tr>
  )
}, (prev, next) =>
  prev.stats === next.stats &&
  prev.player.id === next.player.id
)

const TeamTable = memo(({ equipo, jugadores, getStats, puntos, colorAccent, lado }) => {
  const isLeft = lado === 'local'
  const totales = useMemo(() => calculateTeamTotals(jugadores, getStats), [jugadores, getStats])

  return (
    <section className="max-w-[1780px] mx-auto w-full">
      {/* Header equipo */}
      <div
        className={`flex items-center justify-between min-h-20 px-4 sm:px-10 mb-0 py-4 sm:py-0 ${isLeft ? 'border-l-[8px]' : 'border-r-[8px] flex-row-reverse'}`}
        style={{
          borderColor: colorAccent,
          background: `linear-gradient(${isLeft ? 'to right' : 'to left'}, ${colorAccent}22, transparent)`
        }}
      >
        <div className={`flex items-center gap-4 sm:gap-6 ${isLeft ? '' : 'flex-row-reverse'}`}>
          <Shield size={24} className="sm:w-[36px] sm:h-[36px]" style={{ color: colorAccent, filter: `drop-shadow(0 0 12px ${colorAccent}88)` }} />
          <h2 className="text-xl sm:text-4xl font-black italic uppercase tracking-tighter leading-none text-white">
            {equipo?.nombre}
          </h2>
        </div>
        <div className="text-4xl sm:text-7xl font-black text-white italic tabular-nums" style={{ textShadow: `0 0 40px ${colorAccent}66` }}>
          <AnimatedNumber value={puntos} />
        </div>
      </div>

      {/* Tabla */}
      <div className="border border-white/[0.08] bg-[#0a0a0a]">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse" style={{ minWidth: '1100px' }}>
            <thead>
              {/* Fila 1: grupos */}
              <tr className="bg-white/[0.06] border-b border-white/[0.08]">
                <th className="border-r border-white/[0.08] py-1.5 w-10 text-center text-[9px] font-black text-white/20 uppercase tracking-widest" rowSpan={2}>#</th>
                <th className="border-r border-white/[0.08] py-1.5 px-3 text-[9px] font-black text-white/20 uppercase tracking-widest" rowSpan={2}>Jugador</th>
                <th className="border-r border-white/[0.08] py-1.5 text-center text-[9px] font-black text-white/20 uppercase tracking-widest" rowSpan={2}>Min</th>
                <th className="border-r border-white/[0.08] py-1 text-center text-[9px] font-black text-white/30 uppercase tracking-widest" colSpan={2}>Tiros campo</th>
                <th className="border-r border-white/[0.08] py-1 text-center text-[9px] font-black text-[#0078D4]/60 uppercase tracking-widest" colSpan={2}>2 Puntos</th>
                <th className="border-r border-white/[0.08] py-1 text-center text-[9px] font-black text-[#fbbf24]/60 uppercase tracking-widest" colSpan={2}>3 Puntos</th>
                <th className="border-r border-white/[0.08] py-1 text-center text-[9px] font-black text-[#a78bfa]/60 uppercase tracking-widest" colSpan={2}>Tiros libres</th>
                <th className="border-r border-white/[0.08] py-1 text-center text-[9px] font-black text-white/30 uppercase tracking-widest" colSpan={3}>Rebotes</th>
                <th className="border-r border-white/[0.08] py-1 text-center text-[9px] font-black text-emerald-400/60 uppercase tracking-widest" rowSpan={2}>AS</th>
                <th className="border-r border-white/[0.08] py-1 text-center text-[9px] font-black text-red-400/60 uppercase tracking-widest" rowSpan={2}>TO</th>
                <th className="border-r border-white/[0.08] py-1 text-center text-[9px] font-black text-cyan-400/60 uppercase tracking-widest" rowSpan={2}>ST</th>
                <th className="border-r border-white/[0.08] py-1 text-center text-[9px] font-black text-white/30 uppercase tracking-widest" rowSpan={2}>BS/BA</th>
                <th className="border-r border-white/[0.08] py-1 text-center text-[9px] font-black text-orange-400/60 uppercase tracking-widest" rowSpan={2}>FC/FR</th>
                <th className="border-r border-white/[0.08] py-1 text-center text-[9px] font-black text-white/30 uppercase tracking-widest" rowSpan={2}>+/-</th>
                <th className="border-r border-white/[0.08] py-1 text-center text-[9px] font-black text-[#fbbf24]/60 uppercase tracking-widest" rowSpan={2}>VAL</th>
                <th className="py-1 text-center text-[9px] font-black uppercase tracking-widest bg-white/[0.04]" style={{ color: colorAccent }} rowSpan={2}>PTS</th>
              </tr>
              {/* Fila 2: subcolumnas */}
              <tr className="bg-white/[0.03] border-b border-white/[0.08] text-[9px] font-black text-white/20 uppercase tracking-widest">
                <th className="border-r border-white/[0.08] py-1 text-center">C/I</th>
                <th className="border-r border-white/[0.08] py-1 text-center">%</th>
                <th className="border-r border-white/[0.08] py-1 text-center">C/I</th>
                <th className="border-r border-white/[0.08] py-1 text-center">%</th>
                <th className="border-r border-white/[0.08] py-1 text-center">C/I</th>
                <th className="border-r border-white/[0.08] py-1 text-center">%</th>
                <th className="border-r border-white/[0.08] py-1 text-center">C/I</th>
                <th className="border-r border-white/[0.08] py-1 text-center">%</th>
                <th className="border-r border-white/[0.08] py-1 text-center">RO</th>
                <th className="border-r border-white/[0.08] py-1 text-center">RD</th>
                <th className="border-r border-white/[0.08] py-1 text-center">RT</th>
              </tr>
            </thead>
            <tbody>
              {(Array.isArray(jugadores) ? jugadores : []).map((j, i) => (
                <PlayerRow key={j.id} player={j} stats={getStats(j.id)} colorPrincipal={colorAccent} index={i} />
              ))}
              {/* Fila totales */}
              <tr className="border-t border-white/20 bg-white/[0.04]">
                <td colSpan={3} className="border-r border-white/[0.08] py-2 px-3 text-[10px] font-black text-white/40 uppercase tracking-widest">Totales</td>
                <td className="text-center border-r border-white/[0.08] py-2 text-[11px] font-bold text-white/50">{totales.tc_c}/{totales.tc_i}</td>
                <td className="text-center border-r border-white/[0.08] py-2 text-[10px] text-white/30">{pct(totales.tc_c, totales.tc_i)}</td>
                <td className="text-center border-r border-white/[0.08] py-2 text-[11px] font-bold text-[#0078D4]">{totales.t2_c}/{totales.t2_i}</td>
                <td className="text-center border-r border-white/[0.08] py-2 text-[10px] text-[#0078D4]/50">{pct(totales.t2_c, totales.t2_i)}</td>
                <td className="text-center border-r border-white/[0.08] py-2 text-[11px] font-bold text-[#fbbf24]">{totales.t3_c}/{totales.t3_i}</td>
                <td className="text-center border-r border-white/[0.08] py-2 text-[10px] text-[#fbbf24]/50">{pct(totales.t3_c, totales.t3_i)}</td>
                <td className="text-center border-r border-white/[0.08] py-2 text-[11px] font-bold text-[#a78bfa]">{totales.tl_c}/{totales.tl_i}</td>
                <td className="text-center border-r border-white/[0.08] py-2 text-[10px] text-[#a78bfa]/50">{pct(totales.tl_c, totales.tl_i)}</td>
                <td className="text-center border-r border-white/[0.08] py-2 text-[11px] font-bold text-white/40">{totales.ro}</td>
                <td className="text-center border-r border-white/[0.08] py-2 text-[11px] font-bold text-white/40">{totales.rd}</td>
                <td className="text-center border-r border-white/[0.08] py-2 text-[12px] font-black text-white">{totales.rt}</td>
                <td className="text-center border-r border-white/[0.08] py-2 text-[12px] font-black text-emerald-400">{totales.as}</td>
                <td className="text-center border-r border-white/[0.08] py-2 text-[12px] font-black text-red-400/60">{totales.per}</td>
                <td className="text-center border-r border-white/[0.08] py-2 text-[12px] font-black text-cyan-400">{totales.rec}</td>
                <td className="text-center border-r border-white/[0.08] py-2 text-[11px] font-bold text-white/50">{totales.bs}/{totales.ba}</td>
                <td className="text-center border-r border-white/[0.08] py-2 text-[11px] font-bold text-orange-400">{totales.fc}/{totales.fr}</td>
                <td className="text-center border-r border-white/[0.08] py-2 text-[11px] font-bold text-white/30">{totales.mm}</td>
                <td className="text-center border-r border-white/[0.08] py-2 text-[12px] font-black text-[#fbbf24]">{totales.ef}</td>
                <td className="text-center py-2 text-[16px] font-black text-white bg-white/[0.06]">{totales.pts}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
})



export default function ScoreboardPage() {
  const [searchParams] = useSearchParams()
  const id = searchParams.get('id')
  const {
    partido, equipoLocal, equipoVisitante,
    jugadoresLocal, jugadoresVisitante,
    getStats, parciales,
    tiempo_restante // Usar el reloj optimizado
  } = usePartido(id, {
    pollInterval: 3000,
    withParciales: true
  })

  if (!partido) return (
    <div className="h-screen bg-[#020202] flex items-center justify-center font-sans relative overflow-hidden text-white uppercase tracking-widest">
      <MeshBackground />
      <div className="text-center z-10 p-16 bg-[#0a0a0a] border border-white/10">
        <Radio size={48} className="text-[#0078D4] animate-pulse mx-auto mb-8" />
        <h1 className="text-3xl font-black italic mb-4">CARGANDO DATOS</h1>
        <Link to="/admin" className="text-[11px] font-black text-white/40 hover:text-white transition-all border-b border-white/20 pb-1">← VOLVER</Link>
      </div>
    </div>
  )

  const colorLocal = equipoLocal?.color_principal || '#0078D4'
  const colorVisitante = equipoVisitante?.color_principal || '#ef4444'

  return (
    <div className="min-h-screen bg-[#020202] flex flex-col font-sans text-white relative">
      <MeshBackground />

      {/* Header */}
      <header className="min-h-[10vh] bg-black/60 border-b border-white/[0.08] px-4 sm:px-12 flex flex-col md:flex-row items-center justify-between z-40 relative backdrop-blur-md flex-shrink-0 py-4 md:py-0 gap-6">
        <h1 className="text-3xl font-black italic tracking-tighter uppercase">ABAMON <span className="text-[#0078D4]">STATS</span></h1>

        <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-10 bg-white/[0.03] px-4 sm:px-10 py-2 border border-white/[0.08]">
          <div className="flex flex-col items-center">
            <span className="text-[9px] font-black text-white/20 tracking-[0.4em] uppercase mb-0.5">PER</span>
            <div className="text-2xl sm:text-4xl font-black text-[#0078D4] italic leading-none">{partido.cuarto_actual}</div>
          </div>
          <div className="h-8 sm:h-10 w-px bg-white/10" />
          <div className="flex flex-col items-center">
            <span className="text-[9px] font-black text-[#FFB900] tracking-[0.5em] uppercase mb-0.5 flex items-center gap-2">
              <Clock size={11} /> CLOCK
            </span>
            <div className="text-3xl sm:text-5xl font-black text-white tracking-wide leading-none tabular-nums">
              {Math.floor(tiempo_restante / 60)}:{(tiempo_restante % 60).toString().padStart(2, '0')}
            </div>
          </div>
          <div className="hidden sm:block h-10 w-px bg-white/10" />
          <div className="hidden sm:flex flex-col items-center">
            <span className="text-[9px] font-black text-white/20 tracking-widest uppercase mb-0.5">ID</span>
            <div className="text-lg font-mono font-black text-white/10">#{partido.id}</div>
          </div>
        </div>

        <div className="flex items-center gap-3">
  // print nav button removed
          <div className="flex items-center gap-3 bg-emerald-500/10 px-4 py-2 border border-emerald-500/20">
            <Radio size={13} className="text-emerald-500 animate-pulse" />
            <span className="text-[10px] font-black text-emerald-500 tracking-[0.3em] uppercase">EN VIVO</span>
          </div>
        </div>
      </header>

      {/* Parciales */}
      <div className="z-10 relative border-b border-white/[0.06] bg-black/30 px-12 py-4">
        <div className="max-w-[1780px] mx-auto flex items-center gap-8 overflow-x-auto">
          <span className="text-[9px] font-black text-white/20 tracking-[0.5em] uppercase flex-shrink-0">Parciales</span>
          <div className="flex items-stretch divide-x divide-white/[0.08]">
            {[1, 2, 3, 4].map(q => (
              <div key={q} className={`flex flex-col items-center px-6 ${partido.cuarto_actual === q ? 'bg-white/[0.04]' : ''}`}>
                <span className={`text-[8px] font-black tracking-[0.5em] uppercase mb-1 ${partido.cuarto_actual === q ? 'text-[#0078D4]' : 'text-white/15'}`}>C{q}</span>
                <div className="flex gap-2 font-black tabular-nums text-[13px]">
                  <span className={partido.cuarto_actual === q ? 'text-white' : 'text-white/30'}>{getScoreToInterval(partido, parciales, partido.local_id, q, 2) || '—'}</span>
                  <span className="text-white/10">-</span>
                  <span className={partido.cuarto_actual === q ? 'text-white' : 'text-white/30'}>{getScoreToInterval(partido, parciales, partido.visitante_id, q, 2) || '—'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tablas */}
      <main className="flex-1 overflow-y-auto p-8 space-y-12 z-10 relative custom-scrollbar">
        <TeamTable
          equipo={equipoLocal}
          jugadores={jugadoresLocal}
          getStats={getStats}
          puntos={partido.pts_local}
          colorAccent={colorLocal}
          lado="local"
        />
        <TeamTable
          equipo={equipoVisitante}
          jugadores={jugadoresVisitante}
          getStats={getStats}
          puntos={partido.pts_visitante}
          colorAccent={colorVisitante}
          lado="visitante"
        />
      </main>

      <footer className="min-h-10 bg-black border-t border-white/[0.06] px-4 sm:px-12 flex flex-wrap items-center justify-between z-50 text-[10px] font-black uppercase text-white/15 tracking-widest py-2 sm:py-0 gap-4">
        <span>ABAMON Stats System</span>
        <span>{partido.estado === 'en_juego' ? '● En juego' : partido.estado === 'finalizado' ? 'Final' : 'Pendiente'}</span>
      </footer>

  // component call removed
    </div>
  )
}
