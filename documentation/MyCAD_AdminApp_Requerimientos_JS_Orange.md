# MyCAD Admin App — Requerimientos (UI Naranja + Register + Functions)

## Stack (versiones según package.json del proyecto)
- React + Vite (JS)
- TailwindCSS 4.1 (@tailwindcss/vite)
- Appwrite SDK
- React Query + Devtools
- Framer Motion
- Lucide React (iconos principal)
- Recharts, react-big-calendar, date-fns
- vite-plugin-pwa
- react-hot-toast

## Branding
- Color primario corporativo: **naranja**
- Implementado como tokens CSS:
  - `--brand`, `--brand-600`, `--brand-700`

## Auth
### Login
- Email + password
- Toaster + loading
### Register (nuevo)
- Crea Auth user + inicia sesión
- **Luego debe asegurar `users_profile`**
  - Recomendado: Function `ensureProfile`
  - Frontend deja el hook listo y muestra aviso si no está configurada.

## Admin Usuarios
- Crear usuarios de Auth de terceros **no se hace en frontend**.
- Se hace con Function server-side `createUserWithProfile`:
  - crea Auth user
  - crea `users_profile`
  - opcional: asigna Team y crea `group_members`

## Env vars
- `VITE_APPWRITE_FN_ENSURE_PROFILE_ID`
- `VITE_APPWRITE_FN_CREATE_USER_WITH_PROFILE_ID`
