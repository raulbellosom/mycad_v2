# Arquitectura de Archivos y Storage - MyCAD

## 📁 Resumen de Colecciones

### Tablas Principales de Metadatos

| Colección | ID                     | Propósito                                                                 |
| --------- | ---------------------- | ------------------------------------------------------------------------- |
| `files`   | `694f49530013655513be` | Metadatos de TODOS los archivos (docs, PDFs, imágenes de vehículos, etc.) |
| `images`  | `694f4a740001ba16362b` | Solo para avatares/fotos de perfil (optimizadas)                          |

### Tablas de Unión (Join Tables)

| Colección       | ID                     | Une                           |
| --------------- | ---------------------- | ----------------------------- |
| `vehicle_files` | `694f34ee000d203ab6b9` | `vehicles` ↔ `files`          |
| `service_files` | `694f5751002a7fc81f2d` | `service_histories` ↔ `files` |
| `repair_files`  | `694f59d900342c03959a` | `repair_reports` ↔ `files`    |
| `rental_files`  | `694f5cb500254021c246` | `rentals` ↔ `files`           |
| `driver_files`  | `6950a9b600360a57896c` | `drivers` ↔ `files`           |

---

## 🔄 Flujo de Subida de Archivos

### Para Vehículos (fotos, documentos)

```
1. USUARIO SUBE ARCHIVO
         ↓
2. Storage Bucket (vehicles)
   → Obtiene: storageFileId
         ↓
3. Crear documento en `files`
   {
     groupId: "...",
     storageFileId: "...",
     ownerProfileId: "profile.$id",  // ID del documento users_profile
     ownerProfile: "profile.$id",    // RELACIÓN two-way (mismo valor)
     name: "archivo.jpg",
     mimeType: "image/jpeg",
     sizeBytes: 12345,
     enabled: true
   }
   → Obtiene: files.$id
         ↓
4. Crear documento en `vehicle_files` (join)
   {
     groupId: "...",
     vehicleId: "...",
     fileId: "files.$id",     // El ID del documento en files
     file: "files.$id",       // RELACIÓN two-way (mismo valor)
     kind: "IMAGE",           // o "DOCUMENT"
     name: "archivo.jpg",
     enabled: true
   }
```

### Para Servicios/Reparaciones

```
Mismo flujo, pero paso 4 va a `service_files` o `repair_files`:

service_files: {
  groupId, serviceHistoryId, fileId, file (relación), enabled
}

repair_files: {
  groupId, repairReportId, fileId, file (relación), enabled
}
```

### Para Avatares/Fotos de Perfil

```
1. Storage Bucket (avatars)
         ↓
2. Crear documento en `images` (NO en files)
   {
     groupId: "...",
     storageFileId: "...",
     ownerProfileId: "profile.$id",
     label: "Avatar",
     mimeType: "image/jpeg",
     sizeBytes: 12345,
     width: 200,
     height: 200,
     enabled: true
   }
         ↓
3. Actualizar users_profile.avatarFileId con el storageFileId
```

---

## 📊 Estructura Actual de Tablas (según Appwrite Console)

### `files` (Tabla principal de metadatos)

| Campo          | Tipo         | Required | Notas                                |
| -------------- | ------------ | -------- | ------------------------------------ |
| groupId        | String       | ✅       | Tenant                               |
| storageFileId  | String       | ✅       | ID del archivo en Storage            |
| ownerProfileId | String       | ❌       | `users_profile.$id` (para índices)   |
| ownerProfile   | Relationship | ❌       | Relación two-way con `users_profile` |
| name           | String       | ✅       | Nombre del archivo                   |
| mimeType       | String       | ❌       | Tipo MIME                            |
| sizeBytes      | Integer      | ❌       | Tamaño en bytes                      |
| checksum       | String       | ❌       | Hash opcional                        |
| enabled        | Boolean      | ❌       | Default: true                        |
| vehicleLinks   | Relationship | -        | Backref de vehicle_files             |
| serviceLinks   | Relationship | -        | Backref de service_files             |
| repairLinks    | Relationship | -        | Backref de repair_files              |
| rentalLinks    | Relationship | -        | Backref de rental_files              |
| driverLinks    | Relationship | -        | Backref de driver_files              |

### `vehicle_files` (Join table)

| Campo     | Tipo         | Required | Notas                         |
| --------- | ------------ | -------- | ----------------------------- |
| groupId   | String       | ✅       | Tenant                        |
| vehicleId | String       | ✅       | `vehicles.$id`                |
| fileId    | String       | ✅       | `files.$id` (para índices)    |
| file      | Relationship | ❌       | Relación two-way con `files`  |
| kind      | Enum         | ✅       | IMAGE / DOCUMENT              |
| name      | String       | ❌       | Nombre (redundante pero útil) |
| enabled   | Boolean      | ❌       | Default: true                 |

### `images` (Solo para avatares)

| Campo          | Tipo    | Required | Notas                        |
| -------------- | ------- | -------- | ---------------------------- |
| groupId        | String  | ✅       | Tenant                       |
| storageFileId  | String  | ✅       | ID en Storage bucket avatars |
| ownerProfileId | String  | ✅       | `users_profile.$id`          |
| label          | String  | ❌       | Etiqueta descriptiva         |
| mimeType       | String  | ❌       | Tipo MIME                    |
| sizeBytes      | Integer | ❌       | Tamaño                       |
| width          | Integer | ❌       | Ancho en px                  |
| height         | Integer | ❌       | Alto en px                   |
| enabled        | Boolean | ❌       | Default: true                |

---

## ⚠️ Problemas Identificados

### 1. Relaciones Two-Way

En Appwrite, cuando hay una relación two-way, necesitas enviar el ID del documento relacionado en el campo de la relación:

```javascript
// ❌ INCORRECTO - Solo envía el string
{
  ownerProfileId: "69515bdd0022fc71dabf"
}

// ✅ CORRECTO - Envía tanto el string como la relación
{
  ownerProfileId: "69515bdd0022fc71dabf",  // Para índices
  ownerProfile: "69515bdd0022fc71dabf"     // Para la relación two-way
}
```

### 2. IDs Confusos

- `profile.$id` = ID del documento en `users_profile` (ej: `69515bdd0022fc71dabf`)
- `user.$id` = ID del usuario en Auth de Appwrite (ej: `69515bdd000db30db247`)
- `profile.userAuthId` = Copia del `user.$id` en el profile

**Para `ownerProfileId` en `files`, usar `profile.$id` (el ID del documento)**

### 3. Permisos de Appwrite

El error 401 puede ocurrir si:

- La colección no tiene permisos para "Users"
- El bucket de Storage no tiene permisos
- La sesión del usuario expiró

---

## 🎯 Cuándo usar cada tabla

| Escenario                 | Storage Bucket | Metadata | Join Table               |
| ------------------------- | -------------- | -------- | ------------------------ |
| Foto de vehículo          | `vehicles`     | `files`  | `vehicle_files`          |
| Documento de vehículo     | `vehicles`     | `files`  | `vehicle_files`          |
| Factura de servicio       | `vehicles`     | `files`  | `service_files`          |
| Foto de daño (reparación) | `vehicles`     | `files`  | `repair_files`           |
| Contrato de renta         | `vehicles`     | `files`  | `rental_files`           |
| Licencia de conductor     | `vehicles`     | `files`  | `driver_files`           |
| Avatar de usuario         | `avatars`      | `images` | N/A (directo en profile) |

---

## 📝 Checklist de Permisos en Appwrite Console

Todas estas colecciones necesitan permisos "Users" (Create, Read, Update, Delete):

- [ ] `files`
- [ ] `images`
- [ ] `vehicle_files`
- [ ] `service_files`
- [ ] `repair_files`
- [ ] `rental_files`
- [ ] `driver_files`

Buckets de Storage:

- [ ] `vehicles` bucket
- [ ] `avatars` bucket
