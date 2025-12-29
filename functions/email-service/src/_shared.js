import { Client, Databases, Users, ID, Query } from "node-appwrite";
import nodemailer from "nodemailer";

/**
 * Get required environment variable or throw
 */
function must(key) {
  const v = process.env[key];
  if (!v) throw new Error(`Missing env var: ${key}`);
  return v;
}

/**
 * Get optional environment variable with default
 */
function optional(key, defaultValue = "") {
  return process.env[key] || defaultValue;
}

/**
 * Safely parse request body JSON
 */
function safeBodyJson(req) {
  try {
    const val = req?.bodyJson;
    if (!val) return {};
    if (typeof val === "object") return val;
    return {};
  } catch {
    return {};
  }
}

/**
 * Return JSON response
 */
function json(res, statusCode, body) {
  return res.json(body, statusCode);
}

/**
 * Create nodemailer transporter
 */
function createTransporter() {
  const secure = optional("SMTP_SECURE", "false") === "true";

  return nodemailer.createTransport({
    host: must("SMTP_HOST"),
    port: parseInt(optional("SMTP_PORT", "587"), 10),
    secure,
    auth: {
      user: must("SMTP_USER"),
      pass: must("SMTP_PASS"),
    },
  });
}

/**
 * Translations for email content
 */
const translations = {
  es: {
    verification: {
      subject: "Verifica tu correo - MyCAD",
      title: "Verifica tu correo electrónico",
      welcome: "¡Bienvenido a MyCAD",
      content:
        "Gracias por registrarte. Por favor verifica tu dirección de correo electrónico para obtener acceso completo a todas las funciones.",
      button: "Verificar Correo",
    },
    passwordReset: {
      subject: "Restablece tu contraseña - MyCAD",
      title: "Restablece tu contraseña",
      greeting: "Hola",
      content:
        "Recibimos una solicitud para restablecer tu contraseña. Si no realizaste esta solicitud, puedes ignorar este correo.",
      button: "Restablecer Contraseña",
      expiry: "Este enlace expirará en 1 hora.",
    },
    report: {
      subject: "Tu Reporte - MyCAD",
      title: "Tu Reporte está Listo",
      greeting: "Hola",
      content:
        "Se ha generado el reporte que solicitaste. Puedes descargarlo usando el botón de abajo.",
      button: "Descargar Reporte",
    },
    notification: {
      subject: "Notificación - MyCAD",
      greeting: "Hola",
    },
    footer: {
      copyright: "Todos los derechos reservados.",
      automated:
        "Este es un correo automático, por favor no respondas a este mensaje.",
    },
  },
  en: {
    verification: {
      subject: "Verify your email - MyCAD",
      title: "Verify your email address",
      welcome: "Welcome to MyCAD",
      content:
        "Thank you for signing up. Please verify your email address to get full access to all features.",
      button: "Verify Email",
    },
    passwordReset: {
      subject: "Reset your password - MyCAD",
      title: "Reset your password",
      greeting: "Hi",
      content:
        "We received a request to reset your password. If you didn't make this request, you can safely ignore this email.",
      button: "Reset Password",
      expiry: "This link will expire in 1 hour.",
    },
    report: {
      subject: "Your Report - MyCAD",
      title: "Your Report is Ready",
      greeting: "Hi",
      content:
        "The report you requested has been generated. You can download it using the button below.",
      button: "Download Report",
    },
    notification: {
      subject: "Notification - MyCAD",
      greeting: "Hi",
    },
    footer: {
      copyright: "All rights reserved.",
      automated:
        "This is an automated email, please do not reply to this message.",
    },
  },
};

/**
 * Get translations for language
 */
function getTranslations(lang = "es") {
  return translations[lang] || translations.es;
}

export {
  must,
  optional,
  safeBodyJson,
  json,
  createTransporter,
  translations,
  getTranslations,
  Client,
  Databases,
  Users,
  ID,
  Query,
};
