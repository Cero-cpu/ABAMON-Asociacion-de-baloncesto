import { useState, useEffect, useRef, useCallback } from 'react'
import { getPartido, getEquipo, getJugadores, getStatsPartido, getParciales } from '../services/api'
import { fibaSocket } from '../services/websocket'

/**
 * Hook que mantiene en sincronía todos los datos de un partido.
 * Optimizado para evitar re-renders innecesarios y centralizar el estado.
 */
export function usePartido(partidoId, { pollInterval = 10000, withParciales = false } = {}) {
    const [state, setState] = useState({
        partido: null,
        equipoLocal: null,
        equipoVisitante: null,
        jugadoresLocal: [],
        jugadoresVisitante: [],
        stats: [],
        parciales: [],
        loading: true,
        error: null
    })

    // Estado independiente para el reloj para evitar re-renders masivos
    const [clock, setClock] = useState({
        tiempo_restante: 600,
        reloj_activo: false
    })

    const localIdRef = useRef(null)
    const visitIdRef = useRef(null)
    const isMounted = useRef(true)

    const updateState = useCallback((updates) => {
        if (!isMounted.current) return
        setState(prev => ({ ...prev, ...updates }))
    }, [])

    const cargarTodo = useCallback(async (id) => {
        updateState({ loading: true, error: null })
        try {
            const resP = await getPartido(id)
            const p = resP.data

            localIdRef.current = p.local_id
            visitIdRef.current = p.visitante_id

            setClock({
                tiempo_restante: p.tiempo_restante,
                reloj_activo: p.reloj_activo
            })

            const [resL, resV, resEL, resEV, resS, resParc] = await Promise.all([
                getJugadores(p.local_id),
                getJugadores(p.visitante_id),
                getEquipo(p.local_id),
                getEquipo(p.visitante_id),
                getStatsPartido(id),
                withParciales ? getParciales(id) : Promise.resolve({ data: [] })
            ])

            updateState({
                partido: p,
                jugadoresLocal: resL.data,
                jugadoresVisitante: resV.data,
                equipoLocal: resEL.data,
                equipoVisitante: resEV.data,
                stats: resS.data,
                parciales: resParc.data,
                loading: false
            })
        } catch (err) {
            updateState({ error: 'Error al cargar el partido', loading: false })
        }
    }, [updateState, withParciales])

    const refreshData = useCallback(async () => {
        if (!partidoId) return
        try {
            const [resP, resS, resParc] = await Promise.all([
                getPartido(partidoId),
                getStatsPartido(partidoId),
                withParciales ? getParciales(partidoId) : Promise.resolve({ data: state.parciales })
            ])

            const p = resP.data
            
            // Solo actualizamos el reloj si NO es un tick (es decir, si cambió el estado base)
            setClock(prev => ({
                tiempo_restante: (state.partido?.reloj_activo && p.reloj_activo && state.partido?.cuarto_actual === p.cuarto_actual)
                    ? prev.tiempo_restante
                    : p.tiempo_restante,
                reloj_activo: p.reloj_activo
            }))

            updateState({
                partido: p,
                stats: resS.data,
                parciales: resParc.data
            })
        } catch (error) {
            console.error("Error en refreshData:", error)
        }
    }, [partidoId, withParciales, state.parciales, state.partido, updateState])

    const refreshJugadores = useCallback(async () => {
        if (!localIdRef.current || !visitIdRef.current) return
        try {
            const [rL, rV] = await Promise.all([
                getJugadores(localIdRef.current),
                getJugadores(visitIdRef.current),
            ])
            updateState({
                jugadoresLocal: rL.data,
                jugadoresVisitante: rV.data
            })
        } catch (error) {
            console.error("Error en refreshJugadores:", error)
        }
    }, [updateState])

    useEffect(() => {
        isMounted.current = true
        if (!partidoId) return

        cargarTodo(partidoId)

        const wsHandler = (data) => {
            if (data.event === 'clock_tick') {
                setClock({
                    tiempo_restante: data.tiempo_restante,
                    reloj_activo: data.reloj_activo
                })
            } else if (data.estado_partido) {
                // Si el mensaje incluye el estado completo, actualizamos inmediatamente
                const s = data.estado_partido
                setClock({
                    tiempo_restante: s.tiempo_restante,
                    reloj_activo: s.reloj_activo
                })
                setState(prev => {
                    if (!prev.partido) return prev
                    return {
                        ...prev,
                        partido: { ...prev.partido, ...s }
                    }
                })
                // Aún así disparamos un refresh en background para las estadísticas de jugadores
                // pero el marcador ya se verá actualizado instantáneamente
                refreshData()
            } else {
                refreshData()
            }
        }
        fibaSocket.conectar(parseInt(partidoId))
        fibaSocket.onUpdate(wsHandler)

        const pollTimer = setInterval(() => {
            refreshData()
            refreshJugadores()
        }, pollInterval)

        return () => {
            isMounted.current = false
            fibaSocket.removeListener(wsHandler)
            clearInterval(pollTimer)
        }
    }, [partidoId, pollInterval, cargarTodo, refreshData, refreshJugadores])

    const getStats = useCallback((jid) => state.stats.find(s => s.jugador_id === jid) || {}, [state.stats])
    const getParcial = useCallback((c, i) => state.parciales.find(p => p.cuarto === c && p.intervalo === i), [state.parciales])

    return {
        ...state,
        ...clock, // Inyectamos tiempo_restante y reloj_activo aquí
        getStats,
        getParcial,
        refreshStats: refreshData,
        refreshPartido: refreshData,
        refreshJugadores
    }
}
