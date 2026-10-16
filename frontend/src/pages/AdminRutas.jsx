import { useCallback, useEffect, useState } from 'react'
import { apiFetch } from '../api/client'
import Spinner from '../components/Spinner'

const FORM_VACIO = {
  nombre: '',
  descripcion: '',
  region: '',
  duracionHoras: 1,
  dificultad: 'Media',
  publicada: true,
}

/**
 * RUTA PROTEGIDA POR ROL — <RequireRole roles={['Admin','Manager']} />.
 * Un usuario con rol "User" que escriba /admin/rutas a mano es redirigido a /no-autorizado.
 */
export default function AdminRutas() {
  const [rutas, setRutas] = useState([])
  const [form, setForm] = useState(FORM_VACIO)
  const [editandoId, setEditandoId] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)
  const [aviso, setAviso] = useState(null)

  const cargar = useCallback(async () => {
    setCargando(true)
    setError(null)
    try {
      setRutas((await apiFetch('/admin/rutas')) ?? [])
    } catch (err) {
      setError(err.message)
    } finally {
      setCargando(false)
    }
  }, [])

  useEffect(() => {
    cargar()
  }, [cargar])

  function update(field) {
    return (event) => {
      const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value
      setForm((prev) => ({ ...prev, [field]: value }))
    }
  }

  function resetForm() {
    setForm(FORM_VACIO)
    setEditandoId(null)
  }

  function empezarEdicion(ruta) {
    setEditandoId(ruta.id)
    setForm({
      nombre: ruta.nombre,
      descripcion: ruta.descripcion,
      region: ruta.region,
      duracionHoras: ruta.duracionHoras,
      dificultad: ruta.dificultad,
      publicada: ruta.publicada,
    })
    setAviso(null)
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError(null)
    setAviso(null)

    const payload = { ...form, duracionHoras: Number(form.duracionHoras) }

    try {
      if (editandoId) {
        await apiFetch(`/admin/rutas/${editandoId}`, { method: 'PUT', body: payload })
        setAviso(`Ruta ${editandoId} actualizada.`)
      } else {
        await apiFetch('/admin/rutas', { method: 'POST', body: payload })
        setAviso('Ruta creada.')
      }
      resetForm()
      await cargar()
    } catch (err) {
      setError(err.message)
    }
  }

  async function eliminar(ruta) {
    setError(null)
    setAviso(null)
    try {
      await apiFetch(`/admin/rutas/${ruta.id}`, { method: 'DELETE' })
      setAviso(`Ruta "${ruta.nombre}" eliminada.`)
      if (editandoId === ruta.id) resetForm()
      await cargar()
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="stack">
      <header className="page-head">
        <div>
          <span className="tag tag--role">Protegida por rol</span>
          <h1>Gestión de rutas</h1>
          <p className="muted">
            Requiere <span className="badge">Admin</span> o <span className="badge">Manager</span>.
            El backend responde <strong>403</strong> a cualquier otro usuario, aunque esté
            autenticado.
          </p>
        </div>
      </header>

      {error && <p className="alert alert--error">{error}</p>}
      {aviso && <p className="alert alert--ok">{aviso}</p>}

      <div className="grid grid--2 grid--wide-first">
        <section className="card">
          <h2>{editandoId ? `Editar ruta #${editandoId}` : 'Nueva ruta'}</h2>

          <form className="form" onSubmit={handleSubmit}>
            <label className="field">
              <span>Nombre</span>
              <input value={form.nombre} onChange={update('nombre')} required />
            </label>

            <label className="field">
              <span>Descripción</span>
              <textarea
                rows={3}
                value={form.descripcion}
                onChange={update('descripcion')}
              />
            </label>

            <div className="form__row">
              <label className="field">
                <span>Región</span>
                <input value={form.region} onChange={update('region')} />
              </label>

              <label className="field">
                <span>Duración (h)</span>
                <input
                  type="number"
                  min="0.5"
                  step="0.5"
                  value={form.duracionHoras}
                  onChange={update('duracionHoras')}
                />
              </label>

              <label className="field">
                <span>Dificultad</span>
                <select value={form.dificultad} onChange={update('dificultad')}>
                  <option>Baja</option>
                  <option>Media</option>
                  <option>Alta</option>
                </select>
              </label>
            </div>

            <label className="field field--check">
              <input
                type="checkbox"
                checked={form.publicada}
                onChange={update('publicada')}
              />
              <span>Publicada en el catálogo público</span>
            </label>

            <div className="form__actions">
              <button className="btn btn--primary" type="submit">
                {editandoId ? 'Guardar cambios' : 'Crear ruta'}
              </button>
              {editandoId && (
                <button type="button" className="btn btn--ghost" onClick={resetForm}>
                  Cancelar
                </button>
              )}
            </div>
          </form>
        </section>

        <section className="card">
          <h2>Todas las rutas ({rutas.length})</h2>
          <p className="muted">
            Incluye las no publicadas: el listado de <code>/api/admin/rutas</code> es completo.
          </p>

          {cargando && <Spinner label="Cargando rutas…" />}

          {!cargando && (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Nombre</th>
                    <th>Región</th>
                    <th>Estado</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {rutas.map((ruta) => (
                    <tr key={ruta.id}>
                      <td>{ruta.id}</td>
                      <td>{ruta.nombre}</td>
                      <td>{ruta.region || '—'}</td>
                      <td>
                        <span className={`pill ${ruta.publicada ? 'pill--on' : 'pill--off'}`}>
                          {ruta.publicada ? 'Publicada' : 'Borrador'}
                        </span>
                      </td>
                      <td className="table__actions">
                        <button
                          type="button"
                          className="btn btn--small btn--ghost"
                          onClick={() => empezarEdicion(ruta)}
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          className="btn btn--small btn--danger"
                          onClick={() => eliminar(ruta)}
                        >
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
