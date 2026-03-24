import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || (window.location.hostname === 'localhost' ? 'http://localhost:8000' : '/api'),
  headers: { 'Content-Type': 'application/json' }
})

// Intercept requests to add authentication token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('fiba_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export const login = (username, password) => api.post('/api/auth/login', { username, password })
export const logout = () => localStorage.removeItem('fiba_token')

export const getEquipos = () => api.get('/api/equipos')
export const getEquipo = (id) => api.get(`/api/equipos/${id}`)
export const crearEquipo = (data) => api.post('/api/equipos', data)
export const eliminarEquipo = (id) => api.delete(`/api/equipos/${id}`)
export const getJugadores = (equipoId) => api.get(`/api/jugadores/equipo/${equipoId}`)
export const crearJugador = (data) => api.post('/api/jugadores', data)
export const actualizarJugador = (id, data) => api.put(`/api/jugadores/${id}`, data)
export const eliminarJugador = (id) => api.delete(`/api/jugadores/${id}`)
export const getPartidos = () => api.get('/api/partidos')
export const crearPartido = (data) => api.post('/api/partidos', data)
export const getPartido = (id) => api.get(`/api/partidos/${id}`)
export const cambiarEstado = (id, estado) => api.put(`/api/partidos/${id}/estado?estado=${estado}`)
export const avanzarCuarto = (id) => api.put(`/api/partidos/${id}/cuarto`)
export const eliminarPartido = (id) => api.delete(`/api/partidos/${id}`)
export const iniciarPartido = (id) => api.put(`/api/partidos/${id}/iniciar`)
export const finalizarPartido = (id) => api.put(`/api/partidos/${id}/finalizar`)
export const getStatsPartido = (partidoId) => api.get(`/api/stats/partido/${partidoId}`)
export const getStatsJugador = (jugadorId) => api.get(`/api/stats/jugador/${jugadorId}`)
export const getGlobalStats = () => api.get('/api/stats/global')
export const getRachas = () => api.get('/api/stats/rachas')
export const registrarEvento = (data) => api.post('/api/eventos', data)
export const deshacerEvento = (partidoId) => api.post(`/api/eventos/deshacer/${partidoId}`)
export const rehacerEvento = (partidoId) => api.post(`/api/eventos/rehacer/${partidoId}`)
export const getParciales = (partidoId) => api.get(`/api/parciales/${partidoId}`)
export const guardarParcial = (partidoId, data) => api.post(`/api/parciales/${partidoId}`, data)
export const getResumenPartido = (id) => api.get(`/api/partidos/${id}/resumen`)
export const toggleReloj = (id) => api.put(`/api/partidos/${id}/reloj/toggle`)
export const setReloj = (id, segundos) => api.put(`/api/partidos/${id}/reloj/set?segundos=${segundos}`)

export default api
