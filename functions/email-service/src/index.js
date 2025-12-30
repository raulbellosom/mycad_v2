import {
  must,
  optional,
  safeBodyJson,
  json,
  createTransporter,
  getTranslations,
  buildUrl,
} from "./_shared.js";

import {
  verificationTemplate,
  passwordResetTemplate,
  reportTemplate,
  notificationTemplate,
  simpleTemplate,
} from "./templates.js";

/**
 * Email Service Appwrite Function
 *
 * Handles all email sending operations for MyCAD:
 * - Account verification
 * - Password reset
 * - Report delivery
 * - General notifications
 *
 * @param {Object} context - Appwrite function context
 */
export default async ({ req, res, log, error }) => {
  let transporter = null;

  try {
    const payload = safeBodyJson(req);
    const action = String(payload.action || "").trim();

    if (!action) {
      return json(res, 400, {
        ok: false,
        error: "Missing action parameter",
        availableActions: [
          "send-verification",
          "send-password-reset",
          "send-report",
          "send-notification",
          "send-simple",
          "health",
        ],
      });
    }

    // Health check endpoint
    if (action === "health") {
      return json(res, 200, {
        ok: true,
        status: "healthy",
        timestamp: new Date().toISOString(),
      });
    }

    // Create transporter (lazy initialization)
    transporter = createTransporter();

    // Route to appropriate handler
    switch (action) {
      case "send-verification":
        return await handleVerification(payload, transporter, res, log);

      case "send-password-reset":
        return await handlePasswordReset(payload, transporter, res, log);

      case "send-report":
        return await handleReport(payload, transporter, res, log);

      case "send-notification":
        return await handleNotification(payload, transporter, res, log);

      case "send-simple":
        return await handleSimple(payload, transporter, res, log);

      default:
        return json(res, 400, {
          ok: false,
          error: `Unknown action: ${action}`,
        });
    }
  } catch (e) {
    const errorMessage = e.message || String(e);
    try {
      error?.(errorMessage);
    } catch {}

    return json(res, 500, {
      ok: false,
      error: errorMessage,
    });
  }
};

/**
 * Handle verification email
 */
async function handleVerification(payload, transporter, res, log) {
  const {
    email,
    name,
    verificationLink,
    token,
    userId,
    secret,
    lang = "es",
  } = payload;

  if (!email) {
    return json(res, 400, {
      ok: false,
      error: "Missing required field: email",
    });
  }

  // Build verification link if not provided
  let finalLink = verificationLink;
  if (!finalLink) {
    if (token) {
      finalLink = buildUrl("/verify-email", { token });
    } else if (userId && secret) {
      finalLink = buildUrl("/verify-email", { userId, secret });
    } else {
      return json(res, 400, {
        ok: false,
        error:
          "Missing required fields: verificationLink OR (token) OR (userId AND secret)",
      });
    }
  }

  const t = getTranslations(lang);
  const html = verificationTemplate(name, finalLink, t);

  const mailOptions = {
    from: optional("SMTP_FROM", '"MyCAD" <no-reply@mycad.app>'),
    to: email,
    subject: t.verification.subject,
    html,
  };

  const info = await transporter.sendMail(mailOptions);
  log?.(`Verification email sent to ${email}: ${info.messageId}`);

  return json(res, 200, {
    ok: true,
    messageId: info.messageId,
    action: "send-verification",
  });
}

/**
 * Handle password reset email
 */
async function handlePasswordReset(payload, transporter, res, log) {
  const {
    email,
    name,
    resetLink,
    token,
    userId,
    secret,
    lang = "es",
  } = payload;

  if (!email) {
    return json(res, 400, {
      ok: false,
      error: "Missing required field: email",
    });
  }

  // Build reset link if not provided
  let finalLink = resetLink;
  if (!finalLink) {
    if (token) {
      finalLink = buildUrl("/reset-password", { token });
    } else if (userId && secret) {
      finalLink = buildUrl("/reset-password", { userId, secret });
    } else {
      return json(res, 400, {
        ok: false,
        error:
          "Missing required fields: resetLink OR (token) OR (userId AND secret)",
      });
    }
  }

  const t = getTranslations(lang);
  const html = passwordResetTemplate(name, finalLink, t);

  const mailOptions = {
    from: optional("SMTP_FROM", '"MyCAD" <no-reply@mycad.app>'),
    to: email,
    subject: t.passwordReset.subject,
    html,
  };

  const info = await transporter.sendMail(mailOptions);
  log?.(`Password reset email sent to ${email}: ${info.messageId}`);

  return json(res, 200, {
    ok: true,
    messageId: info.messageId,
    action: "send-password-reset",
  });
}

/**
 * Handle report email
 */
async function handleReport(payload, transporter, res, log) {
  const {
    email,
    name,
    subject: customSubject,
    reportName,
    reportUrl,
    lang = "es",
  } = payload;

  if (!email || !reportUrl) {
    return json(res, 400, {
      ok: false,
      error: "Missing required fields: email, reportUrl",
    });
  }

  const t = getTranslations(lang);
  const html = reportTemplate(
    name,
    reportName || "report.pdf",
    reportUrl,
    t,
    customSubject
  );

  const mailOptions = {
    from: optional("SMTP_FROM", '"MyCAD" <no-reply@mycad.app>'),
    to: email,
    subject: customSubject || t.report.subject,
    html,
  };

  const info = await transporter.sendMail(mailOptions);
  log?.(`Report email sent to ${email}: ${info.messageId}`);

  return json(res, 200, {
    ok: true,
    messageId: info.messageId,
    action: "send-report",
  });
}

/**
 * Handle notification email
 */
async function handleNotification(payload, transporter, res, log) {
  const {
    email,
    name,
    subject,
    title,
    message,
    actionUrl,
    actionText,
    lang = "es",
  } = payload;

  if (!email || !message) {
    return json(res, 400, {
      ok: false,
      error: "Missing required fields: email, message",
    });
  }

  const t = getTranslations(lang);
  const html = notificationTemplate(
    name,
    title || subject || t.notification.subject,
    message,
    actionUrl,
    actionText,
    t
  );

  const mailOptions = {
    from: optional("SMTP_FROM", '"MyCAD" <no-reply@mycad.app>'),
    to: email,
    subject: subject || t.notification.subject,
    html,
  };

  const info = await transporter.sendMail(mailOptions);
  log?.(`Notification email sent to ${email}: ${info.messageId}`);

  return json(res, 200, {
    ok: true,
    messageId: info.messageId,
    action: "send-notification",
  });
}

/**
 * Handle simple email (no action button)
 */
async function handleSimple(payload, transporter, res, log) {
  const { email, subject, title, message, lang = "es" } = payload;

  if (!email || !message) {
    return json(res, 400, {
      ok: false,
      error: "Missing required fields: email, message",
    });
  }

  const t = getTranslations(lang);
  const html = simpleTemplate(title || subject || "MyCAD", message, t);

  const mailOptions = {
    from: optional("SMTP_FROM", '"MyCAD" <no-reply@mycad.app>'),
    to: email,
    subject: subject || "MyCAD",
    html,
  };

  const info = await transporter.sendMail(mailOptions);
  log?.(`Simple email sent to ${email}: ${info.messageId}`);

  return json(res, 200, {
    ok: true,
    messageId: info.messageId,
    action: "send-simple",
  });
}
