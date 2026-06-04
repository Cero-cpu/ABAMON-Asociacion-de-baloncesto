import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { LayoutDashboard, Database, Activity, Terminal, Clock, Box } from 'lucide-react'
import ReportesSection from '../components/ReportesSection'
import HistoryControls from '../components/HistoryControls'
import { getEquipos, getPartidos } from '../services/api'

export default function ReportesPage() {
    const [equipos, setEquipos] = useState([])
    const [partidos, setPartidos] = useState([])

    useEffect(() => {
        const cargarDatos = async () => {
            try {
                const [eq, pt] = await Promise.all([getEquipos(), getPartidos()])
                setEquipos(eq.data)
                setPartidos(pt.data)
            } catch (e) { console.error(e) }
        }
        cargarDatos()
    }, [])

    return (
        <div className="flex flex-col h-screen w-full bg-[#0a0a0a] text-white overflow-hidden">
            <div className="scanline" />

            {/* 1. Navegación Top (Estilo Fluent) */}
            <header className="region-top-nav px-6">
                {/* Brand / Nav */}
                <div className="flex items-center gap-4 mr-10">
                    <div className="w-8 h-8 rounded-sm bg-[#0078D4] flex items-center justify-center shadow-[0_0_15px_rgba(0,120,212,0.4)] flex-shrink-0">
                        <Box size={18} className="text-white" />
                    </div>
                    <div>
                        <h2 className="text-[12px] font-black uppercase tracking-[0.3em] italic leading-none">ABAMON <span className="text-[#0078D4]">OS</span></h2>
                        <p className="text-[8px] font-black text-[#111] bg-[#0078D4] px-1 mt-1 inline-block">REPORT_HUB</p>
                    </div>
                </div>

                <nav className="flex items-center gap-2">
                    <HistoryControls />
                    <div className="h-6 w-px bg-white/5 mx-4" />
                    <div className="flex items-center gap-3 opacity-60">
                        <LayoutDashboard size={14} className="text-[#0078D4]" />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em]">HUB_DE_ANALITICAS</span>
                    </div>
                </nav>

                <div className="flex-1" />

                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_5px_green]" />
                        <span className="text-[9px] font-black uppercase tracking-widest text-[#444] whitespace-nowrap">FLUJO_DATOS_VIVO</span>
                    </div>
                </div>
            </header>

            {/* Main Viewport */}
            <main className="region-main">

                <div className="flex-1 overflow-y-auto custom-scrollbar p-10 lg:p-16">
                    <ReportesSection equipos={equipos} partidos={partidos} />
                </div>

                <footer className="status-bar px-10">
                    <div className="flex items-center gap-6 overflow-hidden">
                        <Terminal size={12} className="text-[#444] flex-shrink-0" />
                        <span className="text-[10px] font-black text-[#333] uppercase tracking-widest truncate">Agregador_En_Linea</span>
                    </div>
                    <div className="ml-auto flex items-center gap-8 text-[#333] flex-shrink-0">
                        <Clock size={12} />
                        <span className="font-mono text-[10px]">{new Date().toLocaleTimeString()} UTC</span>
                    </div>
                </footer>
            </main>
        </div>
    )
}
