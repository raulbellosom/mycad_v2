import { useMutation } from "@tanstack/react-query";
import emailService from "../services/emailService";

/**
 * Hook for sending verification emails
 */
export function useSendVerificationEmail() {
  return useMutation({
    mutationFn: emailService.sendVerification,
  });
}

/**
 * Hook for sending password reset emails
 */
export function useSendPasswordResetEmail() {
  return useMutation({
    mutationFn: emailService.sendPasswordReset,
  });
}

/**
 * Hook for sending report emails
 */
export function useSendReportEmail() {
  return useMutation({
    mutationFn: emailService.sendReport,
  });
}

/**
 * Hook for sending notification emails
 */
export function useSendNotificationEmail() {
  return useMutation({
    mutationFn: emailService.sendNotification,
  });
}

/**
 * Hook for sending simple emails
 */
export function useSendSimpleEmail() {
  return useMutation({
    mutationFn: emailService.sendSimple,
  });
}

/**
 * Hook for checking email service health
 */
export function useEmailServiceHealth() {
  return useMutation({
    mutationFn: emailService.checkHealth,
  });
}

/**
 * Combined hook with all email operations
 * @returns {Object} Email service mutations
 */
export function useEmailService() {
  const sendVerification = useSendVerificationEmail();
  const sendPasswordReset = useSendPasswordResetEmail();
  const sendReport = useSendReportEmail();
  const sendNotification = useSendNotificationEmail();
  const sendSimple = useSendSimpleEmail();
  const checkHealth = useEmailServiceHealth();

  return {
    sendVerification,
    sendPasswordReset,
    sendReport,
    sendNotification,
    sendSimple,
    checkHealth,
    // Convenience: check if any mutation is loading
    isLoading:
      sendVerification.isPending ||
      sendPasswordReset.isPending ||
      sendReport.isPending ||
      sendNotification.isPending ||
      sendSimple.isPending,
  };
}

export default useEmailService;
