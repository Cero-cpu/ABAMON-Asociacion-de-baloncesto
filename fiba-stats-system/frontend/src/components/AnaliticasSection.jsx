import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    TrendingUp, Zap, Database, Dribbble, RefreshCw, BarChart3, ArrowUpRight, ShieldCheck, Cpu
} from 'lucide-react';
import { getGlobalStats, getRachas } from '../services/api';

// --- ELEMENTOS DE DISEÑO LUXURY ---
const HUDCorner = ({ pos = "top-left" }) => {
    const isTop = pos.includes("top");
    const isLeft = pos.includes("left");
    return (
        <div className={`absolute ${isTop ? 'top-0' : 'bottom-0'} ${isLeft ? 'left-0' : 'right-0'} w-8 h-8 border-white/10 ${isTop ? 'border-t-2' : 'border-b-2'} ${isLeft ? 'border-l-2' : 'border-r-2'} pointer-events-none opacity-40`} />
    );
};

const Scanlines = () => (
    <div className="absolute inset-0 pointer-events-none opacity-[0.02] overflow-hidden z-20">
        <div className="w-full h-full bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,4px_100%]" />
    </div>
);

const MomentumBar = ({ value, max = 10, color = "#0078D4" }) => {
    const percentage = Math.min((value / max) * 100, 100);
    return (
        <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden relative border border-white/5">
            <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${percentage}%` }}
                transition={{ duration: 1.2, ease: "easeOut" }}
                className="h-full relative shadow-[0_0_15px_rgba(0,120,212,0.3)]"
                style={{ backgroundColor: color }}
            >
                <div className="absolute top-0 right-0 w-1 h-full bg-white animate-pulse" />
                <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white/20" />
            </motion.div>
        </div>
    );
};

const TradingCard = ({ title, value, label, icon: Icon, color = "#0078D4" }) => (
    <div className="bg-[#0a0a0a] border border-white/5 p-6 relative group overflow-hidden hover:border-white/10 transition-all">
        <div className="absolute top-0 left-0 w-1 h-full bg-transparent group-hover:bg-[#0078D4] transition-all" style={{ backgroundColor: color }} />
        <div className="flex justify-between items-start mb-6">
            <div className="p-3 bg-white/[0.02] border border-white/5 rounded-sm text-white/40 group-hover:text-white transition-all">
                <Icon size={16} />
            </div>
            <span className="text-[10px] font-black text-white/10 uppercase tracking-[0.3em] font-mono group-hover:text-white/20">Dato Oficial</span>
        </div>
        <div className="flex flex-col">
            <span className="text-[9px] font-black text-white/30 uppercase tracking-[0.4em] mb-1">{title}</span>
            <span className="text-4xl font-black text-white tracking-tighter mb-1 font-oswald italic">{value}</span>
            <span className="text-[8px] font-bold text-white/20 uppercase tracking-widest">{label}</span>
        </div>
    </div>
);

export default function AnaliticasSection() {
    const [stats, setStats] = useState(null);
    const [rachas, setRachas] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [statsRes, rachasRes] = await Promise.all([
                getGlobalStats(),
                getRachas()
            ]);
            setStats(statsRes.data);
            setRachas(rachasRes.data);
        } catch (error) {
            console.error("Error fetching analytics data:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    if (loading) return (
        <div className="h-full w-full bg-[#050505] flex flex-col items-center justify-center gap-8 relative">
            <Scanlines />
            <div className="relative">
                <RefreshCw size={64} className="text-[#0078D4] animate-spin opacity-20" />
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-16 h-16 border-t-2 border-r-2 border-[#0078D4] rounded-full animate-spin-slow" />
                </div>
            </div>
            <div className="flex flex-col items-center gap-2">
                <span className="text-[11px] font-black text-white tracking-[1.5em] animate-pulse">CARGANDO ESTADÍSTICAS</span>
                <div className="w-48 h-1 bg-white/5 rounded-full overflow-hidden">
                    <motion.div
                        initial={{ x: "-100%" }}
                        animate={{ x: "100%" }}
                        transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                        className="w-1/2 h-full bg-[#0078D4]"
                    />
                </div>
            </div>
        </div>
    );

    return (
        <div className="flex flex-col h-full w-full bg-[#080808] relative overflow-hidden font-sans select-none">
            <Scanlines />

            {/* Header / Command Center */}
            <div className="p-12 pb-8 flex-shrink-0 relative z-10">
                <div className="flex items-end justify-between mb-12">
                    <div className="flex items-center gap-6">
                        <div className="w-14 h-14 bg-gradient-to-br from-[#0078D4] to-[#00BCF2] flex items-center justify-center rounded-sm shadow-[0_0_40px_rgba(0,120,212,0.4)]">
                            <Cpu size={28} className="text-white" />
                        </div>
                        <div>
                            <div className="flex items-center gap-3 mb-1">
                                <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-[8px] font-black tracking-widest rounded-sm border border-emerald-500/30">EN LÍNEA</span>
                                <span className="text-white/20 text-[9px] font-mono tracking-widest italic">SISTEMA_DATO_OFICIAL</span>
                            </div>
                            <h2 className="text-5xl font-black text-white italic tracking-tighter uppercase leading-none">CENTRO DE <span className="text-[#0078D4]">ANALÍTICAS</span></h2>
                        </div>
                    </div>
                    <div className="text-right hidden md:block">
                        <p className="text-[9px] font-black text-white/20 tracking-[0.5em] uppercase mb-1">Resumen de la Temporada</p>
                        <p className="text-xl font-black text-white font-oswald uppercase tracking-widest">DATOS EN TIEMPO REAL</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
                    <TradingCard title="Partidos Jugados" value={stats?.total_matches || 0} label="HISTORIAL TOTAL" icon={Database} />
                    <TradingCard title="Promedio de Puntos" value={stats?.total_punto_avg?.toFixed(1) || "0.0"} label="PUNTOS POR EQUIPO" icon={TrendingUp} color="#00BCF2" />
                    <TradingCard title="Tapones Totales" value={stats?.total_tapones || 0} label="DEFENSA GLOBAL" icon={ShieldCheck} color="#107C10" />
                    <TradingCard title="Eficiencia Media" value={stats?.total_eficiencia_avg?.toFixed(1) || "0.0"} label="ÍNDICE DE RENDIMIENTO" icon={Zap} color="#FFD700" />
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 min-h-0 overflow-hidden flex gap-8 px-12 pb-12 relative z-10">

                {/* Left Side: Mejores Rachas */}
                <div className="flex-1 min-h-0 bg-[#0b0b0b] border border-white/5 rounded-sm p-8 relative flex flex-col">
                    <HUDCorner pos="top-left" />
                    <HUDCorner pos="bottom-right" />

                    <div className="flex items-center justify-between mb-10 border-b border-white/5 pb-6">
                        <div className="flex items-center gap-4">
                            <div className="w-2 h-8 bg-[#0078D4] shadow-[0_0_15px_#0078D4]" />
                            <h3 className="text-sm font-black text-white uppercase tracking-[0.4em]">Mejores Rachas de Victorias</h3>
                        </div>
                        <span className="text-[10px] font-mono text-white/20">DATOS ACTUALIZADOS</span>
                    </div>

                    <div className="flex-1 overflow-y-auto pr-4 custom-scrollbar space-y-8">
                        {rachas.length > 0 ? rachas.map((item, idx) => {
                            const isHot = item.streak >= 3;
                            const barColor = isHot ? "#107C10" : item.streak >= 1 ? "#0078D4" : "#333";

                            return (
                                <motion.div
                                    key={idx}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: idx * 0.1 }}
                                    className="relative group"
                                >
                                    <div className="flex justify-between items-end mb-3">
                                        <div className="flex items-center gap-4">
                                            <span className="text-[11px] font-mono text-white/20">{(idx + 1).toString().padStart(2, '0')}</span>
                                            <div className="flex flex-col">
                                                <span className="text-xs font-black text-white uppercase tracking-wider group-hover:text-[#0078D4] transition-all">
                                                    {item.equipo}
                                                </span>
                                                <span className="text-[9px] font-bold text-white/30 tracking-widest">{item.abrev}</span>
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end">
                                            <div className="flex items-center gap-2">
                                                {isHot && <ArrowUpRight size={14} className="text-emerald-400 animate-bounce" />}
                                                <span className={`text-lg font-black font-oswald ${isHot ? 'text-emerald-400' : 'text-white'}`}>
                                                    {item.streak} Victorias
                                                </span>
                                            </div>
                                            <span className="text-[8px] font-black text-white/10 uppercase tracking-tighter">Racha Actual</span>
                                        </div>
                                    </div>
                                    <MomentumBar value={item.streak} max={8} color={barColor} />
                                </motion.div>
                            );
                        }) : (
                            <div className="flex-1 flex items-center justify-center flex-col gap-4 opacity-20 py-20">
                                <BarChart3 size={48} />
                                <span className="text-[10px] font-black tracking-widest">SIN DATOS DE TENDENCIA</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Side: Market Stats / Distribution */}
                <div className="w-[380px] flex flex-col gap-6 hidden xl:flex min-h-0 overflow-y-auto custom-scrollbar pr-2">
                    <div className="bg-[#0b0b0b] border border-white/5 rounded-sm p-8 relative flex-shrink-0">
                        <HUDCorner pos="top-right" />
                        <h4 className="text-[10px] font-black text-white/40 uppercase tracking-[0.5em] mb-8">Puntos por Zona</h4>
                        <div className="space-y-10">
                            {[
                                { l: "ZONA PINTURA", v: stats?.pnt_pintura || 0, c: "#0078D4" },
                                { l: "PERÍMETRO / TRIPLES", v: stats?.pnt_triples || 0, c: "#00BCF2" },
                                { l: "LÍNEA DE LIBRES", v: stats?.pnt_libres || 0, c: "#E1F5FE" }
                            ].map((zone, i) => (
                                <div key={i} className="flex flex-col gap-3">
                                    <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest">
                                        <span className="text-white/40">{zone.l}</span>
                                        <span className="text-white">{zone.v} PTS</span>
                                    </div>
                                    <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                                        <motion.div
                                            initial={{ scaleX: 0 }}
                                            animate={{ scaleX: stats ? (zone.v / stats.total_puntos) || 0 : 0 }}
                                            style={{ backgroundColor: zone.c, originX: 0 }}
                                            className="h-full w-full"
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
