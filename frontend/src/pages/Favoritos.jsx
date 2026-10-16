import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { apiFetch } from '../api/client'
import Spinner from '../components/Spinner'

/** RUTA PRIVADA — requiere sesión (sin importar el rol). */
export default function Favoritos() {
  const [favoritos, setFavoritos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)

  const cargar = useCallback(async () => {
    setCargando(true)
    setError(null)
    try {
      setFavoritos((await apiFetch('/favoritos')) ?? [])
    } catch (err) {
      setError(err.message)
    } finally {
      setCargando(false)
    }
  }, [])

  useEffect(() => {
    cargar()
  }, [cargar])

  async function quitar(rutaId) {
    try {
      await apiFetch(`/favoritos/${rutaId}`, { method: 'DELETE' })
      setFavoritos((prev) => prev.filter((ruta) => ruta.id !== rutaId))
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="stack">
      <header className="page-head">
        <div>
          <span className="tag tag--private">Ruta privada</span>
          <h1>Mis favoritos</h1>
          <p className="muted">
            Datos de <code>GET /api/favoritos</code>. Cada usuario ve únicamente sus propias rutas
            guardadas (se filtra por el <code>id</code> del token, no por un parámetro de la URL).
          </p>
        </div>
        <Link className="btn btn--ghost" to="/rutas">
          Explorar catálogo
        </Link>
      </header>

      {cargando && <Spinner label="Cargando tus favoritos…" />}
      {error && <p className="alert alert--error">{error}</p>}

      {!cargando && !error && favoritos.length === 0 && (
        <p className="alert">
          Todavía no guardaste ninguna ruta. Andá al <Link to="/rutas">catálogo</Link> y usá el
          botón ⭐.
        </p>
      )}

      <div className="grid grid--3">
        {favoritos.map((ruta) => (
          <article key={ruta.id} className="card card--ruta">
            <h3>{ruta.nombre}</h3>
            <p className="muted">{ruta.descripcion}</p>

            <ul className="meta">
              <li>
                <span>Región</span>
                <strong>{ruta.region || '—'}</strong>
              </li>
              <li>
                <span>Duración</span>
                <strong>{ruta.duracionHoras} h</strong>
              </li>
              <li>
                <span>Dificultad</span>
                <strong>{ruta.dificultad}</strong>
              </li>
            </ul>

            <div className="card__actions">
              <Link className="btn btn--ghost" to={`/rutas/${ruta.id}`}>
                Ver detalle
              </Link>
              <button type="button" className="btn btn--danger" onClick={() => quitar(ruta.id)}>
                Quitar
              </button>
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}
