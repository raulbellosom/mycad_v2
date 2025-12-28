# 📋 Plan de Implementación - Módulo de Reportes MyCAD

## Resumen Ejecutivo

Este documento detalla la implementación completa del módulo de reportes para MyCAD, incluyendo:

- **Reportes de Servicio/Mantenimiento** (`service_histories`)
- **Reportes de Reparación** (`repair_reports`)

Con generación de PDF, diseño responsive, sistema RBAC y estados de finalización.

---

## 📊 Análisis de la Base de Datos

### ✅ Campos Disponibles (Ya existen en BD)

#### **service_histories** (Reportes de Servicio/Mantenimiento)

| Campo              | Tipo         | En Imagen | Nota                 |
| ------------------ | ------------ | --------- | -------------------- |
| groupId            | String(64)   | ✅        | Tenant               |
| vehicleId          | String(64)   | ✅        | Vehículo relacionado |
| createdByProfileId | String(64)   | ✅        | Quien creó           |
| serviceDate        | Datetime     | ✅        | Fecha del servicio   |
| odometer           | Integer      | ✅        | Kilometraje          |
| title              | String(120)  | ✅        | Título del reporte   |
| description        | String(1500) | ✅        | Observaciones        |
| cost               | Float        | ✅        | Costo total          |
| vendorName         | String(120)  | ✅        | Proveedor/Taller     |
| enabled            | Boolean      | ✅        | Soft delete          |

#### **replaced_parts** (Partes reemplazadas en servicio)

| Campo            | Tipo        | En Imagen | Nota                |
| ---------------- | ----------- | --------- | ------------------- |
| groupId          | String(64)  | ✅        | Tenant              |
| serviceHistoryId | String(64)  | ✅        | Reporte relacionado |
| name             | String(120) | ✅        | Nombre de la pieza  |
| quantity         | Integer     | ✅        | Cantidad            |
| unitCost         | Float       | ✅        | Costo unitario      |
| notes            | String(500) | ✅        | Notas               |
| enabled          | Boolean     | ✅        | Soft delete         |

#### **repair_reports** (Reportes de Reparación)

| Campo              | Tipo         | En Imagen | Nota                           |
| ------------------ | ------------ | --------- | ------------------------------ |
| groupId            | String(64)   | ✅        | Tenant                         |
| vehicleId          | String(64)   | ✅        | Vehículo relacionado           |
| createdByProfileId | String(64)   | ✅        | Quien creó                     |
| reportDate         | Datetime     | ✅        | Fecha del reporte              |
| title              | String(120)  | ✅        | Título del reporte             |
| description        | String(2000) | ✅        | Observaciones                  |
| status             | Enum         | ✅        | OPEN/IN_PROGRESS/DONE/CANCELED |
| costEstimate       | Float        | ✅        | Costo estimado                 |
| finalCost          | Float        | ✅        | Costo final                    |
| enabled            | Boolean      | ✅        | Soft delete                    |

#### **repaired_parts** (Partes reparadas)

| Campo          | Tipo        | En Imagen | Nota                |
| -------------- | ----------- | --------- | ------------------- |
| groupId        | String(64)  | ✅        | Tenant              |
| repairReportId | String(64)  | ✅        | Reporte relacionado |
| name           | String(120) | ✅        | Nombre de la pieza  |
| quantity       | Integer     | ✅        | Cantidad            |
| unitCost       | Float       | ✅        | Costo unitario      |
| notes          | String(500) | ✅        | Notas               |
| enabled        | Boolean     | ✅        | Soft delete         |

### ⚠️ Campos Faltantes - Agregar a la BD

Basándome en las imágenes de referencia, necesitamos agregar los siguientes campos:

#### **service_histories** - Agregar:

| Campo                  | Tipo         | Required | Default     | Nota                              |
| ---------------------- | ------------ | -------- | ----------- | --------------------------------- |
| `status`               | Enum         | ❌       | DRAFT       | DRAFT/FINALIZED                   |
| `serviceType`          | Enum         | ❌       | MAINTENANCE | MAINTENANCE/INSPECTION/OTHER      |
| `invoiceNumber`        | String(50)   | ❌       |             | Número de factura                 |
| `laborCost`            | Float(min=0) | ❌       |             | Costo de mano de obra             |
| `partsCost`            | Float(min=0) | ❌       |             | Costo de refacciones (calculado)  |
| `workshopAddress`      | String(200)  | ❌       |             | Dirección del taller              |
| `workshopPhone`        | String(30)   | ❌       |             | Teléfono del taller               |
| `nextServiceDate`      | Datetime     | ❌       |             | Próximo servicio                  |
| `nextServiceOdometer`  | Integer      | ❌       |             | Kilometraje para próximo servicio |
| `finalizedAt`          | Datetime     | ❌       |             | Fecha de finalización             |
| `finalizedByProfileId` | String(64)   | ❌       |             | Quien finalizó                    |

#### **repair_reports** - Agregar:

| Campo                  | Tipo        | Required | Default    | Nota                                      |
| ---------------------- | ----------- | -------- | ---------- | ----------------------------------------- |
| `reportNumber`         | String(50)  | ❌       |            | Número de reporte (auto-generado)         |
| `odometer`             | Integer     | ❌       |            | Kilometraje al momento del reporte        |
| `priority`             | Enum        | ❌       | NORMAL     | LOW/NORMAL/HIGH/URGENT                    |
| `damageType`           | Enum        | ❌       | MECHANICAL | MECHANICAL/ELECTRICAL/BODY/INTERIOR/OTHER |
| `laborCost`            | Float       | ❌       |            | Costo de mano de obra                     |
| `partsCost`            | Float       | ❌       |            | Costo de refacciones                      |
| `workshopName`         | String(120) | ❌       |            | Nombre del taller                         |
| `workshopAddress`      | String(200) | ❌       |            | Dirección del taller                      |
| `workshopPhone`        | String(30)  | ❌       |            | Teléfono del taller                       |
| `startDate`            | Datetime    | ❌       |            | Fecha inicio reparación                   |
| `completionDate`       | Datetime    | ❌       |            | Fecha fin reparación                      |
| `finalizedAt`          | Datetime    | ❌       |            | Fecha de finalización (bloquea edición)   |
| `finalizedByProfileId` | String(64)  | ❌       |            | Quien finalizó                            |
| `warrantyDays`         | Integer     | ❌       |            | Días de garantía                          |
| `warrantyNotes`        | String(500) | ❌       |            | Notas de garantía                         |

---

## 🗂️ Arquitectura de Archivos

```
front/src/features/reports/
├── index.js                          # Exports públicos
├── constants/
│   └── report.constants.js           # Enums, status, tipos
├── services/
│   ├── service-reports.service.js    # CRUD service_histories
│   ├── repair-reports.service.js     # CRUD repair_reports
│   └── pdf.service.js                # Generación PDF (llama Function)
├── hooks/
│   ├── useServiceReports.js          # React Query hooks
│   ├── useRepairReports.js
│   └── useParts.js                   # Hook para manejo de partes
├── components/
│   ├── common/
│   │   ├── ReportStatusBadge.jsx     # Badge de estado
│   │   ├── ReportCard.jsx            # Card preview de reporte
│   │   ├── PartsTable.jsx            # Tabla de partes (add/edit/delete)
│   │   ├── PartsTableRow.jsx         # Fila editable de parte
│   │   ├── ReportFilesSection.jsx    # Sección de archivos adjuntos
│   │   ├── VehicleInfoCard.jsx       # Info del vehículo en reporte
│   │   └── ReportSummary.jsx         # Resumen de costos
│   ├── service/
│   │   ├── ServiceReportForm.jsx     # Formulario completo
│   │   ├── ServiceReportView.jsx     # Vista detalle (solo lectura)
│   │   ├── ServiceReportsList.jsx    # Lista de reportes
│   │   └── ServiceReportPDFButton.jsx
│   └── repair/
│       ├── RepairReportForm.jsx      # Formulario completo
│       ├── RepairReportView.jsx      # Vista detalle (solo lectura)
│       ├── RepairReportsList.jsx     # Lista de reportes
│       └── RepairReportPDFButton.jsx
├── pages/
│   ├── ReportsPage.jsx               # Página principal (tabs)
│   ├── ServiceReportCreatePage.jsx
│   ├── ServiceReportEditPage.jsx
│   ├── ServiceReportViewPage.jsx
│   ├── RepairReportCreatePage.jsx
│   ├── RepairReportEditPage.jsx
│   └── RepairReportViewPage.jsx
└── utils/
    ├── report.validations.js         # Esquemas Zod
    └── report.helpers.js             # Helpers (cálculos, formateo)
```

### Appwrite Functions (Backend)

```
functions/
├── generate-service-report-pdf/
│   ├── package.json
│   ├── README.md
│   └── src/
│       ├── _shared.js
│       ├── index.js
│       └── templates/
│           └── service-report.template.js
└── generate-repair-report-pdf/
    ├── package.json
    ├── README.md
    └── src/
        ├── _shared.js
        ├── index.js
        └── templates/
            └── repair-report.template.js
```

---

## 🎨 Diseño de UI/UX

### Principios de Diseño

1. **Mobile First**: Todo responsive desde móvil
2. **Coherencia**: Seguir el mismo patrón visual del resto de la app
3. **Accesibilidad**: Labels claros, contraste adecuado
4. **Feedback Visual**: Estados de carga, éxito, error
5. **Flujo Intuitivo**: Wizards para formularios largos

### Layout del Formulario de Servicio

```
┌─────────────────────────────────────────────────────────────┐
│ 🔧 Nuevo Reporte de Servicio                    [Guardar ▼]│
├─────────────────────────────────────────────────────────────┤
│ ╔═══════════════════════════════════════════════════════╗  │
│ ║ 🚗 Información del Vehículo (Card clickeable)         ║  │
│ ║ ┌─────────────┐                                       ║  │
│ ║ │   [Imagen]  │ Marca Modelo Año                      ║  │
│ ║ │             │ Placas: XXX-000  |  No. Eco: V001     ║  │
│ ║ │             │ Kilometraje actual: 45,000 km         ║  │
│ ║ └─────────────┘                                       ║  │
│ ╚═══════════════════════════════════════════════════════╝  │
│                                                             │
│ ┌───────────────────────────────────────────────────────┐  │
│ │ 📋 Datos del Servicio                                 │  │
│ │ ┌─────────────────┐ ┌─────────────────┐               │  │
│ │ │ Título *        │ │ Tipo Servicio   │               │  │
│ │ │ [____________]  │ │ [Mantenimiento▼]│               │  │
│ │ └─────────────────┘ └─────────────────┘               │  │
│ │ ┌─────────────────┐ ┌─────────────────┐               │  │
│ │ │ Fecha Servicio* │ │ Kilometraje     │               │  │
│ │ │ [📅 ________]   │ │ [________] km   │               │  │
│ │ └─────────────────┘ └─────────────────┘               │  │
│ └───────────────────────────────────────────────────────┘  │
│                                                             │
│ ┌───────────────────────────────────────────────────────┐  │
│ │ 🏢 Información del Taller                             │  │
│ │ ┌─────────────────┐ ┌─────────────────┐               │  │
│ │ │ Nombre Taller   │ │ Teléfono        │               │  │
│ │ │ [____________]  │ │ [____________]  │               │  │
│ │ └─────────────────┘ └─────────────────┘               │  │
│ │ ┌───────────────────────────────────────┐             │  │
│ │ │ Dirección                             │             │  │
│ │ │ [__________________________________]  │             │  │
│ │ └───────────────────────────────────────┘             │  │
│ │ ┌─────────────────┐                                   │  │
│ │ │ No. Factura     │                                   │  │
│ │ │ [____________]  │                                   │  │
│ │ └─────────────────┘                                   │  │
│ └───────────────────────────────────────────────────────┘  │
│                                                             │
│ ┌───────────────────────────────────────────────────────┐  │
│ │ 🔩 Refacciones/Partes                      [+ Agregar]│  │
│ │ ┌─────────────────────────────────────────────────────┐│ │
│ │ │ Pieza         │ Cant │ P.Unit  │ Subtotal │  Acc   ││ │
│ │ ├───────────────┼──────┼─────────┼──────────┼────────┤│ │
│ │ │ Filtro Aceite │  1   │ $150.00 │ $150.00  │ 🗑️ ✏️ ││ │
│ │ │ Aceite 5W-30  │  4   │ $250.00 │ $1000.00 │ 🗑️ ✏️ ││ │
│ │ │ Bujías        │  4   │ $89.00  │ $356.00  │ 🗑️ ✏️ ││ │
│ │ └─────────────────────────────────────────────────────┘│ │
│ │                                    Total: $1,506.00    │  │
│ └───────────────────────────────────────────────────────┘  │
│                                                             │
│ ┌───────────────────────────────────────────────────────┐  │
│ │ 💰 Resumen de Costos                                  │  │
│ │ ┌─────────────────┐ ┌─────────────────┐               │  │
│ │ │ Mano de Obra    │ │ Refacciones     │               │  │
│ │ │ [$ _________]   │ │ $ 1,506.00 (🔒) │               │  │
│ │ └─────────────────┘ └─────────────────┘               │  │
│ │ ┌───────────────────────────────────────┐             │  │
│ │ │           TOTAL: $ 2,006.00           │             │  │
│ │ └───────────────────────────────────────┘             │  │
│ └───────────────────────────────────────────────────────┘  │
│                                                             │
│ ┌───────────────────────────────────────────────────────┐  │
│ │ 📝 Observaciones                                      │  │
│ │ ┌─────────────────────────────────────────────────────┐│ │
│ │ │                                                     ││ │
│ │ │                                                     ││ │
│ │ │                                                     ││ │
│ │ └─────────────────────────────────────────────────────┘│ │
│ └───────────────────────────────────────────────────────┘  │
│                                                             │
│ ┌───────────────────────────────────────────────────────┐  │
│ │ 🗓️ Próximo Servicio                                   │  │
│ │ ┌─────────────────┐ ┌─────────────────┐               │  │
│ │ │ Fecha Próxima   │ │ Kilometraje     │               │  │
│ │ │ [📅 ________]   │ │ [________] km   │               │  │
│ │ └─────────────────┘ └─────────────────┘               │  │
│ └───────────────────────────────────────────────────────┘  │
│                                                             │
│ ┌───────────────────────────────────────────────────────┐  │
│ │ 📎 Archivos Adjuntos                       [+ Subir]  │  │
│ │ ┌─────┐ ┌─────┐ ┌─────┐                               │  │
│ │ │ 📄  │ │ 🖼️  │ │ 📄  │                               │  │
│ │ │Fact.│ │Foto1│ │PDF  │                               │  │
│ │ └─────┘ └─────┘ └─────┘                               │  │
│ └───────────────────────────────────────────────────────┘  │
│                                                             │
│ ┌───────────────────────────────────────────────────────┐  │
│ │  [Cancelar]  [Guardar Borrador]  [✓ Finalizar Reporte]│  │
│ └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Vista del Reporte (Solo Lectura)

```
┌─────────────────────────────────────────────────────────────┐
│ 📄 Reporte de Servicio #SRV-2024-001                        │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Estado: [🟢 FINALIZADO]              [📥 PDF] [✏️ Editar]│ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ (Mismo contenido pero en modo solo lectura con diseño      │
│  de "documento" - fondo blanco, bordes suaves, tipografía  │
│  elegante similar a un PDF)                                │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 📋 Historial de Cambios (si es admin)                   │ │
│ │ • 2024-01-15 14:30 - Finalizado por Juan Pérez         │ │
│ │ • 2024-01-15 10:00 - Creado por María García           │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔐 Sistema de Permisos RBAC

### Permisos Necesarios (ya definidos en PermissionsProvider)

```javascript
// Historial de servicios / Mantenimientos
SERVICES_VIEW: "services.view",
SERVICES_CREATE: "services.create",
SERVICES_EDIT: "services.edit",
SERVICES_DELETE: "services.delete",

// Reportes de reparación
REPAIRS_VIEW: "repairs.view",
REPAIRS_CREATE: "repairs.create",
REPAIRS_EDIT: "repairs.edit",
REPAIRS_DELETE: "repairs.delete",

// Reportes generales (analytics, exports, PDF)
REPORTS_VIEW: "reports.view",
REPORTS_CREATE: "reports.create",
REPORTS_MANAGE: "reports.manage",
```

### Permisos Adicionales Sugeridos

```javascript
// Finalización de reportes (solo ciertos roles)
SERVICES_FINALIZE: "services.finalize",
REPAIRS_FINALIZE: "repairs.finalize",

// Re-abrir reportes finalizados (super admin)
SERVICES_REOPEN: "services.reopen",
REPAIRS_REOPEN: "repairs.reopen",
```

### Matriz de Permisos por Rol

| Acción              | Admin | Supervisor | Mecánico     | Auditor |
| ------------------- | ----- | ---------- | ------------ | ------- |
| Ver reportes        | ✅    | ✅         | ✅ (propios) | ✅      |
| Crear reportes      | ✅    | ✅         | ✅           | ❌      |
| Editar (borrador)   | ✅    | ✅         | ✅ (propios) | ❌      |
| Editar (finalizado) | ❌    | ❌         | ❌           | ❌      |
| Finalizar           | ✅    | ✅         | ❌           | ❌      |
| Re-abrir            | ✅    | ❌         | ❌           | ❌      |
| Eliminar (soft)     | ✅    | ❌         | ❌           | ❌      |
| Generar PDF         | ✅    | ✅         | ✅           | ✅      |

---

## 📄 Generación de PDF

### Estrategia: Appwrite Function (Recomendada)

**¿Por qué Function en lugar de cliente?**

1. **Consistencia**: El PDF se genera igual sin importar el dispositivo/navegador
2. **Seguridad**: No exponemos lógica de negocio al cliente
3. **Logo de Empresa**: Se almacena en Storage y la Function lo obtiene
4. **Performance**: No carga el navegador del usuario
5. **Cacheo**: Podemos guardar el PDF generado en Storage

### Flujo de Generación

```
┌──────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Cliente │───>│ Appwrite        │───>│ Storage         │
│  (React) │    │ Function        │    │ (PDF guardado)  │
└──────────┘    └─────────────────┘    └─────────────────┘
      │                 │                      │
      │  1. Solicitar   │                      │
      │     PDF         │                      │
      │ ───────────────>│                      │
      │                 │ 2. Obtener datos     │
      │                 │    del reporte       │
      │                 │ 3. Obtener logo      │
      │                 │<─────────────────────│
      │                 │ 4. Generar PDF       │
      │                 │    (jsPDF/PDFKit)    │
      │                 │ 5. Guardar en        │
      │                 │    Storage           │
      │                 │ ────────────────────>│
      │                 │ 6. Retornar URL      │
      │<────────────────│    del PDF           │
      │                 │                      │
      │ 7. Descargar/   │                      │
      │    Previsualizar│                      │
```

### Configuración del Logo

**Dónde poner el logo:**

1. Crear bucket en Storage: `company-assets` (o similar)
2. Subir el logo con ID predecible: `company-logo` o usando el `groupId`
3. La Function obtiene: `storage.getFile('company-assets', groupId + '-logo')`

**Variables de entorno para la Function:**

```env
APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
APPWRITE_PROJECT_ID=xxx
APPWRITE_API_KEY=xxx
APPWRITE_DATABASE_ID=xxx
APPWRITE_BUCKET_COMPANY_ASSETS_ID=xxx
COLLECTION_SERVICE_HISTORIES_ID=xxx
COLLECTION_REPAIR_REPORTS_ID=xxx
COLLECTION_REPLACED_PARTS_ID=xxx
COLLECTION_REPAIRED_PARTS_ID=xxx
COLLECTION_VEHICLES_ID=xxx
COLLECTION_GROUPS_ID=xxx
```

### Estructura del PDF

```
┌─────────────────────────────────────────────────────────────┐
│ [LOGO]          REPORTE DE SERVICIO           Folio: #001  │
│ Empresa XYZ                                    Fecha: ...   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ INFORMACIÓN DEL VEHÍCULO                                    │
│ ────────────────────────────────────────────────────────── │
│ Marca: Toyota    Modelo: Corolla    Año: 2022              │
│ Placas: ABC-123  No. Económico: V001  Km: 45,000           │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ DATOS DEL SERVICIO                                          │
│ ────────────────────────────────────────────────────────── │
│ Tipo: Mantenimiento Preventivo                              │
│ Fecha: 15/01/2024                                          │
│ Taller: AutoService Pro                                     │
│ Dirección: Av. Principal #123                               │
│ Factura: FAC-2024-001                                       │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ REFACCIONES UTILIZADAS                                      │
│ ┌──────────────────┬──────┬──────────┬──────────┐          │
│ │ Descripción      │ Cant │ P.Unit   │ Subtotal │          │
│ ├──────────────────┼──────┼──────────┼──────────┤          │
│ │ Filtro de aceite │   1  │ $150.00  │ $150.00  │          │
│ │ Aceite 5W-30     │   4  │ $250.00  │ $1000.00 │          │
│ │ Bujías NGK       │   4  │ $89.00   │ $356.00  │          │
│ └──────────────────┴──────┴──────────┴──────────┘          │
│                                     Subtotal: $1,506.00     │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ RESUMEN DE COSTOS                                           │
│ ────────────────────────────────────────────────────────── │
│ Mano de Obra:                                    $500.00    │
│ Refacciones:                                   $1,506.00    │
│ ─────────────────────────────────────────────────────────  │
│ TOTAL:                                         $2,006.00    │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ OBSERVACIONES                                               │
│ ────────────────────────────────────────────────────────── │
│ Se realizó cambio de aceite y filtros. Se recomienda        │
│ próximo servicio a los 50,000 km o en 6 meses.             │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ PRÓXIMO SERVICIO                                            │
│ Fecha sugerida: 15/07/2024  |  Kilometraje: 50,000 km      │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ ________________________    ________________________        │
│ Firma Responsable           Firma Cliente                   │
│                                                             │
│ Generado: 15/01/2024 14:30  |  Por: Juan Pérez             │
└─────────────────────────────────────────────────────────────┘
```

---

## 📋 Tasks Detallados

### FASE 1: Preparación Base de Datos (Día 1)

- [ ] **Task 1.1**: Agregar campos faltantes a `service_histories` en Appwrite Console
- [ ] **Task 1.2**: Agregar campos faltantes a `repair_reports` en Appwrite Console
- [ ] **Task 1.3**: Agregar nuevos índices necesarios
- [ ] **Task 1.4**: Actualizar `env.js` con nuevas variables de entorno (si aplica)

### FASE 2: Estructura Frontend (Día 1-2)

- [ ] **Task 2.1**: Crear estructura de carpetas en `features/reports/`
- [ ] **Task 2.2**: Crear `report.constants.js` con enums y constantes
- [ ] **Task 2.3**: Crear servicios base (`service-reports.service.js`, `repair-reports.service.js`)
- [ ] **Task 2.4**: Crear hooks React Query (`useServiceReports.js`, `useRepairReports.js`)
- [ ] **Task 2.5**: Actualizar rutas en `AppRouter.jsx`

### FASE 3: Componentes Compartidos (Día 2-3)

- [ ] **Task 3.1**: Crear `ReportStatusBadge.jsx`
- [ ] **Task 3.2**: Crear `PartsTable.jsx` y `PartsTableRow.jsx`
- [ ] **Task 3.3**: Crear `VehicleInfoCard.jsx`
- [ ] **Task 3.4**: Crear `ReportSummary.jsx` (resumen de costos)
- [ ] **Task 3.5**: Crear `ReportFilesSection.jsx`
- [ ] **Task 3.6**: Crear `ReportCard.jsx` (preview en lista)

### FASE 4: Reportes de Servicio (Día 3-4)

- [ ] **Task 4.1**: Crear `ServiceReportForm.jsx` (formulario completo)
- [ ] **Task 4.2**: Crear `ServiceReportView.jsx` (vista solo lectura)
- [ ] **Task 4.3**: Crear `ServiceReportsList.jsx`
- [ ] **Task 4.4**: Crear páginas: Create, Edit, View
- [ ] **Task 4.5**: Implementar validaciones con Zod
- [ ] **Task 4.6**: Integrar con permisos RBAC

### FASE 5: Reportes de Reparación (Día 4-5)

- [ ] **Task 5.1**: Crear `RepairReportForm.jsx` (formulario completo)
- [ ] **Task 5.2**: Crear `RepairReportView.jsx` (vista solo lectura)
- [ ] **Task 5.3**: Crear `RepairReportsList.jsx`
- [ ] **Task 5.4**: Crear páginas: Create, Edit, View
- [ ] **Task 5.5**: Implementar validaciones con Zod
- [ ] **Task 5.6**: Integrar con permisos RBAC

### FASE 6: Sistema de Finalización (Día 5)

- [ ] **Task 6.1**: Implementar lógica de estado DRAFT/FINALIZED
- [ ] **Task 6.2**: Crear modal de confirmación para finalizar
- [ ] **Task 6.3**: Bloquear edición cuando status = FINALIZED
- [ ] **Task 6.4**: Implementar permiso de re-apertura (admin)

### FASE 7: Generación de PDF - Functions (Día 6-7)

- [ ] **Task 7.1**: Crear bucket `company-assets` para logos
- [ ] **Task 7.2**: Crear Function `generate-service-report-pdf`
- [ ] **Task 7.3**: Crear Function `generate-repair-report-pdf`
- [ ] **Task 7.4**: Diseñar template PDF (jsPDF o PDFKit)
- [ ] **Task 7.5**: Implementar botón de descarga en frontend
- [ ] **Task 7.6**: Cachear PDFs generados en Storage

### FASE 8: Página Principal y Navegación (Día 7)

- [ ] **Task 8.1**: Rediseñar `ReportsPage.jsx` con tabs
- [ ] **Task 8.2**: Implementar filtros (por vehículo, fecha, estado)
- [ ] **Task 8.3**: Implementar búsqueda
- [ ] **Task 8.4**: Agregar exportación masiva (opcional)

### FASE 9: Testing y Pulido (Día 8)

- [ ] **Task 9.1**: Probar flujo completo de creación
- [ ] **Task 9.2**: Probar permisos RBAC con diferentes roles
- [ ] **Task 9.3**: Probar generación de PDF
- [ ] **Task 9.4**: Probar responsive en móvil
- [ ] **Task 9.5**: Revisar accesibilidad
- [ ] **Task 9.6**: Optimizar performance

---

## 🚀 Orden de Implementación Sugerido

1. **Empezar con Service Reports** (más simple, menos campos)
2. Una vez funcional, replicar para Repair Reports
3. Dejar PDF para el final (puede funcionar sin él inicialmente)

---

## 📦 Dependencias Adicionales

```bash
# Para generación de PDF en Function
npm install pdfkit  # o jspdf

# Ya deberían estar (validar):
npm install @tanstack/react-query zod react-hook-form @hookform/resolvers
npm install date-fns  # para formateo de fechas
npm install lucide-react  # iconos
npm install framer-motion  # animaciones
```

---

## ❓ Preguntas Pendientes

1. **¿Hay un diseño específico para el PDF?** ¿Colores corporativos?
2. **¿El logo va por grupo o es uno global?** (Recomiendo por grupo)
3. **¿Quieres preview del PDF antes de descargar?** (Se puede hacer con iframe)
4. **¿Hay firmas digitales requeridas?** (Campos para firma en el PDF)
5. **¿Exportación masiva a Excel/CSV?** (Adicional al PDF individual)

---

_Documento creado: Diciembre 2024_
_Última actualización: Diciembre 2024_
