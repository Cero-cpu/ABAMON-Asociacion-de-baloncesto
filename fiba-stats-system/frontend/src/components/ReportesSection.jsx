import { useState } from 'react'
import { FileText, Database, Activity, BarChart3, ShieldCheck, ChevronDown, Loader } from 'lucide-react'
import { getResumenPartido, getParciales, getEquipo } from '../services/api'

const StatCard = ({ label, value, sub, icon: Icon, color }) => (
    <div className="pro-tool-window p-8 bg-[#121212] flex flex-col gap-6 group hover:border-[#0078D4]/30 transition-all border-white/5 overflow-hidden">
        <div className="flex justify-between items-start gap-4">
            <div className="w-10 h-10 bg-black/40 border border-white/5 flex items-center justify-center rounded-sm shadow-inner group-hover:border-[#0078D4]/20 transition-colors flex-shrink-0">
                <Icon size={18} className={color || 'text-[#0078D4]'} />
            </div>
            <div className="text-right overflow-hidden">
                <p className="text-[10px] font-black text-[#444] uppercase tracking-[0.4em] mb-1 truncate">{label}</p>
                <span className="text-3xl font-oswald font-black text-white italic tabular-nums truncate block">{value}</span>
            </div>
        </div>
        <div className="flex items-center gap-3 mt-auto">
            <div className="h-1 flex-1 bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-[#0078D4] w-2/3" />
            </div>
            <span className="text-[9px] font-black text-[#0078D4] uppercase tracking-widest whitespace-nowrap">{sub}</span>
        </div>
    </div>
)

export default function ReportesSection({ equipos, partidos }) {
    const [busqueda, setBusqueda] = useState('')
    const [cargando, setCargando] = useState(false)
    const [error, setError] = useState(null)

    const eqList = Array.isArray(equipos) ? equipos : []
    const ptList = Array.isArray(partidos) ? partidos : []

    const partidosFiltrados = ptList.filter(p => {
        const local = eqList.find(e => e.id === p.local_id)?.nombre || ''
        const vis = eqList.find(e => e.id === p.visitante_id)?.nombre || ''
        return local.toLowerCase().includes(busqueda.toLowerCase()) ||
            vis.toLowerCase().includes(busqueda.toLowerCase())
    })

    return (
        <div className="flex flex-col gap-8 max-w-[1500px] mx-auto w-full">

            {/* Header */}
            <div className="flex flex-col lg:flex-row items-start lg:items-end justify-between border-b border-white/5 pb-12 gap-8">
                <div className="overflow-hidden">
                    <h1 className="text-4xl lg:text-5xl xl:text-6xl font-black italic tracking-tighter uppercase leading-none">
                        Gestión de <span className="text-[#0078D4]">Reportes</span>
                    </h1>
                    <p className="text-[#444] text-[11px] font-black tracking-[0.6em] uppercase mt-6">
                        Descarga de Actas y Resultados Oficiales
                    </p>
                </div>

                <div className="flex flex-col gap-4 w-full lg:w-[360px]">
                    <p className="text-[9px] font-black text-[#555] uppercase tracking-[0.4em]">
                        BUSCAR POR EQUIPO
                    </p>
                    <input
                        type="text"
                        placeholder="Escribe el nombre de un equipo..."
                        className="control-input w-full"
                        value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)}
                    />
                </div>
            </div>

            {/* Métricas */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                <StatCard label="Equipos_Inscritos" value={eqList.length} sub="BASE DE DATOS" icon={Database} />
                <StatCard label="Total_Encuentros" value={ptList.length} sub="PARTIDOS REGISTRADOS" icon={Activity} color="text-green-500" />
                <StatCard label="Finalizados" value={ptList.filter(p => p.estado === 'finalizado').length} sub="LISTOS PARA IMPRIMIR" icon={BarChart3} color="text-purple-500" />
                <StatCard label="En_Cancha" value={ptList.filter(p => p.estado === 'en_curso').length} sub="ACTUALMENTE EN JUEGO" icon={ShieldCheck} color="text-amber-500" />
            </div>

            {/* Lista de partidos */}
            <div className="pro-tool-window bg-[#121212] border-white/5 overflow-hidden">
                <div className="grid-panel-header flex items-center justify-between px-6">
                    <div className="flex items-center gap-3">
                        <FileText size={12} className="text-[#0078D4]" />
                        LISTADO DE PARTIDOS JUGADOS
                    </div>
                    <span className="text-[9px] text-white/20 font-mono uppercase tracking-widest">
                        {partidosFiltrados.length} RESULTADOS ENCONTRADOS
                    </span>
                </div>
                <div className="divide-y divide-white/5 max-h-[600px] overflow-y-auto custom-scrollbar">
                    {partidosFiltrados.length === 0 && (
                        <p className="text-[#444] text-[11px] font-black text-center py-10 uppercase tracking-widest">
                            Sin partidos registrados
                        </p>
                    )}
                    {partidosFiltrados.map(p => {
                        const local = eqList.find(e => e.id === p.local_id)
                        const vis = eqList.find(e => e.id === p.visitante_id)
                        return (
                            <div key={p.id} className="flex items-center justify-between px-6 py-4 hover:bg-white/[0.02] transition-colors gap-4">
                                <div className="flex items-center gap-4 overflow-hidden">
                                    <span className="text-[9px] font-black text-[#333] uppercase tracking-widest flex-shrink-0">#{p.id}</span>
                                    <span className="text-[11px] font-black text-white truncate">
                                        {local?.nombre || 'Local'} vs {vis?.nombre || 'Visitante'}
                                    </span>
                                </div>
                                <div className="flex items-center gap-6 flex-shrink-0">
                                    <span className="text-[14px] font-black font-oswald italic text-[#0078D4]">
                                        {p.pts_local} — {p.pts_visitante}
                                    </span>
                                    <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 ${p.estado === 'finalizado' ? 'text-green-400 bg-green-400/10' :
                                        p.estado === 'en_curso' ? 'text-amber-400 bg-amber-400/10' :
                                            'text-[#444] bg-white/5'
                                        }`}>
                                        {p.estado}
                                    </span>
                                    <button
                                        onClick={() => {
                                            const url = `/#/acta?id=${p.id}`;
                                            window.open(url, 'FIBA_Print', 'width=1100,height=850');
                                        }}
                                        disabled={p.estado !== 'finalizado'}
                                        className={`control-button h-8 px-4 text-[9px] ${p.estado === 'finalizado' ? 'opacity-100 border-[#0078D4] text-[#0078D4]' : 'opacity-30 cursor-not-allowed'}`}
                                    >
                                        {p.estado === 'finalizado' ? 'DESCARGAR ACTA OFICIAL' : 'PARTIDO EN CURSO'}
                                    </button>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* Módulo removido */}
        </div>
    )
}
