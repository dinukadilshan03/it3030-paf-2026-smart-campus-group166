import type { RoleCode } from "@/types/auth";

import { findLocationForResource, toIdNumber } from "@/lib/tickets/shared";
import type {
  CreateTicketFormValues,
  TicketAssignmentFormValues,
  TicketAttachmentDraft,
  TicketCategoryFormValues,
  TicketCommentFormValues,
  TicketResourceOption,
  TicketStatusFormValues,
} from "@/lib/tickets/types";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ATTACHMENT_MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_ATTACHMENT_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

export function validateCreateTicketForm(
  values: CreateTicketFormValues,
  resources: TicketResourceOption[],
  options: { requireReporterSelection?: boolean } = {},
) {
  const errors = validateTicketDetailsForm(values, resources, options);

  if (values.attachments.length > 3) {
    errors.attachments = "Only up to 3 image attachments are allowed.";
  }

  values.attachments.forEach((attachment, index) => {
    const prefix = `attachments.${index}`;
    const attachmentErrors = validateAttachmentDraft(attachment);
    Object.entries(attachmentErrors).forEach(([field, message]) => {
      errors[`${prefix}.${field}`] = message;
    });
  });

  return errors;
}

export function validateUpdateTicketForm(
  values: Pick<
    CreateTicketFormValues,
    | "reporterUserId"
    | "resourceId"
    | "locationId"
    | "ticketCategoryId"
    | "title"
    | "description"
    | "priority"
    | "preferredContactName"
    | "preferredContactEmail"
    | "preferredContactPhone"
  >,
  resources: TicketResourceOption[],
  options: { requireReporterSelection?: boolean } = {},
) {
  return validateTicketDetailsForm(values, resources, options);
}

function validateTicketDetailsForm(
  values: Pick<
    CreateTicketFormValues,
    | "reporterUserId"
    | "resourceId"
    | "locationId"
    | "ticketCategoryId"
    | "title"
    | "description"
    | "priority"
    | "preferredContactName"
    | "preferredContactEmail"
    | "preferredContactPhone"
  >,
  resources: TicketResourceOption[],
  options: { requireReporterSelection?: boolean } = {},
) {
  const errors: Record<string, string> = {};

  if (options.requireReporterSelection && !values.reporterUserId.trim()) {
    errors.reporterUserId = "Choose who is reporting this issue.";
  }

  if (!values.ticketCategoryId.trim()) {
    errors.ticketCategoryId = "Choose a ticket category.";
  }

  if (!values.title.trim()) {
    errors.title = "Title is required.";
  } else if (values.title.trim().length > 200) {
    errors.title = "Title must be 200 characters or fewer.";
  }

  if (!values.description.trim()) {
    errors.description = "Description is required.";
  }

  if (!values.resourceId.trim() && !values.locationId.trim()) {
    errors.locationId = "Choose a location or a specific resource.";
  }

  if (values.preferredContactName.trim().length > 160) {
    errors.preferredContactName = "Preferred contact name must be 160 characters or fewer.";
  }

  if (
    values.preferredContactEmail.trim() &&
    !EMAIL_PATTERN.test(values.preferredContactEmail.trim())
  ) {
    errors.preferredContactEmail = "Enter a valid contact email address.";
  }

  if (values.preferredContactPhone.trim().length > 30) {
    errors.preferredContactPhone = "Preferred contact phone must be 30 characters or fewer.";
  }

  const resourceId = toIdNumber(values.resourceId);
  const locationId = toIdNumber(values.locationId);
  const resourceLocationId = findLocationForResource(resources, resourceId ?? null);

  if (
    resourceId != null &&
    locationId != null &&
    resourceLocationId != null &&
    resourceLocationId !== locationId
  ) {
    errors.locationId = "The selected resource belongs to a different location.";
  }

  return errors;
}

export function validateAssignmentForm(values: TicketAssignmentFormValues) {
  const errors: Record<string, string> = {};

  if (!values.assignedStaffUserId.trim()) {
    errors.assignedStaffUserId = "Choose a staff member to assign.";
  }

  return errors;
}

export function validateStatusForm(values: TicketStatusFormValues) {
  const errors: Record<string, string> = {};

  if (!values.status) {
    errors.status = "Choose the next ticket status.";
  }

  if (values.status === "RESOLVED" && !values.resolutionSummary.trim()) {
    errors.resolutionSummary = "Resolution summary is required when resolving a ticket.";
  }

  if (values.status === "REJECTED" && !values.rejectionReason.trim()) {
    errors.rejectionReason = "Rejection reason is required when rejecting a ticket.";
  }

  return errors;
}

export function validateCommentForm(values: TicketCommentFormValues, role: RoleCode) {
  const errors: Record<string, string> = {};

  if (!values.body.trim()) {
    errors.body = "Comment text is required.";
  }

  if (values.commentType === "INTERNAL_NOTE" && role === "STUDENT") {
    errors.commentType = "Students cannot post internal notes.";
  }

  return errors;
}

export function validateAttachmentDraft(values: TicketAttachmentDraft) {
  const errors: Record<string, string> = {};

  if (!values.file) {
    errors.file = "Choose an image to upload.";
    return errors;
  }

  if (!values.fileName.trim()) {
    errors.file = "The selected image is missing a file name.";
  }

  if (!ALLOWED_ATTACHMENT_MIME_TYPES.has(values.file.type)) {
    errors.file = "Only JPG, PNG, WEBP, and GIF images are allowed.";
  }

  if (!Number.isFinite(values.file.size) || values.file.size <= 0) {
    errors.file = "The selected image is empty.";
  } else if (values.file.size > ATTACHMENT_MAX_FILE_SIZE_BYTES) {
    errors.file = "Each image must be 5 MB or smaller.";
  }

  if (values.mimeType.trim().length > 120) {
    errors.file = "The selected image format is not supported.";
  }

  return errors;
}

export function validateTicketCategoryForm(values: TicketCategoryFormValues) {
  const errors: Record<string, string> = {};

  if (!values.code.trim()) {
    errors.code = "Category code is required.";
  } else if (values.code.trim().length > 50) {
    errors.code = "Category code must be 50 characters or fewer.";
  }

  if (!values.name.trim()) {
    errors.name = "Category name is required.";
  } else if (values.name.trim().length > 100) {
    errors.name = "Category name must be 100 characters or fewer.";
  }

  return errors;
}
