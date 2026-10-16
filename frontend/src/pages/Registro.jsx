import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'

export default function Registro() {
  const { register } = useAuth()
  const navigate = useNavigate()

  const [form, setForm] = useState({ username: '', email: '', fullName: '', password: '' })
  const [error, setError] = useState(null)
  const [enviando, setEnviando] = useState(false)

  function update(field) {
    return (event) => setForm((prev) => ({ ...prev, [field]: event.target.value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError(null)
    setEnviando(true)

    try {
      await register(form)
      navigate('/perfil', { replace: true })
    } catch (err) {
      setError(err.message)
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="auth">
      <form className="card auth__form" onSubmit={handleSubmit}>
        <h1>Crear cuenta</h1>
        <p className="muted">
          El registro es una <strong>ruta pública</strong>. La cuenta nueva recibe siempre el rol{' '}
          <span className="badge">User</span>.
        </p>

        {error && <p className="alert alert--error">{error}</p>}

        <label className="field">
          <span>Usuario</span>
          <input value={form.username} onChange={update('username')} placeholder="lucia" required />
        </label>

        <label className="field">
          <span>Email</span>
          <input
            type="email"
            value={form.email}
            onChange={update('email')}
            placeholder="lucia@example.com"
            required
          />
        </label>

        <label className="field">
          <span>Nombre completo</span>
          <input value={form.fullName} onChange={update('fullName')} placeholder="Lucía Pérez" />
        </label>

        <label className="field">
          <span>Contraseña</span>
          <input
            type="password"
            value={form.password}
            onChange={update('password')}
            placeholder="mínimo 6 caracteres"
            minLength={6}
            required
          />
        </label>

        <button className="btn btn--primary" type="submit" disabled={enviando}>
          {enviando ? 'Creando cuenta…' : 'Crear cuenta'}
        </button>

        <p className="muted small">
          ¿Ya tenés cuenta? <Link to="/login">Ingresá</Link>.
        </p>
      </form>
    </div>
  )
}
