# Changelog - Email Service URLs

## 🎯 Cambio Implementado

Se agregó soporte para construcción automática de URLs usando una variable de entorno base (`APP_BASE_URL`), permitiendo mayor flexibilidad y mantenibilidad.

## 📝 Resumen de Cambios

### 1. Nueva Variable de Entorno

**Ubicación:** Variables de la Function en Appwrite Console

```env
APP_BASE_URL=https://dev.mycad.mx
```

**Ejemplos por ambiente:**

- Desarrollo: `http://localhost:5173`
- Staging: `https://dev.mycad.mx`
- Producción: `https://mycad.mx`

### 2. Nuevos Helpers en `_shared.js`

```javascript
buildUrl(path, params);
```

**Uso:**

```javascript
buildUrl("/verify-email", { token: "abc123" });
// Resultado: https://dev.mycad.mx/verify-email?token=abc123

buildUrl("/reset-password", { userId: "user123", secret: "xyz789" });
// Resultado: https://dev.mycad.mx/reset-password?userId=user123&secret=xyz789
```

### 3. Actualizaciones en Handlers

#### `handleVerification`

**Antes:**

```javascript
{
  "email": "user@example.com",
  "verificationLink": "https://mycad.mx/verify?token=abc123"  // URL completa requerida
}
```

**Ahora (3 opciones):**

```javascript
// Opción 1: Token simple (recomendado)
{
  "email": "user@example.com",
  "token": "abc123"
}

// Opción 2: Appwrite native
{
  "email": "user@example.com",
  "userId": "user123",
  "secret": "secret456"
}

// Opción 3: URL completa (legacy)
{
  "email": "user@example.com",
  "verificationLink": "https://custom-url.com/verify?token=abc123"
}
```

#### `handlePasswordReset`

Mismo patrón que verificación, soporta:

- `token` (recomendado)
- `userId` + `secret` (Appwrite)
- `resetLink` (legacy)

### 4. Servicio Frontend Actualizado

**Archivo:** `front/src/shared/services/emailService.js`

**Nuevos parámetros opcionales:**

```javascript
sendVerificationEmail({
  email,
  name,
  token, // ← NUEVO
  userId, // ← NUEVO
  secret, // ← NUEVO
  verificationLink, // legacy
});

sendPasswordResetEmail({
  email,
  name,
  token, // ← NUEVO
  userId, // ← NUEVO
  secret, // ← NUEVO
  resetLink, // legacy
});
```

### 5. Nuevas Utilidades

**Archivo:** `front/src/shared/utils/emailUtils.js`

Helpers para generar tokens seguros y manejar verificaciones:

```javascript
import {
  generateSecureToken,
  getExpirationDate,
} from "@/shared/utils/emailUtils";

// Generar token seguro
const token = generateSecureToken(); // 64 caracteres hex

// Calcular expiración
const expiresAt = getExpirationDate(24); // 24 horas
```

## 🚀 Migración

### Para Código Existente

**Opción 1: Actualizar a tokens (recomendado)**

```javascript
// Antes
const verificationUrl = `${window.location.origin}/verify?token=${token}`;
await emailService.sendVerification({
  email,
  verificationLink: verificationUrl,
});

// Después
await emailService.sendVerification({ email, token });
```

**Opción 2: Mantener compatibilidad**
No es necesario cambiar nada. Las URLs completas siguen funcionando:

```javascript
// Esto sigue funcionando
await emailService.sendVerification({
  email,
  verificationLink: "https://mycad.mx/verify?token=abc123",
});
```

### Para Código Nuevo

Usa el patrón de token:

```javascript
import { generateSecureToken } from "@/shared/utils/emailUtils";

// 1. Generar token
const token = generateSecureToken();

// 2. Guardar en DB con expiración
await saveVerificationToken(userId, token, expiresIn24h);

// 3. Enviar email (la function construye la URL)
await emailService.sendVerification({ email, name, token });
```

## ✅ Ventajas del Nuevo Sistema

### 1. **Centralización**

- URL base en un solo lugar
- Fácil cambiar entre ambientes

### 2. **Seguridad**

- La URL base está en el servidor, no expuesta al cliente
- No hay riesgo de URLs manipuladas

### 3. **Simplicidad**

```javascript
// Antes: 3 líneas
const baseUrl = window.location.origin;
const fullUrl = `${baseUrl}/verify?token=${token}`;
await emailService.send({ verificationLink: fullUrl });

// Ahora: 1 línea
await emailService.send({ token });
```

### 4. **Flexibilidad**

- Soporta 3 patrones diferentes
- Backward compatible con código existente
- Permite migración gradual

### 5. **Mantenibilidad**

```env
# Cambiar URL en un solo lugar
APP_BASE_URL=https://new-domain.com  # ✅ Afecta todos los emails
```

## 📚 Documentación

### Archivos Nuevos

- ✅ `EXAMPLES.md` - Ejemplos completos de uso
- ✅ `emailUtils.js` - Utilidades para tokens

### Archivos Actualizados

- ✅ `README.md` - Sección de URLs y variables
- ✅ `_shared.js` - Helper `buildUrl()`
- ✅ `index.js` - Handlers actualizados
- ✅ `emailService.js` - Parámetros nuevos

## 🔄 Próximos Pasos

### 1. Desplegar Function

```bash
cd functions/email-service
appwrite deploy function
```

### 2. Configurar Variable

En Appwrite Console > Functions > email-service > Settings:

```
APP_BASE_URL = https://dev.mycad.mx
```

### 3. Actualizar Frontend (opcional)

Si quieres migrar a tokens:

```javascript
// Actualizar llamadas existentes
await emailService.sendVerification({
  email,
  token, // en lugar de verificationLink
});
```

## 🐛 Troubleshooting

### Error: "Missing required fields"

**Causa:** No se proporcionó ni `verificationLink`, ni `token`, ni `userId+secret`

**Solución:** Proporciona al menos una opción:

```javascript
// Cualquiera de estas funciona:
{ token: 'abc123' }
{ userId: 'user123', secret: 'xyz' }
{ verificationLink: 'https://...' }
```

### URL incorrecta en email

**Causa:** `APP_BASE_URL` no está configurada

**Solución:**

1. Ir a Appwrite Console > Functions > email-service > Settings
2. Agregar variable: `APP_BASE_URL=https://dev.mycad.mx`
3. Guardar y reiniciar la function

### Token no funciona en localhost

**Causa:** `APP_BASE_URL` apunta a producción

**Solución:** Usar variable diferente por ambiente:

```env
# Desarrollo
APP_BASE_URL=http://localhost:5173

# Producción
APP_BASE_URL=https://mycad.mx
```

---

**Fecha:** 30 de Diciembre de 2025  
**Versión:** 2.0.0  
**Autor:** MyCAD Team
