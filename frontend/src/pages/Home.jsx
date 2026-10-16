import { Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'

const ROUTE_TABLE = [
  {
    kind: 'public',
    label: 'Pública',
    path: '/rutas',
    backend: 'GET /api/rutas',
    who: 'Cualquier visitante, sin token',
    guard: '—',
  },
  {
    kind: 'private',
    label: 'Privada',
    path: '/favoritos',
    backend: 'GET /api/favoritos',
    who: 'Usuario autenticado',
    guard: '<RequireAuth />',
  },
  {
    kind: 'role',
    label: 'Protegida por rol',
    path: '/admin/rutas',
    backend: 'GET /api/admin/rutas',
    who: 'Admin o Manager',
    guard: '<RequireRole roles={["Admin","Manager"]} />',
  },
  {
    kind: 'role',
    label: 'Protegida por rol',
    path: '/admin/usuarios',
    backend: 'GET /api/admin/usuarios',
    who: 'Solo Admin',
    guard: '<RequireRole roles={["Admin"]} />',
  },
]

export default function Home() {
  const { isAuthenticated, roles } = useAuth()

  return (
    <div className="stack">
      <section className="hero">
        <h1>Rutas públicas, privadas y protegidas por rol</h1>
        <p>
          Aplicación de ejemplo con <strong>API REST en .NET 10 + JWT</strong> y{' '}
          <strong>frontend React + Vite</strong>. El backend valida el token y los roles; el
          frontend usa guardianes de ruta para que ni siquiera se monte el componente si el
          usuario no está habilitado.
        </p>

        <div className="hero__actions">
          <Link className="btn btn--primary" to="/rutas">
            Ver catálogo público
          </Link>
          {!isAuthenticated && (
            <Link className="btn btn--ghost" to="/login">
              Probar las rutas privadas
            </Link>
          )}
        </div>

        {isAuthenticated && (
          <p className="hero__session">
            Sesión activa con los roles: {roles.map((r) => <span key={r} className="badge">{r}</span>)}
          </p>
        )}
      </section>

      <section className="card">
        <h2>Mapa de rutas</h2>
        <p className="muted">
          Cada fila se valida dos veces: en el navegador (guardián de React Router) y en el
          servidor (<code>[Authorize]</code> / <code>[Authorize(Roles = …)]</code>).
        </p>

        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Tipo</th>
                <th>Ruta en el front</th>
                <th>Endpoint</th>
                <th>Quién accede</th>
                <th>Guardián</th>
              </tr>
            </thead>
            <tbody>
              {ROUTE_TABLE.map((row) => (
                <tr key={`${row.path}-${row.backend}`}>
                  <td>
                    <span className={`tag tag--${row.kind}`}>{row.label}</span>
                  </td>
                  <td>
                    <Link to={row.path}>{row.path}</Link>
                  </td>
                  <td>
                    <code>{row.backend}</code>
                  </td>
                  <td>{row.who}</td>
                  <td>
                    <code className="code--small">{row.guard}</code>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="card">
        <h2>Usuarios de prueba</h2>
        <p className="muted">
          La base SQLite se siembra al arrancar la API. Usá estos usuarios para comprobar los
          tres niveles de acceso.
        </p>

        <div className="grid grid--3">
          <article className="account">
            <h3>admin</h3>
            <p className="muted">Contraseña: <code>Admin123!</code></p>
            <p>
              <span className="badge">Admin</span> <span className="badge">Manager</span>{' '}
              <span className="badge">User</span>
            </p>
            <p className="muted">Accede a todo, incluida la gestión de usuarios.</p>
          </article>

          <article className="account">
            <h3>manager</h3>
            <p className="muted">Contraseña: <code>Manager123!</code></p>
            <p>
              <span className="badge">Manager</span> <span className="badge">User</span>
            </p>
            <p className="muted">
              Puede gestionar rutas, pero recibe <strong>403</strong> en la gestión de usuarios.
            </p>
          </article>

          <article className="account">
            <h3>user</h3>
            <p className="muted">Contraseña: <code>User123!</code></p>
            <p>
              <span className="badge">User</span>
            </p>
            <p className="muted">
              Accede a las rutas privadas, pero recibe <strong>403</strong> en las de rol.
            </p>
          </article>
        </div>
      </section>
    </div>
  )
}
