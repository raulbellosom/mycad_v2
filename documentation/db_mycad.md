# MyCAD — Base de Datos (Appwrite Console) vNext v2 (Appwrite **1.8.2**) ✅

**Objetivo:** que puedas crear TODA la BD desde la **Appwrite Console** (sin CLI) para la app de vehículos (usuarios, roles/permisos, grupos, vehículos, reportes, rentas, archivos).

**IMPORTANTE - CAMBIOS v2:**

- ❌ **ELIMINADO** el campo `teamId` de `groups` - ya no usamos Teams de Auth de Appwrite
- ✅ **`groups.$id`** es ahora el identificador único y se usa directamente como `groupId` en todas las tablas
- ✅ **Relaciones two-way** se llenan correctamente usando `$id` de documentos
- ✅ Sistema RBAC propio sin dependencia de Teams de Appwrite

---

## 0) Reglas (las que pediste, aplicadas aquí)

1. **Índices**

   - ✅ Solo en **campos escalares** (String/Integer/Float/Datetime/Enum/Boolean).
   - ❌ **NO** crear índices sobre **Relationship attributes**.
   - ❌ **NO** usar `$id` (id de la misma tabla) como índice.

2. **Required vs Default (Console)**

   - Si un campo es **required**, **NO** le pongo default en Appwrite.
   - Cuando un default es importante (ej. `enabled=true`), lo marco como **NOT required + default** y lo **validas/forzas** en Functions (o desde tu API).

3. **Integer / Float**

   - En Appwrite debes definir **min/max** (o rango equivalente) para Integer y Float.
   - Aquí te dejo rangos recomendados; ajusta si lo necesitas.

4. **Soft delete**

   - Todas las entidades clave llevan `enabled` (Boolean).
   - Recomendación: no borrar físico casi nunca; así `onDelete` se vuelve "seguro".

5. **Multi-tenant por Grupo**
   - `groupId` = `$id` del documento en la colección **groups** (tu tenant).
   - Todo documento "de negocio" (vehículos, reportes, etc.) trae `groupId` para filtrar duro.
   - ❌ **YA NO** usamos Teams de Auth de Appwrite para esto.

---

## 1) Colecciones (Appwrite Database) — Lista completa

### Identidad / Tenancy

- `users_profile`
- `groups`
- `group_members`
- `group_invitations`

### RBAC (roles / permisos)

- `permissions`
- `roles`
- `role_permissions`
- `user_roles` _(asignación de roles por grupo/tenant)_

### Catálogos

- `vehicle_types`
- `vehicle_brands`
- `vehicle_models`
- `conditions`

### Core

- `vehicles`
- `vehicle_conditions` _(historial/estado actual opcional)_

### Archivos

- `files`
- `images`
- `vehicle_files` _(join para imágenes/docs del vehículo)_

### Reportes / Historial

- `service_histories`
- `replaced_parts`
- `service_files`

- `repair_reports`
- `repaired_parts`
- `repair_files`

### Rentas

- `clients`
- `rentals`
- `rental_files`

### Conductores

- `drivers`
- `driver_licenses`
- `driver_files`
- `vehicle_driver_assignments`
- `vehicle_driver_assignment_files`

---

## 2) Detalle por colección (Attributes + Indexes + Relationships)

> Convención v2:
>
> - **`groupId`** ahora es `groups.$id` (el $id real del documento grupo)
> - **Relationships** para navegar: `group`, `profile`, etc.
> - Mantener campos escalares para índices y búsquedas

---

# A) users_profile

## A.1 Attributes

| Field           | Type        | Required | Default | Notes                        |
| --------------- | ----------- | -------: | ------- | ---------------------------- |
| userAuthId      | String(64)  |       ✅ |         | `$id` del usuario en Auth    |
| email           | String(254) |       ✅ |         | copia para soporte/búsqueda  |
| username        | String(36)  |       ❌ |         |                              |
| firstName       | String(80)  |       ✅ |         |                              |
| lastName        | String(80)  |       ✅ |         |                              |
| phone           | String(30)  |       ❌ |         |                              |
| avatarFileId    | String(64)  |       ❌ |         | Storage fileId               |
| isPlatformAdmin | Boolean     |       ❌ | false   | default ⇒ no required        |
| status          | Enum        |       ❌ | ACTIVE  | ACTIVE / SUSPENDED / DELETED |
| enabled         | Boolean     |       ❌ | true    | soft delete                  |

## A.2 Indexes (NO $id)

- `uq_users_profile_userAuthId` (unique) → `userAuthId`
- `uq_users_profile_email` (unique) → `email`
- `idx_users_profile_enabled` → `enabled`

## A.3 Relationships (Two-way)

- `ownedGroups` (backref de `groups.ownerProfile`)
- `ownedVehicles` (backref de `vehicles.ownerProfile`)
- `groupMemberships` (backref de `group_members.profile`)
- `createdServiceHistories` (backref de `service_histories.createdByProfile`)
- `createdRepairReports` (backref de `repair_reports.createdByProfile`)
- `userRoles` (backref de `user_roles.profile`)

---

# B) groups (Grupos/Tenants - SIN Teams de Auth)

> ⚠️ **CAMBIO v2:** Eliminado `teamId`. El `$id` del documento ES el identificador del grupo.

## B.1 Attributes

| Field          | Type        | Required | Default | Notes                           |
| -------------- | ----------- | -------: | ------- | ------------------------------- |
| name           | String(120) |       ✅ |         |                                 |
| description    | String(500) |       ❌ |         |                                 |
| ownerProfileId | String(64)  |       ✅ |         | `users_profile.$id` (indexable) |
| logoFileId     | String(64)  |       ❌ |         | Storage fileId                  |
| enabled        | Boolean     |       ❌ | true    |                                 |

## B.2 Indexes

- `idx_groups_ownerProfileId` → `ownerProfileId`
- `idx_groups_enabled` → `enabled`
- `idx_groups_name` → `name` (opcional para búsquedas)

## B.3 Relationship

### B.3.1 `ownerProfile`

- **Two-way**
- Related: `users_profile`
- Attribute key: `ownerProfile`
- Backref key: `ownedGroups`
- Cardinalidad: **Many-to-one**
- On delete: **Restrict**

---

# C) group_members

> ⚠️ **CAMBIO v2:** `groupId` ahora es `groups.$id` (no `teamId`)

## C.1 Attributes

| Field     | Type        | Required | Default | Notes                        |
| --------- | ----------- | -------: | ------- | ---------------------------- |
| groupId   | String(64)  |       ✅ |         | `groups.$id` (**NO teamId**) |
| profileId | String(64)  |       ✅ |         | `users_profile.$id`          |
| role      | Enum        |       ✅ |         | OWNER / MEMBER               |
| enabled   | Boolean     |       ❌ | true    |                              |
| joinedAt  | Datetime    |       ❌ |         | set en Function/API          |
| notes     | String(500) |       ❌ |         |                              |

## C.2 Indexes

- `idx_group_members_groupId` → `groupId`
- `idx_group_members_profileId` → `profileId`
- `idx_group_members_group_role` → (`groupId`, `role`)
- `idx_group_members_group_profile` → (`groupId`, `profileId`) — para validar unicidad

## C.3 Relationships

### C.3.1 `group`

- **Two-way**
- Related: `groups`
- Attribute key: `group`
- Backref key: `members`
- Cardinalidad: **Many-to-one**
- On delete: **Cascade**

### C.3.2 `profile`

- **Two-way**
- Related: `users_profile`
- Attribute key: `profile`
- Backref key: `groupMemberships`
- Cardinalidad: **Many-to-one**
- On delete: **Restrict**

---

# D) permissions

## D.1 Attributes

| Field       | Type        | Required | Default | Notes                                        |
| ----------- | ----------- | -------: | ------- | -------------------------------------------- |
| key         | String(120) |       ✅ |         | ej: `vehicles.read`, `reports.repair.create` |
| description | String(500) |       ❌ |         |                                              |
| enabled     | Boolean     |       ❌ | true    |                                              |

## D.2 Indexes

- `uq_permissions_key` (unique) → `key`
- `idx_permissions_enabled` → `enabled`

---

# E) roles

> ⚠️ **CAMBIO v2:** `groupId` es `groups.$id`

## E.1 Attributes

| Field       | Type        | Required | Default | Notes                        |
| ----------- | ----------- | -------: | ------- | ---------------------------- |
| groupId     | String(64)  |       ✅ |         | `groups.$id` (tenant)        |
| name        | String(80)  |       ✅ |         | ej: Admin, Mecánico, Auditor |
| description | String(500) |       ❌ |         |                              |
| isSystem    | Boolean     |       ❌ | false   | roles base del sistema       |
| enabled     | Boolean     |       ❌ | true    |                              |

## E.2 Indexes

- `idx_roles_groupId` → `groupId`
- `idx_roles_group_name` → (`groupId`, `name`)
- `idx_roles_enabled` → `enabled`

## E.3 Relationships

### E.3.1 `group`

- **Two-way**
- Related: `groups`
- Attribute key: `group`
- Backref key: `roles`
- Cardinalidad: **Many-to-one**
- On delete: **Cascade**

---

# F) role_permissions

## F.1 Attributes

| Field        | Type       | Required | Default | Notes             |
| ------------ | ---------- | -------: | ------- | ----------------- |
| groupId      | String(64) |       ✅ |         | `groups.$id`      |
| roleId       | String(64) |       ✅ |         | `roles.$id`       |
| permissionId | String(64) |       ✅ |         | `permissions.$id` |
| enabled      | Boolean    |       ❌ | true    |                   |

## F.2 Indexes

- `idx_role_permissions_groupId` → `groupId`
- `idx_role_permissions_group_role` → (`groupId`, `roleId`)
- `idx_role_permissions_group_permission` → (`groupId`, `permissionId`)
- `idx_role_permissions_enabled` → `enabled`

## F.3 Relationships

### `role`

- Two-way: `role_permissions.role` ↔ `roles.permissions`
- Cardinalidad: Many-to-one
- On delete: Cascade

### `permission`

- Two-way: `role_permissions.permission` ↔ `permissions.roles`
- Cardinalidad: Many-to-one
- On delete: Restrict

---

# G) user_roles (asignación de roles a un profile dentro de un group)

## G.1 Attributes

| Field      | Type       | Required | Default | Notes               |
| ---------- | ---------- | -------: | ------- | ------------------- |
| groupId    | String(64) |       ✅ |         | `groups.$id`        |
| profileId  | String(64) |       ✅ |         | `users_profile.$id` |
| roleId     | String(64) |       ✅ |         | `roles.$id`         |
| enabled    | Boolean    |       ❌ | true    |                     |
| assignedAt | Datetime   |       ❌ |         | set en Function/API |

## G.2 Indexes

- `idx_user_roles_groupId` → `groupId`
- `idx_user_roles_group_profile` → (`groupId`, `profileId`)
- `idx_user_roles_group_role` → (`groupId`, `roleId`)
- `idx_user_roles_enabled` → `enabled`

## G.3 Relationships

- `group`: Two-way ↔ `groups.userRoles` (Many-to-one) On delete Cascade
- `profile`: Two-way ↔ `users_profile.userRoles` (Many-to-one) On delete Restrict
- `role`: Two-way ↔ `roles.userAssignments` (Many-to-one) On delete Restrict

---

# H) vehicle_types

## H.1 Attributes

| Field         | Type       | Required | Default | Notes        |
| ------------- | ---------- | -------: | ------- | ------------ |
| groupId       | String(64) |       ✅ |         | `groups.$id` |
| name          | String(80) |       ✅ |         |              |
| economicGroup | String(32) |       ✅ |         |              |
| enabled       | Boolean    |       ❌ | true    |              |

## H.2 Indexes

- `idx_vehicle_types_groupId` → `groupId`
- `idx_vehicle_types_group_name` → (`groupId`, `name`)
- `idx_vehicle_types_enabled` → `enabled`

## H.3 Relationships

- `group`: Two-way ↔ `groups.vehicleTypes` (Many-to-one) On delete Cascade

---

# I) vehicle_brands

## I.1 Attributes

| Field   | Type       | Required | Default | Notes        |
| ------- | ---------- | -------: | ------- | ------------ |
| groupId | String(64) |       ✅ |         | `groups.$id` |
| name    | String(80) |       ✅ |         |              |
| enabled | Boolean    |       ❌ | true    |              |

## I.2 Indexes

- `idx_vehicle_brands_groupId` → `groupId`
- `idx_vehicle_brands_group_name` → (`groupId`, `name`)
- `idx_vehicle_brands_enabled` → `enabled`

## I.3 Relationships

- `group`: Two-way ↔ `groups.vehicleBrands` (Many-to-one) On delete Cascade

---

# J) vehicle_models

> ℹ️ **Relación Modelo-Marca-Tipo:** Un modelo está compuesto por una marca (`brandId`) y un tipo (`typeId`).
> Cuando un vehículo selecciona un modelo, sus campos `brandId` y `typeId` deben coincidir con los del modelo.
> Ver sección L) vehicles para las reglas de consistencia.

## J.1 Attributes

| Field   | Type                       | Required | Default | Notes                                      |
| ------- | -------------------------- | -------: | ------- | ------------------------------------------ |
| groupId | String(64)                 |       ✅ |         | `groups.$id`                               |
| brandId | String(64)                 |       ❌ |         | `vehicle_brands.$id` - marca del modelo    |
| typeId  | String(64)                 |       ❌ |         | `vehicle_types.$id` - tipo del modelo      |
| name    | String(120)                |       ✅ |         | nombre del modelo (ej: "Corolla", "F-150") |
| year    | Integer(min=1900,max=2100) |       ❌ |         | año del modelo                             |
| enabled | Boolean                    |       ❌ | true    |                                            |

## J.2 Indexes

- `idx_vehicle_models_groupId` → `groupId`
- `idx_vehicle_models_group_name` → (`groupId`, `name`)
- `idx_vehicle_models_group_brand` → (`groupId`, `brandId`)
- `idx_vehicle_models_group_type` → (`groupId`, `typeId`)
- `idx_vehicle_models_enabled` → `enabled`

## J.3 Relationships

- `group`: Two-way ↔ `groups.vehicleModels` (Many-to-one) On delete Cascade
- `brand`: Two-way ↔ `vehicle_brands.models` (Many-to-one) On delete Restrict
- `type`: Two-way ↔ `vehicle_types.models` (Many-to-one) On delete Restrict

---

# K) conditions

## K.1 Attributes

| Field       | Type        | Required | Default | Notes                       |
| ----------- | ----------- | -------: | ------- | --------------------------- |
| groupId     | String(64)  |       ✅ |         | `groups.$id`                |
| name        | String(80)  |       ✅ |         | Nuevo / En reparación / etc |
| description | String(300) |       ❌ |         |                             |
| enabled     | Boolean     |       ❌ | true    |                             |

## K.2 Indexes

- `idx_conditions_groupId` → `groupId`
- `idx_conditions_group_name` → (`groupId`, `name`)
- `idx_conditions_enabled` → `enabled`

## K.3 Relationships

- `group`: Two-way ↔ `groups.conditions` (Many-to-one) On delete Cascade

---

# L) vehicles

> ⚠️ **DENORMALIZACIÓN CONTROLADA - Reglas de Consistencia:**
>
> Los campos `typeId`, `brandId` y `modelId` están **denormalizados intencionalmente** para permitir:
>
> - Queries rápidos por tipo/marca sin necesidad de joins
> - Flexibilidad para vehículos sin modelo definido
>
> **REGLAS OBLIGATORIAS:**
>
> 1. **Si el vehículo tiene `modelId`:**
>
>    - `brandId` del vehículo **DEBE** ser igual a `vehicle_models.brandId` del modelo
>    - `typeId` del vehículo **DEBE** ser igual a `vehicle_models.typeId` del modelo
>    - La UI debe **auto-llenar** `brandId` y `typeId` cuando se selecciona un modelo
>
> 2. **Si el vehículo NO tiene `modelId`:**
>
>    - `typeId` es **required** (debe seleccionarse manualmente)
>    - `brandId` es **opcional** (puede seleccionarse manualmente)
>
> 3. **Al actualizar:**
>    - Si se cambia el `modelId`, actualizar automáticamente `brandId` y `typeId`
>    - Si se cambia `brandId` o `typeId` manualmente Y hay un `modelId`, validar consistencia o limpiar `modelId`
>
> **Implementación sugerida:** Crear un hook/utilidad `useVehicleModelSync` que maneje esta lógica automáticamente.

## L.1 Attributes

| Field                   | Type                       | Required | Default | Notes                                              |
| ----------------------- | -------------------------- | -------: | ------- | -------------------------------------------------- |
| groupId                 | String(64)                 |       ✅ |         | `groups.$id`                                       |
| ownerProfileId          | String(64)                 |       ✅ |         | indexable                                          |
| visibility              | Enum                       |       ❌ | GROUP   | PRIVATE / GROUP                                    |
| typeId                  | String(64)                 |       ✅ |         | `vehicle_types.$id` - ver reglas arriba            |
| brandId                 | String(64)                 |       ✅ |         | `vehicle_brands.$id` - ver reglas arriba           |
| modelId                 | String(64)                 |       ✅ |         | `vehicle_models.$id` - ver reglas arriba           |
| color                   | String(40)                 |       ❌ |         |                                                    |
| plate                   | String(15)                 |       ❌ |         |                                                    |
| economicNumber          | String(32)                 |       ✅ |         |                                                    |
| serialNumber            | String(60)                 |       ❌ |         |                                                    |
| acquisitionDate         | Datetime                   |       ❌ |         |                                                    |
| purchaseCost            | Float(min=0,max=100000000) |       ❌ |         |                                                    |
| mileage                 | Integer(min=0,max=5000000) |       ❌ | 0       | default ⇒ no required                              |
| mileageUnit             | Enum                       |       ❌ | KM      | KM / MI                                            |
| status                  | Enum                       |       ❌ | ACTIVE  | ACTIVE / IN_MAINTENANCE / SOLD / RENTED / INACTIVE |
| notes                   | String(1500)               |       ❌ |         |                                                    |
| enabled                 | Boolean                    |       ❌ | true    |                                                    |
| acquisitionCost         | Float(min=0,max=100000000) |       ❌ |         |                                                    |
| acquisitionCostCurrency | Enum                       |       ❌ | USD     | USD / EUR / MXN                                    |
| bookValue               | Float(min=0,max=100000000) |       ❌ |         |                                                    |
| bookValueCurrency       | Enum                       |       ❌ | USD     | USD / EUR / MXN                                    |
| marketValue             | Float(min=0,max=100000000) |       ❌ |         |                                                    |
| marketValueCurrency     | Enum                       |       ❌ | USD     | USD / EUR / MXN                                    |

## L.2 Indexes

- `idx_vehicles_groupId` → `groupId`
- `idx_vehicles_ownerProfileId` → `ownerProfileId`
- `idx_vehicles_group_status` → (`groupId`, `status`)
- `idx_vehicles_group_type` → (`groupId`, `typeId`)
- `idx_vehicles_group_plate` → (`groupId`, `plate`)
- `idx_vehicles_group_economicNumber` → (`groupId`, `economicNumber`)
- `idx_vehicles_enabled` → `enabled`

## L.3 Relationships

- `group`: Two-way ↔ `groups.vehicles` (Many-to-one) On delete Cascade
- `ownerProfile`: Two-way ↔ `users_profile.ownedVehicles` (Many-to-one) On delete Restrict
- `type`: Two-way ↔ `vehicle_types.vehicles` (Many-to-one) On delete Restrict
- `brand`: Two-way ↔ `vehicle_brands.vehicles` (Many-to-one) On delete Restrict
- `model`: Two-way ↔ `vehicle_models.vehicles` (Many-to-one) On delete Restrict

---

# M) vehicle_conditions

## M.1 Attributes

| Field       | Type       | Required | Default | Notes            |
| ----------- | ---------- | -------: | ------- | ---------------- |
| groupId     | String(64) |       ✅ |         | `groups.$id`     |
| vehicleId   | String(64) |       ✅ |         | `vehicles.$id`   |
| conditionId | String(64) |       ✅ |         | `conditions.$id` |
| startDate   | Datetime   |       ❌ |         |                  |
| endDate     | Datetime   |       ❌ |         |                  |
| enabled     | Boolean    |       ❌ | true    |                  |

## M.2 Indexes

- `idx_vehicle_conditions_groupId` → `groupId`
- `idx_vehicle_conditions_group_vehicle` → (`groupId`, `vehicleId`)
- `idx_vehicle_conditions_group_condition` → (`groupId`, `conditionId`)
- `idx_vehicle_conditions_enabled` → `enabled`

## M.3 Relationships

- `group`: Two-way ↔ `groups.vehicleConditions` (Many-to-one) On delete Cascade
- `vehicle`: Two-way ↔ `vehicles.conditionHistory` (Many-to-one) On delete Cascade
- `condition`: Two-way ↔ `conditions.vehicleUsages` (Many-to-one) On delete Restrict

# N) files

> “Archivo genérico” (docs, PDF, etc.). Imágenes separadas en `images` si quieres.

## N.1 Attributes

| Field          | Type                          | Required | Default | Notes          |
| -------------- | ----------------------------- | -------: | ------- | -------------- |
| groupId        | String(64)                    |       ✅ |         | tenant         |
| storageFileId  | String(64)                    |       ✅ |         | Storage fileId |
| ownerProfileId | String(64)                    |       ✅ |         | quien subió    |
| name           | String(200)                   |       ✅ |         |                |
| mimeType       | String(120)                   |       ❌ |         |                |
| sizeBytes      | Integer(min=0,max=2147483647) |       ❌ |         |                |
| checksum       | String(128)                   |       ❌ |         | opcional       |
| enabled        | Boolean                       |       ❌ | true    |                |

## N.2 Indexes

- `idx_files_group_storage` → (`groupId`, `storageFileId`)
- `idx_files_ownerProfileId` → `ownerProfileId`
- `idx_files_enabled` → `enabled`

## N.3 Relationships

- `ownerProfile`: Two-way ↔ `users_profile.uploadedFiles` (Many-to-one) On delete Restrict

---

# O) images

> Igual que files pero orientado a imagen (si quieres usar optimizaciones/filtros).

## O.1 Attributes

| Field          | Type                          | Required | Default | Notes          |
| -------------- | ----------------------------- | -------: | ------- | -------------- |
| groupId        | String(64)                    |       ✅ |         | tenant         |
| storageFileId  | String(64)                    |       ✅ |         | Storage fileId |
| ownerProfileId | String(64)                    |       ✅ |         | quien subió    |
| label          | String(120)                   |       ❌ |         |                |
| mimeType       | String(120)                   |       ❌ |         |                |
| sizeBytes      | Integer(min=0,max=2147483647) |       ❌ |         |                |
| width          | Integer(min=0,max=20000)      |       ❌ |         |                |
| height         | Integer(min=0,max=20000)      |       ❌ |         |                |
| enabled        | Boolean                       |       ❌ | true    |                |

## O.2 Indexes

- `idx_images_group_storage` → (`groupId`, `storageFileId`)
- `idx_images_ownerProfileId` → `ownerProfileId`
- `idx_images_enabled` → `enabled`

---

# P) vehicle_files (joins de vehículo ↔ file/image)

> En Prisma tú tenías `ServicesFile`, `RentalFile`, `RepairFile` como joins separados.
> Aquí lo dejo genérico por vehículo, y además mantengo los joins específicos (service/rental/repair) más abajo.

## P.1 Attributes

| Field     | Type       | Required | Default | Notes                                         |
| --------- | ---------- | -------: | ------- | --------------------------------------------- |
| groupId   | String(64) |       ✅ |         |                                               |
| vehicleId | String(64) |       ✅ |         |                                               |
| fileId    | String(64) |       ✅ |         | `files.$id` o `images.$id` (elige 1 estándar) |
| kind      | Enum       |       ✅ |         | IMAGE / DOCUMENT                              |
| name      | String(80) |       ❌ |         |                                               |
| enabled   | Boolean    |       ❌ | true    |                                               |

## P.2 Indexes

- `idx_vehicle_files_group_vehicle` → (`groupId`, `vehicleId`)
- `idx_vehicle_files_group_kind` → (`groupId`, `kind`)
- `idx_vehicle_files_enabled` → `enabled`

## P.3 Relationships

- `vehicle`: Two-way ↔ `vehicles.files` (Many-to-one) On delete Cascade
- `file`: Two-way ↔ `files.vehicleLinks` (Many-to-one) On delete Restrict

---

# Q) service_histories

## Q.1 Attributes

| Field                  | Type                       | Required | Default     | Notes                             |
| ---------------------- | -------------------------- | -------: | ----------- | --------------------------------- |
| groupId                | String(64)                 |       ✅ |             |                                   |
| vehicleId              | String(64)                 |       ✅ |             |                                   |
| createdByProfileId     | String(64)                 |       ✅ |             |                                   |
| serviceDate            | Datetime                   |       ✅ |             |                                   |
| odometer               | Integer(min=0,max=5000000) |       ❌ |             |                                   |
| title                  | String(120)                |       ✅ |             |                                   |
| description            | String(1500)               |       ❌ |             |                                   |
| cost                   | Float(min=0,max=100000000) |       ❌ |             |                                   |
| vendorName             | String(120)                |       ❌ |             |                                   |
| enabled                | Boolean                    |       ❌ | true        |                                   |
| `status`               | Enum                       |       ❌ | DRAFT       | DRAFT/FINALIZED                   |
| `serviceType`          | Enum                       |       ❌ | MAINTENANCE | MAINTENANCE/SERVICE/OTHER         |
| `invoiceNumber`        | String(50)                 |       ❌ |             | Número de factura                 |
| `laborCost`            | Float(min=0)               |       ❌ |             | Costo de mano de obra             |
| `partsCost`            | Float(min=0)               |       ❌ |             | Costo de refacciones (calculado)  |
| `workshopAddress`      | String(200)                |       ❌ |             | Dirección del taller              |
| `workshopPhone`        | String(30)                 |       ❌ |             | Teléfono del taller               |
| `nextServiceDate`      | Datetime                   |       ❌ |             | Próximo servicio                  |
| `nextServiceOdometer`  | Integer                    |       ❌ |             | Kilometraje para próximo servicio |
| `finalizedAt`          | Datetime                   |       ❌ |             | Fecha de finalización             |
| `finalizedByProfileId` | String(64)                 |       ❌ |             | Quien finalizó                    |

## Q.2 Indexes

- `idx_service_histories_group_vehicle` → (`groupId`, `vehicleId`)
- `idx_service_histories_group_date` → (`groupId`, `serviceDate`)
- `idx_service_histories_enabled` → `enabled`

## Q.3 Relationships

- `vehicle`: One-way ↔ `vehicles.serviceHistories` (Many-to-one) On delete Cascade
- `createdByProfile`: Two-way ↔ `users_profile.createdServiceHistories` (Many-to-one) On delete Restrict

---

# R) replaced_parts

## R.1 Attributes

| Field            | Type                       | Required | Default | Notes                |
| ---------------- | -------------------------- | -------: | ------- | -------------------- |
| groupId          | String(64)                 |       ✅ |         |                      |
| serviceHistoryId | String(64)                 |       ✅ |         |                      |
| name             | String(120)                |       ✅ |         |                      |
| quantity         | Integer(min=1,max=100000)  |       ✅ |         | required sin default |
| unitCost         | Float(min=0,max=100000000) |       ❌ |         |                      |
| notes            | String(500)                |       ❌ |         |                      |
| enabled          | Boolean                    |       ❌ | true    |                      |

## R.2 Indexes

- `idx_replaced_parts_group_service` → (`groupId`, `serviceHistoryId`)
- `idx_replaced_parts_enabled` → `enabled`

## R.3 Relationships

- `serviceHistory`: Two-way ↔ `service_histories.parts` (Many-to-one) On delete Cascade

---

# S) service_files

## S.1 Attributes

| Field            | Type       | Required | Default | Notes       |
| ---------------- | ---------- | -------: | ------- | ----------- |
| groupId          | String(64) |       ✅ |         |             |
| serviceHistoryId | String(64) |       ✅ |         |             |
| fileId           | String(64) |       ✅ |         | `files.$id` |
| enabled          | Boolean    |       ❌ | true    |             |

## S.2 Indexes

- `idx_service_files_group_service` → (`groupId`, `serviceHistoryId`)
- `idx_service_files_enabled` → `enabled`

## S.3 Relationships

- `serviceHistory`: Two-way ↔ `service_histories.files` (Many-to-one) On delete Cascade
- `file`: Two-way ↔ `files.serviceLinks` (Many-to-one) On delete Restrict

---

# T) repair_reports

## T.1 Attributes

| Field                  | Type                       | Required | Default    | Notes                                     |
| ---------------------- | -------------------------- | -------: | ---------- | ----------------------------------------- |
| groupId                | String(64)                 |       ✅ |            |                                           |
| vehicleId              | String(64)                 |       ✅ |            |                                           |
| createdByProfileId     | String(64)                 |       ✅ |            |                                           |
| reportDate             | Datetime                   |       ✅ |            |                                           |
| title                  | String(120)                |       ✅ |            |                                           |
| description            | String(2000)               |       ❌ |            |                                           |
| status                 | Enum                       |       ❌ | OPEN       | OPEN / IN_PROGRESS / DONE / CANCELED      |
| costEstimate           | Float(min=0,max=100000000) |       ❌ |            |                                           |
| finalCost              | Float(min=0,max=100000000) |       ❌ |            |                                           |
| enabled                | Boolean                    |       ❌ | true       |                                           |
| `reportNumber`         | String(50)                 |       ❌ |            | Número de reporte (auto-generado)         |
| `odometer`             | Integer                    |       ❌ |            | Kilometraje al momento del reporte        |
| `priority`             | Enum                       |       ❌ | NORMAL     | LOW/NORMAL/HIGH/URGENT                    |
| `damageType`           | Enum                       |       ❌ | MECHANICAL | MECHANICAL/ELECTRICAL/BODY/INTERIOR/OTHER |
| `laborCost`            | Float                      |       ❌ |            | Costo de mano de obra                     |
| `partsCost`            | Float                      |       ❌ |            | Costo de refacciones                      |
| `workshopName`         | String(120)                |       ❌ |            | Nombre del taller                         |
| `workshopAddress`      | String(200)                |       ❌ |            | Dirección del taller                      |
| `workshopPhone`        | String(30)                 |       ❌ |            | Teléfono del taller                       |
| `startDate`            | Datetime                   |       ❌ |            | Fecha inicio reparación                   |
| `completionDate`       | Datetime                   |       ❌ |            | Fecha fin reparación                      |
| `finalizedAt`          | Datetime                   |       ❌ |            | Fecha de finalización (bloquea edición)   |
| `finalizedByProfileId` | String(64)                 |       ❌ |            | Quien finalizó                            |
| `warrantyDays`         | Integer                    |       ❌ |            | Días de garantía                          |
| `warrantyNotes`        | String(500)                |       ❌ |            | Notas de garantía                         |

## T.2 Indexes

- `idx_repair_reports_group_vehicle` → (`groupId`, `vehicleId`)
- `idx_repair_reports_group_date` → (`groupId`, `reportDate`)
- `idx_repair_reports_enabled` → `enabled`

## T.3 Relationships

- `vehicle`: One-way ↔ `vehicles.repairReports` (Many-to-one) On delete Cascade
- `createdByProfile`: Two-way ↔ `users_profile.createdRepairReports` (Many-to-one) On delete Restrict

---

# U) repaired_parts

## U.1 Attributes

| Field          | Type                       | Required | Default | Notes |
| -------------- | -------------------------- | -------: | ------- | ----- |
| groupId        | String(64)                 |       ✅ |         |       |
| repairReportId | String(64)                 |       ✅ |         |       |
| name           | String(120)                |       ✅ |         |       |
| quantity       | Integer(min=1,max=100000)  |       ✅ |         |       |
| unitCost       | Float(min=0,max=100000000) |       ❌ |         |       |
| notes          | String(500)                |       ❌ |         |       |
| enabled        | Boolean                    |       ❌ | true    |       |

## U.2 Indexes

- `idx_repaired_parts_group_repair` → (`groupId`, `repairReportId`)
- `idx_repaired_parts_enabled` → `enabled`

## U.3 Relationships

- `repairReport`: Two-way ↔ `repair_reports.parts` (Many-to-one) On delete Cascade

---

# V) repair_files

## V.1 Attributes

| Field          | Type       | Required | Default | Notes       |
| -------------- | ---------- | -------: | ------- | ----------- |
| groupId        | String(64) |       ✅ |         |             |
| repairReportId | String(64) |       ✅ |         |             |
| fileId         | String(64) |       ✅ |         | `files.$id` |
| enabled        | Boolean    |       ❌ | true    |             |

## V.2 Indexes

- `idx_repair_files_group_repair` → (`groupId`, `repairReportId`)
- `idx_repair_files_enabled` → `enabled`

## V.3 Relationships

- `repairReport`: Two-way ↔ `repair_reports.files` (Many-to-one) On delete Cascade
- `file`: Two-way ↔ `files.repairLinks` (Many-to-one) On delete Restrict

---

# W) clients

## W.1 Attributes

| Field   | Type        | Required | Default | Notes |
| ------- | ----------- | -------: | ------- | ----- |
| groupId | String(64)  |       ✅ |         |       |
| name    | String(120) |       ✅ |         |       |
| email   | String(254) |       ❌ |         |       |
| phone   | String(30)  |       ❌ |         |       |
| notes   | String(800) |       ❌ |         |       |
| enabled | Boolean     |       ❌ | true    |       |

## W.2 Indexes

- `idx_clients_group_name` → (`groupId`, `name`)
- `idx_clients_enabled` → `enabled`

---

# X) rentals

## X.1 Attributes

| Field     | Type                       | Required | Default | Notes                        |
| --------- | -------------------------- | -------: | ------- | ---------------------------- |
| groupId   | String(64)                 |       ✅ |         |                              |
| vehicleId | String(64)                 |       ✅ |         |                              |
| clientId  | String(64)                 |       ✅ |         |                              |
| startDate | Datetime                   |       ✅ |         |                              |
| endDate   | Datetime                   |       ❌ |         |                              |
| dailyRate | Float(min=0,max=100000000) |       ❌ |         |                              |
| totalCost | Float(min=0,max=100000000) |       ❌ |         |                              |
| status    | Enum                       |       ❌ | ACTIVE  | ACTIVE / FINISHED / CANCELED |
| notes     | String(800)                |       ❌ |         |                              |
| enabled   | Boolean                    |       ❌ | true    |                              |

## X.2 Indexes

- `idx_rentals_group_vehicle` → (`groupId`, `vehicleId`)
- `idx_rentals_group_client` → (`groupId`, `clientId`)
- `idx_rentals_group_status` → (`groupId`, `status`)
- `idx_rentals_enabled` → `enabled`

## X.3 Relationships

- `vehicle`: Two-way ↔ `vehicles.rentals` (Many-to-one) On delete Restrict/Cascade
- `client`: Two-way ↔ `clients.rentals` (Many-to-one) On delete Restrict

---

# Y) rental_files

## Y.1 Attributes

| Field    | Type       | Required | Default | Notes |
| -------- | ---------- | -------: | ------- | ----- |
| groupId  | String(64) |       ✅ |         |       |
| rentalId | String(64) |       ✅ |         |       |
| fileId   | String(64) |       ✅ |         |       |
| enabled  | Boolean    |       ❌ | true    |       |

## Y.2 Indexes

- `idx_rental_files_group_rental` → (`groupId`, `rentalId`)
- `idx_rental_files_enabled` → `enabled`

## Y.3 Relationships

- `rental`: Two-way ↔ `rentals.files` (Many-to-one) On delete Cascade
- `file`: Two-way ↔ `files.rentalLinks` (Many-to-one) On delete Restrict

# Z) drivers

## Z.1 Attributes

| Field           | Type         | Required | Default | Notes                                                             |
| --------------- | ------------ | -------: | ------- | ----------------------------------------------------------------- |
| groupId         | String(64)   |       ✅ |         | tenant (TeamId o tu groupId estándar)                             |
| linkedProfileId | String(64)   |       ❌ |         | **si ya es usuario**, guarda `users_profile.$id` aquí (indexable) |
| firstName       | String(80)   |       ✅ |         |                                                                   |
| lastName        | String(80)   |       ✅ |         |                                                                   |
| phone           | String(30)   |       ❌ |         |                                                                   |
| email           | String(254)  |       ❌ |         | recomendable para “invitar” luego                                 |
| birthDate       | Datetime     |       ❌ |         | opcional                                                          |
| notes           | String(1000) |       ❌ |         |                                                                   |
| status          | Enum         |       ❌ | ACTIVE  | ACTIVE / INACTIVE / SUSPENDED                                     |
| enabled         | Boolean      |       ❌ | true    | soft delete                                                       |

## Z.2 Indexes

- `idx_drivers_groupId` → `groupId`
- `idx_drivers_group_name` → (`groupId`, `firstName`, `lastName`)
- `idx_drivers_group_email` → (`groupId`, `email`)
- `idx_drivers_linkedProfileId` → `linkedProfileId`
- `idx_drivers_enabled` → `enabled`
- `uq_drivers_group_email` → (`unique`) (`groupId`, `email`)

## Z.3 Relationships

### Z.3.1 `linkedProfile`

- **Two-way**
- Related: `users_profile`
- Attribute key: `linkedProfile`
- Backref key: `driverRecord`
- Cardinalidad: **Many-to-one**
- On delete: **Restrict**

# AA) driver_licenses

## AA.1 Attributes

| Field         | Type         | Required | Default | Notes                                         |
| ------------- | ------------ | -------: | ------- | --------------------------------------------- |
| groupId       | String(64)   |       ✅ |         |                                               |
| driverId      | String(64)   |       ✅ |         | `drivers.$id` (indexable)                     |
| licenseNumber | String(40)   |       ✅ |         |                                               |
| licenseType   | Enum         |       ❌ |         | A-A1-A2-B-C-D-E/E1                            |
| country       | String(2)    |       ❌ |         | MX/US…                                        |
| state         | String(3-10) |       ❌ |         | JAL/NAY…                                      |
| issuedAt      | Datetime     |       ❌ |         |                                               |
| expiresAt     | Datetime     |       ❌ |         |                                               |
| frontImageId  | String(64)   |       ❌ |         | `images.$id` o `files.$id` (elige 1 estándar) |
| backImageId   | String(64)   |       ❌ |         | idem                                          |
| enabled       | Boolean      |       ❌ | true    |                                               |

## AA.2 Indexes

- `idx_driver_licenses_group_driver` → (`groupId`, `driverId`)
- `idx_driver_licenses_group_number` → (`groupId`, `licenseNumber`)
- `idx_driver_licenses_enabled` → `enabled`

## AA.3 Relationships

- `driver`: Two-way ↔ `drivers.licenses` (Many-to-one) On delete Cascade/Restrict (tú política; con soft delete da igual)

# AB) driver_files

## AB.1 Attributes

| Field    | Type        | Required | Default | Notes                                                        |
| -------- | ----------- | -------: | ------- | ------------------------------------------------------------ |
| groupId  | String(64)  |       ✅ |         |                                                              |
| driverId | String(64)  |       ✅ |         |                                                              |
| fileId   | String(64)  |       ✅ |         | `files.$id` (o `images.$id`, pero ideal unificar a `files`)  |
| kind     | Enum        |       ✅ |         | LICENSE_FRONT / LICENSE_BACK / ID / CONTRACT / PHOTO / OTHER |
| label    | String(120) |       ❌ |         |                                                              |
| enabled  | Boolean     |       ❌ | true    |                                                              |

## AB.2 Indexes

- `idx_driver_files_group_driver` → (`groupId`, `driverId`)
- `idx_driver_files_group_kind` → (`groupId`, `kind`)
- `idx_driver_files_enabled` → `enabled`

## AB.3 Relationships

- `driver`: Two-way ↔ `drivers.files` (Many-to-one) On delete Cascade
- `file`: Two-way ↔ `files.driverLinks` (Many-to-one) On delete Restrict

## AB.4 Soft delete

- `enabled`: Boolean (default true)

# AC) vehicle_driver_assignments

| Field              | Type         | Required | Default   | Notes                                                            |
| ------------------ | ------------ | -------: | --------- | ---------------------------------------------------------------- |
| groupId            | String(64)   |       ✅ |           | tenant / grupo                                                   |
| vehicleId          | String(64)   |       ✅ |           | referencia a `vehicles.$id` (scalar)                             |
| driverId           | String(64)   |       ✅ |           | referencia a `drivers.$id` (scalar)                              |
| startDate          | Datetime     |       ✅ |           | desde cuándo                                                     |
| endDate            | Datetime     |       ❌ |           | **null = indefinida / activa**                                   |
| isActive           | Boolean      |       ❌ | true      | útil para filtrar rápido (pero debe ser consistente con endDate) |
| role               | Enum         |       ❌ | PRIMARY   | PRIMARY / SECONDARY / TEMP / SUBSTITUTE                          |
| assignmentType     | Enum         |       ❌ | OPERATION | OPERATION / RENTAL / MAINTENANCE / DELIVERY / OTHER              |
| startMileage       | Integer      |       ❌ |           | km/mi al inicio                                                  |
| endMileage         | Integer      |       ❌ |           | km/mi al cierre                                                  |
| startFuelLevel     | Integer      |       ❌ |           | 0–100 (si lo ocupas)                                             |
| endFuelLevel       | Integer      |       ❌ |           | 0–100                                                            |
| notes              | String(1500) |       ❌ |           | observaciones                                                    |
| createdByProfileId | String(64)   |       ✅ |           | `users_profile.$id` (quién asignó)                               |
| enabled            | Boolean      |       ❌ | true      | soft delete                                                      |

## AC.2 Indexes

- `idx_vda_group_vehicle` → (`groupId`, `vehicleId`)
- `idx_vda_group_driver` → (`groupId`, `driverId`)
- `idx_vda_group_vehicle_active` → (`groupId`, `vehicleId`, `isActive`)
- `idx_vda_group_driver_active` → (`groupId`, `driverId`, `isActive`)
- `idx_vda_group_dates` → (`groupId`, `startDate`) (opcional para reportes por periodo)
- `idx_vda_enabled` → `enabled`
- `uq_vda_active_vehicle` → (`groupId`, `vehicleId`, `isActive`)

## AC.3 Relationships

- `vehicle`: One-way ↔ `vehicles.driverAssignments` (Many-to-one) On delete Cascade
- `driver`: Two-way ↔ `drivers.vehicleAssignments` (Many-to-one) On delete Cascade
- `createdBy`: One-way ↔ `users_profile.vehicleDriverAssignmentsCreated` (Many-to-one) On delete Cascade

# AD) vehicle_driver_assignment_files

| Field        | Type       | Required | Notes                                         |
| ------------ | ---------- | -------: | --------------------------------------------- |
| groupId      | String(64) |       ✅ |                                               |
| assignmentId | String(64) |       ✅ | `vehicle_driver_assignments.$id`              |
| fileId       | String(64) |       ✅ | `files.$id`                                   |
| kind         | Enum       |       ✅ | DELIVERY_PHOTO / SIGNATURE / CONTRACT / OTHER |
| enabled      | Boolean    |       ❌ | true                                          |

## AD.2 Indexes

- `idx_vda_group_assignment` → (`groupId`, `assignmentId`)
- `idx_vda_group_kind` → (`groupId`, `kind`)
- `idx_vda_enabled` → `enabled`

## AD.3 Relationships

- `assignment`: Two-way ↔ `vehicle_driver_assignments.files` (Many-to-one) On delete Cascade
- `file`: Two-way ↔ `files.vehicleDriverAssignmentsFiles` (Many-to-one) On delete Cascade

# AE) audit_logs

## AE.1 Attributes

| Field      | Type         | Required | Default | Notes                                                    |
| ---------- | ------------ | -------: | ------- | -------------------------------------------------------- |
| groupId    | String(64)   |       ✅ |         | `groups.$id` (puede ser null para logs globales)         |
| profileId  | String(64)   |       ✅ |         | `users_profile.$id` - quien ejecutó la acción            |
| action     | Enum         |       ✅ |         | CREATE / UPDATE / DELETE / LOGIN / LOGOUT / VIEW / OTHER |
| entityType | String(80)   |       ✅ |         | vehicles / service_histories / repair_reports / etc      |
| entityId   | String(64)   |       ❌ |         | `$id` del documento afectado                             |
| entityName | String(200)  |       ❌ |         | nombre/identificador legible (ej: placa del vehículo)    |
| details    | String(2000) |       ❌ |         | JSON con cambios o metadata adicional                    |
| ipAddress  | String(45)   |       ❌ |         | IPv4 o IPv6                                              |
| userAgent  | String(500)  |       ❌ |         | navegador/dispositivo                                    |
| createdAt  | Datetime     |       ✅ |         | timestamp de la acción (set en Function/API)             |
| enabled    | Boolean      |       ❌ | true    |                                                          |

## AE.2 Indexes

- `idx_audit_logs_groupId` → `groupId`
- `idx_audit_logs_profileId` → `profileId`
- `idx_audit_logs_group_action` → (`groupId`, `action`)
- `idx_audit_logs_group_entityType` → (`groupId`, `entityType`)
- `idx_audit_logs_group_createdAt` → (`groupId`, `createdAt`)
- `idx_audit_logs_enabled` → `enabled`

## AE.3 Relationships

- `profile`: One-way ↔ `users_profile.auditLogs` (Many-to-one) On delete Restrict

---

# AF) group_invitations

> Sistema de invitaciones por email para que usuarios existentes se unan a grupos.
>
> ⚠️ **SIMPLIFICADO v2.1:** Se eliminaron las relaciones two-way con `users_profile` para evitar
> sobrecarga de backrefs en esa colección. Solo se mantiene la relación con `groups`.
> Los campos `invitedByProfileId` e `invitedProfileId` son **escalares indexables** para queries.

## AF.1 Attributes

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

## AF.2 Indexes

> ⚠️ Nombres de índice máximo 43 caracteres. Usamos prefijo `idx_grp_inv_` para acortar.

| Index Name                     | Type   | Fields                              | Chars |
| ------------------------------ | ------ | ----------------------------------- | ----- |
| `idx_grp_inv_groupId`          | key    | `groupId`                           | 21    |
| `uq_grp_inv_token`             | unique | `token`                             | 18    |
| `idx_grp_inv_grp_email_status` | key    | `groupId`, `invitedEmail`, `status` | 30    |
| `idx_grp_inv_invitedProfileId` | key    | `invitedProfileId`                  | 30    |
| `idx_grp_inv_invitedById`      | key    | `invitedByProfileId`                | 26    |
| `idx_grp_inv_enabled`          | key    | `enabled`                           | 21    |

## AF.3 Relationships

> ⚠️ **Solo UNA relación** con `groups`. NO crear relaciones two-way con `users_profile`
> para evitar sobrecarga de backrefs. Usar los campos escalares para queries.

### AF.3.1 `group`

- **Two-way**
- Related: `groups`
- Attribute key: `group`
- Backref key: `invitations`
- Cardinalidad: **Many-to-one**
- On delete: **Cascade**

## AF.4 Notas de implementación

- **Para obtener invitaciones enviadas por un usuario:** Query por `invitedByProfileId`
- **Para obtener invitaciones recibidas por un usuario:** Query por `invitedProfileId` o `invitedEmail`
- **NO** crear relaciones two-way adicionales con `users_profile` - ya tiene demasiados backrefs

---

## 3) Migración de datos existentes

Si tienes datos con el esquema anterior (usando `teamId`), necesitarás:

1. **Crear un script de migración** que:

   - Para cada `group_members.groupId` (que era `teamId`), busque el `groups.$id` correspondiente
   - Actualice el valor de `groupId` al `$id` real del documento `groups`
   - Lo mismo para `user_roles`, `roles`, `role_permissions` y todas las tablas con `groupId`

2. **Eliminar el campo `teamId`** de la colección `groups` (después de migrar)

3. **Eliminar los Teams de Auth** si ya no los necesitas

---

## 4) Orden recomendado de creación (Console)

1. `users_profile`
2. `groups` → relationship `ownerProfile`
3. `group_members` → relationships `group` y `profile`

4. `permissions`
5. `roles` → relationship `group`
6. `role_permissions` → relationships `role`, `permission`
7. `user_roles` → relationships `group`, `profile`, `role`

8. catálogos: `vehicle_types`, `vehicle_brands`, `vehicle_models`, `conditions` (con relationship `group`)

9. `vehicles` (+ relationships a group/profile/catálogos)
10. `vehicle_conditions`
11. `files`, `images`

12. `service_histories` → `replaced_parts` → `service_files`
13. `repair_reports` → `repaired_parts` → `repair_files`
14. `clients` → `rentals` → `rental_files`

15. `drivers` → `driver_licenses` → `driver_files`
16. `vehicle_driver_assignments` → `vehicle_driver_assignment_files`

---

## 5) Resumen de cambios v2

| Antes (v1)                         | Ahora (v2)                                       |
| ---------------------------------- | ------------------------------------------------ |
| `groups.teamId` = Team de Auth     | **ELIMINADO** - usamos `groups.$id` directamente |
| `group_members.groupId` = `teamId` | `group_members.groupId` = `groups.$id`           |
| `roles.groupId` = `teamId`         | `roles.groupId` = `groups.$id`                   |
| `user_roles.groupId` = `teamId`    | `user_roles.groupId` = `groups.$id`              |
| `vehicles.groupId` = `teamId`      | `vehicles.groupId` = `groups.$id`                |
| Teams de Auth de Appwrite          | **NO SE USAN** - sistema RBAC propio             |
| `activeGroupId` = `teamId`         | `activeGroupId` = `groups.$id`                   |
| Query por `teamId`                 | Query por `groups.$id` directamente              |

---
