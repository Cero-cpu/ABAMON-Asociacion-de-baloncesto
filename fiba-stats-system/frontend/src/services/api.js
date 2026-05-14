import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || (window.location.hostname === 'localhost' ? 'http://localhost:8000/api' : '/api'),
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000 // 15 seconds timeout to prevent infinite hanging
})

// Intercept requests to add authentication token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('fiba_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Auto-retry once for GET requests that fail (useful for cold starts)
api.interceptors.response.use(null, async (error) => {
  const { config, response } = error;
  if (!config || config.method !== 'get' || config.__isRetry) {
    return Promise.reject(error);
  }
  
  // Only retry on network errors or 503/504 (typical for sleeping servers)
  if (!response || response.status >= 500) {
    config.__isRetry = true;
    console.log("Servidor dormido o lento, reintentando peticion...");
    await new Promise(resolve => setTimeout(resolve, 2000));
    return api(config);
  }
  
  return Promise.reject(error);
});

export const login = (username, password) => api.post('/auth/login', { username, password })
export const logout = () => localStorage.removeItem('fiba_token')

export const getEquipos = () => api.get('/equipos')
export const getEquipo = (id) => api.get(`/equipos/${id}`)
export const crearEquipo = (data) => api.post('/equipos', data)
export const actualizarEquipo = (id, data) => api.put(`/equipos/${id}`, data)
export const eliminarEquipo = (id) => api.delete(`/equipos/${id}`)
export const getJugadores = (equipoId) => api.get(`/jugadores/equipo/${equipoId}`)
export const crearJugador = (data) => api.post('/jugadores', data)
export const actualizarJugador = (id, data) => api.put(`/jugadores/${id}`, data)
export const eliminarJugador = (id) => api.delete(`/jugadores/${id}`)
export const getPartidos = () => api.get('/partidos')
export const crearPartido = (data) => api.post('/partidos', data)
export const actualizarPartido = (id, data) => api.post(`/partidos/${id}/manual-update`, data)
export const getPartido = (id) => api.get(`/partidos/${id}`)
export const cambiarEstado = (id, estado) => api.put(`/partidos/${id}/estado?estado=${estado}`)
export const avanzarCuarto = (id) => api.put(`/partidos/${id}/cuarto`)
export const eliminarPartido = (id) => api.delete(`/partidos/${id}`)
export const iniciarPartido = (id) => api.put(`/partidos/${id}/iniciar`)
export const finalizarPartido = (id) => api.put(`/partidos/${id}/finalizar`)
export const getStatsPartido = (partidoId) => api.get(`/stats/partido/${partidoId}`)
export const getStatsJugador = (jugadorId) => api.get(`/stats/jugador/${jugadorId}`)
export const getGlobalStats = () => api.get('/stats/global')
export const getRachas = () => api.get('/stats/rachas')
export const registrarEvento = (data) => api.post('/eventos', data)
export const deshacerEvento = (partidoId) => api.post(`/eventos/deshacer/${partidoId}`)
export const rehacerEvento = (partidoId) => api.post(`/eventos/rehacer/${partidoId}`)
export const getParciales = (partidoId) => api.get(`/parciales/${partidoId}`)
export const guardarParcial = (partidoId, data) => api.post(`/parciales/${partidoId}`, data)
export const getResumenPartido = (id) => api.get(`/partidos/${id}/resumen`)
export const toggleReloj = (id) => api.put(`/partidos/${id}/reloj/toggle`)
export const setReloj = (id, segundos) => api.put(`/partidos/${id}/reloj/set?segundos=${segundos}`)

export default api
