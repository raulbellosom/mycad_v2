# ResourceNotFound Component

Componente para mostrar un mensaje elegante cuando un recurso no existe, no hay permisos, o hay un error al cargar.

## Uso

```jsx
import { ResourceNotFound } from "../../../shared/ui/ResourceNotFound";

// Recurso no encontrado
<ResourceNotFound
  resourceType="reporte de servicio"
  resourceId={reportId}
  reason="not-found"
  backPath="/reports"
  backLabel="Volver a Reportes"
/>

// Sin permisos
<ResourceNotFound
  resourceType="vehículo"
  resourceId={vehicleId}
  reason="no-permission"
  backPath="/vehicles"
  backLabel="Volver a Vehículos"
/>

// Error genérico
<ResourceNotFound
  resourceType="documento"
  resourceId={docId}
  reason="error"
  backPath="/documents"
  backLabel="Volver a Documentos"
/>

// Con mensajes personalizados
<ResourceNotFound
  resourceType="usuario"
  resourceId={userId}
  reason="not-found"
  customTitle="Usuario no disponible"
  customDescription="Este usuario ha sido desactivado o eliminado del sistema."
  backPath="/users"
  backLabel="Volver a Usuarios"
/>
```

## Props

| Prop                | Tipo                                      | Default     | Descripción                                 |
| ------------------- | ----------------------------------------- | ----------- | ------------------------------------------- |
| `resourceType`      | string                                    | "recurso"   | Tipo de recurso (ej: "reporte", "vehículo") |
| `resourceId`        | string                                    | -           | ID del recurso buscado (opcional)           |
| `reason`            | "not-found" \| "no-permission" \| "error" | "not-found" | Razón del error                             |
| `backPath`          | string                                    | -           | Ruta para el botón de regreso               |
| `backLabel`         | string                                    | "Volver"    | Etiqueta del botón de regreso               |
| `customTitle`       | string                                    | -           | Título personalizado                        |
| `customDescription` | string                                    | -           | Descripción personalizada                   |

## Tipos de Razón

### `not-found`

- **Icono**: FileQuestion (naranja)
- **Título**: "{resourceType} no encontrado"
- **Descripción**: "El {resourceType} que buscas no existe o fue eliminado."
- **Sugerencias**:
  - Verifica que el enlace sea correcto
  - El recurso pudo haber sido eliminado
  - Intenta buscarlo desde la lista principal

### `no-permission`

- **Icono**: Lock (rojo)
- **Título**: "Acceso denegado"
- **Descripción**: "No tienes permisos para acceder a este {resourceType}."
- **Sugerencias**:
  - Contacta al administrador del grupo
  - Verifica que tengas los permisos necesarios
  - Asegúrate de estar en el grupo correcto

### `error`

- **Icono**: AlertCircle (ámbar)
- **Título**: "Error al cargar"
- **Descripción**: "Hubo un problema al intentar cargar este {resourceType}."
- **Sugerencias**:
  - Verifica tu conexión a internet
  - Intenta recargar la página
  - Si el problema persiste, contacta a soporte

## Características

- ✨ **Animaciones suaves** con Framer Motion
- 🎨 **Íconos animados** con efecto de brillo pulsante
- 🎯 **Navegación inteligente**: Usa history.back() si no hay backPath
- 💡 **Sugerencias contextuales** según el tipo de error
- 📱 **Responsive** para móvil y desktop
- 🎭 **Tematización** automática con CSS variables

## Diferencias con NotFoundPage

| Aspecto      | ResourceNotFound                     | NotFoundPage                    |
| ------------ | ------------------------------------ | ------------------------------- |
| **Uso**      | Recurso específico no encontrado     | Ruta/URL no existe              |
| **Contexto** | Dentro de la aplicación              | Error de navegación             |
| **Casos**    | Reporte, vehículo, usuario no existe | /ruta-que-no-existe             |
| **Mensaje**  | Específico al tipo de recurso        | Genérico "Página no encontrada" |
| **ID**       | Muestra el ID del recurso buscado    | No aplica                       |

## Ejemplo Real

```jsx
// En ServiceReportViewPage.jsx
if (error || !report) {
  return (
    <PageLayout title="Error">
      <ResourceNotFound
        resourceType="reporte de servicio"
        resourceId={id}
        reason={
          error?.message?.includes("permission") ? "no-permission" : "not-found"
        }
        backPath="/reports"
        backLabel="Volver a Reportes"
      />
    </PageLayout>
  );
}
```

## Casos de Uso

Usa este componente cuando:

- ✅ Un registro específico no existe en la BD
- ✅ El usuario no tiene permisos para ver el recurso
- ✅ Hubo un error al cargar los datos
- ✅ El recurso fue eliminado o está deshabilitado

**NO** uses este componente para:

- ❌ Rutas que no existen (usa `NotFoundPage`)
- ❌ Listas vacías (usa `EmptyState`)
- ❌ Estados de carga (usa `LoadingScreen`)
