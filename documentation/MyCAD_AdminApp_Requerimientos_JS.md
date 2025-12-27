# MyCAD Admin App (Appwrite) — Requerimientos (React + Vite + JS) vNext

> Base funcional: propuesta de BD/Appwrite **mycad_db_vnext_propuesta.md** (colecciones, scopes, soft-delete, multi-tenant por grupos).  
> Stack objetivo: **React (JS)** + **Vite**, **TailwindCSS 4.1**, **Appwrite**, UI moderna con **dark mode**, animaciones y UX consistente.  
> **Sin TypeScript** (solo JavaScript).

---

## 0) Librerías obligatorias (MVP)

### Core
- react, react-dom
- react-router-dom
- appwrite
- axios

### UI/UX
- tailwindcss (v4.1) + @tailwindcss/vite
- framer-motion
- lucide-react (iconos principal)
- clsx + tailwind-merge (para classnames)
- react-hot-toast (toaster)

### Data & State
- @tanstack/react-query
- @tanstack/react-query-devtools

### Fechas y calendario
- date-fns
- react-big-calendar

### Dashboards
- recharts (gráficas)

### Gestures
- @use-gesture/react

### PWA
- vite-plugin-pwa

> Se pueden agregar libs extra solo si aportan valor (p. ej. zod, react-hook-form, zustand), pero el core anterior es el estándar del proyecto.

---

## 1) Objetivo del sistema

Construir una app web **100% responsiva** (móvil/tablet/desktop) para:

- Gestión de **Usuarios** (perfil negocio) vinculados a **Appwrite Auth**.
- Gestión de **Grupos** (multi‑tenant) con **Appwrite Teams** + metadata local.
- Gestión de **Roles y permisos** (por grupo) + **admin global**.
- Gestión de **Vehículos** y recursos (archivos, mantenimientos, rentas).
- Gestión de **Catálogos** (tipo, marca, modelo, condición).
- Gestión de **Reportes** (plantillas y ejecuciones).
- **Auditoría** básica (logs).

**Enfoque visual:** elegante, sofisticado, moderno; feedback claro (toasts), loaders, estados vacíos y animaciones suaves.

---

## 2) Reglas clave (seguridad y multi‑tenant)

### 2.1 La UI no es la fuente de verdad
- La UI oculta/bloquea acciones según rol, pero **la seguridad real** debe vivir en:
  - permisos por documento en Appwrite (`permissions`)
  - y/o Functions/API que validen rol y actúen como “gatekeeper”.

### 2.2 “Grupo activo” como contexto
- Toda consulta multi‑tenant debe usar `groupId`/`teamId` como filtro.
- La app tiene selector de **grupo activo** global (topbar).

### 2.3 Soft delete
- Cuando aplique, se usa `enabled=false` (o `status=DELETED`) — sin borrado físico.

### 2.4 Índices
- Restricción: **no usar $id como índice principal** (se asume que la BD propuesta ya contempla campos alternos para indexación/búsqueda).
- En UI se prioriza búsqueda/filtros por campos útiles (placa, VIN, serie, nombre, etc.).

---

## 3) Roles y permisos (modelo operativo)

### 3.1 Roles por grupo (mínimo)
- OWNER
- ADMIN
- MEMBER
- VIEWER

### 3.2 Admin global
- Un team especial `platform_admins` (o bandera en `users_profile.isPlatformAdmin`) con acceso cross‑group.

### 3.3 Permisos por documento (sugerido)
- Lectura: `team:{groupId}` + `team:platform_admins`
- Escritura: `team:{groupId}` (solo owners/admins) + `team:platform_admins`

> Nota: Appwrite maneja permisos por documento; si necesitas granularidad fina (CRUD por entidad), lo más robusto es centralizar en Functions.

---

## 4) Módulos (MVP)

### 4.1 Autenticación
- Login (email + password)
- Forgot password
- Logout
- Sesión persistente

**Regla:** trabajar con `users_profile` como identidad de negocio:
- `users_profile.userAuthId` referencia `AuthUser.$id`.

### 4.2 users_profile
- Ver/editar perfil propio
- Lista/detalle para admin (cambiar status, etc.)

### 4.3 Grupos (Teams + groups)
- Listar grupos disponibles
- Seleccionar grupo activo
- (Fase 2) Crear/editar grupo
- Vista de miembros (Teams)

### 4.4 Vehículos
- Lista con filtros y paginación
- Crear/editar
- Detalle con tabs:
  - General
  - Archivos (fotos/docs)
  - Servicios
  - Rentas (si aplica)
  - Auditoría

Visibilidad:
- PRIVATE (solo owner)
- GROUP (todo el team)

### 4.5 Catálogos
- vehicle_types (global)
- vehicle_brands (global)
- vehicle_models (global con brandId)
- conditions (GLOBAL / GROUP)

Reglas:
- Global: solo admin global escribe
- Group: owner/admin del grupo escribe

### 4.6 Reportes
- report_templates CRUD
- report_runs lista/estado
- descarga desde Storage

### 4.7 Dashboard
- KPIs del grupo
- Gráficas con Recharts
- Calendario con react-big-calendar (p. ej. mantenimientos o rentas)

### 4.8 Auditoría
- Lista de audit_logs
- Filtros por acción/actor/entidad

---

## 5) No funcional (UI/Arquitectura)

### 5.1 Diseño
- Layout con sidebar + topbar sticky
- Cards, tablas responsivas, modales
- Transiciones y micro‑interacciones con Framer Motion
- Iconografía consistente con Lucide

### 5.2 Dark mode (Tailwind 4.1)
Se implementa manual con selector `.dark`:

```css
@import "tailwindcss";
@custom-variant dark (&:where(.dark, .dark *));
```

### 5.3 Manejo de estado y datos
- React Query como estándar para fetch/caching/mutations
- Axios como HTTP client (si se usa Functions/API propias)
- Appwrite SDK para Auth/Database/Teams/Storage

### 5.4 Patrón de carpetas (recomendado)
Arquitectura por **features** (escalable):

- `src/app` (router, providers, config)
- `src/shared` (ui reusables, utils, hooks base, appwrite client)
- `src/features/<feature>` (pages, components, hooks, services)

---

## 6) Variables de entorno (obligatorias)

- `VITE_APPWRITE_ENDPOINT`
- `VITE_APPWRITE_PROJECT_ID`
- `VITE_APPWRITE_DATABASE_ID`
- `VITE_APPWRITE_BUCKET_VEHICLES_ID`

Opcionales:
- `VITE_APPWRITE_PLATFORM_ADMINS_TEAM_ID`
- `VITE_APP_NAME`

---

## 7) Pantallas (MVP)

1. Auth
   - Login
   - Forgot password
2. App
   - Dashboard
   - Vehículos (lista/detalle)
   - Catálogos
   - Grupos
   - Usuarios
   - Reportes
   - Auditoría

---

## 8) Entregables

1) **Repositorio Vite (JS)** con:
- Tailwind 4.1 + dark mode manual
- PWA listo (vite-plugin-pwa)
- Providers: Theme, Auth, ActiveGroup, ReactQuery
- UI components reusables
- Starter de pantallas y wiring a Appwrite

2) `.env.example` completo  
3) README con setup y scripts

