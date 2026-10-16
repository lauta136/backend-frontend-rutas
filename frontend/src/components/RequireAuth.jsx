import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import Spinner from './Spinner'

/**
 * RUTA PRIVADA — solo usuarios autenticados.
 *
 * Si el usuario no inició sesión lo mandamos a /login guardando la ruta que
 * intentaba visitar, para devolverlo ahí después de autenticarse.
 * Funciona como ruta "layout": renderiza <Outlet /> con las rutas hijas.
 */
export default function RequireAuth({ children }) {
  const { isAuthenticated, loading } = useAuth()
  const location = useLocation()

  if (loading) return <Spinner label="Verificando sesión…" />

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return children ?? <Outlet />
}

/**
 * RUTA PRIVADA PROTEGIDA POR ROL — requiere autenticación + alguno de los roles.
 *
 * - Sin sesión           -> /login (guardando el destino original)
 * - Sesión sin el rol    -> /no-autorizado (403)
 */
export function RequireRole({ roles, children }) {
  const { isAuthenticated, hasRole, user, loading } = useAuth()
  const location = useLocation()

  if (loading) return <Spinner label="Verificando permisos…" />

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (!hasRole(...roles)) {
    return (
      <Navigate
        to="/no-autorizado"
        replace
        state={{ required: roles, current: user?.roles ?? [] }}
      />
    )
  }

  return children ?? <Outlet />
}
