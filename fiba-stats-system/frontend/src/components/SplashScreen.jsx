import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const COLUMN_COUNT = 12;

export default function SplashScreen({ onComplete }) {
    const [isFinishing, setIsFinishing] = useState(false);
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        // Simular progreso de carga
        const interval = setInterval(() => {
            setProgress(prev => {
                if (prev >= 100) {
                    clearInterval(interval);
                    return 100;
                }
                return prev + 1;
            });
        }, 25);

        const timer = setTimeout(() => {
            setIsFinishing(true);
            setTimeout(onComplete, 1200);
        }, 3800);

        return () => {
            clearInterval(interval);
            clearTimeout(timer);
        };
    }, [onComplete]);

    return (
        <AnimatePresence>
            {!isFinishing && (
                <motion.div
                    initial={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.8, ease: "easeInOut" }}
                    className="fixed inset-0 z-[99999] bg-[#020202] flex items-center justify-center overflow-hidden"
                >
                    {/* Fondo con profundidad cinemática */}
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,#1a1a1a_0%,#000_100%)]" />
                    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 contrast-150 brightness-100 pointer-events-none" />

                    {/* Columnas Decorativas (Efecto Glassmorphism 3D) */}
                    <div className="flex gap-[2px] w-full h-screen px-[1px] relative" style={{ perspective: '2000px' }}>
                        {[...Array(COLUMN_COUNT)].map((_, i) => (
                            <motion.div
                                key={i}
                                initial={{ rotateX: -100, opacity: 0, scaleY: 0, translateY: -300 }}
                                animate={{ rotateX: 0, opacity: 1, scaleY: 1, translateY: 0 }}
                                transition={{
                                    duration: 1.2,
                                    delay: i * 0.08,
                                    ease: [0.16, 1, 0.3, 1] // Apple-like ease-out expo
                                }}
                                className="flex-1 h-full relative"
                            >
                                {/* Capa de cristal */}
                                <div className="absolute inset-0 bg-gradient-to-b from-white/[0.03] via-transparent to-white/[0.01] border-x border-white/[0.05] backdrop-blur-[2px]" />

                                {/* Rayo de luz dinámico (Apple Shimmer) */}
                                <motion.div
                                    animate={{
                                        top: ['-100%', '200%'],
                                        opacity: [0, 0.5, 0]
                                    }}
                                    transition={{
                                        duration: 3,
                                        repeat: Infinity,
                                        delay: i * 0.1,
                                        ease: "easeInOut"
                                    }}
                                    className="absolute inset-x-0 h-96 bg-gradient-to-b from-transparent via-blue-400/10 to-transparent pointer-events-none"
                                />
                            </motion.div>
                        ))}
                    </div>

                    {/* Contenido Central: Logo y Marca con Tipografía Premium */}
                    <div className="absolute flex flex-col items-center z-10">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, filter: 'blur(10px)' }}
                            animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                            transition={{ delay: 1, duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                            className="text-center"
                        >
                            <h1 className="text-8xl md:text-9xl font-black tracking-[-0.05em] text-white flex flex-col leading-[0.8]">
                                <span className="block opacity-90">FIBA</span>
                                <span className="bg-gradient-to-b from-blue-400 to-blue-600 bg-clip-text text-transparent">STATS</span>
                            </h1>

                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 1.8, duration: 0.8 }}
                                className="mt-8 flex flex-col items-center gap-4"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                                    <span className="text-[11px] uppercase font-bold tracking-[0.6em] text-white/50 pl-[0.6em]">
                                        Encendiendo Motores
                                    </span>
                                </div>
                            </motion.div>
                        </motion.div>
                    </div>

                    {/* Barra de Progreso Minimalista (Estilo macOS Update) */}
                    <div className="absolute bottom-20 left-0 right-0 flex flex-col items-center gap-3">
                        <div className="w-72 h-[3px] bg-white/[0.08] rounded-full overflow-hidden relative">
                            <motion.div
                                initial={{ width: "0%" }}
                                animate={{ width: `${progress}%` }}
                                transition={{ duration: 0.1, ease: "linear" }}
                                className="h-full bg-white relative"
                            >
                                {/* Brillo en la punta del progreso */}
                                <div className="absolute right-0 top-0 bottom-0 w-8 bg-blue-400 blur-sm opacity-50" />
                            </motion.div>
                        </div>
                        <motion.span
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 0.4 }}
                            className="text-[10px] font-mono text-white tracking-widest"
                        >
                            {progress}%
                        </motion.span>
                    </div>

                    {/* Efectos Periféricos de Lente */}
                    <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_200px_rgba(0,0,0,0.8)]" />
                </motion.div>
            )}
        </AnimatePresence>
    );
}
