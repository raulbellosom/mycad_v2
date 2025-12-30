# Guía de Diseño - Email Templates MyCAD

## 🎨 Filosofía de Diseño

Los emails de MyCAD siguen principios de diseño moderno y profesional:

### Principios Clave

1. **Claridad** - Mensajes directos y fáciles de entender
2. **Profesionalismo** - Diseño corporativo de alta calidad
3. **Accesibilidad** - Compatible con todos los dispositivos y clientes
4. **Marca Consistente** - Colores y elementos de MyCAD en cada email

## 🎨 Sistema de Colores

### Colores Primarios

```css
Naranja Principal:    #f97316  /* Marca MyCAD */
Naranja Oscuro:       #ea580c  /* Hover y gradientes */
Naranja Claro:        #fdba74  /* Acentos sutiles */
```

### Colores Neutrales

```css
Fondo:               #f9fafb  /* Gray 50 - Limpio y profesional */
Contenedor:          #ffffff  /* Blanco puro */
Borde:               #e5e7eb  /* Gray 200 */
Borde Oscuro:        #d1d5db  /* Gray 300 */
```

### Colores de Texto

```css
Texto Principal:     #111827  /* Gray 900 - Alto contraste */
Texto Secundario:    #6b7280  /* Gray 500 - Información adicional */
Texto Muted:         #9ca3af  /* Gray 400 - Texto secundario */
```

### Colores de Estado

```css
Éxito:              #10b981  /* Green 500 - Confirmaciones */
Advertencia:        #f59e0b  /* Amber 500 - Alertas */
```

## 📐 Espaciado y Tipografía

### Espaciado

- **Padding Container**: 40px horizontal, 32-40px vertical
- **Máximo Ancho**: 600px (estándar para emails)
- **Border Radius**: 12px (contenedor), 8-10px (botones), 50% (círculos)

### Tipografía

- **Font Family**: System fonts (`-apple-system, BlinkMacSystemFont, 'Segoe UI'`)
- **Título Principal (h1)**: 28px, peso 800
- **Título Sección (h2)**: 26px, peso 700
- **Texto Cuerpo**: 16px, line-height 1.7
- **Texto Pequeño**: 12-13px para notas y footer

## 🔲 Componentes

### 1. Header con Logo

```
┌─────────────────────────────────┐
│   Gradiente Naranja (Primario)  │
│  ┌───────────────────────────┐  │
│  │ [🚗] MyCAD                │  │ ← Logo en tarjeta blanca
│  └───────────────────────────┘  │
└─────────────────────────────────┘
```

**Características:**

- Gradiente naranja (135deg)
- Logo en tarjeta blanca elevada
- Emoji/ícono de vehículo
- Sombra sutil

### 2. Título de Sección

```
┌─────────────────────────────────┐
│                                 │
│    Título Principal Grande      │
│    Subtítulo opcional           │
│                                 │
└─────────────────────────────────┘
```

**Características:**

- Centrado
- Color de texto principal (#111827)
- Subtítulo en color secundario

### 3. Ícono Circular

```
    ┌─────────┐
    │         │
    │   🔔    │  ← Emoji o ícono
    │         │
    └─────────┘
```

**Especificaciones:**

- Tamaño: 80x80px
- Fondo: Gradiente del color temático con opacidad (15% - 30%)
- Borde: 3px sólido del color temático
- Border radius: 50%

**Variantes de color por tipo:**

- **Verificación**: Naranja (#f97316) - Sobre ✉️
- **Password Reset**: Ámbar (#f59e0b) - Llave 🔑
- **Reporte**: Verde (#10b981) - Gráfica 📊
- **Notificación**: Naranja (#f97316) - Campana 🔔

### 4. Botón de Acción (CTA)

```
┌─────────────────────────────────┐
│  Gradiente con Sombra Elevada   │
│  ┌───────────────────────────┐  │
│  │  Texto del Botón  →       │  │
│  └───────────────────────────┘  │
└─────────────────────────────────┘
```

**Especificaciones:**

- Gradiente: Naranja (#f97316) a Naranja Oscuro (#ea580c)
- Padding: 16px vertical, 48px horizontal
- Border radius: 10px
- Box shadow: Sombra naranja con opacidad
- Texto: Blanco, peso 700, tamaño 16px
- Ícono: Emoji o flecha al final del texto

### 5. Tarjetas de Información

```
┌─────────────────────────────────┐
│ Borde Lateral de Color          │
│                                 │
│ 🔒 Título en Negrita            │
│ Texto descriptivo...            │
│                                 │
└─────────────────────────────────┘
```

**Tipos:**

**Tarjeta de Seguridad** (Gris/Naranja)

- Fondo: #f3f4f6
- Borde izquierdo: 4px #f97316
- Ícono: 🔒

**Tarjeta de Advertencia** (Amarillo)

- Fondo: #fef3c7
- Borde izquierdo: 4px #f59e0b
- Ícono: ⏱️

**Tarjeta de Archivo** (Gradiente Gris)

- Fondo: Gradiente de #f3f4f6 a #f9fafb
- Borde: 2px #e5e7eb
- Border radius: 12px

### 6. Footer

```
┌─────────────────────────────────┐
│  MyCAD - Gestión de Vehículos   │
│  Sistema profesional de...      │
│                                 │
│  ─────────────────────────────  │
│                                 │
│  © 2025 MyCAD. Todos los...    │
│  Este es un correo automático  │
└─────────────────────────────────┘
```

**Características:**

- Fondo: #f3f4f6 (Gray 100)
- Borde superior: 1px #e5e7eb
- Texto centrado
- Jerarquía visual clara

## 📱 Responsive Design

### Breakpoints

- **Desktop**: 600px (ancho máximo)
- **Mobile**: 100% width con padding 20px

### Adaptaciones Móviles

- Padding reducido: 20px en lugar de 40px
- Font sizes relativos
- Botones de ancho completo en mobile
- Stack vertical automático

## ✉️ Compatibilidad

### Clientes de Email Soportados

✅ Gmail (Web, iOS, Android)
✅ Outlook (2016+, Web, Mobile)
✅ Apple Mail (macOS, iOS)
✅ Yahoo Mail
✅ Thunderbird
✅ ProtonMail

### Técnicas de Compatibilidad

- Tables para layout (no CSS Grid/Flexbox)
- Inline styles (no CSS externo)
- Fallbacks para gradientes
- Comentarios condicionales para Outlook (`<!--[if mso]>`)

## 🔧 Mejores Prácticas

### HTML

1. Usar tablas para layout
2. Estilos inline siempre
3. Atributos de accesibilidad (`role="presentation"`)
4. Alt text en imágenes

### CSS

1. No usar `!important` (excepto casos especiales)
2. Colores en hex (#ffffff), no rgba
3. Evitar shorthand (usar `padding-top`, no `padding`)
4. Fallbacks para propiedades modernas

### Contenido

1. Máximo 600px de ancho
2. Texto centrado para mejor lectura
3. Jerarquía visual clara (títulos → contenido → CTA)
4. CTAs únicos y claros (un botón principal)
5. Mensajes de seguridad cuando aplique

## 🎯 Ejemplos de Uso

### Email de Verificación

```
[Header Naranja con Logo]
[Título: "Verifica tu correo electrónico"]
[Ícono: Sobre naranja ✉️]
[Texto: Mensaje de bienvenida]
[Botón: "Verificar Correo ✓"]
[Tarjeta: Nota de seguridad]
[Footer]
```

### Email de Reset Password

```
[Header Naranja con Logo]
[Título: "Restablece tu contraseña"]
[Ícono: Llave amarilla 🔑]
[Texto: Explicación del proceso]
[Botón: "Restablecer Contraseña →"]
[Tarjeta: Advertencia de expiración]
[Footer]
```

### Email de Reporte

```
[Header Naranja con Logo]
[Título: "Tu Reporte está Listo"]
[Ícono: Gráfica verde 📊]
[Texto: Confirmación]
[Tarjeta: Información del archivo]
[Botón: "Descargar Reporte ⬇"]
[Footer]
```

## 🔄 Proceso de Actualización

Si necesitas agregar un nuevo tipo de email:

1. **Define el propósito** - ¿Qué acción debe tomar el usuario?
2. **Elige el ícono** - Emoji representativo del tipo
3. **Selecciona el color** - Usa el sistema de colores
4. **Crea el contenido** - Usa los componentes existentes
5. **Agrega traducciones** - En `_shared.js`
6. **Crea el template** - En `templates.js`
7. **Agrega el handler** - En `index.js`
8. **Documenta** - Actualiza README y esta guía

---

**Última actualización:** Diciembre 2025
**Versión:** 1.0.0
**Autor:** MyCAD Team
