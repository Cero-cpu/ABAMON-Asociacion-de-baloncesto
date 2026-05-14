import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Calendar, List, Trophy, ChevronRight, LayoutDashboard, Search, Filter, Shield, Activity, Database, Clock, Terminal, Printer } from 'lucide-react'
import HistoryControls from '../components/HistoryControls'
import { getPartidos, getResumenPartido, getParciales, getEquipo } from '../services/api'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

const MatchCard = ({ match, index }) => {
  const isFinal = match.estado === 'finalizado'
  const inProgress = match.estado === 'en_juego'

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
      className="group relative bg-[#111] border border-white/5 hover:border-[#0078D4]/40 transition-all duration-500 overflow-hidden"
    >
      <Link to={inProgress ? `/operacion/${match.id}` : `/panel-de-datos?id=${match.id}`} className="block">
        <div className="absolute top-0 left-0 w-full h-1 bg-white/5 group-hover:bg-[#0078D4] transition-colors" />

        <div className="p-7 space-y-6 relative z-10">
          {/* HEADER INFO */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-1.5 h-1.5 rounded-full ${inProgress ? 'bg-red-500 animate-ping' : isFinal ? 'bg-[#333]' : 'bg-[#0078D4]'}`} />
              <span className={`text-[8px] font-black uppercase tracking-[0.1em] px-2 py-0.5 rounded-sm ${inProgress ? 'text-red-500' : 'text-[#666] bg-white/[0.02] border border-white/5'}`}>
                {match.estado === 'en_juego' ? 'STATUS_VIVO' : 'STATUS_ARCHIVO'}
              </span>
            </div>
            <span className="text-[8px] font-mono text-[#333] tracking-tighter uppercase">ID: 0x{match.id.toString(16).toUpperCase()}</span>
          </div>

          {/* MAIN SCORE AREA */}
          <div className="flex flex-col items-center gap-4">
            <div className="flex items-center justify-center gap-8 w-full">
              <div className="flex-1 flex flex-col items-end overflow-hidden">
                <span className="text-[9px] font-black text-[#222] mb-1 uppercase tracking-widest">{match.equipo_local?.abrev || 'LOC'}</span>
                <span className="text-3xl font-oswald font-black text-white group-hover:text-[#0078D4] transition-colors truncate">{match.pts_local}</span>
              </div>

              <div className="flex flex-col items-center flex-shrink-0">
                <div className="w-px h-6 bg-white/5" />
                <span className="text-[12px] font-oswald font-black text-[#1a1a1a] italic my-1">VS</span>
                <div className="w-px h-6 bg-white/5" />
              </div>

              <div className="flex-1 flex flex-col items-start overflow-hidden">
                <span className="text-[9px] font-black text-[#222] mb-1 uppercase tracking-widest">{match.equipo_visitante?.abrev || 'VIS'}</span>
                <span className="text-3xl font-oswald font-black text-white group-hover:text-[#0078D4] transition-colors truncate">{match.pts_visitante}</span>
              </div>
            </div>
          </div>

          {/* FOOTER METADATA */}
          <div className="pt-6 border-t border-white/5 flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-[7px] font-black text-[#222] uppercase mb-0.5">STATION</span>
              <span className="text-[10px] font-bold text-[#444] uppercase tracking-wider">{match.cancha || 'ARENA_01'}</span>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex flex-col items-end">
                <span className="text-[7px] font-black text-[#222] uppercase mb-0.5">DATE_REF</span>
                <span className="text-[10px] font-mono text-[#444]">{format(new Date(match.fecha), "dd/MM/yy")}</span>
              </div>
            </div>
          </div>
        </div>

        {/* HOVER EFFECT */}
        <div className="absolute -right-16 -bottom-16 w-32 h-32 bg-[#0078D4] blur-[80px] opacity-0 group-hover:opacity-[0.05] transition-opacity" />
      </Link>
    </motion.div>
  )
}

export default function HistorialPage() {
  const [partidos, setPartidos] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('todos')
  const [toast, setToast] = useState('')

  useEffect(() => {
    const handleContextMenu = (e) => e.preventDefault()
    document.addEventListener('contextmenu', handleContextMenu)

    const fetchPartidos = async () => {
      try {
        const res = await getPartidos()
        setPartidos(res.data.sort((a, b) => new Date(b.fecha) - new Date(a.fecha)))
      } catch (err) {
        console.error("Error fetching matches:", err)
      } finally {
        setLoading(false)
      }
    }
    fetchPartidos()

    return () => document.removeEventListener('contextmenu', handleContextMenu)
  }, [])

  const filteredPartidos = (Array.isArray(partidos) ? partidos : []).filter(p => {
    if (filter === 'todos') return true
    return p.estado === filter
  })

  const flash = (m) => { setToast(m); setTimeout(() => setToast(''), 3000) }

  // print handler removed
  return (
    <div className="flex flex-col h-screen w-full bg-[#0a0a0a] text-white overflow-hidden">
      <div className="scanline" />

      {/* 1. Navegación Top (Estilo Fluent) */}
      <header className="region-top-nav px-6">
        {/* Brand / Nav */}
        <div className="flex items-center gap-4 mr-10">
          <div className="w-8 h-8 rounded-sm bg-[#0078D4] flex items-center justify-center shadow-[0_0_15px_rgba(0,120,212,0.4)] flex-shrink-0">
            <Shield size={18} className="text-white" />
          </div>
          <div>
            <h2 className="text-[12px] font-black uppercase tracking-[0.3em] italic leading-none">FIBA <span className="text-[#0078D4]">OS</span></h2>
            <p className="text-[8px] font-black text-[#111] bg-[#0078D4] px-1 mt-1 inline-block">ARCHIVE_SYSTEM</p>
          </div>
        </div>

        <nav className="flex items-center gap-2">
          <HistoryControls />
          <div className="h-6 w-px bg-white/5 mx-4" />
          <div className="flex items-center gap-6">
            <Database size={14} className="text-[#0078D4]" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">REGISTRO_GLOBAL</span>

            <div className="flex bg-black/40 p-1 border border-white/5 ml-4">
              {['todos', 'en_juego', 'finalizado'].map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-4 py-1.5 text-[9px] font-black uppercase tracking-widest transition-all ${filter === f ? 'bg-[#0078D4] text-white shadow-lg' : 'text-[#444] hover:text-white'
                    }`}
                >
                  {f === 'en_juego' ? 'VIVOS' : f === 'finalizado' ? 'ARCHIVO' : 'TODOS'}
                </button>
              ))}
            </div>
          </div>
        </nav>

        <div className="flex-1" />

        <div className="flex items-center gap-4">
          <Link to="/admin" className="h-9 px-6 flex items-center gap-3 bg-[#0078D4]/5 border border-[#0078D4]/20 text-[#555] hover:text-white hover:bg-[#0078D4] transition-all text-[9px] font-black tracking-[0.2em] uppercase">
            <LayoutDashboard size={14} /> ADMIN_PANEL
          </Link>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto custom-scrollbar relative z-10 bg-[#0c0c0c]/50">
        <div className="max-w-[1900px] mx-auto w-full px-6 lg:px-12 py-12 lg:py-20">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-[50vh] gap-6">
              <div className="w-12 h-12 border-4 border-[#0078D4]/20 border-t-[#0078D4] rounded-full animate-spin" />
              <span className="text-[11px] font-black text-[#333] uppercase tracking-[0.6em] animate-pulse">Solicitando_Catálogo_Datos...</span>
            </div>
          ) : filteredPartidos.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
              <AnimatePresence mode="popLayout">
                {filteredPartidos.map((match, i) => (
                  <MatchCard key={match.id} match={match} index={i} />
                ))}
              </AnimatePresence>
            </div>
          ) : (
            <div className="pro-tool-window p-32 text-center bg-[#111] max-w-2xl mx-auto border-dashed">
              <div className="w-20 h-20 bg-black/40 border border-white/5 rounded-sm flex items-center justify-center mx-auto mb-10 shadow-2xl">
                <Terminal size={40} className="text-[#222]" />
              </div>
              <h2 className="text-3xl font-black italic tracking-[0.3em] uppercase mb-4 text-[#333]">RESULTADO_PUNTERO_NULO</h2>
              <p className="text-[#555] text-[10px] max-w-xs mx-auto leading-relaxed uppercase tracking-[0.4em] font-black italic">
                La consulta solicitada devolvió cero registros. Por favor, verifique los parámetros de filtrado.
              </p>
            </div>
          )}
        </div>
      </main>

      <footer className="h-10 bg-[#161616] border-t border-white/5 flex items-center px-10 justify-between text-[10px] font-black text-[#333] tracking-[0.4em] uppercase flex-shrink-0">
        <div className="flex items-center gap-6 overflow-hidden">
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="w-2 h-2 rounded-full bg-[#0078D4] shadow-[0_0_8px_#0078D4]" />
            <span className="text-[#0078D4] whitespace-nowrap">Integridad_Nodo: Verificada</span>
          </div>
          {toast && (
            <div className="flex items-center gap-2">
              <span className="text-[#333]">|</span>
              <span className="text-[#0078D4] italic animate-pulse">{toast}</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-12 flex-shrink-0">
          <div className="hidden xs:flex items-center gap-2">
            <Clock size={12} />
            <span className="font-mono">{new Date().toLocaleTimeString()}</span>
          </div>
          <span className="text-[#0078D4] italic whitespace-nowrap">Repositorio_Estación_Activo</span>
        </div>
      </footer>

    </div>
  )
}
