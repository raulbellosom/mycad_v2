# Generate PDF Function

Appwrite Function para generar PDFs profesionales de reportes de servicio y reparación.

## Configuración

### Variables de Entorno

Copia `.env.example` a `.env` y configura:

```bash
APPWRITE_FUNCTION_PROJECT_ID=    # ID del proyecto
APPWRITE_API_KEY=                # API Key con permisos de lectura/escritura
APPWRITE_DATABASE_ID=            # ID de la base de datos
APPWRITE_BUCKET_REPORT_FILES_ID= # ID del bucket para PDFs
APPWRITE_COLLECTION_SERVICE_HISTORIES_ID=
APPWRITE_COLLECTION_REPAIR_REPORTS_ID=
APPWRITE_COLLECTION_REPLACED_PARTS_ID=
APPWRITE_COLLECTION_REPAIRED_PARTS_ID=
APPWRITE_COLLECTION_VEHICLES_ID=
```

### Instalación

```bash
npm install
```

## Uso

### Payload

La función espera un JSON con la siguiente estructura:

```json
{
  "reportType": "service",  // "service" o "repair"
  "reportId": "abc123",     // ID del reporte
  "regenerate": false       // (opcional) Regenerar si ya existe
}
```

### Desde el Frontend

```javascript
import { functions } from '@/shared/appwrite/client';

const execution = await functions.createExecution(
  env.fnGeneratePdfId,
  JSON.stringify({
    reportType: 'service',
    reportId: reportId,
    regenerate: false
  })
);
```

### Respuesta

```json
{
  "success": true,
  "message": "PDF generated successfully",
  "fileId": "xyz789",
  "fileName": "service_abc123_1234567890.pdf"
}
```

## Características

- **Diseño Profesional**: Sin emojis, colores corporativos sobrios
- **Logo**: Incluye el logo de MyCAD en el header
- **Información Completa**: Vehículo, servicios/reparaciones, partes, costos
- **Regeneración**: Permite regenerar PDFs eliminando versiones anteriores
- **Auditoría**: Incluye quién creó y finalizó el reporte

## Estructura del PDF

### Reporte de Servicio

1. Header con logo y fecha
2. Badge de estado (Finalizado/Borrador)
3. Título del reporte
4. Información del vehículo
5. Detalles del servicio
6. Tabla de refacciones
7. Resumen de costos
8. Información de auditoría
9. Footer corporativo

### Reporte de Reparación

Similar al de servicio pero con detalles específicos de reparación:
- Tipo de daño
- Descripción del daño
- Taller de reparación
- Partes reparadas

## Colores Corporativos

- **Primary**: #1a56db (Azul corporativo)
- **Secondary**: #6b7280 (Gris)
- **Accent**: #10b981 (Verde)
- **Text**: #111827 (Negro)
- **Background**: #f9fafb (Gris claro)
