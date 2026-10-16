import { Link } from 'react-router-dom'

/** 404 — ninguna ruta del router coincide con la URL. */
export default function NoEncontrado() {
  return (
    <div className="auth">
      <section className="card auth__form center">
        <h1 className="error-code">404</h1>
        <h2>Página no encontrada</h2>
        <p className="muted">La URL que visitaste no existe en esta aplicación.</p>

        <div className="form__actions center">
          <Link className="btn btn--primary" to="/">
            Ir al inicio
          </Link>
          <Link className="btn btn--ghost" to="/rutas">
            Ver el catálogo
          </Link>
        </div>
      </section>
    </div>
  )
}
