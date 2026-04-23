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

    // Refreshers individuales para actualizaciones ligeras
    const refreshData = useCallback(async () => {
        if (!partidoId) return
        try {
            const [resP, resS, resParc] = await Promise.all([
                getPartido(partidoId),
                getStatsPartido(partidoId),
                withParciales ? getParciales(partidoId) : Promise.resolve({ data: state.parciales })
            ])

            updateState({
                partido: {
                    ...resP.data,
                    // Si el reloj está activo y NO ha cambiado el cuarto, preservamos el tiempo local
                    // Pero si el cuarto cambió, aceptamos el nuevo tiempo (reset) del servidor
                    tiempo_restante: (state.partido?.reloj_activo && resP.data.reloj_activo && state.partido?.cuarto_actual === resP.data.cuarto_actual)
                        ? state.partido.tiempo_restante
                        : resP.data.tiempo_restante
                },
                stats: resS.data,
                parciales: resParc.data
            })
        } catch (error) {
            console.error("Error en refreshData:", error)
        }
    }, [partidoId, withParciales, state.parciales, updateState])

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
                // Actualizar solo el reloj para máxima fluidez sin sobrecargar el servidor
                setState(prev => {
                    if (!prev.partido) return prev
                    return {
                        ...prev,
                        partido: {
                            ...prev.partido,
                            tiempo_restante: data.tiempo_restante,
                            reloj_activo: data.reloj_activo
                        }
                    }
                })
            } else {
                // Para eventos de anotación u otros cambios de estado, refrescar todo
                refreshData()
            }
        }
        fibaSocket.conectar(parseInt(partidoId))
        fibaSocket.onUpdate(wsHandler)

        const pollTimer = setInterval(() => {
            // Bajamos la frecuencia del poll masivo si el socket está activo
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
        getStats,
        getParcial,
        refreshStats: refreshData,
        refreshPartido: refreshData,
        refreshJugadores
    }
}
