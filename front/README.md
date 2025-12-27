# MyCAD Admin — Orange UI (React JS + Vite + TailwindCSS 4.1 + Appwrite)

Este starter usa **naranja corporativo** como color principal mediante tokens CSS:
- `--brand`, `--brand-600`, `--brand-700`

## Dependencias (según tu package.json)
Ver `package.json` (versiones compatibles).  

## Setup
```bash
npm i
cp .env.example .env
npm run dev
```

## Dark mode (Tailwind v4.1)
`src/styles/app.css`:
```css
@import "tailwindcss";
@custom-variant dark (&:where(.dark, .dark *));
```

## Registro y users_profile (recomendado vía Function)
- El registro crea Auth user y sesión.
- Para crear `users_profile`, se recomienda una Function:
  - `VITE_APPWRITE_FN_ENSURE_PROFILE_ID`

Admin -> Crear usuario:
- Debe ser vía Function con permisos server-side:
  - `VITE_APPWRITE_FN_CREATE_USER_WITH_PROFILE_ID`
