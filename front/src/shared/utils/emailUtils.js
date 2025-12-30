/**
 * Utility functions for email service
 */

/**
 * Generate a secure random token
 * @param {number} length - Length of the token in bytes (default: 32)
 * @returns {string} Hexadecimal token string
 */
export function generateSecureToken(length = 32) {
  if (typeof window !== "undefined" && window.crypto) {
    // Browser environment
    const array = new Uint8Array(length);
    window.crypto.getRandomValues(array);
    return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join(
      ""
    );
  } else if (typeof require !== "undefined") {
    // Node.js environment
    const crypto = require("crypto");
    return crypto.randomBytes(length).toString("hex");
  } else {
    throw new Error("No cryptographic random generator available");
  }
}

/**
 * Create expiration date for token
 * @param {number} hours - Hours until expiration (default: 24)
 * @returns {Date} Expiration date
 */
export function getExpirationDate(hours = 24) {
  const expiration = new Date();
  expiration.setHours(expiration.getHours() + hours);
  return expiration;
}

/**
 * Check if token is expired
 * @param {string|Date} expirationDate - ISO string or Date object
 * @returns {boolean} True if expired
 */
export function isTokenExpired(expirationDate) {
  const expDate =
    typeof expirationDate === "string"
      ? new Date(expirationDate)
      : expirationDate;
  return expDate < new Date();
}

/**
 * Format email verification URL (for backward compatibility)
 * @param {string} baseUrl - Base URL of the application
 * @param {string} token - Verification token
 * @returns {string} Complete verification URL
 */
export function buildVerificationUrl(baseUrl, token) {
  const cleanBase = baseUrl.replace(/\/$/, "");
  return `${cleanBase}/verify-email?token=${encodeURIComponent(token)}`;
}

/**
 * Format password reset URL (for backward compatibility)
 * @param {string} baseUrl - Base URL of the application
 * @param {string} token - Reset token
 * @returns {string} Complete reset URL
 */
export function buildResetPasswordUrl(baseUrl, token) {
  const cleanBase = baseUrl.replace(/\/$/, "");
  return `${cleanBase}/reset-password?token=${encodeURIComponent(token)}`;
}

/**
 * Example usage for verification flow
 */
export const emailVerificationExample = {
  // Step 1: Generate token and save to database
  async createVerification(userId, email) {
    const token = generateSecureToken();
    const expiresAt = getExpirationDate(24); // 24 hours

    // Save to your database
    await database.createDocument("verifications", {
      userId,
      email,
      token,
      expiresAt: expiresAt.toISOString(),
      used: false,
    });

    return { token, expiresAt };
  },

  // Step 2: Send email
  async sendEmail(email, name, token) {
    const emailService = await import("./emailService.js");
    return emailService.sendVerificationEmail({
      email,
      name,
      token, // Function will build: https://dev.mycad.mx/verify-email?token=xxx
      lang: "es",
    });
  },

  // Step 3: Validate token from URL params
  async validateToken(token) {
    const verification = await database.findDocument("verifications", {
      token,
      used: false,
    });

    if (!verification) {
      throw new Error("Token inválido");
    }

    if (isTokenExpired(verification.expiresAt)) {
      throw new Error("Token expirado");
    }

    // Mark as used
    await database.updateDocument("verifications", verification.id, {
      used: true,
      verifiedAt: new Date().toISOString(),
    });

    return verification;
  },
};

/**
 * Example usage for password reset flow
 */
export const passwordResetExample = {
  // Step 1: Create reset request
  async createReset(email) {
    const token = generateSecureToken();
    const expiresAt = getExpirationDate(1); // 1 hour

    await database.createDocument("password_resets", {
      email,
      token,
      expiresAt: expiresAt.toISOString(),
      used: false,
    });

    return { token, expiresAt };
  },

  // Step 2: Send email
  async sendEmail(email, name, token) {
    const emailService = await import("./emailService.js");
    return emailService.sendPasswordResetEmail({
      email,
      name,
      token, // Function will build: https://dev.mycad.mx/reset-password?token=xxx
      lang: "es",
    });
  },

  // Step 3: Validate and reset password
  async resetPassword(token, newPassword) {
    const reset = await database.findDocument("password_resets", {
      token,
      used: false,
    });

    if (!reset) {
      throw new Error("Token inválido");
    }

    if (isTokenExpired(reset.expiresAt)) {
      throw new Error("Token expirado");
    }

    // Update user password (use your own method)
    await updateUserPassword(reset.email, newPassword);

    // Mark as used
    await database.updateDocument("password_resets", reset.id, {
      used: true,
      usedAt: new Date().toISOString(),
    });

    return true;
  },
};

export default {
  generateSecureToken,
  getExpirationDate,
  isTokenExpired,
  buildVerificationUrl,
  buildResetPasswordUrl,
  emailVerificationExample,
  passwordResetExample,
};
