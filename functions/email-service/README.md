# Email Service Function

Appwrite Function para envío de correos electrónicos en MyCAD.

## Funcionalidades

- ✅ Envío de correos de verificación de cuenta
- ✅ Envío de correos de restablecimiento de contraseña
- ✅ Envío de reportes PDF por correo
- ✅ Notificaciones generales
- ✅ Soporte multi-idioma (ES/EN)
- ✅ Templates HTML responsivos

## Variables de Entorno Requeridas

Configura estas variables en la consola de Appwrite (Settings > Variables):

```env
# SMTP Configuration
SMTP_HOST=smtp.tuproveedor.com
SMTP_PORT=587
SMTP_USER=tu-email@dominio.com
SMTP_PASS=tu-contraseña
SMTP_FROM="MyCAD" <no-reply@tudominio.com>
SMTP_SECURE=false

# Appwrite (automáticas en self-hosted)
APPWRITE_ENDPOINT=https://tu-appwrite.com/v1
APPWRITE_PROJECT_ID=tu-project-id
APPWRITE_API_KEY=tu-api-key
APPWRITE_DATABASE_ID=tu-database-id

# Collections
COLLECTION_USERS_PROFILE_ID=tu-collection-id
```

## Acciones Disponibles

### 1. `send-verification`

Envía correo de verificación de cuenta.

```json
{
  "action": "send-verification",
  "email": "usuario@ejemplo.com",
  "name": "Juan Pérez",
  "verificationLink": "https://tuapp.com/verify?token=xxx",
  "lang": "es"
}
```

### 2. `send-password-reset`

Envía correo para restablecer contraseña.

```json
{
  "action": "send-password-reset",
  "email": "usuario@ejemplo.com",
  "name": "Juan Pérez",
  "resetLink": "https://tuapp.com/reset?token=xxx",
  "lang": "es"
}
```

### 3. `send-report`

Envía un reporte PDF por correo.

```json
{
  "action": "send-report",
  "email": "usuario@ejemplo.com",
  "name": "Juan Pérez",
  "subject": "Reporte de Vehículos - Enero 2025",
  "reportName": "reporte-vehiculos.pdf",
  "reportUrl": "https://storage.../reporte.pdf",
  "lang": "es"
}
```

### 4. `send-notification`

Envía una notificación general.

```json
{
  "action": "send-notification",
  "email": "usuario@ejemplo.com",
  "name": "Juan Pérez",
  "subject": "Alerta de Mantenimiento",
  "title": "Mantenimiento Programado",
  "message": "El vehículo ABC-123 tiene mantenimiento pendiente.",
  "actionUrl": "https://tuapp.com/vehicles/123",
  "actionText": "Ver Vehículo",
  "lang": "es"
}
```

## Despliegue

### 1. Usando Appwrite CLI

```bash
# Instalar CLI si no lo tienes
npm install -g appwrite-cli

# Login
appwrite login

# Desplegar la function
cd functions/email-service
appwrite deploy function
```

### 2. Manual desde Consola

1. Ve a tu consola de Appwrite > Functions
2. Crea una nueva function con Node.js runtime
3. Sube el contenido de la carpeta `email-service`
4. Configura las variables de entorno
5. Habilita ejecución desde cliente si es necesario

## Uso desde el Frontend

```javascript
import { functions } from "@/shared/appwrite/client";

// Enviar verificación
const result = await functions.createExecution(
  import.meta.env.VITE_APPWRITE_FN_EMAIL_SERVICE_ID,
  JSON.stringify({
    action: "send-verification",
    email: "user@example.com",
    name: "Juan",
    verificationLink: "https://...",
    lang: "es",
  }),
  false // async = false para esperar respuesta
);

const response = JSON.parse(result.responseBody);
if (response.ok) {
  console.log("Email enviado:", response.messageId);
}
```

## Eventos Automáticos (Opcional)

Puedes configurar la function para ejecutarse automáticamente con eventos de Appwrite:

- `users.*.create` - Enviar email de bienvenida
- `users.*.sessions.*.create` - Notificar nuevo inicio de sesión

Configura los eventos en Settings > Events de la function.
