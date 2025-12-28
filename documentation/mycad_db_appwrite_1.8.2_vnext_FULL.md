# MyCAD — Base de Datos (Appwrite Console) vNext (Appwrite **1.8.2**) ✅

**Objetivo:** que puedas crear TODA la BD desde la **Appwrite Console** (sin CLI) para la app de vehículos (usuarios, roles/permisos, grupos, vehículos, reportes, rentas, archivos).

**Fuente base usada para partir:** `mycad_db_vnext_appwrite_1.8RC2_relaciones.md` (lo corregí y amplié)  
**Archivo Prisma analizado:** `schema.prisma`

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
   - Recomendación: no borrar físico casi nunca; así `onDelete` se vuelve “seguro”.

5. **Multi-tenant por Grupo (Team)**
   - `groupId` = `$id` del **Team** de Appwrite (tu tenant).
   - Todo documento “de negocio” (vehículos, reportes, etc.) trae `groupId` para filtrar duro.

---

## 1) Colecciones (Appwrite Database) — Lista completa

### Identidad / Tenancy

- `users_profile`
- `groups`
- `group_members`

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

---

## 2) Detalle por colección (Attributes + Indexes + Relationships)

> Convención:
>
> - **IDs escalares** para indexar: `groupId`, `ownerProfileId`, `vehicleId`, etc.
> - **Relationships** para navegar: `vehicle`, `ownerProfile`, etc.
> - Cuando exista relación, se mantiene el ID escalar para búsqueda y para índices.

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

## A.3 Relationships (Two-way sugerido)

- `ownedGroups` (backref de `groups.ownerProfile`)
- `ownedVehicles` (backref de `vehicles.ownerProfile`)
- `groupMemberships` (backref de `group_members.profile`)
- `createdServiceHistories` (backref de `service_histories.createdByProfile`)
- `createdRepairReports` (backref de `repair_reports.createdByProfile`)

---

# B) groups (metadata del Team)

## B.1 Attributes

| Field          | Type        | Required | Default | Notes                           |
| -------------- | ----------- | -------: | ------- | ------------------------------- |
| teamId         | String(64)  |       ✅ |         | `$id` del Team en Appwrite      |
| name           | String(120) |       ✅ |         |                                 |
| description    | String(500) |       ❌ |         |                                 |
| ownerProfileId | String(64)  |       ✅ |         | `users_profile.$id` (indexable) |
| logoFileId     | String(64)  |       ❌ |         | Storage fileId                  |
| enabled        | Boolean     |       ❌ | true    |                                 |

## B.2 Indexes

- `uq_groups_teamId` (unique) → `teamId`
- `idx_groups_ownerProfileId` → `ownerProfileId`
- `idx_groups_enabled` → `enabled`

## B.3 Relationship

### B.3.1 `ownerProfile`

- **Two-way**
- Related: `users_profile`
- Attribute key: `ownerProfile`
- Backref key: `ownedGroups`
- Cardinalidad: **Many-to-one**
- On delete: **Restrict**

---

# C) group_members (membresías por grupo)

## C.1 Attributes

| Field     | Type        | Required | Default | Notes                                                        |
| --------- | ----------- | -------: | ------- | ------------------------------------------------------------ |
| groupId   | String(64)  |       ✅ |         | `groups.teamId` (TeamId)                                     |
| profileId | String(64)  |       ✅ |         | `users_profile.$id`                                          |
| role      | Enum        |       ✅ |         | OWNER / ADMIN / MEMBER / VIEWER _(sin default por required)_ |
| enabled   | Boolean     |       ❌ | true    |                                                              |
| joinedAt  | Datetime    |       ❌ |         | set en Function/API                                          |
| notes     | String(500) |       ❌ |         |                                                              |

## C.2 Indexes

- `idx_group_members_groupId` → `groupId`
- `idx_group_members_profileId` → `profileId`
- `idx_group_members_group_role` → (`groupId`, `role`)

> Unique compuesto (groupId+profileId): Appwrite console puede limitar esto; si no te deja, **valídalo en Function** antes de crear.

## C.3 Relationships

### C.3.1 `group`

- **Two-way**
- Related: `groups`
- Attribute key: `group`
- Backref key: `members`
- Cardinalidad: **Many-to-one**
- On delete: **Cascade** _(si borras físico el group; con soft delete casi no aplica)_

### C.3.2 `profile`

- **Two-way**
- Related: `users_profile`
- Attribute key: `profile`
- Backref key: `groupMemberships`
- Cardinalidad: **Many-to-one**
- On delete: **Restrict** _(recomendado si soft delete; si borras profiles físico, usa Cascade)_

---

# D) permissions (Prisma: Permission)

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

# E) roles (Prisma: Role)

## E.1 Attributes

| Field       | Type        | Required | Default | Notes                        |
| ----------- | ----------- | -------: | ------- | ---------------------------- |
| groupId     | String(64)  |       ✅ |         | tenant                       |
| name        | String(80)  |       ✅ |         | ej: Admin, Mecánico, Auditor |
| description | String(500) |       ❌ |         |                              |
| isSystem    | Boolean     |       ❌ | false   | roles base del sistema       |
| enabled     | Boolean     |       ❌ | true    |                              |

## E.2 Indexes

- `idx_roles_groupId` → `groupId`
- `idx_roles_group_name` → (`groupId`, `name`)
- `idx_roles_enabled` → `enabled`

---

# F) role_permissions (Prisma: RolePermission)

## F.1 Attributes

| Field        | Type       | Required | Default | Notes             |
| ------------ | ---------- | -------: | ------- | ----------------- |
| groupId      | String(64) |       ✅ |         | tenant            |
| roleId       | String(64) |       ✅ |         | `roles.$id`       |
| permissionId | String(64) |       ✅ |         | `permissions.$id` |
| enabled      | Boolean    |       ❌ | true    |                   |

## F.2 Indexes

- `idx_role_permissions_group_role` → (`groupId`, `roleId`)
- `idx_role_permissions_group_permission` → (`groupId`, `permissionId`)
- `idx_role_permissions_enabled` → `enabled`

## F.3 Relationships

### `role`

- Two-way: `role_permissions.role` ↔ `roles.permissions`
- Cardinalidad: Many-to-one
- On delete: Restrict/Cascade (tu política)

### `permission`

- Two-way: `role_permissions.permission` ↔ `permissions.roles`
- Cardinalidad: Many-to-one
- On delete: Restrict/Cascade

---

# G) user_roles (asignación de roles a un profile dentro de un group)

> Esto completa el RBAC multi-tenant (porque en Prisma el User traía roleId directo, pero tú necesitas “por grupo”).

## G.1 Attributes

| Field      | Type       | Required | Default | Notes               |
| ---------- | ---------- | -------: | ------- | ------------------- |
| groupId    | String(64) |       ✅ |         | tenant              |
| profileId  | String(64) |       ✅ |         | `users_profile.$id` |
| roleId     | String(64) |       ✅ |         | `roles.$id`         |
| enabled    | Boolean    |       ❌ | true    |                     |
| assignedAt | Datetime   |       ❌ |         | set en Function/API |

## G.2 Indexes

- `idx_user_roles_group_profile` → (`groupId`, `profileId`)
- `idx_user_roles_group_role` → (`groupId`, `roleId`)
- `idx_user_roles_enabled` → `enabled`

## G.3 Relationships

- `profile`: Two-way ↔ `users_profile.userRoles` (Many-to-one) On delete Restrict
- `role`: Two-way ↔ `roles.userAssignments` (Many-to-one) On delete Restrict

---

# H) vehicle_types (Prisma: VehicleType)

## H.1 Attributes

| Field         | Type       | Required | Default | Notes  |
| ------------- | ---------- | -------: | ------- | ------ |
| groupId       | String(64) |       ✅ |         | tenant |
| name          | String(80) |       ✅ |         |        |
| economicGroup | String(32) |       ✅ |         |        |
| enabled       | Boolean    |       ❌ | true    |        |

## H.2 Indexes

- `idx_vehicle_types_group_name` → (`groupId`, `name`)
- `idx_vehicle_types_enabled` → `enabled`

---

# I) vehicle_brands (Prisma: VehicleBrand)

## I.1 Attributes

| Field   | Type       | Required | Default | Notes  |
| ------- | ---------- | -------: | ------- | ------ |
| groupId | String(64) |       ✅ |         | tenant |
| name    | String(80) |       ✅ |         |        |
| enabled | Boolean    |       ❌ | true    |        |

## I.2 Indexes

- `idx_vehicle_brands_group_name` → (`groupId`, `name`)
- `idx_vehicle_brands_enabled` → `enabled`

---

# J) vehicle_models (Prisma: Model)

## J.1 Attributes

| Field   | Type                       | Required | Default | Notes                |
| ------- | -------------------------- | -------: | ------- | -------------------- |
| groupId | String(64)                 |       ✅ |         | tenant               |
| brandId | String(64)                 |       ❌ |         | indexable (catálogo) |
| typeId  | String(64)                 |       ❌ |         | indexable (catálogo) |
| name    | String(120)                |       ✅ |         | modelo               |
| year    | Integer(min=1900,max=2100) |       ❌ |         |                      |
| enabled | Boolean                    |       ❌ | true    |                      |

## J.2 Indexes

- `idx_vehicle_models_group_name` → (`groupId`, `name`)
- `idx_vehicle_models_group_brand` → (`groupId`, `brandId`)
- `idx_vehicle_models_group_type` → (`groupId`, `typeId`)
- `idx_vehicle_models_enabled` → `enabled`

## J.3 Relationships (opcional pero recomendado)

- `brand`: Two-way ↔ `vehicle_brands.models` (Many-to-one) On delete Restrict
- `type`: Two-way ↔ `vehicle_types.models` (Many-to-one) On delete Restrict

---

# K) conditions (Prisma: Condition)

## K.1 Attributes

| Field       | Type        | Required | Default | Notes                       |
| ----------- | ----------- | -------: | ------- | --------------------------- |
| groupId     | String(64)  |       ✅ |         | tenant                      |
| name        | String(80)  |       ✅ |         | Nuevo / En reparación / etc |
| description | String(300) |       ❌ |         |                             |
| enabled     | Boolean     |       ❌ | true    |                             |

## K.2 Indexes

- `idx_conditions_group_name` → (`groupId`, `name`)
- `idx_conditions_enabled` → `enabled`

---

# L) vehicles (Prisma: Vehicle)

## L.1 Attributes

| Field           | Type                       | Required | Default | Notes                                              |
| --------------- | -------------------------- | -------: | ------- | -------------------------------------------------- |
| groupId         | String(64)                 |       ✅ |         | tenant                                             |
| ownerProfileId  | String(64)                 |       ✅ |         | indexable                                          |
| visibility      | Enum                       |       ❌ | GROUP   | PRIVATE / GROUP                                    |
| typeId          | String(64)                 |       ✅ |         | catálogo                                           |
| brandId         | String(64)                 |       ❌ |         | catálogo                                           |
| modelId         | String(64)                 |       ❌ |         | catálogo                                           |
| color           | String(40)                 |       ❌ |         |                                                    |
| plate           | String(15)                 |       ❌ |         |                                                    |
| economicNumber  | String(32)                 |       ✅ |         |                                                    |
| serialNumber    | String(60)                 |       ❌ |         |                                                    |
| acquisitionDate | Datetime                   |       ❌ |         |                                                    |
| purchaseCost    | Float(min=0,max=100000000) |       ❌ |         |                                                    |
| mileage         | Integer(min=0,max=5000000) |       ❌ | 0       | default ⇒ no required                              |
| mileageUnit     | Enum                       |       ❌ | KM      | KM / MI                                            |
| status          | Enum                       |       ❌ | ACTIVE  | ACTIVE / IN_MAINTENANCE / SOLD / RENTED / INACTIVE |
| notes           | String(1500)               |       ❌ |         |                                                    |
| enabled         | Boolean                    |       ❌ | true    |                                                    |

## L.2 Indexes

- `idx_vehicles_groupId` → `groupId`
- `idx_vehicles_ownerProfileId` → `ownerProfileId`
- `idx_vehicles_group_status` → (`groupId`, `status`)
- `idx_vehicles_group_type` → (`groupId`, `typeId`)
- `idx_vehicles_group_plate` → (`groupId`, `plate`)
- `idx_vehicles_group_economicNumber` → (`groupId`, `economicNumber`)
- `idx_vehicles_group_vin` → (`groupId`, `vin`)
- `idx_vehicles_enabled` → `enabled`

## L.3 Relationships

- `ownerProfile`: Two-way ↔ `users_profile.ownedVehicles` (Many-to-one) On delete Restrict
- `group`: Two-way ↔ `groups.vehicles` (Many-to-one) On delete Restrict/Cascade

- `type`: Two-way ↔ `vehicle_types.vehicles` (Many-to-one) On delete Restrict
- `brand`: Two-way ↔ `vehicle_brands.vehicles` (Many-to-one) On delete Restrict
- `model`: Two-way ↔ `vehicle_models.vehicles` (Many-to-one) On delete Restrict

---

# M) vehicle_conditions (Prisma: VehicleCondition)

> Útil si quieres guardar historial de condición por fechas. Si no, puedes dejar solo `vehicles.status` + `vehicles.conditionId`.

## M.1 Attributes

| Field       | Type       | Required | Default | Notes            |
| ----------- | ---------- | -------: | ------- | ---------------- |
| groupId     | String(64) |       ✅ |         | tenant           |
| vehicleId   | String(64) |       ✅ |         | `vehicles.$id`   |
| conditionId | String(64) |       ✅ |         | `conditions.$id` |
| startDate   | Datetime   |       ❌ |         |                  |
| endDate     | Datetime   |       ❌ |         |                  |
| enabled     | Boolean    |       ❌ | true    |                  |

## M.2 Indexes

- `idx_vehicle_conditions_group_vehicle` → (`groupId`, `vehicleId`)
- `idx_vehicle_conditions_group_condition` → (`groupId`, `conditionId`)
- `idx_vehicle_conditions_enabled` → `enabled`

## M.3 Relationships

- `vehicle`: Two-way ↔ `vehicles.conditionHistory` (Many-to-one) On delete Cascade/Restrict
- `condition`: Two-way ↔ `conditions.vehicleUsages` (Many-to-one) On delete Restrict

---

# N) files (Prisma: File)

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

# O) images (Prisma: Image / UserImage)

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
| label     | String(80) |       ❌ |         |                                               |
| enabled   | Boolean    |       ❌ | true    |                                               |

## P.2 Indexes

- `idx_vehicle_files_group_vehicle` → (`groupId`, `vehicleId`)
- `idx_vehicle_files_group_kind` → (`groupId`, `kind`)
- `idx_vehicle_files_enabled` → `enabled`

## P.3 Relationships

- `vehicle`: Two-way ↔ `vehicles.files` (Many-to-one) On delete Cascade
- `file`: Two-way ↔ `files.vehicleLinks` (Many-to-one) On delete Restrict

---

# Q) service_histories (Prisma: ServiceHistory)

## Q.1 Attributes

| Field              | Type                       | Required | Default | Notes |
| ------------------ | -------------------------- | -------: | ------- | ----- |
| groupId            | String(64)                 |       ✅ |         |       |
| vehicleId          | String(64)                 |       ✅ |         |       |
| createdByProfileId | String(64)                 |       ✅ |         |       |
| serviceDate        | Datetime                   |       ✅ |         |       |
| odometer           | Integer(min=0,max=5000000) |       ❌ |         |       |
| title              | String(120)                |       ✅ |         |       |
| description        | String(1500)               |       ❌ |         |       |
| cost               | Float(min=0,max=100000000) |       ❌ |         |       |
| vendorName         | String(120)                |       ❌ |         |       |
| enabled            | Boolean                    |       ❌ | true    |       |

## Q.2 Indexes

- `idx_service_histories_group_vehicle` → (`groupId`, `vehicleId`)
- `idx_service_histories_group_date` → (`groupId`, `serviceDate`)
- `idx_service_histories_enabled` → `enabled`

## Q.3 Relationships

- `vehicle`: Two-way ↔ `vehicles.serviceHistories` (Many-to-one) On delete Cascade
- `createdByProfile`: Two-way ↔ `users_profile.createdServiceHistories` (Many-to-one) On delete Restrict

---

# R) replaced_parts (Prisma: ReplacedPart)

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

# S) service_files (Prisma: ServicesFile)

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

# T) repair_reports (Prisma: RepairReport)

## T.1 Attributes

| Field              | Type                       | Required | Default | Notes                                |
| ------------------ | -------------------------- | -------: | ------- | ------------------------------------ |
| groupId            | String(64)                 |       ✅ |         |                                      |
| vehicleId          | String(64)                 |       ✅ |         |                                      |
| createdByProfileId | String(64)                 |       ✅ |         |                                      |
| reportDate         | Datetime                   |       ✅ |         |                                      |
| title              | String(120)                |       ✅ |         |                                      |
| description        | String(2000)               |       ❌ |         |                                      |
| status             | Enum                       |       ❌ | OPEN    | OPEN / IN_PROGRESS / DONE / CANCELED |
| costEstimate       | Float(min=0,max=100000000) |       ❌ |         |                                      |
| finalCost          | Float(min=0,max=100000000) |       ❌ |         |                                      |
| enabled            | Boolean                    |       ❌ | true    |                                      |

## T.2 Indexes

- `idx_repair_reports_group_vehicle` → (`groupId`, `vehicleId`)
- `idx_repair_reports_group_date` → (`groupId`, `reportDate`)
- `idx_repair_reports_enabled` → `enabled`

## T.3 Relationships

- `vehicle`: Two-way ↔ `vehicles.repairReports` (Many-to-one) On delete Cascade
- `createdByProfile`: Two-way ↔ `users_profile.createdRepairReports` (Many-to-one) On delete Restrict

---

# U) repaired_parts (Prisma: RepairedPart)

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

# V) repair_files (Prisma: RepairFile)

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

# W) clients (Prisma: Client)

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

# X) rentals (Prisma: Rental)

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

# Y) rental_files (Prisma: RentalFile)

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

- `vehicle`: Two-way ↔ `vehicles.driverAssignments` (Many-to-one) On delete Cascade
- `driver`: Two-way ↔ `drivers.vehicleAssignments` (Many-to-one) On delete Cascade
- `createdBy`: Two-way ↔ `users_profile.vehicleDriverAssignmentsCreated` (Many-to-one) On delete Cascade

---

## 3) Orden recomendado de creación (Console)

1. `users_profile`
2. `groups` → relationship `ownerProfile`
3. `group_members` → relationships `group` y `profile`

4. `permissions`
5. `roles`
6. `role_permissions`
7. `user_roles`

8. catálogos: `vehicle_types`, `vehicle_brands`, `vehicle_models`, `conditions`

9. `vehicles` (+ relationships a profile/group/catálogos)
10. `vehicle_conditions` (si lo usarás)
11. `files`, `images`

12. `service_histories` → `replaced_parts` → `service_files`
13. `repair_reports` → `repaired_parts` → `repair_files`
14. `clients` → `rentals` → `rental_files`
15. `vehicles` → `rentals` → `rental_files`

16. `drivers`
17. `driver_licenses` → `driver_files`
18. `driver_files` → `driver_licenses`
19. `vehicle_driver_assignments`

---
