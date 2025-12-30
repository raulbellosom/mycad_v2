# Plan de Implementación: Invitaciones a Grupos por Email

## Descripción General

Implementar un sistema de invitaciones por correo electrónico que permita a los administradores de grupo invitar a usuarios existentes (que ya tienen cuenta en la plataforma pero no pertenecen a su grupo) a unirse a su grupo.

## Problema Actual

1. Cuando un admin de grupo intenta crear un nuevo usuario con un email que ya existe, falla el registro
2. No hay forma de agregar usuarios existentes a un grupo si no conoces su ID de perfil
3. Los usuarios existentes no reciben notificación cuando alguien quiere que se unan a su grupo

## Solución Propuesta

### Flujo de Invitación

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           FLUJO DE INVITACIÓN                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Admin escribe email ──► ¿Email existe? ──► NO ──► Crear usuario normal    │
│                              │                                              │
│                              │ SÍ                                           │
│                              ▼                                              │
│                    ¿Ya es miembro del grupo? ──► SÍ ──► Mostrar mensaje    │
│                              │                                              │
│                              │ NO                                           │
│                              ▼                                              │
│                    Crear registro de invitación                            │
│                              │                                              │
│                              ▼                                              │
│                    Enviar email con link de aceptación                     │
│                              │                                              │
│                              ▼                                              │
│             Usuario recibe email ──► Click en "Aceptar"                    │
│                              │                                              │
│                              ▼                                              │
│                    Se agrega como miembro del grupo                        │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 1. Nueva Colección: `group_invitations`

> Documentación completa en [db_mycad.md](db_mycad.md) sección AF)
>
> ⚠️ **SIMPLIFICADO v2.1:** Se eliminaron las relaciones two-way con `users_profile` para evitar
> sobrecarga de backrefs. Solo se mantiene la relación con `groups`.
> Los campos `invitedByProfileId` e `invitedProfileId` son **escalares indexables** para queries.

### Atributos

| Field              | Type        | Required | Default | Notes                                               |
| ------------------ | ----------- | -------: | ------- | --------------------------------------------------- |
| groupId            | String(64)  |       ✅ |         | `groups.$id` (tenant) - scalar indexable            |
| invitedEmail       | String(254) |       ✅ |         | Email del usuario invitado (normalizado lowercase)  |
| invitedProfileId   | String(64)  |       ❌ |         | `users_profile.$id` si el email ya existe - scalar  |
| invitedByProfileId | String(64)  |       ✅ |         | `users_profile.$id` de quien invita - scalar        |
| role               | Enum        |       ❌ | MEMBER  | OWNER / MEMBER                                      |
| status             | Enum        |       ❌ | PENDING | PENDING / ACCEPTED / REJECTED / EXPIRED / CANCELLED |
| token              | String(64)  |       ✅ |         | UUID único para aceptar invitación                  |
| message            | String(500) |       ❌ |         | Mensaje personalizado del invitador                 |
| expiresAt          | Datetime    |       ✅ |         | Fecha de expiración (7 días por defecto)            |
| respondedAt        | Datetime    |       ❌ |         | Fecha de respuesta (aceptar/rechazar)               |
| enabled            | Boolean     |       ❌ | true    | soft delete                                         |

### Índices

> ⚠️ Nombres de índice máximo 43 caracteres. Usamos prefijo `idx_grp_inv_` para acortar.

| Index Name                     | Type   | Fields                              |
| ------------------------------ | ------ | ----------------------------------- |
| `idx_grp_inv_groupId`          | key    | `groupId`                           |
| `uq_grp_inv_token`             | unique | `token`                             |
| `idx_grp_inv_grp_email_status` | key    | `groupId`, `invitedEmail`, `status` |
| `idx_grp_inv_invitedProfileId` | key    | `invitedProfileId`                  |
| `idx_grp_inv_invitedById`      | key    | `invitedByProfileId`                |
| `idx_grp_inv_enabled`          | key    | `enabled`                           |

### Relaciones

> ⚠️ **Solo UNA relación** con `groups`. NO crear relaciones two-way con `users_profile`.

| Relationship | Related Collection | Attribute Key | Backref Key   | Cardinality | On Delete |
| ------------ | ------------------ | ------------- | ------------- | ----------- | --------- |
| `group`      | `groups`           | `group`       | `invitations` | Many-to-one | Cascade   |

### Notas de implementación

- **Para obtener invitaciones enviadas por un usuario:** Query por `invitedByProfileId`
- **Para obtener invitaciones recibidas por un usuario:** Query por `invitedProfileId` o `invitedEmail`
- **NO** crear relaciones two-way adicionales con `users_profile`

---

## 2. Actualización del Email Service

### Nueva Acción: `send-group-invitation`

```json
{
  "action": "send-group-invitation",
  "email": "usuario@ejemplo.com",
  "name": "Juan Pérez",
  "inviterName": "Admin del Grupo",
  "groupName": "Maquinaria y Canteras",
  "role": "MEMBER",
  "message": "Te invito a unirte a nuestro grupo para gestionar la flota",
  "acceptUrl": "https://mycad.app/invitations/accept?token=xxx",
  "lang": "es"
}
```

### Nuevo Template: `groupInvitationTemplate`

```javascript
// templates.js - Agregar nuevo template

export function groupInvitationTemplate(
  name,
  inviterName,
  groupName,
  role,
  message,
  acceptUrl,
  t
) {
  const roleLabels = {
    OWNER: "Dueño",
    ADMIN: "Administrador",
    MEMBER: "Miembro",
    VIEWER: "Visor",
  };

  const content = `
${headerSection(t.groupInvitation.title)}
<!-- Content -->
<tr>
  <td style="padding: 0 40px 40px 40px;">
    <p style="margin: 0 0 16px 0; font-size: 16px; line-height: 1.6; color: ${
      colors.text
    }; text-align: center;">
      ${t.groupInvitation.greeting}${name ? " " + name : ""},
    </p>
    <p style="margin: 0 0 16px 0; font-size: 16px; line-height: 1.6; color: ${
      colors.textMuted
    }; text-align: center;">
      <strong style="color: ${colors.primary};">${inviterName}</strong> ${
    t.groupInvitation.invitesYou
  }
    </p>
    
    <!-- Group info box -->
    <table role="presentation" width="100%" style="margin: 24px 0; background-color: ${
      colors.background
    }; border: 1px solid ${colors.border}; border-radius: 8px;">
      <tr>
        <td style="padding: 20px; text-align: center;">
          <p style="margin: 0 0 8px 0; font-size: 18px; font-weight: 600; color: ${
            colors.white
          };">
            🏢 ${groupName}
          </p>
          <p style="margin: 0; font-size: 14px; color: ${colors.textMuted};">
            ${t.groupInvitation.roleLabel}: <strong style="color: ${
    colors.primary
  };">${roleLabels[role] || role}</strong>
          </p>
        </td>
      </tr>
    </table>
    
    ${
      message
        ? `
    <div style="margin: 0 0 24px 0; padding: 16px; background-color: ${colors.background}; border-left: 3px solid ${colors.primary}; border-radius: 0 8px 8px 0;">
      <p style="margin: 0; font-size: 14px; font-style: italic; color: ${colors.textMuted};">
        "${message}"
      </p>
    </div>
    `
        : ""
    }
    
    ${actionButton(acceptUrl, t.groupInvitation.acceptButton)}
    
    <p style="margin: 24px 0 0 0; font-size: 13px; color: ${
      colors.textDark
    }; text-align: center;">
      ${t.groupInvitation.ignoreNote}
    </p>
    <p style="margin: 8px 0 0 0; font-size: 12px; color: ${
      colors.textDark
    }; text-align: center;">
      ⏱️ ${t.groupInvitation.expiry}
    </p>
  </td>
</tr>
  `.trim();

  return baseTemplate(content, footerSection(t));
}
```

### Traducciones a Agregar

```javascript
// _shared.js - Agregar a translations

groupInvitation: {
  subject: "Te han invitado a un grupo en MyCAD",
  title: "Invitación a Grupo",
  greeting: "Hola",
  invitesYou: "te ha invitado a unirte al grupo:",
  roleLabel: "Rol asignado",
  acceptButton: "Aceptar Invitación",
  ignoreNote: "Si no esperabas esta invitación, puedes ignorar este correo.",
  expiry: "Esta invitación expira en 7 días",
}
```

---

## 3. Nuevos Servicios Frontend

### `invitations.service.js`

```javascript
// front/src/features/groups/services/invitations.service.js

import { databases, functions } from "../../../shared/appwrite/client";
import { Query, ID } from "appwrite";
import { env } from "../../../shared/appwrite/env";

const DB = env.databaseId;
const INVITATIONS = env.collectionGroupInvitationsId;
const USERS_PROFILE = env.collectionUsersProfileId;

/**
 * Verifica si un email ya existe en la plataforma
 */
export async function checkEmailExists(email) {
  const res = await databases.listDocuments(DB, USERS_PROFILE, [
    Query.equal("email", email.toLowerCase()),
    Query.limit(1),
  ]);
  return res.documents[0] || null;
}

/**
 * Verifica si ya existe una invitación pendiente
 */
export async function checkPendingInvitation(groupId, email) {
  const res = await databases.listDocuments(DB, INVITATIONS, [
    Query.equal("groupId", groupId),
    Query.equal("invitedEmail", email.toLowerCase()),
    Query.equal("status", "PENDING"),
    Query.equal("enabled", true),
    Query.limit(1),
  ]);
  return res.documents[0] || null;
}

/**
 * Crea una invitación y envía el correo
 */
export async function createGroupInvitation({
  groupId,
  groupName,
  email,
  role = "MEMBER",
  message = "",
  inviterProfileId,
  inviterName,
}) {
  // 1. Verificar si el email ya existe
  const existingProfile = await checkEmailExists(email);

  // 2. Verificar si ya hay invitación pendiente
  const pendingInvitation = await checkPendingInvitation(groupId, email);
  if (pendingInvitation) {
    throw new Error("Ya existe una invitación pendiente para este email");
  }

  // 3. Crear token único
  const token = crypto.randomUUID();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // 7 días

  // 4. Crear documento de invitación
  const invitation = await databases.createDocument(
    DB,
    INVITATIONS,
    ID.unique(),
    {
      groupId,
      invitedEmail: email.toLowerCase(),
      invitedProfileId: existingProfile?.$id || null,
      invitedByProfileId: inviterProfileId,
      role,
      status: "PENDING",
      token,
      message,
      expiresAt: expiresAt.toISOString(),
      enabled: true,
      group: groupId,
      invitedBy: inviterProfileId,
    }
  );

  // 5. Enviar correo
  const acceptUrl = `${window.location.origin}/invitations/accept?token=${token}`;

  await functions.createExecution(
    env.fnEmailServiceId,
    JSON.stringify({
      action: "send-group-invitation",
      email,
      name: existingProfile?.firstName || "",
      inviterName,
      groupName,
      role,
      message,
      acceptUrl,
      lang: "es",
    })
  );

  return invitation;
}

/**
 * Obtiene una invitación por token
 */
export async function getInvitationByToken(token) {
  const res = await databases.listDocuments(DB, INVITATIONS, [
    Query.equal("token", token),
    Query.equal("enabled", true),
    Query.limit(1),
  ]);
  return res.documents[0] || null;
}

/**
 * Acepta una invitación
 */
export async function acceptInvitation(token, profileId) {
  const invitation = await getInvitationByToken(token);

  if (!invitation) {
    throw new Error("Invitación no encontrada");
  }

  if (invitation.status !== "PENDING") {
    throw new Error("Esta invitación ya fue procesada");
  }

  if (new Date(invitation.expiresAt) < new Date()) {
    await databases.updateDocument(DB, INVITATIONS, invitation.$id, {
      status: "EXPIRED",
    });
    throw new Error("Esta invitación ha expirado");
  }

  // Actualizar invitación
  await databases.updateDocument(DB, INVITATIONS, invitation.$id, {
    status: "ACCEPTED",
    respondedAt: new Date().toISOString(),
  });

  // Agregar como miembro del grupo
  // (usar función existente addGroupMember)
  return invitation;
}

/**
 * Rechaza una invitación
 */
export async function rejectInvitation(token) {
  const invitation = await getInvitationByToken(token);

  if (!invitation || invitation.status !== "PENDING") {
    throw new Error("Invitación no válida");
  }

  return await databases.updateDocument(DB, INVITATIONS, invitation.$id, {
    status: "REJECTED",
    respondedAt: new Date().toISOString(),
  });
}

/**
 * Lista invitaciones pendientes de un usuario
 */
export async function listMyPendingInvitations(profileId) {
  const res = await databases.listDocuments(DB, INVITATIONS, [
    Query.equal("invitedProfileId", profileId),
    Query.equal("status", "PENDING"),
    Query.equal("enabled", true),
    Query.orderDesc("$createdAt"),
  ]);
  return res.documents;
}

/**
 * Lista invitaciones enviadas por un grupo
 */
export async function listGroupInvitations(groupId) {
  const res = await databases.listDocuments(DB, INVITATIONS, [
    Query.equal("groupId", groupId),
    Query.equal("enabled", true),
    Query.orderDesc("$createdAt"),
  ]);
  return res.documents;
}

/**
 * Cancela una invitación pendiente
 */
export async function cancelInvitation(invitationId) {
  return await databases.updateDocument(DB, INVITATIONS, invitationId, {
    status: "CANCELLED",
  });
}

/**
 * Reenvía una invitación
 */
export async function resendInvitation(invitationId) {
  // Obtener invitación, generar nuevo token, actualizar expiración, enviar correo
  // ...
}
```

---

## 4. Componentes UI

### 4.1 Modificar `CreateUserModal.jsx`

Agregar lógica para detectar emails existentes:

```jsx
// Antes de crear usuario, verificar si email existe
const existingUser = await checkEmailExists(email);

if (existingUser) {
  // Mostrar modal de confirmación para enviar invitación
  setShowInviteConfirm(true);
  setExistingUserInfo(existingUser);
  return;
}

// Si no existe, crear usuario normal
// ...
```

### 4.2 Modal de Confirmación de Invitación

```jsx
<ConfirmModal
  isOpen={showInviteConfirm}
  title="Usuario Existente"
  message={`El email ${email} ya está registrado en la plataforma. ¿Deseas enviar una invitación para que se una a tu grupo?`}
  confirmText="Enviar Invitación"
  onConfirm={() => handleSendInvitation()}
  onCancel={() => setShowInviteConfirm(false)}
/>
```

### 4.3 Tab de Invitaciones en `MembersTab.jsx`

Agregar una sección o tab para ver invitaciones pendientes del grupo:

```jsx
// Invitaciones Pendientes
<div className="mt-6">
  <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
    <Mail size={16} />
    Invitaciones Pendientes
    <Badge variant="warning" size="sm">
      {pendingInvitations.length}
    </Badge>
  </h4>

  {pendingInvitations.map((inv) => (
    <div
      key={inv.$id}
      className="flex items-center justify-between p-3 border rounded-lg mb-2"
    >
      <div>
        <p className="font-medium">{inv.invitedEmail}</p>
        <p className="text-xs text-muted-fg">
          Enviada {formatDate(inv.$createdAt)} • Expira{" "}
          {formatDate(inv.expiresAt)}
        </p>
      </div>
      <div className="flex gap-2">
        <Button
          size="sm"
          variant="ghost"
          onClick={() => resendInvitation(inv.$id)}
        >
          <RefreshCw size={14} />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => cancelInvitation(inv.$id)}
        >
          <X size={14} />
        </Button>
      </div>
    </div>
  ))}
</div>
```

### 4.4 Página de Aceptación de Invitación

Nueva ruta: `/invitations/accept?token=xxx`

```jsx
// front/src/features/groups/pages/AcceptInvitationPage.jsx

export function AcceptInvitationPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const { profile } = useAuth();

  const {
    data: invitation,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["invitation", token],
    queryFn: () => getInvitationByToken(token),
    enabled: !!token,
  });

  const acceptMutation = useMutation({
    mutationFn: () => acceptInvitation(token, profile.$id),
    onSuccess: () => {
      toast.success("¡Te has unido al grupo!");
      navigate("/groups");
    },
  });

  // ... UI con información del grupo e invitador
  // Botones: Aceptar / Rechazar
}
```

### 4.5 Notificación en Dashboard/Header

Mostrar badge de invitaciones pendientes:

```jsx
// En el header o sidebar
const { data: pendingInvitations } = useQuery({
  queryKey: ["my-pending-invitations", profile?.$id],
  queryFn: () => listMyPendingInvitations(profile.$id),
  enabled: !!profile?.$id,
});

{
  pendingInvitations?.length > 0 && (
    <Badge variant="warning">{pendingInvitations.length}</Badge>
  );
}
```

---

## 5. Variables de Entorno Nuevas

### Frontend (`.env`)

```env
VITE_APPWRITE_COLLECTION_GROUP_INVITATIONS_ID=
VITE_APPWRITE_FN_EMAIL_SERVICE_ID=
```

### Email Service Function

Ya configuradas, solo asegurar que estén activas.

---

## 6. Flujo de Implementación

### Fase 1: Backend/Database ⏳

- [ ] Crear colección `group_invitations` en Appwrite
- [ ] Configurar índices y relaciones
- [ ] Actualizar `email-service` con nuevo template y acción
- [ ] Agregar variable de entorno para function ID

### Fase 2: Servicios Frontend ⏳

- [ ] Crear `invitations.service.js`
- [ ] Agregar variables de entorno

### Fase 3: UI - Envío de Invitaciones ⏳

- [ ] Modificar `CreateUserModal` para detectar emails existentes
- [ ] Crear modal de confirmación de invitación
- [ ] Agregar sección de invitaciones en `MembersTab`

### Fase 4: UI - Recepción de Invitaciones ⏳

- [ ] Crear página `/invitations/accept`
- [ ] Agregar ruta en `AppRouter`
- [ ] Mostrar notificación de invitaciones pendientes
- [ ] Crear página/modal para ver mis invitaciones

### Fase 5: Testing y Pulido ⏳

- [ ] Probar flujo completo
- [ ] Manejar casos edge (expiración, cancelación, reenvío)
- [ ] Validaciones de permisos

---

## 7. Consideraciones de Seguridad

1. **Token único**: Usar UUID v4 para tokens de aceptación
2. **Expiración**: Invitaciones expiran en 7 días
3. **Verificación de usuario**: Solo el usuario con el email puede aceptar
4. **Rate limiting**: Limitar cantidad de invitaciones enviadas por grupo/día
5. **Auditoría**: Registrar en `audit_logs` las invitaciones enviadas/aceptadas

---

## 8. Mejoras Futuras

- [ ] Invitaciones por lote (CSV)
- [ ] Personalización de mensaje por defecto del grupo
- [ ] Historial de invitaciones
- [ ] Recordatorios automáticos antes de expirar
- [ ] Invitación con link público (sin email específico)

---

## Archivos a Crear/Modificar

| Archivo                                                     | Acción    | Descripción                             |
| ----------------------------------------------------------- | --------- | --------------------------------------- |
| `functions/email-service/src/templates.js`                  | Modificar | Agregar `groupInvitationTemplate`       |
| `functions/email-service/src/_shared.js`                    | Modificar | Agregar traducciones                    |
| `functions/email-service/src/index.js`                      | Modificar | Agregar handler `send-group-invitation` |
| `front/src/shared/appwrite/env.js`                          | Modificar | Agregar nuevas variables                |
| `front/src/features/groups/services/invitations.service.js` | Crear     | Servicio de invitaciones                |
| `front/src/features/groups/pages/AcceptInvitationPage.jsx`  | Crear     | Página de aceptación                    |
| `front/src/features/users/components/CreateUserModal.jsx`   | Modificar | Detectar email existente                |
| `front/src/features/groups/components/MembersTab.jsx`       | Modificar | Mostrar invitaciones                    |
| `front/src/app/router/AppRouter.jsx`                        | Modificar | Nueva ruta                              |

---

_Última actualización: 29 de Diciembre, 2025_
