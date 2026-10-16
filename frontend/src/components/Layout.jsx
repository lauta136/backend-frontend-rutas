import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'

function linkClass({ isActive }) {
  return isActive ? 'nav__link nav__link--active' : 'nav__link'
}

export default function Layout() {
  const { isAuthenticated, user, logout, hasRole } = useAuth()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/', { replace: true })
  }

  return (
    <div className="app">
      <header className="nav">
        <Link to="/" className="nav__brand">
          🥾 Rutas App
        </Link>

        <nav className="nav__links">
          {/* Rutas públicas */}
          <NavLink to="/" className={linkClass} end>
            Inicio
          </NavLink>
          <NavLink to="/rutas" className={linkClass}>
            Catálogo público
          </NavLink>

          {/* Rutas privadas */}
          {isAuthenticated && (
            <>
              <NavLink to="/favoritos" className={linkClass}>
                Mis favoritos
              </NavLink>
              <NavLink to="/perfil" className={linkClass}>
                Mi perfil
              </NavLink>
            </>
          )}

          {/* Rutas protegidas por rol: solo se muestran si el usuario tiene el rol */}
          {hasRole('Admin', 'Manager') && (
            <NavLink to="/admin/rutas" className={linkClass}>
              Gestión de rutas
            </NavLink>
          )}
          {hasRole('Admin') && (
            <NavLink to="/admin/usuarios" className={linkClass}>
              Usuarios
            </NavLink>
          )}
        </nav>

        <div className="nav__session">
          {isAuthenticated ? (
            <>
              <span className="nav__user">
                <strong>{user.username}</strong>
                {user.roles.map((role) => (
                  <span key={role} className="badge">
                    {role}
                  </span>
                ))}
              </span>
              <button type="button" className="btn btn--ghost" onClick={handleLogout}>
                Salir
              </button>
            </>
          ) : (
            <>
              <Link className="btn btn--ghost" to="/login">
                Ingresar
              </Link>
              <Link className="btn btn--primary" to="/registro">
                Crear cuenta
              </Link>
            </>
          )}
        </div>
      </header>

      <main className="main">
        <Outlet />
      </main>

      <footer className="footer">
        <p>
          Demo de rutas: <span className="tag tag--public">públicas</span>{' '}
          <span className="tag tag--private">privadas</span>{' '}
          <span className="tag tag--role">protegidas por rol</span>
        </p>
        <p className="footer__note">API .NET 10 + JWT · Frontend React + Vite</p>
      </footer>
    </div>
  )
}
