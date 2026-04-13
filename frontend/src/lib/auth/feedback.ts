export type AuthReasonCode = "signed_out";

type AuthFeedback = {
  tone: "error" | "info";
  message: string;
};

import type { AuthErrorCode } from "@/types/auth";

export function resolveAuthFeedback(
  error?: string,
  reason?: string,
): AuthFeedback {
  switch (error as AuthErrorCode | undefined) {
    case "account_blocked":
      return {
        tone: "error",
        message:
          "Your account is currently blocked from signing in. Please contact an administrator.",
      };
    case "invalid_profile":
      return {
        tone: "error",
        message:
          "Google sign-in returned an incomplete or conflicting profile. Try a different account or contact an administrator.",
      };
    case "provisioning_failed":
      return {
        tone: "error",
        message:
          "Google sign-in succeeded, but SmartCampus could not finish creating your local app account. Please try again.",
      };
    case "oauth_not_allowed":
      return {
        tone: "error",
        message:
          "This account must use the staff or admin email-password login instead of Google.",
      };
    case "local_login_not_allowed":
      return {
        tone: "error",
        message:
          "This account must use the student Google sign-in instead of email and password.",
      };
    case "invalid_credentials":
      return {
        tone: "error",
        message: "The email or password you entered is incorrect.",
      };
    case "password_change_required":
      return {
        tone: "error",
        message:
          "Your temporary password must be changed before you can continue into the workspace.",
      };
    case "oauth_failed":
      return {
        tone: "error",
        message: "Google sign-in did not complete successfully. Please try again.",
      };
    default:
      break;
  }

  switch (reason as AuthReasonCode | undefined) {
    case "signed_out":
      return {
        tone: "info",
        message: "You have been signed out successfully.",
      };
    default:
      return {
        tone: "info",
        message:
          "Students sign in with Google. Staff and admins sign in with email and password.",
      };
  }
}
