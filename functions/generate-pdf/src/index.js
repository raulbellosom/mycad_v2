import { getAppwriteClient, env } from "./_shared.js";
import {
  generateServiceReportPDF,
  generateRepairReportPDF,
} from "./pdfGenerator.js";
import { Query, ID } from "node-appwrite";
import axios from "axios";
import FormData from "form-data";

/**
 * Appwrite Function para generar PDFs profesionales de reportes
 *
 * Payload esperado:
 * {
 *   "reportType": "service" | "repair",
 *   "reportId": "string",
 *   "regenerate": boolean (opcional, default false)
 * }
 */
export default async ({ req, res, log, error }) => {
  try {
    const { databases, storage } = getAppwriteClient();

    // Parse request body
    let payload;
    try {
      payload = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    } catch (e) {
      throw new Error("Invalid JSON payload");
    }

    const { reportType, reportId, regenerate = false } = payload;

    // Validación
    if (!reportType || !["service", "repair"].includes(reportType)) {
      throw new Error(
        'reportType is required and must be "service" or "repair"'
      );
    }
    if (!reportId) {
      throw new Error("reportId is required");
    }

    log(`Generating PDF for ${reportType} report: ${reportId}`);

    // Obtener el reporte
    let report, vehicle, parts, group, groupLogo;

    if (reportType === "service") {
      report = await databases.getDocument(
        env.databaseId,
        env.collectionServiceHistoriesId,
        reportId
      );

      // Obtener perfiles de creador y finalizador
      if (report.createdByProfileId) {
        report.createdByProfile = await databases.getDocument(
          env.databaseId,
          env.collectionUsersProfileId,
          report.createdByProfileId
        );
      }
      if (report.finalizedByProfileId) {
        report.finalizedByProfile = await databases.getDocument(
          env.databaseId,
          env.collectionUsersProfileId,
          report.finalizedByProfileId
        );
      }

      // Obtener vehículo
      vehicle = await databases.getDocument(
        env.databaseId,
        env.collectionVehiclesId,
        report.vehicleId
      );

      // Obtener grupo
      group = await databases.getDocument(
        env.databaseId,
        env.collectionGroupsId,
        report.groupId
      );

      // Obtener logo del grupo si existe (service)
      if (group.logoFileId) {
        try {
          const endpoint =
            process.env.APPWRITE_ENDPOINT ||
            "https://appwrite.racoondevs.com/v1";
          const logoUrl = `${endpoint}/storage/buckets/${env.bucketGroupLogosId}/files/${group.logoFileId}/view?project=${process.env.APPWRITE_FUNCTION_PROJECT_ID}`;
          const logoResponse = await axios.get(logoUrl, {
            responseType: "arraybuffer",
            headers: {
              "X-Appwrite-Project": process.env.APPWRITE_FUNCTION_PROJECT_ID,
              "X-Appwrite-Key": process.env.APPWRITE_API_KEY,
            },
          });
          groupLogo = Buffer.from(logoResponse.data);
          log(`Group logo loaded: ${group.logoFileId}`);
        } catch (e) {
          log(`Warning: Could not load group logo: ${e.message}`);
          groupLogo = null;
        }
      }

      // Obtener tipo, marca y modelo del vehículo
      if (vehicle.typeId) {
        vehicle.type = await databases.getDocument(
          env.databaseId,
          env.collectionVehicleTypesId,
          vehicle.typeId
        );
      }
      if (vehicle.brandId) {
        vehicle.brand = await databases.getDocument(
          env.databaseId,
          env.collectionVehicleBrandsId,
          vehicle.brandId
        );
      }
      if (vehicle.modelId) {
        vehicle.model = await databases.getDocument(
          env.databaseId,
          env.collectionVehicleModelsId,
          vehicle.modelId
        );
      }

      // Obtener partes
      const partsResponse = await databases.listDocuments(
        env.databaseId,
        env.collectionReplacedPartsId,
        [
          Query.equal("serviceHistoryId", reportId),
          Query.equal("enabled", true),
        ]
      );
      parts = partsResponse.documents;
    } else {
      // repair
      report = await databases.getDocument(
        env.databaseId,
        env.collectionRepairReportsId,
        reportId
      );

      // Obtener perfiles de creador y finalizador
      if (report.createdByProfileId) {
        report.createdByProfile = await databases.getDocument(
          env.databaseId,
          env.collectionUsersProfileId,
          report.createdByProfileId
        );
      }
      if (report.finalizedByProfileId) {
        report.finalizedByProfile = await databases.getDocument(
          env.databaseId,
          env.collectionUsersProfileId,
          report.finalizedByProfileId
        );
      }

      vehicle = await databases.getDocument(
        env.databaseId,
        env.collectionVehiclesId,
        report.vehicleId
      );

      // Obtener grupo
      group = await databases.getDocument(
        env.databaseId,
        env.collectionGroupsId,
        report.groupId
      );

      // Obtener logo del grupo si existe (repair)
      if (group.logoFileId) {
        try {
          const endpoint =
            process.env.APPWRITE_ENDPOINT ||
            "https://appwrite.racoondevs.com/v1";
          const logoUrl = `${endpoint}/storage/buckets/${env.bucketGroupLogosId}/files/${group.logoFileId}/view?project=${process.env.APPWRITE_FUNCTION_PROJECT_ID}`;
          const logoResponse = await axios.get(logoUrl, {
            responseType: "arraybuffer",
            headers: {
              "X-Appwrite-Project": process.env.APPWRITE_FUNCTION_PROJECT_ID,
              "X-Appwrite-Key": process.env.APPWRITE_API_KEY,
            },
          });
          groupLogo = Buffer.from(logoResponse.data);
          log(`Group logo loaded: ${group.logoFileId}`);
        } catch (e) {
          log(`Warning: Could not load group logo: ${e.message}`);
          groupLogo = null;
        }
      }

      // Obtener tipo, marca y modelo del vehículo
      if (vehicle.typeId) {
        vehicle.type = await databases.getDocument(
          env.databaseId,
          env.collectionVehicleTypesId,
          vehicle.typeId
        );
      }
      if (vehicle.brandId) {
        vehicle.brand = await databases.getDocument(
          env.databaseId,
          env.collectionVehicleBrandsId,
          vehicle.brandId
        );
      }
      if (vehicle.modelId) {
        vehicle.model = await databases.getDocument(
          env.databaseId,
          env.collectionVehicleModelsId,
          vehicle.modelId
        );
      }

      const partsResponse = await databases.listDocuments(
        env.databaseId,
        env.collectionRepairedPartsId,
        [Query.equal("repairReportId", reportId), Query.equal("enabled", true)]
      );
      parts = partsResponse.documents;
    }

    // Si el reporte ya tiene un PDF y regenerate=false, retornar el existente
    if (report.reportFileId && !regenerate) {
      log(`PDF already exists: ${report.reportFileId}, skipping generation`);
      return res.json({
        success: true,
        message: "PDF already exists",
        fileId: report.reportFileId,
      });
    }

    // Si existe y regenerate=true, eliminar el anterior
    if (report.reportFileId && regenerate) {
      try {
        log(`Deleting old PDF: ${report.reportFileId}`);
        await storage.deleteFile(env.bucketReportFilesId, report.reportFileId);
      } catch (e) {
        error(`Failed to delete old PDF: ${e.message}`);
        // Continue anyway
      }
    }

    // Generar el PDF
    log("Generating PDF buffer...");
    const pdfBuffer =
      reportType === "service"
        ? await generateServiceReportPDF(
            report,
            vehicle,
            parts,
            group,
            groupLogo
          )
        : await generateRepairReportPDF(
            report,
            vehicle,
            parts,
            group,
            groupLogo
          );

    // Subir el PDF al bucket usando axios
    const fileName = `${reportType}_${reportId}_${Date.now()}.pdf`;
    const fileId = ID.unique();
    log(`Uploading PDF: ${fileName} with ID: ${fileId}`);

    // Crear FormData con el buffer del PDF
    const formData = new FormData();
    formData.append("fileId", fileId);
    formData.append("file", pdfBuffer, {
      filename: fileName,
      contentType: "application/pdf",
    });
    formData.append("permissions[]", 'read("any")');

    // Subir usando la API REST de Appwrite
    const endpoint =
      process.env.APPWRITE_ENDPOINT || "https://appwrite.racoondevs.com/v1";
    const uploadUrl = `${endpoint}/storage/buckets/${env.bucketReportFilesId}/files`;

    const uploadResponse = await axios.post(uploadUrl, formData, {
      headers: {
        ...formData.getHeaders(),
        "X-Appwrite-Project": process.env.APPWRITE_FUNCTION_PROJECT_ID,
        "X-Appwrite-Key": process.env.APPWRITE_API_KEY,
      },
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
    });

    const file = uploadResponse.data;
    log(`PDF uploaded successfully: ${file.$id}`);

    // Actualizar el reporte con el ID del archivo
    const collectionId =
      reportType === "service"
        ? env.collectionServiceHistoriesId
        : env.collectionRepairReportsId;

    await databases.updateDocument(env.databaseId, collectionId, reportId, {
      reportFileId: file.$id,
    });

    log("Report updated with PDF file ID");

    return res.json({
      success: true,
      message: "PDF generated successfully",
      fileId: file.$id,
      fileName: fileName,
    });
  } catch (err) {
    error(`Error generating PDF: ${err.message}`);
    error(err.stack);

    return res.json(
      {
        success: false,
        error: err.message,
      },
      500
    );
  }
};
