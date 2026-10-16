import { useCallback, useEffect, useState } from 'react'
import { apiFetch } from '../api/client'
import { useAuth } from '../auth/AuthContext'
import Spinner from '../components/Spinner'

const ROLES = ['Admin', 'Manager', 'User']

/**
 * RUTA PROTEGIDA POR ROL — exclusiva de <span className="badge">Admin</span>.
 * Un Manager autenticado recibe 403 (y el frontend lo manda a /no-autorizado).
 */
export default function AdminUsuarios() {
  const { user: yo } = useAuth()

  const [usuarios, setUsuarios] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)
  const [aviso, setAviso] = useState(null)

  const cargar = useCallback(async () => {
    setCargando(true)
    setError(null)
    try {
      setUsuarios((await apiFetch('/admin/usuarios')) ?? [])
    } catch (err) {
      setError(err.message)
    } finally {
      setCargando(false)
    }
  }, [])

  useEffect(() => {
    cargar()
  }, [cargar])

  async function alternarRol(usuario, rol) {
    setError(null)
    setAviso(null)

    const nuevosRoles = usuario.roles.includes(rol)
      ? usuario.roles.filter((r) => r !== rol)
      : [...usuario.roles, rol]

    if (nuevosRoles.length === 0) {
      setError('Cada usuario debe conservar al menos un rol.')
      return
    }

    try {
      const actualizado = await apiFetch(`/admin/usuarios/${usuario.id}/roles`, {
        method: 'PUT',
        body: { roles: nuevosRoles },
      })

      setUsuarios((prev) =>
        prev.map((u) => (u.id === actualizado.id ? actualizado : u)),
      )
      setAviso(`Roles de ${usuario.username} actualizados: ${actualizado.roles.join(', ')}.`)
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="stack">
      <header className="page-head">
        <div>
          <span className="tag tag--role">Protegida por rol (solo Admin)</span>
          <h1>Gestión de usuarios</h1>
          <p className="muted">
            Solo el rol <span className="badge">Admin</span> puede leer y modificar roles. Un{' '}
            <span className="badge">Manager</span> recibe <strong>403 Forbidden</strong> en{' '}
            <code>/api/admin/usuarios</code>.
          </p>
        </div>
      </header>

      {error && <p className="alert alert--error">{error}</p>}
      {aviso && <p className="alert alert--ok">{aviso}</p>}

      <section className="card">
        <h2>Usuarios registrados ({usuarios.length})</h2>

        {cargando && <Spinner label="Cargando usuarios…" />}

        {!cargando && (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Usuario</th>
                  <th>Email</th>
                  <th>Nombre</th>
                  <th>Roles (clic para alternar)</th>
                </tr>
              </thead>
              <tbody>
                {usuarios.map((usuario) => (
                  <tr key={usuario.id}>
                    <td>{usuario.id}</td>
                    <td>
                      <strong>{usuario.username}</strong>
                      {usuario.id === yo?.id && <span className="muted"> (vos)</span>}
                    </td>
                    <td>{usuario.email}</td>
                    <td>{usuario.fullName}</td>
                    <td>
                      <div className="roles">
                        {ROLES.map((rol) => {
                          const activo = usuario.roles.includes(rol)
                          return (
                            <button
                              key={rol}
                              type="button"
                              className={`chip chip--toggle ${activo ? 'chip--on' : ''}`}
                              onClick={() => alternarRol(usuario, rol)}
                              title={
                                activo
                                  ? `Quitar el rol ${rol}`
                                  : `Asignar el rol ${rol}`
                              }
                            >
                              {activo ? '✓' : '+'} {rol}
                            </button>
                          )
                        })}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <p className="muted small">
          Ojo: si te quitás el rol <strong>Admin</strong>, el backend seguirá aceptando tu token
          actual (los roles viajan dentro del JWT) hasta que expire o vuelvas a iniciar sesión.
        </p>
      </section>
    </div>
  )
}
