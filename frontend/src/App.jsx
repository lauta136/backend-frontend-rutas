import { createBrowserRouter, RouterProvider } from 'react-router-dom'

import { AuthProvider } from './auth/AuthContext'
import Layout from './components/Layout'
import RequireAuth, { RequireRole } from './components/RequireAuth'

import Home from './pages/Home'
import RutasPublicas from './pages/RutasPublicas'
import RutaDetalle from './pages/RutaDetalle'
import Login from './pages/Login'
import Registro from './pages/Registro'
import Perfil from './pages/Perfil'
import Favoritos from './pages/Favoritos'
import AdminRutas from './pages/AdminRutas'
import AdminUsuarios from './pages/AdminUsuarios'
import NoAutorizado from './pages/NoAutorizado'
import NoEncontrado from './pages/NoEncontrado'

/**
 * Definición central del router.
 *
 * Las tres clases de ruta se distinguen por el elemento que las envuelve:
 *
 *   Pública               -> sin guardián
 *   Privada               -> <RequireAuth />          (exige sesión)
 *   Protegida por rol     -> <RequireRole roles={…} /> (exige sesión + rol)
 *
 * Los guardianes son rutas "layout": si la validación falla redirigen,
 * y si pasa renderizan un <Outlet /> con las rutas hijas.
 */
const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <Home /> },

      /* --------------------------------------------- Rutas públicas */
      { path: 'rutas', element: <RutasPublicas /> },
      { path: 'rutas/:id', element: <RutaDetalle /> },
      { path: 'login', element: <Login /> },
      { path: 'registro', element: <Registro /> },
      { path: 'no-autorizado', element: <NoAutorizado /> },

      /* ------------------------- Rutas privadas (solo autenticados) */
      {
        element: <RequireAuth />,
        children: [
          { path: 'perfil', element: <Perfil /> },
          { path: 'favoritos', element: <Favoritos /> },

          /* --------- Rutas privadas protegidas por rol (dentro de las privadas) */
          {
            element: <RequireRole roles={['Admin', 'Manager']} />,
            children: [{ path: 'admin/rutas', element: <AdminRutas /> }],
          },
          {
            element: <RequireRole roles={['Admin']} />,
            children: [{ path: 'admin/usuarios', element: <AdminUsuarios /> }],
          },
        ],
      },

      /* --------------------------------------------------- 404 */
      { path: '*', element: <NoEncontrado /> },
    ],
  },
])

export default function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  )
}
