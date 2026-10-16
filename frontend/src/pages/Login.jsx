import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'

const DEMO_USERS = [
  { username: 'admin', password: 'Admin123!', detalle: 'Admin + Manager + User' },
  { username: 'manager', password: 'Manager123!', detalle: 'Manager + User' },
  { username: 'user', password: 'User123!', detalle: 'User' },
]

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [form, setForm] = useState({ username: '', password: '' })
  const [error, setError] = useState(null)
  const [enviando, setEnviando] = useState(false)

  // Si el guardián de ruta nos trajo acá, volvemos al destino original.
  const destino = location.state?.from?.pathname ?? '/perfil'

  function update(field) {
    return (event) => setForm((prev) => ({ ...prev, [field]: event.target.value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError(null)
    setEnviando(true)

    try {
      const user = await login(form.username, form.password)
      const teniaRol = ['Admin', 'Manager'].some((r) => user.roles.includes(r))
      navigate(destino === '/admin/rutas' && !teniaRol ? '/perfil' : destino, { replace: true })
    } catch (err) {
      setError(err.message)
    } finally {
      setEnviando(false)
    }
  }

  function usarDemo(usuario) {
    setForm({ username: usuario.username, password: usuario.password })
  }

  return (
    <div className="auth">
      <form className="card auth__form" onSubmit={handleSubmit}>
        <h1>Ingresar</h1>
        <p className="muted">
          <code>POST /api/auth/login</code> devuelve un JWT con los roles del usuario.
        </p>

        {error && <p className="alert alert--error">{error}</p>}

        <label className="field">
          <span>Usuario</span>
          <input
            value={form.username}
            onChange={update('username')}
            autoComplete="username"
            placeholder="user"
            required
          />
        </label>

        <label className="field">
          <span>Contraseña</span>
          <input
            type="password"
            value={form.password}
            onChange={update('password')}
            autoComplete="current-password"
            placeholder="User123!"
            required
          />
        </label>

        <button className="btn btn--primary" type="submit" disabled={enviando}>
          {enviando ? 'Ingresando…' : 'Ingresar'}
        </button>

        <p className="muted small">
          ¿No tenés cuenta? <Link to="/registro">Creá una</Link>.
        </p>

        <div className="auth__demo">
          <p className="muted small">Usuarios de prueba (clic para autocompletar):</p>
          <div className="auth__demo-buttons">
            {DEMO_USERS.map((usuario) => (
              <button
                key={usuario.username}
                type="button"
                className="chip"
                onClick={() => usarDemo(usuario)}
              >
                <strong>{usuario.username}</strong>
                <span>{usuario.detalle}</span>
              </button>
            ))}
          </div>
        </div>
      </form>
    </div>
  )
}
