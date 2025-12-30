# Ejemplos de Uso - Email Service

## 📧 Guía Rápida

### Configuración Inicial

1. **Variables de Entorno en Appwrite Function**

```env
APP_BASE_URL=https://dev.mycad.mx
SMTP_HOST=smtp.ionos.com
SMTP_PORT=587
SMTP_USER=no-reply@mycad.mx
SMTP_PASS=tu-password
SMTP_FROM="MyCAD" <no-reply@mycad.mx>
```

2. **Variable de Entorno en Frontend**

```env
VITE_APPWRITE_FN_EMAIL_SERVICE_ID=tu-function-id
```

## 🔐 Verificación de Email

### Opción 1: Token Simple (Recomendado)

**Backend/Function:**

```javascript
import emailService from "@/shared/services/emailService";

// Cuando el usuario se registra
await emailService.sendVerification({
  email: "usuario@ejemplo.com",
  name: "Juan Pérez",
  token: "abc123xyz789", // Token generado por ti
  lang: "es",
});
```

**URL generada automáticamente:**

```
https://dev.mycad.mx/verify-email?token=abc123xyz789
```

**Página de verificación (frontend):**

```javascript
// /verify-email
import { useSearchParams } from "react-router-dom";

function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  // Validar token con tu API
  const { mutate: verify } = useMutation({
    mutationFn: () => validateToken(token),
    onSuccess: () => navigate("/dashboard"),
  });

  return <button onClick={verify}>Verificar Email</button>;
}
```

### Opción 2: Appwrite Native (userId + secret)

**Con Appwrite Account API:**

```javascript
import { account } from "@/shared/appwrite/client";
import emailService from "@/shared/services/emailService";

// Crear verificación con Appwrite
const verification = await account.createVerification(
  "https://mycad.mx/verify-email"
);

// Enviar email personalizado
await emailService.sendVerification({
  email: user.email,
  name: user.name,
  userId: verification.userId,
  secret: verification.secret,
  lang: "es",
});
```

**URL generada:**

```
https://dev.mycad.mx/verify-email?userId=user123&secret=secret456
```

**Página de verificación:**

```javascript
function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const userId = searchParams.get("userId");
  const secret = searchParams.get("secret");

  const { mutate: verify } = useMutation({
    mutationFn: () => account.updateVerification(userId, secret),
    onSuccess: () => navigate("/dashboard"),
  });

  return <button onClick={verify}>Confirmar Verificación</button>;
}
```

## 🔑 Restablecimiento de Contraseña

### Opción 1: Token Simple (Recomendado)

**Solicitar reset:**

```javascript
import emailService from "@/shared/services/emailService";

// En la página "Olvidé mi contraseña"
async function handleForgotPassword(email) {
  // 1. Generar token y guardarlo en DB
  const resetToken = generateSecureToken();
  await savePasswordResetToken(email, resetToken, expiresIn1Hour);

  // 2. Enviar email
  await emailService.sendPasswordReset({
    email,
    name: user.name,
    token: resetToken,
    lang: "es",
  });
}
```

**URL generada:**

```
https://dev.mycad.mx/reset-password?token=xyz789abc123
```

**Página de reset:**

```javascript
// /reset-password
function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [newPassword, setNewPassword] = useState("");

  const { mutate: resetPassword } = useMutation({
    mutationFn: (password) => resetPasswordWithToken(token, password),
    onSuccess: () => navigate("/login"),
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        resetPassword(newPassword);
      }}
    >
      <input
        type="password"
        value={newPassword}
        onChange={(e) => setNewPassword(e.target.value)}
        placeholder="Nueva contraseña"
      />
      <button type="submit">Restablecer</button>
    </form>
  );
}
```

### Opción 2: Appwrite Native

**Solicitar reset:**

```javascript
import { account } from "@/shared/appwrite/client";
import emailService from "@/shared/services/emailService";

// Crear recovery con Appwrite
const recovery = await account.createRecovery(
  user.email,
  "https://mycad.mx/reset-password"
);

// Enviar email personalizado
await emailService.sendPasswordReset({
  email: user.email,
  name: user.name,
  userId: recovery.userId,
  secret: recovery.secret,
  lang: "es",
});
```

**Completar reset:**

```javascript
function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const userId = searchParams.get("userId");
  const secret = searchParams.get("secret");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const { mutate: resetPassword } = useMutation({
    mutationFn: (password) =>
      account.updateRecovery(userId, secret, password, confirmPassword),
    onSuccess: () => navigate("/login"),
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        resetPassword(newPassword);
      }}
    >
      <input
        type="password"
        value={newPassword}
        onChange={(e) => setNewPassword(e.target.value)}
        placeholder="Nueva contraseña"
      />
      <input
        type="password"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        placeholder="Confirmar contraseña"
      />
      <button type="submit">Restablecer</button>
    </form>
  );
}
```

## 📊 Envío de Reportes

```javascript
import emailService from "@/shared/services/emailService";
import { storage } from "@/shared/appwrite/client";

async function sendReportByEmail(userId, reportType) {
  // 1. Generar reporte PDF
  const pdfBlob = await generateReportPDF(userId, reportType);

  // 2. Subir a Appwrite Storage
  const file = await storage.createFile(
    "reports-bucket-id",
    ID.unique(),
    pdfBlob
  );

  // 3. Obtener URL pública del archivo
  const reportUrl = storage.getFileView("reports-bucket-id", file.$id);

  // 4. Enviar por email
  await emailService.sendReport({
    email: user.email,
    name: user.name,
    subject: `Reporte de ${reportType} - ${new Date().toLocaleDateString()}`,
    reportName: `reporte-${reportType}-${Date.now()}.pdf`,
    reportUrl: reportUrl.href,
    lang: "es",
  });
}
```

## 🔔 Notificaciones Generales

### Con botón de acción

```javascript
import emailService from "@/shared/services/emailService";

// Notificar mantenimiento pendiente
await emailService.sendNotification({
  email: driver.email,
  name: driver.name,
  subject: "Mantenimiento Programado",
  title: "Mantenimiento de Vehículo",
  message: `
    <p>El vehículo <strong>${vehicle.plate}</strong> tiene un mantenimiento programado para el ${date}.</p>
    <p>Por favor revisa los detalles y confirma tu disponibilidad.</p>
  `,
  actionUrl: `https://dev.mycad.mx/vehicles/${vehicle.id}/maintenance`,
  actionText: "Ver Detalles",
  lang: "es",
});
```

### Sin botón (solo información)

```javascript
await emailService.sendNotification({
  email: admin.email,
  name: admin.name,
  subject: "Nuevo Vehículo Registrado",
  title: "Registro Exitoso",
  message: `
    <p>Se ha registrado un nuevo vehículo en el sistema:</p>
    <ul style="text-align: left; display: inline-block;">
      <li><strong>Placa:</strong> ${vehicle.plate}</li>
      <li><strong>Marca:</strong> ${vehicle.brand}</li>
      <li><strong>Modelo:</strong> ${vehicle.model}</li>
    </ul>
  `,
  lang: "es",
});
```

## 🎯 Casos de Uso Reales

### 1. Registro de Usuario Completo

```javascript
async function registerUser(userData) {
  // 1. Crear usuario en Appwrite
  const user = await account.create(
    ID.unique(),
    userData.email,
    userData.password,
    userData.name
  );

  // 2. Crear perfil en base de datos
  await databases.createDocument(databaseId, "users_profile", ID.unique(), {
    userAuthId: user.$id,
    firstName: userData.firstName,
    lastName: userData.lastName,
    email: userData.email,
  });

  // 3. Generar token de verificación
  const verificationToken = generateSecureToken();
  await saveVerificationToken(user.$id, verificationToken);

  // 4. Enviar email de bienvenida
  await emailService.sendVerification({
    email: userData.email,
    name: userData.name,
    token: verificationToken,
    lang: "es",
  });

  return user;
}
```

### 2. Sistema de Reset Password

```javascript
// Paso 1: Usuario solicita reset
async function requestPasswordReset(email) {
  // Verificar que el email existe
  const users = await databases.listDocuments(databaseId, "users_profile", [
    Query.equal("email", email),
  ]);

  if (users.total === 0) {
    throw new Error("Email no encontrado");
  }

  // Generar token
  const resetToken = generateSecureToken();
  const expiresAt = new Date(Date.now() + 3600000); // 1 hora

  // Guardar en DB
  await databases.createDocument(databaseId, "password_resets", ID.unique(), {
    email,
    token: resetToken,
    expiresAt: expiresAt.toISOString(),
    used: false,
  });

  // Enviar email
  await emailService.sendPasswordReset({
    email,
    name: users.documents[0].firstName,
    token: resetToken,
    lang: "es",
  });
}

// Paso 2: Usuario restablece password
async function resetPassword(token, newPassword) {
  // Buscar token
  const resets = await databases.listDocuments(databaseId, "password_resets", [
    Query.equal("token", token),
    Query.equal("used", false),
  ]);

  if (resets.total === 0) {
    throw new Error("Token inválido o expirado");
  }

  const reset = resets.documents[0];

  // Verificar expiración
  if (new Date(reset.expiresAt) < new Date()) {
    throw new Error("Token expirado");
  }

  // Actualizar password (usar tu método de actualización)
  await updateUserPassword(reset.email, newPassword);

  // Marcar token como usado
  await databases.updateDocument(databaseId, "password_resets", reset.$id, {
    used: true,
  });
}
```

### 3. Reporte Programado Semanal

```javascript
import { schedule } from "node-cron";

// Ejecutar cada lunes a las 9am
schedule("0 9 * * 1", async () => {
  const admins = await getAdminUsers();

  for (const admin of admins) {
    // Generar reporte
    const reportData = await generateWeeklyReport(admin.groupId);
    const pdfBlob = await createPDF(reportData);

    // Subir a storage
    const file = await storage.createFile(
      "weekly-reports",
      ID.unique(),
      pdfBlob
    );

    // Enviar por email
    await emailService.sendReport({
      email: admin.email,
      name: admin.name,
      subject: `Reporte Semanal - ${new Date().toLocaleDateString()}`,
      reportName: `reporte-semanal-${admin.groupId}.pdf`,
      reportUrl: storage.getFileView("weekly-reports", file.$id).href,
      lang: "es",
    });
  }
});
```

## 🔧 Helpers Útiles

### Generar Token Seguro

```javascript
import crypto from "crypto";

function generateSecureToken(length = 32) {
  return crypto.randomBytes(length).toString("hex");
}
```

### Validar Token

```javascript
async function validateToken(token, type = "verification") {
  const tokens = await databases.listDocuments(databaseId, `${type}_tokens`, [
    Query.equal("token", token),
    Query.equal("used", false),
  ]);

  if (tokens.total === 0) return null;

  const tokenDoc = tokens.documents[0];

  // Verificar expiración
  if (new Date(tokenDoc.expiresAt) < new Date()) {
    return null;
  }

  return tokenDoc;
}
```

---

**Última actualización:** Diciembre 2025
