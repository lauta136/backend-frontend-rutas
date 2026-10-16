import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { apiFetch } from '../api/client'
import { useAuth } from '../auth/AuthContext'
import Spinner from '../components/Spinner'

/** Pública para leer; el botón de favoritos requiere sesión (ruta privada). */
export default function RutaDetalle() {
  const { id } = useParams()
  const { isAuthenticated } = useAuth()

  const [ruta, setRuta] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)
  const [mensaje, setMensaje] = useState(null)

  useEffect(() => {
    let cancelled = false
    setCargando(true)

    apiFetch(`/rutas/${id}`, { auth: false })
      .then((data) => {
        if (!cancelled) setRuta(data)
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
  }, [id])

  async function guardarFavorito() {
    setMensaje(null)
    try {
      await apiFetch(`/favoritos/${id}`, { method: 'POST' })
      setMensaje({ tipo: 'ok', texto: 'Ruta agregada a tus favoritos.' })
    } catch (err) {
      setMensaje({ tipo: 'error', texto: err.message })
    }
  }

  if (cargando) return <Spinner label="Cargando la ruta…" />

  if (error) {
    return (
      <div className="stack">
        <p className="alert alert--error">{error}</p>
        <Link className="btn btn--ghost" to="/rutas">
          Volver al catálogo
        </Link>
      </div>
    )
  }

  return (
    <div className="stack">
      <Link className="btn btn--link" to="/rutas">
        ← Volver al catálogo
      </Link>

      <article className="card">
        <span className="tag tag--public">Pública</span>
        <h1>{ruta.nombre}</h1>
        <p>{ruta.descripcion}</p>

        <ul className="meta meta--wide">
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
          <li>
            <span>Publicada</span>
            <strong>{ruta.publicada ? 'Sí' : 'No'}</strong>
          </li>
          <li>
            <span>Creada por</span>
            <strong>{ruta.creadaPor || '—'}</strong>
          </li>
        </ul>

        {mensaje && (
          <p className={`alert ${mensaje.tipo === 'ok' ? 'alert--ok' : 'alert--error'}`}>
            {mensaje.texto}
          </p>
        )}

        {isAuthenticated ? (
          <button type="button" className="btn btn--primary" onClick={guardarFavorito}>
            ⭐ Guardar en favoritos
          </button>
        ) : (
          <p className="alert">
            Para guardar favoritos necesitás una sesión:{' '}
            <Link to="/login">ingresar</Link> o <Link to="/registro">crear una cuenta</Link>.
          </p>
        )}
      </article>
    </div>
  )
}
