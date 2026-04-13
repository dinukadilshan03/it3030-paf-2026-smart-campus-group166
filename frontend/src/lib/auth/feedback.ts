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
        message: "Use your SmartCampus Google account to enter the protected workspace.",
      };
  }
}
