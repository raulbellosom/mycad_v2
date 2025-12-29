import { functions } from "../appwrite/client";
import { env } from "../appwrite/env";
import { ExecutionMethod } from "appwrite";

/**
 * Email Service - Wrapper for email-service Appwrite Function
 *
 * Provides methods to send various types of emails through the
 * email-service function deployed in Appwrite.
 */

const FUNCTION_ID = env.fnEmailServiceId;

/**
 * Execute email service function
 * @param {Object} payload - The payload to send to the function
 * @returns {Promise<Object>} - The response from the function
 */
async function executeEmailFunction(payload) {
  if (!FUNCTION_ID) {
    throw new Error(
      "Email service function ID not configured (VITE_APPWRITE_FN_EMAIL_SERVICE_ID)"
    );
  }

  const execution = await functions.createExecution(
    FUNCTION_ID,
    JSON.stringify(payload),
    false, // async = false to wait for response
    "/", // path
    ExecutionMethod.POST // method
  );

  // Parse response
  let response;
  try {
    response = JSON.parse(execution.responseBody);
  } catch {
    throw new Error("Invalid response from email service");
  }

  if (!response.ok) {
    throw new Error(response.error || "Email service error");
  }

  return response;
}

/**
 * Send verification email
 * @param {Object} options
 * @param {string} options.email - Recipient email
 * @param {string} [options.name] - Recipient name
 * @param {string} options.verificationLink - Verification URL
 * @param {string} [options.lang='es'] - Language (es/en)
 */
export async function sendVerificationEmail({
  email,
  name,
  verificationLink,
  lang = "es",
}) {
  return executeEmailFunction({
    action: "send-verification",
    email,
    name,
    verificationLink,
    lang,
  });
}

/**
 * Send password reset email
 * @param {Object} options
 * @param {string} options.email - Recipient email
 * @param {string} [options.name] - Recipient name
 * @param {string} options.resetLink - Password reset URL
 * @param {string} [options.lang='es'] - Language (es/en)
 */
export async function sendPasswordResetEmail({
  email,
  name,
  resetLink,
  lang = "es",
}) {
  return executeEmailFunction({
    action: "send-password-reset",
    email,
    name,
    resetLink,
    lang,
  });
}

/**
 * Send report email with download link
 * @param {Object} options
 * @param {string} options.email - Recipient email
 * @param {string} [options.name] - Recipient name
 * @param {string} [options.subject] - Custom subject line
 * @param {string} options.reportName - Name of the report file
 * @param {string} options.reportUrl - URL to download the report
 * @param {string} [options.lang='es'] - Language (es/en)
 */
export async function sendReportEmail({
  email,
  name,
  subject,
  reportName,
  reportUrl,
  lang = "es",
}) {
  return executeEmailFunction({
    action: "send-report",
    email,
    name,
    subject,
    reportName,
    reportUrl,
    lang,
  });
}

/**
 * Send notification email
 * @param {Object} options
 * @param {string} options.email - Recipient email
 * @param {string} [options.name] - Recipient name
 * @param {string} [options.subject] - Email subject
 * @param {string} [options.title] - Email title (displayed in body)
 * @param {string} options.message - Notification message (can include HTML)
 * @param {string} [options.actionUrl] - Optional action button URL
 * @param {string} [options.actionText] - Optional action button text
 * @param {string} [options.lang='es'] - Language (es/en)
 */
export async function sendNotificationEmail({
  email,
  name,
  subject,
  title,
  message,
  actionUrl,
  actionText,
  lang = "es",
}) {
  return executeEmailFunction({
    action: "send-notification",
    email,
    name,
    subject,
    title,
    message,
    actionUrl,
    actionText,
    lang,
  });
}

/**
 * Send simple email (text only, no action button)
 * @param {Object} options
 * @param {string} options.email - Recipient email
 * @param {string} [options.subject] - Email subject
 * @param {string} [options.title] - Email title
 * @param {string} options.message - Email message (can include HTML)
 * @param {string} [options.lang='es'] - Language (es/en)
 */
export async function sendSimpleEmail({
  email,
  subject,
  title,
  message,
  lang = "es",
}) {
  return executeEmailFunction({
    action: "send-simple",
    email,
    subject,
    title,
    message,
    lang,
  });
}

/**
 * Check email service health
 * @returns {Promise<Object>} - Health status
 */
export async function checkEmailServiceHealth() {
  return executeEmailFunction({ action: "health" });
}

// Default export with all methods
const emailService = {
  sendVerification: sendVerificationEmail,
  sendPasswordReset: sendPasswordResetEmail,
  sendReport: sendReportEmail,
  sendNotification: sendNotificationEmail,
  sendSimple: sendSimpleEmail,
  checkHealth: checkEmailServiceHealth,
};

export default emailService;
