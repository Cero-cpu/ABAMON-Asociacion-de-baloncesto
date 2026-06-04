import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { login } from '../services/api'
import logoAbamon from '../assets/Logo_ABAMON.jpeg'

export default function LoginPage() {
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const navigate = useNavigate()

    const handleLogin = async (e) => {
        e.preventDefault()
        setLoading(true)
        setError('')
        try {
            const { data } = await login(username, password)
            localStorage.setItem('fiba_token', data.access_token)
            localStorage.setItem('fiba_user', JSON.stringify({
                username: data.username,
                is_admin: data.is_admin
            }))
            navigate('/admin')
        } catch (err) {
            console.error(err)
            if (err.code === 'ECONNABORTED' || !err.response) {
                setError('El servidor está tardando en despertar... Por favor espera unos segundos e intenta de nuevo.')
            } else {
                setError(err.response?.data?.detail || 'Error de conexión')
            }
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-[#080808] flex items-center justify-center p-6 font-sans relative overflow-hidden">
            {/* Background patterns */}
            <div className="absolute inset-0 opacity-10 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#0078D4] rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#ef4444] rounded-full blur-[120px]" />
            </div>

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-[420px] bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-[28px] p-10 relative z-10 shadow-2xl"
            >
                <div className="flex flex-col items-center mb-10">
                    <div className="w-24 h-24 bg-white/[0.05] rounded-2xl flex items-center justify-center mb-6 border border-white/10 p-2">
                        <img src={logoAbamon} alt="ABAMON Logo" className="w-full h-full object-contain rounded-xl" />
                    </div>
                    <h1 className="text-2xl font-black tracking-tight text-white mb-2">ABAMON STATS SYSTEM</h1>
                    <p className="text-white/40 text-sm font-medium tracking-wide">Acceso Organismo Autorizado</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-6">
                    <div>
                        <label className="block text-[10px] font-black text-white/30 tracking-[0.2em] uppercase mb-2 ml-1">Usuario</label>
                        <input
                            type="text"
                            required
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full bg-white/[0.03] border border-white/5 rounded-xl px-5 py-4 text-white font-medium focus:outline-none focus:border-[#0078D4]/50 focus:bg-white/[0.05] transition-all placeholder:text-white/10"
                            placeholder="Nombre de usuario"
                        />
                    </div>

                    <div>
                        <label className="block text-[10px] font-black text-white/30 tracking-[0.2em] uppercase mb-2 ml-1">Contraseña</label>
                        <input
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-white/[0.03] border border-white/5 rounded-xl px-5 py-4 text-white font-medium focus:outline-none focus:border-[#0078D4]/50 focus:bg-white/[0.05] transition-all placeholder:text-white/10"
                            placeholder="••••••••"
                        />
                    </div>

                    <AnimatePresence>
                        {error && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-red-400 text-xs font-bold text-center"
                            >
                                {error}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-[#0078D4] hover:bg-[#1085dd] text-white font-black py-5 rounded-xl transition-all shadow-lg shadow-[#0078D4]/20 flex items-center justify-center gap-3 active:scale-[0.98] disabled:opacity-50"
                    >
                        {loading ? (
                            <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                        ) : 'INICIAR SESIÓN'}
                    </button>
                </form>

                <div className="mt-12 pt-8 border-t border-white/5 flex flex-col items-center gap-4">
                    <span className="text-[10px] font-black tracking-[0.5em] text-white/10 uppercase italic">
                        Cybersecurity Hardened
                    </span>
                </div>
            </motion.div>
        </div>
    )
}
