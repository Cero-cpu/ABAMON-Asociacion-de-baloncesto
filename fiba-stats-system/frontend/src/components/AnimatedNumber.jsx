import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

/**
 * AnimatedNumber - El corazón de la dopamina visual.
 * Ahora con transiciones "Épicas":
 * - Flash de Neón (Verde al subir, Rojo al bajar).
 * - Expansión cinemática.
 * - Sombra proyectada dinámica.
 */
export default function AnimatedNumber({ value, className = "" }) {
    const [displayValue, setDisplayValue] = useState(value);
    const [flash, setFlash] = useState(null); 
    const lastValue = useRef(value);

    useEffect(() => {
        if (value !== lastValue.current) {
            const dir = value > lastValue.current ? 'up' : 'down';
            setFlash(dir);
            setDisplayValue(value);
            lastValue.current = value;

            const timer = setTimeout(() => {
                setFlash(null);
            }, 600); // Reducido de 800 a 600 para mayor respuesta
            return () => clearTimeout(timer);
        }
    }, [value]);

    return (
        <div className={`relative inline-flex flex-col items-center overflow-visible h-[1.12em] ${className}`}>
            <AnimatePresence mode="popLayout" initial={false}>
                <motion.span
                    key={value}
                    initial={{
                        y: flash === 'up' ? 10 : -10,
                        opacity: 0,
                        scale: 1.2
                    }}
                    animate={{
                        y: 0,
                        opacity: 1,
                        scale: 1,
                        color: flash === 'up' ? '#10b981' : flash === 'down' ? '#ef4444' : 'inherit',
                    }}
                    exit={{
                        y: flash === 'up' ? -10 : 10,
                        opacity: 0,
                        scale: 0.9
                    }}
                    transition={{
                        type: 'spring',
                        stiffness: 500,
                        damping: 30,
                        mass: 0.5
                    }}
                    className="inline-block relative z-10 font-bold will-change-transform"
                >
                    {value}
                </motion.span>
            </AnimatePresence>

            {/* Aura de impacto simplificada */}
            <AnimatePresence>
                {flash && (
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1.5, opacity: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.4 }}
                        className={`absolute inset-0 rounded-full blur-md pointer-events-none ${flash === 'up' ? 'bg-emerald-500/20' : 'bg-red-500/20'}`}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}

