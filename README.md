# Rutas App — Rutas públicas, privadas y protegidas por rol

Aplicación de ejemplo **full-stack** que implementa un router con los tres tipos de rutas
pedidos, validados **en el cliente y en el servidor**:

| Tipo de ruta | Acceso | Guardián en React | Validación en la API |
| --- | --- | --- | --- |
| **Pública** | Cualquier usuario, sin autenticación | — | Sin `[Authorize]` |
| **Privada** | Solo usuarios autenticados | `<RequireAuth />` | `[Authorize]` |
| **Privada protegida por rol** | Autenticado **+** con el rol requerido | `<RequireRole roles={[…]} />` | `[Authorize(Roles = "…")]` |

- **Backend:** ASP.NET Core Web API (.NET 10) + Entity Framework Core + SQLite + **JWT** (BCrypt para contraseñas).
- **Frontend:** React 19 + Vite + React Router 7 (routes + guardianes de ruta).

---

## 1. Estructura del repositorio

```
.
├── backend/
│   └── RutasApi/                 # API REST en .NET 10
│       ├── Controllers/          # Un controlador por tipo de ruta
│       │   ├── AuthController.cs            # login/registro + /me  (público y privado)
│       │   ├── RutasPublicasController.cs   # RUTAS PÚBLICAS
│       │   ├── FavoritosController.cs       # RUTAS PRIVADAS
│       │   ├── RutasAdminController.cs      # PROTEGIDAS POR ROL (Admin | Manager)
│       │   └── UsuariosAdminController.cs   # PROTEGIDAS POR ROL (solo Admin)
│       ├── Data/                 # AppDbContext (EF Core) + seed de datos
│       ├── Models/               # User, Role, UserRole, Ruta, Favorito
│       ├── Dtos/                 # Contratos de entrada/salida de la API
│       ├── Services/             # JwtTokenService + BCryptPasswordHasher
│       ├── Options/              # JwtOptions (configuración tipada)
│       └── Program.cs            # Autenticación, autorización, CORS, Swagger, seed
│
└── frontend/                     # SPA en React + Vite
    └── src/
        ├── App.jsx               # ROUTER: definición de las tres clases de ruta
        ├── api/client.js         # cliente HTTP + inyección del token JWT
        ├── auth/AuthContext.jsx  # sesión, roles, login/register/logout
        ├── components/
        │   ├── Layout.jsx
        │   ├── RequireAuth.jsx   # guardián de RUTA PRIVADA
        │   ├── RequireRole.jsx   # guardián de RUTA POR ROL (exportado de RequireAuth.jsx)
        │   └── Spinner.jsx
        └── pages/                # Home, RutasPublicas, RutaDetalle, Login, Registro,
                                  # Perfil, Favoritos, AdminRutas, AdminUsuarios,
                                  # NoAutorizado (403), NoEncontrado (404)
```

---

## 2. Cómo ejecutarlo

Requisitos: **.NET SDK 10** y **Node.js 20+**.

### Backend (puerto 5080)

La clave de firma JWT **no está versionada**. Antes de arrancar, definila una vez:

```bash
cd backend/RutasApi

# Opción A (recomendada en desarrollo): user-secrets, queda fuera del repo
dotnet user-secrets set "Jwt:Key" "$(openssl rand -base64 48)"

# Opción B: variable de entorno
# export Jwt__Key="$(openssl rand -base64 48)"

dotnet restore
dotnet run --launch-profile http
```

Si no definís ninguna, en **Development** la API genera una clave aleatoria por proceso y lo
avisa con un warning: todo funciona, pero los tokens se invalidan al reiniciar (el frontend
maneja el 401 y te pide login de nuevo). En **Production** la API **se niega a arrancar** sin
`Jwt:Key`.

Al arrancar:
- Se crea la base SQLite `rutas.db` y se siembran roles, usuarios y rutas de ejemplo.
- Swagger UI queda disponible en <http://localhost:5080/swagger>.

### Frontend (puerto 5173)

En **otra** terminal:

```bash
cd frontend
npm install
npm run dev
```

Abrir <http://localhost:5173>.

> Vite reenvía `/api/*` a `http://localhost:5080` (ver `vite.config.js`), así que el navegador
> no se topa con CORS. Si querés llamar a la API directamente, copiá `frontend/.env.example` a
> `frontend/.env` y definí `VITE_API_URL=http://localhost:5080/api` (el backend ya tiene CORS
> habilitado para los orígenes de Vite).

---

## 3. Usuarios de prueba

| Usuario | Contraseña | Roles | Puede acceder a |
| --- | --- | --- | --- |
| `admin` | `Admin123!` | Admin, Manager, User | Todo |
| `manager` | `Manager123!` | Manager, User | Rutas privadas y gestión de rutas (403 en usuarios) |
| `user` | `User123!` | User | Rutas privadas únicamente (403 en rutas/usuarios de admin) |

En la pantalla de login hay botones para autocompletar cada uno.

---

## 4. El router del frontend

`frontend/src/App.jsx` define el árbol de rutas. Lo importante: la clase de ruta se determina por
el **elemento que la envuelve**.

```jsx
const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <Home /> },

      // ---- RUTAS PÚBLICAS: sin guardián ----
      { path: 'rutas', element: <RutasPublicas /> },
      { path: 'rutas/:id', element: <RutaDetalle /> },
      { path: 'login', element: <Login /> },
      { path: 'registro', element: <Registro /> },
      { path: 'no-autorizado', element: <NoAutorizado /> },

      // ---- RUTAS PRIVADAS: requieren sesión ----
      {
        element: <RequireAuth />,
        children: [
          { path: 'perfil', element: <Perfil /> },
          { path: 'favoritos', element: <Favoritos /> },

          // ---- RUTAS PROTEGIDAS POR ROL: requieren sesión + rol ----
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

      { path: '*', element: <NoEncontrado /> },
    ],
  },
])
```

**Guardián de ruta privada** (`RequireAuth.jsx`) — guarda el destino original para volver a él
después del login:

```jsx
if (loading) return <Spinner label="Verificando sesión…" />
if (!isAuthenticated) return <Navigate to="/login" state={{ from: location }} replace />
return children ?? <Outlet />
```

**Guardián de ruta por rol** — distingue *no autenticado* (401 → login) de
*autenticado sin el rol* (403 → `/no-autorizado`):

```jsx
if (!isAuthenticated) return <Navigate to="/login" state={{ from: location }} replace />
if (!hasRole(...roles)) {
  return <Navigate to="/no-autorizado" replace state={{ required: roles, current: user?.roles ?? [] }} />
}
return children ?? <Outlet />
```

---

## 5. La validación en la API (JWT + roles)

El token lo emite `POST /api/auth/login`. `JwtTokenService` incluye un claim de rol por cada rol
del usuario, por lo que `[Authorize(Roles = "...")]` funciona sin configuración extra:

```csharp
claims.AddRange(roles.Select(role => new Claim(ClaimTypes.Role, role)));
```

| Endpoint | Tipo de ruta | Atributo |
| --- | --- | --- |
| `GET /api/rutas` | Pública | `[AllowAnonymous]` |
| `GET /api/rutas/{id}` | Pública | `[AllowAnonymous]` |
| `GET /api/rutas/regiones` | Pública | `[AllowAnonymous]` |
| `POST /api/auth/register` | Pública | `[AllowAnonymous]` |
| `POST /api/auth/login` | Pública | `[AllowAnonymous]` |
| `GET /api/auth/me` | Privada | `[Authorize]` |
| `GET /api/favoritos` | Privada | `[Authorize]` |
| `POST /api/favoritos/{rutaId}` | Privada | `[Authorize]` |
| `DELETE /api/favoritos/{rutaId}` | Privada | `[Authorize]` |
| `GET /api/favoritos/resumen` | Privada | `[Authorize]` |
| `GET /api/admin/rutas` | Por rol | `[Authorize(Roles = "Admin,Manager")]` |
| `POST /api/admin/rutas` | Por rol | `[Authorize(Roles = "Admin,Manager")]` |
| `PUT /api/admin/rutas/{id}` | Por rol | `[Authorize(Roles = "Admin,Manager")]` |
| `DELETE /api/admin/rutas/{id}` | Por rol | `[Authorize(Roles = "Admin,Manager")]` |
| `GET /api/admin/usuarios` | Por rol | `[Authorize(Roles = "Admin")]` |
| `PUT /api/admin/usuarios/{id}/roles` | Por rol | `[Authorize(Roles = "Admin")]` |

Las rutas privadas derivan el usuario del **token**, nunca de un parámetro de la URL
(`User.GetUserId()`), así que un usuario no puede leer los favoritos de otro.

---

## 6. Probar los tres tipos de ruta

### Con el navegador

1. **Pública:** visitá `/rutas` y el detalle de una ruta **sin iniciar sesión** → funciona.
2. **Privada:** visitá `/favoritos` sin sesión → te redirige a `/login`; ingresá con `user` y volvés
   a `/favoritos`.
3. **Por rol:** con `user`, escribí `/admin/rutas` en la barra de direcciones → te manda a
   `/no-autorizado` (403). Con `manager` funciona, pero `/admin/usuarios` sigue dando 403. Con
   `admin` funcionan ambas.

### Con `curl`

```bash
API=http://localhost:5080

# 1) PÚBLICA: sin token -> 200
curl -i $API/api/rutas

# 2) PRIVADA: sin token -> 401
curl -i $API/api/favoritos

# 3) Login y guardamos el token
TOKEN=$(curl -s -X POST $API/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"user","password":"User123!"}' | jq -r .token)

# 4) PRIVADA con token -> 200
curl -i $API/api/favoritos -H "Authorization: Bearer $TOKEN"

# 5) POR ROL con token de "user" -> 403
curl -i $API/api/admin/rutas -H "Authorization: Bearer $TOKEN"
```

---

## 7. Notas de implementación

- **Contraseñas:** se guardan con hash BCrypt; nunca en texto plano.
- **Roles:** relación muchos-a-muchos (`Users` ↔ `Roles` vía `UserRoles`) y el nombre de cada rol
  está centralizado en `RoleNames` para evitar errores de tipeo en los atributos.
- **401 vs 403:** sin token válido la API responde `401 Unauthorized`; con token válido pero sin el
  rol requerido, `403 Forbidden`. El frontend replica esa distinción (`/login` vs `/no-autorizado`).
- **Registro:** siempre asigna el rol `User`; no es posible auto-asignarse `Admin` desde la API
  (solo un `Admin` puede cambiar roles vía `PUT /api/admin/usuarios/{id}/roles`).
- **Token vencido:** cualquier `401` dispara el logout automático en el cliente
  (`setUnauthorizedHandler` en `api/client.js`).
- **Clave JWT:** no se versiona. Se resuelve desde `Jwt__Key` (variable de entorno) o desde
  user-secrets, y en `appsettings.json` el campo queda **vacío**. Si falta:
  - en **Development** se genera una clave aleatoria por proceso (con warning) para que el
    proyecto se pueda correr recién clonado;
  - en **Production** la API falla al arrancar con un mensaje explícito.

  Una clave filtrada permite a cualquiera firmar su propio JWT con `role: Admin` y acceder a los
  endpoints protegidos por rol, así que no debe quedar nunca en el repositorio.
- **Sesión al recargar:** al montar, `AuthContext` valida el token guardado contra `/api/auth/me`;
  si ya venció, limpia la sesión antes de renderizar las rutas privadas.
