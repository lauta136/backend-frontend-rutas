import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'

/** 403 — el usuario está autenticado pero no tiene el rol requerido. */
export default function NoAutorizado() {
  const { user, logout } = useAuth()
  const { state } = useLocation()

  const requeridos = state?.required ?? []
  const actuales = state?.current ?? user?.roles ?? []

  return (
    <div className="auth">
      <section className="card auth__form center">
        <h1 className="error-code">403</h1>
        <h2>No autorizado</h2>
        <p className="muted">
          Tu sesión es válida, pero te falta el rol necesario para ver esta ruta.
        </p>

        {requeridos.length > 0 && (
          <div className="stack stack--tight">
            <p>
              Roles requeridos:{' '}
              {requeridos.map((rol) => (
                <span key={rol} className="badge">
                  {rol}
                </span>
              ))}
            </p>
            <p>
              Tus roles:{' '}
              {actuales.length > 0 ? (
                actuales.map((rol) => (
                  <span key={rol} className="badge">
                    {rol}
                  </span>
                ))
              ) : (
                <em>ninguno</em>
              )}
            </p>
          </div>
        )}

        <div className="form__actions center">
          <Link className="btn btn--primary" to="/">
            Volver al inicio
          </Link>
          <button
            type="button"
            className="btn btn--ghost"
            onClick={() => {
              logout()
            }}
          >
            Cambiar de usuario
          </button>
        </div>
      </section>
    </div>
  )
}
