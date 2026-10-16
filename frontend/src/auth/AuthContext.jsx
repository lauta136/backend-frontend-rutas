import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { apiFetch, getToken, setToken, setUnauthorizedHandler } from '../api/client'

const AuthContext = createContext(null)

/**
 * Estado global de autenticación.
 * Guarda el JWT + el perfil del usuario y expone login / register / logout
 * y helpers (isAuthenticated, roles, hasRole) que usan los guardianes de ruta.
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setTokenState] = useState(() => getToken())
  // Mientras validamos el token guardado no queremos redirigir al usuario a /login.
  const [loading, setLoading] = useState(() => Boolean(getToken()))

  // Al recargar la página, si hay token lo validamos contra /api/auth/me.
  useEffect(() => {
    let cancelled = false

    async function restoreSession() {
      if (!getToken()) {
        setLoading(false)
        return
      }

      try {
        const profile = await apiFetch('/auth/me')
        if (!cancelled) setUser(profile)
      } catch {
        if (!cancelled) {
          setToken(null)
          setTokenState(null)
          setUser(null)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    restoreSession()
    return () => {
      cancelled = true
    }
  }, [])

  // Cualquier respuesta 401 limpia la sesión.
  useEffect(() => {
    setUnauthorizedHandler(() => {
      setToken(null)
      setTokenState(null)
      setUser(null)
    })
    return () => setUnauthorizedHandler(null)
  }, [])

  const applySession = useCallback((authResponse) => {
    setToken(authResponse.token)
    setTokenState(authResponse.token)
    setUser(authResponse.user)
    return authResponse.user
  }, [])

  const login = useCallback(
    async (username, password) =>
      applySession(
        await apiFetch('/auth/login', {
          method: 'POST',
          body: { username, password },
          auth: false,
        }),
      ),
    [applySession],
  )

  const register = useCallback(
    async (payload) =>
      applySession(
        await apiFetch('/auth/register', { method: 'POST', body: payload, auth: false }),
      ),
    [applySession],
  )

  const logout = useCallback(() => {
    setToken(null)
    setTokenState(null)
    setUser(null)
  }, [])

  const value = useMemo(() => {
    const roles = user?.roles ?? []

    return {
      user,
      token,
      loading,
      roles,
      isAuthenticated: Boolean(user),
      hasRole: (...names) => names.some((name) => roles.includes(name)),
      login,
      register,
      logout,
    }
  }, [user, token, loading, login, register, logout])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth() debe usarse dentro de <AuthProvider>.')
  }
  return context
}
