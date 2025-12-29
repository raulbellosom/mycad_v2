/**
 * Email templates for MyCAD
 * All templates are responsive HTML emails
 */

// Brand colors
const colors = {
  primary: "#f97316", // Orange 500
  primaryDark: "#ea580c", // Orange 600
  background: "#09090b", // Zinc 950
  container: "#18181b", // Zinc 900
  border: "#27272a", // Zinc 800
  text: "#e4e4e7", // Zinc 200
  textMuted: "#a1a1aa", // Zinc 400
  textDark: "#71717a", // Zinc 500
  white: "#ffffff",
  black: "#000000",
};

/**
 * Base email template wrapper
 */
function baseTemplate(content, footer) {
  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>MyCAD</title>
  <!--[if mso]>
  <style type="text/css">
    table { border-collapse: collapse; }
    .button { padding: 14px 32px !important; }
  </style>
  <![endif]-->
</head>
<body style="margin: 0; padding: 0; background-color: ${colors.background}; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: ${colors.background};">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="100%" style="max-width: 600px; background-color: ${colors.container}; border-radius: 16px; overflow: hidden; border: 1px solid ${colors.border};">
          ${content}
          ${footer}
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

/**
 * Email header with logo
 */
function headerSection(title) {
  return `
<!-- Header -->
<tr>
  <td align="center" style="padding: 40px 40px 20px 40px; background: linear-gradient(180deg, ${colors.container} 0%, transparent 100%);">
    <table role="presentation" border="0" cellspacing="0" cellpadding="0">
      <tr>
        <td align="center">
          <!-- Logo placeholder - replace with actual logo URL -->
          <div style="width: 64px; height: 64px; background: linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%); border-radius: 16px; display: flex; align-items: center; justify-content: center;">
            <span style="font-size: 32px; font-weight: bold; color: ${colors.white};">M</span>
          </div>
        </td>
      </tr>
      <tr>
        <td align="center" style="padding-top: 16px;">
          <h1 style="margin: 0; font-size: 24px; font-weight: 700; color: ${colors.white};">MyCAD</h1>
        </td>
      </tr>
    </table>
  </td>
</tr>
<!-- Title -->
<tr>
  <td align="center" style="padding: 0 40px;">
    <h2 style="margin: 0 0 24px 0; font-size: 20px; font-weight: 600; color: ${colors.white};">${title}</h2>
  </td>
</tr>
  `.trim();
}

/**
 * Footer section
 */
function footerSection(t) {
  const year = new Date().getFullYear();
  return `
<!-- Footer -->
<tr>
  <td style="background-color: ${colors.black}; padding: 24px 40px; text-align: center;">
    <p style="margin: 0 0 8px 0; font-size: 12px; color: ${colors.textDark};">
      &copy; ${year} MyCAD. ${t.footer.copyright}
    </p>
    <p style="margin: 0; font-size: 11px; color: ${colors.textDark};">
      ${t.footer.automated}
    </p>
  </td>
</tr>
  `.trim();
}

/**
 * Action button
 */
function actionButton(url, text) {
  return `
<table role="presentation" border="0" cellspacing="0" cellpadding="0" style="margin: 24px auto;">
  <tr>
    <td align="center" style="border-radius: 8px; background-color: ${colors.primary};">
      <a href="${url}" target="_blank" class="button" style="display: inline-block; padding: 14px 32px; font-size: 16px; font-weight: 600; color: ${colors.black}; text-decoration: none; border-radius: 8px;">
        ${text}
      </a>
    </td>
  </tr>
</table>
<p style="margin: 0; font-size: 13px; color: ${colors.textDark}; text-align: center;">
  <a href="${url}" style="color: ${colors.primary}; text-decoration: none; word-break: break-all;">${url}</a>
</p>
  `.trim();
}

/**
 * Verification email template
 */
export function verificationTemplate(name, verificationLink, t) {
  const content = `
${headerSection(t.verification.title)}
<!-- Content -->
<tr>
  <td style="padding: 0 40px 40px 40px;">
    <p style="margin: 0 0 16px 0; font-size: 16px; line-height: 1.6; color: ${
      colors.text
    }; text-align: center;">
      ${t.verification.welcome}${name ? ", " + name : ""}!
    </p>
    <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 1.6; color: ${
      colors.textMuted
    }; text-align: center;">
      ${t.verification.content}
    </p>
    ${actionButton(verificationLink, t.verification.button)}
  </td>
</tr>
  `.trim();

  return baseTemplate(content, footerSection(t));
}

/**
 * Password reset email template
 */
export function passwordResetTemplate(name, resetLink, t) {
  const content = `
${headerSection(t.passwordReset.title)}
<!-- Content -->
<tr>
  <td style="padding: 0 40px 40px 40px;">
    <p style="margin: 0 0 16px 0; font-size: 16px; line-height: 1.6; color: ${
      colors.text
    }; text-align: center;">
      ${t.passwordReset.greeting}${name ? " " + name : ""},
    </p>
    <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 1.6; color: ${
      colors.textMuted
    }; text-align: center;">
      ${t.passwordReset.content}
    </p>
    ${actionButton(resetLink, t.passwordReset.button)}
    <p style="margin: 24px 0 0 0; font-size: 14px; color: ${
      colors.textDark
    }; text-align: center;">
      ⏱️ ${t.passwordReset.expiry}
    </p>
  </td>
</tr>
  `.trim();

  return baseTemplate(content, footerSection(t));
}

/**
 * Report email template
 */
export function reportTemplate(name, reportName, reportUrl, t, customSubject) {
  const title = customSubject || t.report.title;
  const content = `
${headerSection(title)}
<!-- Content -->
<tr>
  <td style="padding: 0 40px 40px 40px;">
    <p style="margin: 0 0 16px 0; font-size: 16px; line-height: 1.6; color: ${
      colors.text
    }; text-align: center;">
      ${t.report.greeting}${name ? " " + name : ""},
    </p>
    <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 1.6; color: ${
      colors.textMuted
    }; text-align: center;">
      ${t.report.content}
    </p>
    <!-- Report info box -->
    <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 24px;">
      <tr>
        <td style="background-color: ${colors.background}; border: 1px solid ${
    colors.border
  }; border-radius: 8px; padding: 16px; text-align: center;">
          <p style="margin: 0; font-size: 14px; color: ${colors.textMuted};">
            📄 <strong style="color: ${colors.text};">${reportName}</strong>
          </p>
        </td>
      </tr>
    </table>
    ${actionButton(reportUrl, t.report.button)}
  </td>
</tr>
  `.trim();

  return baseTemplate(content, footerSection(t));
}

/**
 * Generic notification email template
 */
export function notificationTemplate(
  name,
  title,
  message,
  actionUrl,
  actionText,
  t
) {
  const hasAction = actionUrl && actionText;
  const content = `
${headerSection(title)}
<!-- Content -->
<tr>
  <td style="padding: 0 40px 40px 40px;">
    <p style="margin: 0 0 16px 0; font-size: 16px; line-height: 1.6; color: ${
      colors.text
    }; text-align: center;">
      ${t.notification.greeting}${name ? " " + name : ""},
    </p>
    <div style="margin: 0 0 24px 0; font-size: 16px; line-height: 1.6; color: ${
      colors.textMuted
    }; text-align: center;">
      ${message}
    </div>
    ${hasAction ? actionButton(actionUrl, actionText) : ""}
  </td>
</tr>
  `.trim();

  return baseTemplate(content, footerSection(t));
}

/**
 * Simple text email (no action button)
 */
export function simpleTemplate(title, message, t) {
  const content = `
${headerSection(title)}
<!-- Content -->
<tr>
  <td style="padding: 0 40px 40px 40px;">
    <div style="font-size: 16px; line-height: 1.6; color: ${
      colors.textMuted
    }; text-align: center;">
      ${message}
    </div>
  </td>
</tr>
  `.trim();

  return baseTemplate(content, footerSection(t));
}
