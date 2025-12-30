/**
 * Email templates for MyCAD - Premium Design
 * Modern, professional templates with brand identity
 */

// Brand colors - MyCAD Identity
const colors = {
  primary: "#f97316", // Orange 500 - Brand color
  primaryDark: "#ea580c", // Orange 600
  primaryLight: "#fdba74", // Orange 300
  background: "#f9fafb", // Gray 50 - Clean light background
  container: "#ffffff", // White card
  border: "#e5e7eb", // Gray 200
  borderDark: "#d1d5db", // Gray 300
  text: "#111827", // Gray 900 - Dark text
  textSecondary: "#6b7280", // Gray 500
  textMuted: "#9ca3af", // Gray 400
  accent: "#f3f4f6", // Gray 100
  success: "#10b981", // Green 500
  warning: "#f59e0b", // Amber 500
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
  <title>MyCAD - Gestión de Vehículos</title>
  <!--[if mso]>
  <style type="text/css">
    table { border-collapse: collapse; }
    .button { padding: 16px 40px !important; }
  </style>
  <![endif]-->
</head>
<body style="margin: 0; padding: 0; background-color: ${colors.background}; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale;">
  <!-- Outer table for full-width background -->
  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: ${colors.background};">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <!-- Main container -->
        <table role="presentation" width="100%" style="max-width: 600px; background-color: ${colors.container}; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); overflow: hidden;">
          ${content}
          ${footer}
        </table>
        
        <!-- Browser link -->
        <table role="presentation" width="100%" style="max-width: 600px; margin-top: 20px;">
          <tr>
            <td align="center" style="padding: 0 20px;">
              <p style="margin: 0; font-size: 11px; line-height: 16px; color: ${colors.textMuted};">
                ¿No puedes ver este correo correctamente? <a href="#" style="color: ${colors.primary}; text-decoration: none;">Ver en navegador</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

/**
 * Email header with logo and brand
 */
function headerSection(title, subtitle = null) {
  const subtitleHtml = subtitle
    ? `<p style="margin: 12px 0 0 0; font-size: 15px; color: ${colors.textSecondary}; line-height: 1.5;">${subtitle}</p>`
    : "";
  const paddingBottom = subtitle ? "16px" : "32px";

  return `
<!-- Brand Header with gradient -->
<tr>
  <td style="background: linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%); padding: 32px 40px; text-align: center;">
    <table role="presentation" border="0" cellspacing="0" cellpadding="0" width="100%">
      <tr>
        <td align="center">
          <table role="presentation" border="0" cellspacing="0" cellpadding="0">
            <tr>
              <td style="background: ${colors.white}; border-radius: 8px; padding: 12px 24px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                <table role="presentation" border="0" cellspacing="0" cellpadding="0">
                  <tr>
                    <td style="vertical-align: middle; padding-right: 12px;">
                      <div style="width: 40px; height: 40px; background: ${colors.primary}; border-radius: 8px; display: inline-flex; align-items: center; justify-content: center;">
                        <span style="font-size: 24px; line-height: 1;">🚗</span>
                      </div>
                    </td>
                    <td style="vertical-align: middle;">
                      <h1 style="margin: 0; font-size: 28px; font-weight: 800; color: ${colors.primary}; letter-spacing: -0.5px; line-height: 1;">MyCAD</h1>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </td>
</tr>
<tr>
  <td style="padding: 40px 40px ${paddingBottom} 40px; text-align: center;">
    <h2 style="margin: 0; font-size: 26px; font-weight: 700; color: ${colors.text}; line-height: 1.3;">${title}</h2>
    ${subtitleHtml}
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
  <td style="background-color: ${colors.accent}; padding: 32px 40px; border-top: 1px solid ${colors.border};">
    <!-- Social/Info -->
    <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
      <tr>
        <td align="center" style="padding-bottom: 20px;">
          <p style="margin: 0 0 8px 0; font-size: 16px; font-weight: 600; color: ${colors.text};">
            MyCAD - Gestión de Vehículos
          </p>
          <p style="margin: 0; font-size: 13px; color: ${colors.textSecondary};">
            Sistema profesional de administración vehicular
          </p>
        </td>
      </tr>
      
      <!-- Divider -->
      <tr>
        <td style="padding: 16px 0;">
          <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
            <tr>
              <td style="border-top: 1px solid ${colors.borderDark};"></td>
            </tr>
          </table>
        </td>
      </tr>
      
      <!-- Copyright and automated message -->
      <tr>
        <td align="center">
          <p style="margin: 0 0 8px 0; font-size: 12px; color: ${colors.textMuted};">
            &copy; ${year} MyCAD. ${t.footer.copyright}
          </p>
          <p style="margin: 0; font-size: 11px; color: ${colors.textMuted}; line-height: 1.5;">
            ${t.footer.automated}
          </p>
        </td>
      </tr>
    </table>
  </td>
</tr>
  `.trim();
}

/**
 * Action button - Modern design with shadow
 */
function actionButton(url, text, icon = "→") {
  return `
<!-- Call to Action Button -->
<tr>
  <td align="center" style="padding: 32px 40px;">
    <table role="presentation" border="0" cellspacing="0" cellpadding="0">
      <tr>
        <td align="center" style="border-radius: 10px; background: linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%); box-shadow: 0 10px 15px -3px rgba(249, 115, 22, 0.3), 0 4px 6px -2px rgba(249, 115, 22, 0.2);">
          <a href="${url}" target="_blank" style="display: inline-block; padding: 16px 48px; font-size: 16px; font-weight: 700; color: ${colors.white}; text-decoration: none; border-radius: 10px; letter-spacing: 0.3px;">
            ${text} ${icon}
          </a>
        </td>
      </tr>
    </table>
    
    <!-- Link alternativo -->
    <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-top: 20px;">
      <tr>
        <td align="center">
          <p style="margin: 0 0 8px 0; font-size: 12px; color: ${colors.textMuted};">
            O copia y pega este enlace en tu navegador:
          </p>
          <p style="margin: 0; font-size: 12px; word-break: break-all;">
            <a href="${url}" style="color: ${colors.primary}; text-decoration: none; font-weight: 500;">${url}</a>
          </p>
        </td>
      </tr>
    </table>
  </td>
</tr>
  `.trim();
}

/**
 * Verification email template - Premium Design
 */
export function verificationTemplate(name, verificationLink, t) {
  const welcomeText = name ? `¡Bienvenido, ${name}!` : "¡Bienvenido!";

  const content = `
${headerSection(t.verification.title, welcomeText)}
<tr>
  <td style="padding: 0 40px 32px 40px;">
    <table role="presentation" border="0" cellspacing="0" cellpadding="0" width="100%">
      <tr>
        <td align="center" style="padding-bottom: 24px;">
          <div style="width: 80px; height: 80px; background: linear-gradient(135deg, ${
            colors.primary
          }15 0%, ${
    colors.primary
  }30 100%); border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; border: 3px solid ${
    colors.primary
  };">
            <span style="font-size: 40px;">✉️</span>
          </div>
        </td>
      </tr>
    </table>
    <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 1.7; color: ${
      colors.textSecondary
    }; text-align: center;">${t.verification.content}</p>
  </td>
</tr>
${actionButton(verificationLink, t.verification.button, "✓")}
<tr>
  <td style="padding: 0 40px 40px 40px;">
    <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
      <tr>
        <td style="background-color: ${colors.accent}; border-left: 4px solid ${
    colors.primary
  }; border-radius: 6px; padding: 16px 20px;">
          <p style="margin: 0; font-size: 13px; line-height: 1.6; color: ${
            colors.textSecondary
          };">🔒 <strong style="color: ${
    colors.text
  };">Seguridad:</strong> Este enlace es único y expirará en 24 horas. Si no solicitaste verificar tu cuenta, ignora este correo.</p>
        </td>
      </tr>
    </table>
  </td>
</tr>
  `.trim();

  return baseTemplate(content, footerSection(t));
}

/**
 * Password reset email template - Premium Design
 */
export function passwordResetTemplate(name, resetLink, t) {
  const greeting = name ? `Hola, ${name}` : "Hola";

  const content = `
${headerSection(t.passwordReset.title, greeting)}
<tr>
  <td style="padding: 0 40px 32px 40px;">
    <table role="presentation" border="0" cellspacing="0" cellpadding="0" width="100%">
      <tr>
        <td align="center" style="padding-bottom: 24px;">
          <div style="width: 80px; height: 80px; background: linear-gradient(135deg, ${
            colors.warning
          }15 0%, ${
    colors.warning
  }30 100%); border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; border: 3px solid ${
    colors.warning
  };">
            <span style="font-size: 40px;">🔑</span>
          </div>
        </td>
      </tr>
    </table>
    <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 1.7; color: ${
      colors.textSecondary
    }; text-align: center;">${t.passwordReset.content}</p>
  </td>
</tr>
${actionButton(resetLink, t.passwordReset.button, "→")}
<tr>
  <td style="padding: 0 40px 40px 40px;">
    <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
      <tr>
        <td style="background-color: #fef3c7; border-left: 4px solid ${
          colors.warning
        }; border-radius: 6px; padding: 16px 20px;">
          <p style="margin: 0 0 8px 0; font-size: 13px; line-height: 1.6; color: #78350f;">⏱️ <strong>Importante:</strong> ${
            t.passwordReset.expiry
          }</p>
          <p style="margin: 0; font-size: 12px; line-height: 1.5; color: #92400e;">Si no solicitaste restablecer tu contraseña, puedes ignorar este correo de forma segura. Tu contraseña actual seguirá siendo válida.</p>
        </td>
      </tr>
    </table>
  </td>
</tr>
  `.trim();

  return baseTemplate(content, footerSection(t));
}

/**
 * Report email template - Premium Design
 */
export function reportTemplate(name, title, reportName, reportUrl, t) {
  const greeting = name ? `Hola, ${name}` : "Hola";

  const content = `
${headerSection(title, greeting)}
<tr>
  <td style="padding: 0 40px 32px 40px;">
    <table role="presentation" border="0" cellspacing="0" cellpadding="0" width="100%">
      <tr>
        <td align="center" style="padding-bottom: 24px;">
          <div style="width: 80px; height: 80px; background: linear-gradient(135deg, ${
            colors.success
          }15 0%, ${
    colors.success
  }30 100%); border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; border: 3px solid ${
    colors.success
  };">
            <span style="font-size: 40px;">📊</span>
          </div>
        </td>
      </tr>
    </table>
    <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 1.7; color: ${
      colors.textSecondary
    }; text-align: center;">${t.report.content}</p>
    <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 8px;">
      <tr>
        <td style="background: linear-gradient(135deg, ${colors.accent} 0%, ${
    colors.background
  } 100%); border: 2px solid ${
    colors.border
  }; border-radius: 12px; padding: 20px;">
          <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
            <tr>
              <td style="padding-bottom: 8px;">
                <p style="margin: 0; font-size: 12px; font-weight: 600; color: ${
                  colors.textMuted
                }; text-transform: uppercase; letter-spacing: 0.5px;">📄 Archivo de Reporte</p>
              </td>
            </tr>
            <tr>
              <td>
                <p style="margin: 0; font-size: 16px; font-weight: 700; color: ${
                  colors.text
                };">${reportName}</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </td>
</tr>
${actionButton(reportUrl, t.report.button, "⬇")}
<tr>
  <td style="padding: 0 40px 40px 40px;">
    <p style="margin: 0; font-size: 12px; line-height: 1.6; color: ${
      colors.textMuted
    }; text-align: center;">El reporte estará disponible para descarga. Asegúrate de guardarlo en un lugar seguro.</p>
  </td>
</tr>
  `.trim();

  return baseTemplate(content, footerSection(t));
}

/**
 * Notification email template - Premium Design with optional action
 */
export function notificationTemplate(
  title,
  message,
  actionUrl = null,
  actionText = null,
  t
) {
  const hasAction = actionUrl && actionText;
  const actionHtml = hasAction ? actionButton(actionUrl, actionText, "→") : "";

  const content = `
${headerSection(title)}
<tr>
  <td style="padding: 0 40px 32px 40px;">
    <table role="presentation" border="0" cellspacing="0" cellpadding="0" width="100%">
      <tr>
        <td align="center" style="padding-bottom: 24px;">
          <div style="width: 80px; height: 80px; background: linear-gradient(135deg, ${
            colors.primary
          }15 0%, ${
    colors.primary
  }30 100%); border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; border: 3px solid ${
    colors.primary
  };">
            <span style="font-size: 40px;">🔔</span>
          </div>
        </td>
      </tr>
    </table>
    <div style="margin: 0 0 24px 0; font-size: 16px; line-height: 1.7; color: ${
      colors.textSecondary
    }; text-align: center;">${message}</div>
  </td>
</tr>
${actionHtml}
  `.trim();

  return baseTemplate(content, footerSection(t));
}

/**
 * Simple text email (no action button) - Premium Design
 */
export function simpleTemplate(title, message, t) {
  const content = `
${headerSection(title)}
<tr>
  <td style="padding: 0 40px 40px 40px;">
    <div style="margin: 0; font-size: 16px; line-height: 1.7; color: ${
      colors.textSecondary
    }; text-align: center;">${message}</div>
  </td>
</tr>
  `.trim();

  return baseTemplate(content, footerSection(t));
}
