import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { apiFetch } from '../api/client'
import { useAuth } from '../auth/AuthContext'
import Spinner from '../components/Spinner'

/** RUTA PÚBLICA — se carga sin token. */
export default function RutasPublicas() {
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()

  const [rutas, setRutas] = useState([])
  const [regiones, setRegiones] = useState([])
  const [region, setRegion] = useState('')
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    apiFetch('/rutas/regiones', { auth: false })
      .then(setRegiones)
      .catch(() => setRegiones([]))
  }, [])

  useEffect(() => {
    let cancelled = false
    setCargando(true)
    setError(null)

    const query = region ? `?region=${encodeURIComponent(region)}` : ''

    apiFetch(`/rutas${query}`, { auth: false })
      .then((data) => {
        if (!cancelled) setRutas(data ?? [])
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
  }, [region])

  return (
    <div className="stack">
      <header className="page-head">
        <div>
          <span className="tag tag--public">Ruta pública</span>
          <h1>Catálogo de rutas</h1>
          <p className="muted">
            Este listado se obtiene con <code>GET /api/rutas</code> <strong>sin token</strong>.
            Solo aparecen las rutas publicadas.
          </p>
        </div>

        <label className="field field--inline">
          <span>Región</span>
          <select value={region} onChange={(event) => setRegion(event.target.value)}>
            <option value="">Todas</option>
            {regiones.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>
      </header>

      {cargando && <Spinner label="Cargando rutas…" />}
      {error && <p className="alert alert--error">{error}</p>}

      {!cargando && !error && rutas.length === 0 && (
        <p className="alert">No hay rutas publicadas para ese filtro.</p>
      )}

      <div className="grid grid--3">
        {rutas.map((ruta) => (
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
              {isAuthenticated ? (
                <span className="muted small">Podés guardarla en favoritos</span>
              ) : (
                <button
                  type="button"
                  className="btn btn--link"
                  onClick={() => navigate('/login')}
                >
                  Ingresá para guardarla
                </button>
              )}
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}
