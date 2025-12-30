import PDFDocument from "pdfkit";
import { Readable } from "stream";

// Colores corporativos profesionales - Paleta Naranja MyCAD
const COLORS = {
  primary: "#f97316", // Naranja corporativo (brand-500)
  primaryDark: "#ea580c", // Naranja oscuro (brand-600)
  primaryLight: "#fb923c", // Naranja claro (brand-400)
  secondary: "#78716c", // Gris stone
  accent: "#10b981", // Verde para estados positivos
  text: "#0f172a", // Negro texto (slate-900)
  textLight: "#57534e", // Gris texto (stone-600)
  border: "#e7e5e4", // Borde stone-200
  background: "#fafaf9", // Fondo stone-50
  white: "#ffffff",
};

/**
 * Genera un PDF profesional para reporte de servicio
 */
export async function generateServiceReportPDF(
  report,
  vehicle,
  parts = [],
  group = null,
  groupLogo = null
) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    const doc = new PDFDocument({
      size: "LETTER",
      margins: { top: 50, bottom: 50, left: 50, right: 50 },
      info: {
        Title: `Reporte de Servicio - ${report.title}`,
        Author: "MyCAD Admin",
        Subject: "Reporte de Servicio de Vehículo",
        Creator: "MyCAD System",
      },
    });

    // Capturar chunks del PDF
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    // Header con logo y título
    drawHeader(doc, "REPORTE DE SERVICIO", group, groupLogo);

    // Badge de status en el header
    drawStatusBadge(
      doc,
      report.status,
      report.finalizedAt,
      doc.page.width - 140,
      25
    );

    // Información del reporte
    let yPosition = 90;

    // Título del reporte
    doc
      .fontSize(18)
      .fillColor(COLORS.text)
      .font("Helvetica-Bold")
      .text(report.title || "Sin título", 50, yPosition);

    yPosition += 25;

    // Información del vehículo en un recuadro
    yPosition = drawVehicleInfo(doc, vehicle, yPosition);
    yPosition += 15;

    // Detalles del servicio
    yPosition = drawServiceDetails(doc, report, yPosition);
    yPosition += 15;

    // Partes reemplazadas
    if (parts && parts.length > 0) {
      yPosition = drawPartsTable(
        doc,
        parts,
        yPosition,
        "Refacciones Reemplazadas"
      );
      yPosition += 15;
    }

    // Costos
    yPosition = drawCostsSummary(doc, report, parts, yPosition);
    yPosition += 15;

    // Información de creación y finalización
    drawAuditInfo(doc, report, yPosition);

    // Footer
    drawFooter(doc);

    doc.end();
  });
}

/**
 * Genera un PDF profesional para reporte de reparación
 */
export async function generateRepairReportPDF(
  report,
  vehicle,
  parts = [],
  group = null,
  groupLogo = null
) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    const doc = new PDFDocument({
      size: "LETTER",
      margins: { top: 50, bottom: 50, left: 50, right: 50 },
      info: {
        Title: `Reporte de Reparación - ${report.title}`,
        Author: "MyCAD Admin",
        Subject: "Reporte de Reparación de Vehículo",
        Creator: "MyCAD System",
      },
    });

    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    // Header
    drawHeader(doc, "REPORTE DE REPARACIÓN", group, groupLogo);

    // Badge de status en el header
    drawStatusBadge(
      doc,
      report.status,
      report.finalizedAt,
      doc.page.width - 140,
      25
    );

    let yPosition = 90;

    // Título
    doc
      .fontSize(18)
      .fillColor(COLORS.text)
      .font("Helvetica-Bold")
      .text(report.title || "Sin título", 50, yPosition);

    yPosition += 25;

    // Vehículo
    yPosition = drawVehicleInfo(doc, vehicle, yPosition);
    yPosition += 15;

    // Detalles de la reparación
    yPosition = drawRepairDetails(doc, report, yPosition);
    yPosition += 15;

    // Partes reparadas
    if (parts && parts.length > 0) {
      yPosition = drawPartsTable(doc, parts, yPosition, "Partes Reparadas");
      yPosition += 15;
    }

    // Costos
    yPosition = drawRepairCostsSummary(doc, report, parts, yPosition);
    yPosition += 15;

    // Audit info
    drawAuditInfo(doc, report, yPosition);

    // Footer
    drawFooter(doc);

    doc.end();
  });
}

/**
 * Dibuja el header del documento
 */
function drawHeader(doc, title, group = null, groupLogo = null) {
  // Rectángulo de fondo para el header (reducido de 100 a 70)
  doc.rect(0, 0, doc.page.width, 70).fillColor(COLORS.primary).fill();

  // Logo del grupo si existe
  if (groupLogo) {
    try {
      doc.image(groupLogo, 50, 15, { height: 40, fit: [60, 40] });
      // Nombre de la app al lado del logo
      doc
        .fontSize(14)
        .fillColor(COLORS.white)
        .font("Helvetica-Bold")
        .text("MyCAD", 120, 20);
    } catch (e) {
      // Si falla, mostrar nombre de la app
      doc
        .fontSize(16)
        .fillColor(COLORS.white)
        .font("Helvetica-Bold")
        .text("MyCAD", 50, 20);
    }
  } else {
    // Nombre de la app siempre visible
    doc
      .fontSize(16)
      .fillColor(COLORS.white)
      .font("Helvetica-Bold")
      .text("MyCAD", 50, 20);
  }

  // Subtítulo
  doc
    .fontSize(9)
    .fillColor(COLORS.white)
    .font("Helvetica")
    .text(title, groupLogo ? 120 : 50, groupLogo ? 42 : 45);

  // Fecha de generación (derecha)
  const now = new Date().toLocaleDateString("es-MX", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  doc
    .fontSize(8)
    .fillColor(COLORS.white)
    .text(`Generado: ${now}`, doc.page.width - 200, 45, {
      width: 150,
      align: "right",
    });
}

/**
 * Dibuja un badge de status en el header
 */
function drawStatusBadge(doc, status, finalizedAt, x, y) {
  const isFinalized = !!finalizedAt;
  const badgeText = isFinalized ? "FINALIZADO" : "BORRADOR";
  const badgeColor = isFinalized ? COLORS.accent : COLORS.secondary;

  doc.roundedRect(x, y, 90, 20, 3).fillColor(badgeColor).fill();

  doc
    .fontSize(8)
    .fillColor(COLORS.white)
    .font("Helvetica-Bold")
    .text(badgeText, x + 12, y + 6);
}

/**
 * Dibuja la información del vehículo
 */
function drawVehicleInfo(doc, vehicle, yPosition) {
  // Título de sección
  doc
    .fontSize(12)
    .fillColor(COLORS.primary)
    .font("Helvetica-Bold")
    .text("INFORMACIÓN DEL VEHÍCULO", 50, yPosition);

  yPosition += 20;

  // Recuadro - altura ajustada para más contenido
  doc
    .roundedRect(50, yPosition, doc.page.width - 100, 90, 5)
    .fillColor(COLORS.background)
    .fill()
    .strokeColor(COLORS.border)
    .stroke();

  yPosition += 12;

  // Datos del vehículo en dos columnas con mejor espaciado
  const col1X = 70;
  const col2X = 320;
  const labelWidth = 90;
  const lineHeight = 16;

  doc.fontSize(9).fillColor(COLORS.text).font("Helvetica");

  // Columna 1
  let currentY = yPosition;

  // Tipo
  doc
    .font("Helvetica-Bold")
    .text("Tipo:", col1X, currentY, { width: labelWidth });
  doc
    .font("Helvetica")
    .text(vehicle.type?.name || "-", col1X + labelWidth, currentY, {
      width: 150,
    });

  // Marca/Modelo
  currentY += lineHeight;
  doc
    .font("Helvetica-Bold")
    .text("Marca/Modelo:", col1X, currentY, { width: labelWidth });
  const brandModel = `${vehicle.brand?.name || "-"} ${
    vehicle.model?.name || "-"
  }`;
  doc
    .font("Helvetica")
    .text(brandModel, col1X + labelWidth, currentY, { width: 150 });

  // Placas
  currentY += lineHeight;
  doc
    .font("Helvetica-Bold")
    .text("Placas:", col1X, currentY, { width: labelWidth });
  doc
    .font("Helvetica")
    .text(vehicle.plate || "-", col1X + labelWidth, currentY, { width: 150 });

  // Año
  currentY += lineHeight;
  doc
    .font("Helvetica-Bold")
    .text("Año:", col1X, currentY, { width: labelWidth });
  doc
    .font("Helvetica")
    .text(vehicle.model?.year || "-", col1X + labelWidth, currentY, {
      width: 150,
    });

  // Columna 2
  currentY = yPosition;

  // N° Económico
  doc
    .font("Helvetica-Bold")
    .text("N° Económico:", col2X, currentY, { width: labelWidth });
  doc
    .font("Helvetica")
    .text(vehicle.economicNumber || "-", col2X + labelWidth, currentY, {
      width: 120,
    });

  // Serial/VIN
  currentY += lineHeight;
  doc
    .font("Helvetica-Bold")
    .text("Serial/VIN:", col2X, currentY, { width: labelWidth });
  doc
    .font("Helvetica")
    .text(vehicle.serialNumber || "-", col2X + labelWidth, currentY, {
      width: 120,
    });

  // Color
  currentY += lineHeight;
  doc
    .font("Helvetica-Bold")
    .text("Color:", col2X, currentY, { width: labelWidth });
  doc
    .font("Helvetica")
    .text(vehicle.color || "-", col2X + labelWidth, currentY, { width: 120 });

  return yPosition + 95;
}

/**
 * Dibuja detalles del servicio
 */
function drawServiceDetails(doc, report, yPosition) {
  doc
    .fontSize(12)
    .fillColor(COLORS.primary)
    .font("Helvetica-Bold")
    .text("DETALLES DEL SERVICIO", 50, yPosition);

  yPosition += 18;

  const col1X = 70;
  const col2X = 320;

  doc.fontSize(9).fillColor(COLORS.text).font("Helvetica");

  // Fecha de servicio
  doc.font("Helvetica-Bold").text("Fecha de Servicio:", col1X, yPosition);
  doc
    .font("Helvetica")
    .text(formatDate(report.serviceDate) || "-", col1X + 100, yPosition);

  // Tipo de servicio
  doc.font("Helvetica-Bold").text("Tipo de Servicio:", col2X, yPosition);
  doc.font("Helvetica").text(report.serviceType || "-", col2X + 100, yPosition);

  yPosition += 15;

  // Odómetro
  if (report.odometer) {
    doc.font("Helvetica-Bold").text("Odómetro:", col1X, yPosition);
    doc
      .font("Helvetica")
      .text(
        `${Number(report.odometer).toLocaleString()} km`,
        col1X + 100,
        yPosition
      );
  }

  // Taller
  if (report.vendorName) {
    doc.font("Helvetica-Bold").text("Taller:", col2X, yPosition);
    doc.font("Helvetica").text(report.vendorName, col2X + 100, yPosition);
  }

  yPosition += 15;

  // Dirección del taller (ocupa ambas columnas si es necesario)
  if (report.workshopAddress) {
    doc.font("Helvetica-Bold").text("Dirección:", col1X, yPosition);
    doc.font("Helvetica").text(report.workshopAddress, col1X + 100, yPosition, {
      width: doc.page.width - 170,
      lineGap: 2,
    });
    const addressLines = Math.ceil(report.workshopAddress.length / 65);
    if (addressLines > 1) {
      yPosition += (addressLines - 1) * 12;
    }
  }

  // Teléfono (solo si hay espacio o en nueva línea)
  if (report.workshopPhone) {
    yPosition += 15;
    doc.font("Helvetica-Bold").text("Teléfono:", col1X, yPosition);
    doc.font("Helvetica").text(report.workshopPhone, col1X + 100, yPosition);
  }

  yPosition += 15;

  // Descripción
  if (report.description) {
    doc.font("Helvetica-Bold").text("Descripción:", col1X, yPosition);
    yPosition += 12;
    doc
      .font("Helvetica")
      .fontSize(8)
      .text(report.description, col1X, yPosition, {
        width: doc.page.width - 140,
        align: "justify",
      });
    yPosition += Math.ceil(report.description.length / 80) * 10 + 10;
  }

  return yPosition;
}

/**
 * Dibuja detalles de reparación
 */
function drawRepairDetails(doc, report, yPosition) {
  doc
    .fontSize(12)
    .fillColor(COLORS.primary)
    .font("Helvetica-Bold")
    .text("DETALLES DE LA REPARACIÓN", 50, yPosition);

  yPosition += 20;

  const col1X = 70;
  const col2X = 320;

  doc.fontSize(9).fillColor(COLORS.text).font("Helvetica");

  // Fecha
  doc.font("Helvetica-Bold").text("Fecha de Reporte:", col1X, yPosition);
  doc
    .font("Helvetica")
    .text(formatDate(report.reportDate) || "-", col1X + 110, yPosition);

  // Tipo de daño
  if (report.damageType) {
    doc.font("Helvetica-Bold").text("Tipo de Daño:", col2X, yPosition);
    doc.font("Helvetica").text(report.damageType, col2X + 100, yPosition);
  }

  yPosition += 15;

  // Taller
  if (report.workshopName) {
    doc.font("Helvetica-Bold").text("Taller:", col1X, yPosition);
    doc.font("Helvetica").text(report.workshopName, col1X + 110, yPosition);
  }

  yPosition += 20;

  // Descripción del daño
  if (report.damageDescription) {
    doc.font("Helvetica-Bold").text("Descripción del Daño:", col1X, yPosition);
    yPosition += 12;
    doc
      .font("Helvetica")
      .fontSize(8)
      .text(report.damageDescription, col1X, yPosition, {
        width: doc.page.width - 140,
        align: "justify",
      });
    yPosition += Math.ceil(report.damageDescription.length / 80) * 10 + 10;
  }

  return yPosition;
}

/**
 * Dibuja tabla de partes
 */
function drawPartsTable(doc, parts, yPosition, title) {
  doc
    .fontSize(12)
    .fillColor(COLORS.primary)
    .font("Helvetica-Bold")
    .text(title, 50, yPosition);

  yPosition += 18;

  // Header de la tabla
  const tableTop = yPosition;
  const colWidths = {
    name: 250,
    qty: 70,
    unit: 90,
    total: 90,
  };

  doc
    .rect(50, tableTop, doc.page.width - 100, 20)
    .fillColor(COLORS.primary)
    .fill();

  doc.fontSize(9).fillColor(COLORS.white).font("Helvetica-Bold");
  doc.text("Descripción", 60, tableTop + 6);
  doc.text("Cant.", 310, tableTop + 6, {
    width: colWidths.qty,
    align: "center",
  });
  doc.text("P. Unit.", 380, tableTop + 6, {
    width: colWidths.unit,
    align: "right",
  });
  doc.text("Total", 470, tableTop + 6, {
    width: colWidths.total,
    align: "right",
  });

  yPosition = tableTop + 20;

  // Rows
  doc.fillColor(COLORS.text).font("Helvetica");
  parts.forEach((part, index) => {
    const rowBg = index % 2 === 0 ? COLORS.white : COLORS.background;
    doc
      .rect(50, yPosition, doc.page.width - 100, 18)
      .fillColor(rowBg)
      .fill();

    doc.fontSize(8).fillColor(COLORS.text);
    doc.text(part.name || "-", 60, yPosition + 5, { width: 240 });
    doc.text(part.quantity || 0, 310, yPosition + 5, {
      width: colWidths.qty,
      align: "center",
    });
    doc.text(`$${(part.unitCost || 0).toFixed(2)}`, 380, yPosition + 5, {
      width: colWidths.unit,
      align: "right",
    });
    const subtotal = (part.quantity || 0) * (part.unitCost || 0);
    doc.text(`$${subtotal.toFixed(2)}`, 470, yPosition + 5, {
      width: colWidths.total,
      align: "right",
    });

    yPosition += 18;
  });

  // Border de la tabla
  doc
    .rect(50, tableTop, doc.page.width - 100, yPosition - tableTop)
    .strokeColor(COLORS.border)
    .stroke();

  return yPosition;
}

/**
 * Dibuja resumen de costos para servicio
 */
function drawCostsSummary(doc, report, parts, yPosition) {
  const laborCost = parseFloat(report.laborCost) || 0;
  const partsCost = parts.reduce(
    (sum, p) => sum + (p.quantity || 0) * (p.unitCost || 0),
    0
  );
  const totalCost = laborCost + partsCost;

  doc
    .fontSize(12)
    .fillColor(COLORS.primary)
    .font("Helvetica-Bold")
    .text("RESUMEN DE COSTOS", 50, yPosition);

  yPosition += 25;

  const labelX = doc.page.width - 300;
  const valueX = doc.page.width - 150;

  doc.fontSize(10).fillColor(COLORS.text).font("Helvetica");

  doc.text("Mano de Obra:", labelX, yPosition);
  doc.text(`$${laborCost.toFixed(2)}`, valueX, yPosition, {
    align: "right",
    width: 120,
  });

  yPosition += 15;
  doc.text("Refacciones:", labelX, yPosition);
  doc.text(`$${partsCost.toFixed(2)}`, valueX, yPosition, {
    align: "right",
    width: 120,
  });

  yPosition += 20;

  // Total
  doc
    .fontSize(12)
    .font("Helvetica-Bold")
    .fillColor(COLORS.primary)
    .text("TOTAL:", labelX, yPosition);
  doc.text(`$${totalCost.toFixed(2)}`, valueX, yPosition, {
    align: "right",
    width: 120,
  });

  return yPosition;
}

/**
 * Dibuja resumen de costos para reparación
 */
function drawRepairCostsSummary(doc, report, parts, yPosition) {
  const laborCost = parseFloat(report.laborCost) || 0;
  const partsCost = parseFloat(report.partsCost) || 0;
  const finalCost = parseFloat(report.finalCost) || laborCost + partsCost;

  doc
    .fontSize(12)
    .fillColor(COLORS.primary)
    .font("Helvetica-Bold")
    .text("RESUMEN DE COSTOS", 50, yPosition);

  yPosition += 20;

  const labelX = doc.page.width - 300;
  const valueX = doc.page.width - 150;

  doc.fontSize(10).fillColor(COLORS.text).font("Helvetica");

  doc.text("Mano de Obra:", labelX, yPosition);
  doc.text(`$${laborCost.toFixed(2)}`, valueX, yPosition, {
    align: "right",
    width: 120,
  });

  yPosition += 15;
  doc.text("Partes:", labelX, yPosition);
  doc.text(`$${partsCost.toFixed(2)}`, valueX, yPosition, {
    align: "right",
    width: 120,
  });

  yPosition += 20;

  doc
    .fontSize(12)
    .font("Helvetica-Bold")
    .fillColor(COLORS.primary)
    .text("TOTAL:", labelX, yPosition);
  doc.text(`$${finalCost.toFixed(2)}`, valueX, yPosition, {
    align: "right",
    width: 120,
  });

  return yPosition;
}

/**
 * Dibuja información de auditoría (creado por, finalizado por)
 */
function drawAuditInfo(doc, report, yPosition) {
  doc.fontSize(8).fillColor(COLORS.textLight).font("Helvetica");

  const createdBy = report.createdByProfile
    ? `${report.createdByProfile.firstName || ""} ${
        report.createdByProfile.lastName || ""
      }`.trim()
    : "Sistema";

  doc.text(
    `Creado por: ${createdBy} - ${formatDate(report.$createdAt)}`,
    50,
    yPosition
  );

  if (report.finalizedAt && report.finalizedByProfile) {
    const finalizedBy = `${report.finalizedByProfile.firstName || ""} ${
      report.finalizedByProfile.lastName || ""
    }`.trim();
    yPosition += 12;
    doc.text(
      `Finalizado por: ${finalizedBy} - ${formatDate(report.finalizedAt)}`,
      50,
      yPosition
    );
  }
}

/**
 * Dibuja el footer del documento
 */
function drawFooter(doc) {
  const footerY = doc.page.height - 40;

  doc
    .fontSize(8)
    .fillColor(COLORS.textLight)
    .font("Helvetica")
    .text("MyCAD Admin - Sistema de Gestión de Vehículos", 50, footerY, {
      align: "center",
      width: doc.page.width - 100,
    });
}

/**
 * Formatea una fecha
 */
function formatDate(dateStr) {
  if (!dateStr) return "-";
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString("es-MX", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return dateStr;
  }
}
