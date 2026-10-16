import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { apiFetch, getToken } from '../api/client'
import { useAuth } from '../auth/AuthContext'
import Spinner from '../components/Spinner'

/**
 * RUTA PRIVADA — protegida por <RequireAuth />.
 * Confirma contra el servidor que el token enviado es válido (GET /api/auth/me).
 */
export default function Perfil() {
  const { user, hasRole } = useAuth()

  const [resumen, setResumen] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false

    apiFetch('/favoritos/resumen')
      .then((data) => {
        if (!cancelled) setResumen(data)
      })
      .catch((err) => {
        if (!cancelled) setError(err.message)
      })
      .finally(() => {
        if (!cancelled) setCargando(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  const token = getToken()
  const tokenPreview = token ? `${token.slice(0, 18)}…${token.slice(-12)}` : '—'

  return (
    <div className="stack">
      <header className="page-head">
        <div>
          <span className="tag tag--private">Ruta privada</span>
          <h1>Mi perfil</h1>
          <p className="muted">
            Estas pantallas solo se renderizan si <code>&lt;RequireAuth /&gt;</code> valida que hay
            sesión.
          </p>
        </div>
      </header>

      <div className="grid grid--2">
        <section className="card">
          <h2>Datos de la sesión</h2>
          <ul className="meta meta--wide">
            <li>
              <span>Usuario</span>
              <strong>{user.username}</strong>
            </li>
            <li>
              <span>Nombre</span>
              <strong>{user.fullName}</strong>
            </li>
            <li>
              <span>Email</span>
              <strong>{user.email}</strong>
            </li>
            <li>
              <span>Id</span>
              <strong>{user.id}</strong>
            </li>
            <li>
              <span>Roles</span>
              <strong>
                {user.roles.map((role) => (
                  <span key={role} className="badge">
                    {role}
                  </span>
                ))}
              </strong>
            </li>
            <li>
              <span>Token JWT</span>
              <strong>
                <code className="code--small">{tokenPreview}</code>
              </strong>
            </li>
          </ul>
        </section>

        <section className="card">
          <h2>Respuesta de <code>/api/favoritos/resumen</code></h2>
          <p className="muted">
            Llamada autenticada: si el token faltara o estuviera vencido, la API devolvería{' '}
            <strong>401</strong> y la sesión se cerraría sola.
          </p>

          {cargando && <Spinner label="Consultando la API…" />}
          {error && <p className="alert alert--error">{error}</p>}

          {resumen && (
            <pre className="json">{JSON.stringify(resumen, null, 2)}</pre>
          )}
        </section>
      </div>

      <section className="card">
        <h2>Accesos según tu rol</h2>
        <ul className="access-list">
          <li>
            <span className="tag tag--private">Privada</span>
            <Link to="/favoritos">Mis favoritos</Link>
            <span className="ok">✓ disponible</span>
          </li>
          <li>
            <span className="tag tag--role">Rol</span>
            <Link to="/admin/rutas">Gestión de rutas (Admin | Manager)</Link>
            <span className={hasRole('Admin', 'Manager') ? 'ok' : 'ko'}>
              {hasRole('Admin', 'Manager') ? '✓ disponible' : '✕ 403'}
            </span>
          </li>
          <li>
            <span className="tag tag--role">Rol</span>
            <Link to="/admin/usuarios">Gestión de usuarios (Admin)</Link>
            <span className={hasRole('Admin') ? 'ok' : 'ko'}>
              {hasRole('Admin') ? '✓ disponible' : '✕ 403'}
            </span>
          </li>
        </ul>
      </section>
    </div>
  )
}
