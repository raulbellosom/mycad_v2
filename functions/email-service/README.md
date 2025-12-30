# Email Service Function - MyCAD

Appwrite Function para envío de correos electrónicos profesionales en MyCAD con diseño premium.

## ✨ Características

- ✅ **Diseño Premium** - Templates modernos y profesionales
- ✅ **Responsive** - Compatible con todos los dispositivos y clientes de email
- ✅ **Multi-idioma** - Soporte completo en Español e Inglés
- ✅ **Identidad de Marca** - Logo y colores corporativos de MyCAD (naranja)
- ✅ **Accesible** - Optimizado para lectores de pantalla y modo oscuro
- ✅ **Seguro** - Validaciones y mensajes de seguridad incorporados

## 📧 Templates Disponibles

### 1. Verificación de Cuenta

Email elegante con ícono de sobre y nota de seguridad.

- Mensaje de bienvenida personalizado
- Botón destacado con gradiente naranja
- Aviso de expiración en 24 horas
- Nota de seguridad con borde lateral

### 2. Restablecimiento de Contraseña

Email con ícono de llave y advertencia de expiración.

- Mensaje personalizado de saludo
- Botón de acción destacado
- Advertencia visual de expiración en 1 hora
- Nota de seguridad en caso de error

### 3. Envío de Reportes

Email con ícono de gráfica y tarjeta de archivo.

- Tarjeta visual con nombre del reporte
- Ícono de descarga en botón
- Diseño profesional para documentos

### 4. Notificaciones Generales

Email flexible con ícono de campana.

- Contenido personalizable
- Botón de acción opcional
- Diseño limpio y directo

## 🎨 Diseño Visual

### Paleta de Colores

- **Primario**: `#f97316` (Naranja MyCAD)
- **Primario Oscuro**: `#ea580c`
- **Fondo**: `#f9fafb` (Gris claro)
- **Contenedor**: `#ffffff` (Blanco)
- **Texto**: `#111827` (Gris oscuro)
- **Texto Secundario**: `#6b7280`

### Elementos de Diseño

- **Header**: Gradiente naranja con logo en placa vehicular
- **Íconos**: Círculos con gradiente y borde de color
- **Botones**: Gradiente naranja con sombra elevada
- **Tarjetas**: Bordes suaves con sombras sutiles
- **Footer**: Información de copyright y mensaje automático

## 🚀 Despliegue

Configura estas variables en la consola de Appwrite (Settings > Variables):

```env
# SMTP Configuration
SMTP_HOST=smtp.tuproveedor.com
SMTP_PORT=587
SMTP_USER=tu-email@dominio.com
SMTP_PASS=tu-contraseña
SMTP_FROM="MyCAD" <no-reply@tudominio.com>
SMTP_SECURE=false

# Application URL (Frontend)
APP_BASE_URL=https://dev.mycad.mx
# Producción: https://mycad.mx
# Desarrollo: http://localhost:5173

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

**Opción 1: Con token (recomendado)**

```json
{
  "action": "send-verification",
  "email": "usuario@ejemplo.com",
  "name": "Juan Pérez",
  "token": "abc123xyz",
  "lang": "es"
}
```

_La function construirá automáticamente: `https://dev.mycad.mx/verify-email?token=abc123xyz`_

**Opción 2: Con userId y secret (Appwrite)**

```json
{
  "action": "send-verification",
  "email": "usuario@ejemplo.com",
  "name": "Juan Pérez",
  "userId": "user123",
  "secret": "secret456",
  "lang": "es"
}
```

_La function construirá: `https://dev.mycad.mx/verify-email?userId=user123&secret=secret456`_

**Opción 3: Con URL completa (legacy)**

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

**Opción 1: Con token (recomendado)**

```json
{
  "action": "send-password-reset",
  "email": "usuario@ejemplo.com",
  "name": "Juan Pérez",
  "token": "reset-token-123",
  "lang": "es"
}
```

_La function construirá: `https://dev.mycad.mx/reset-password?token=reset-token-123`_

**Opción 2: Con userId y secret (Appwrite)**

```json
{
  "action": "send-password-reset",
  "email": "usuario@ejemplo.com",
  "name": "Juan Pérez",
  "userId": "user123",
  "secret": "secret789",
  "lang": "es"
}
```

**Opción 3: Con URL completa (legacy)**

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

## 📖 Documentación Adicional

- **[EXAMPLES.md](./EXAMPLES.md)** - Ejemplos de uso completos y casos reales
- **[DESIGN_GUIDE.md](./DESIGN_GUIDE.md)** - Guía de diseño y componentes de email

## 🔑 Ventajas del Sistema de URLs

### URLs Construidas Automáticamente

La function construye las URLs usando `APP_BASE_URL`, lo que permite:

✅ **Centralización** - Cambiar la URL base en un solo lugar  
✅ **Ambientes** - Usar diferentes URLs para dev/staging/production  
✅ **Simplicidad** - Solo enviar el token, no URLs completas  
✅ **Seguridad** - La URL base está en el servidor, no en el cliente

### Ejemplo de Flujo

**Antes (con URL completa):**

```javascript
// Frontend construye la URL
const fullUrl = `${window.location.origin}/verify?token=${token}`;
await emailService.sendVerification({ email, verificationLink: fullUrl });
```

**Ahora (con token):**

```javascript
// Function construye la URL usando APP_BASE_URL
await emailService.sendVerification({ email, token });
// Genera: https://dev.mycad.mx/verify-email?token=abc123
```

## 🚀 Despliegue

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

## 💻 Uso desde el Frontend

### Opción 1: Con el servicio wrapper (Recomendado)

```javascript
import emailService from "@/shared/services/emailService";

// Verificación de email (con token)
await emailService.sendVerification({
  email: "user@example.com",
  name: "Juan Pérez",
  token: "abc123xyz", // La function construye la URL automáticamente
  lang: "es",
});

// Reset de password (con token)
await emailService.sendPasswordReset({
  email: "user@example.com",
  name: "Juan Pérez",
  token: "reset-token-123",
  lang: "es",
});

// Enviar reporte
await emailService.sendReport({
  email: "user@example.com",
  name: "Juan Pérez",
  subject: "Reporte Mensual",
  reportName: "reporte-enero-2025.pdf",
  reportUrl: "https://storage.mycad.mx/reports/123.pdf",
  lang: "es",
});
```

### Opción 2: Con React Query hooks

```javascript
import { useSendVerificationEmail } from "@/shared/hooks/useEmailService";

function RegisterForm() {
  const sendVerification = useSendVerificationEmail();

  const handleSubmit = async (userData) => {
    // Crear usuario...
    const token = generateVerificationToken();

    // Enviar email de verificación
    await sendVerification.mutateAsync({
      email: userData.email,
      name: userData.name,
      token,
      lang: "es",
    });

    // Mostrar mensaje de éxito
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* ... */}
      <button disabled={sendVerification.isPending}>
        {sendVerification.isPending ? "Enviando..." : "Registrar"}
      </button>
    </form>
  );
}
```

### Opción 3: Directamente con Functions API

```javascript
import { functions } from "@/shared/appwrite/client";

// Enviar verificación
const result = await functions.createExecution(
  import.meta.env.VITE_APPWRITE_FN_EMAIL_SERVICE_ID,
  JSON.stringify({
    action: "send-verification",
    email: "user@example.com",
    name: "Juan",
    token: "abc123", // Ahora solo envías el token
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
