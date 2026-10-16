/**
 * Cliente HTTP mínimo para la Rutas API.
 *
 * - Guarda el JWT en localStorage.
 * - Agrega la cabecera `Authorization: Bearer <token>` cuando corresponde.
 * - Convierte las respuestas de error de la API en excepciones `ApiError`.
 */

const API_URL = import.meta.env.VITE_API_URL || '/api'
const TOKEN_KEY = 'rutas.token'

export function getToken() {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token)
  else localStorage.removeItem(TOKEN_KEY)
}

export class ApiError extends Error {
  constructor(message, status) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

// El AuthProvider registra aquí su función de logout para que un 401
// (token vencido o inválido) cierre la sesión automáticamente.
let onUnauthorized = null

export function setUnauthorizedHandler(handler) {
  onUnauthorized = handler
}

function parseJson(text) {
  try {
    return JSON.parse(text)
  } catch {
    return null
  }
}

export async function apiFetch(path, { method = 'GET', body, auth = true } = {}) {
  const headers = { Accept: 'application/json' }
  if (body !== undefined) headers['Content-Type'] = 'application/json'

  const token = getToken()
  if (auth && token) headers.Authorization = `Bearer ${token}`

  let response
  try {
    response = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  } catch {
    throw new ApiError('No se pudo contactar la API. ¿Está corriendo el backend en el puerto 5080?', 0)
  }

  if (response.status === 204) return null

  const raw = await response.text()
  const data = raw ? parseJson(raw) : null

  if (!response.ok) {
    if (response.status === 401 && auth && onUnauthorized) onUnauthorized()

    const message =
      data?.message ||
      data?.title ||
      (response.status === 403
        ? 'No tenés permisos para acceder a este recurso.'
        : `La API respondió ${response.status}.`)

    throw new ApiError(message, response.status)
  }

  return data
}
