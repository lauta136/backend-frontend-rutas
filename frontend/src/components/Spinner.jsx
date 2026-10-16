export default function Spinner({ label = 'Cargando…' }) {
  return (
    <div className="spinner">
      <span className="spinner__dot" />
      <p>{label}</p>
    </div>
  )
}
