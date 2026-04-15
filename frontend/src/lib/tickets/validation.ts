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

export function validateCreateTicketForm(
  values: CreateTicketFormValues,
  resources: TicketResourceOption[],
) {
  const errors: Record<string, string> = {};

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

  if (values.attachments.length > 3) {
    errors.attachments = "Only up to 3 attachment metadata entries are allowed.";
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

  if (!values.fileName.trim()) {
    errors.fileName = "File name is required.";
  }

  if (!values.storageBucket.trim()) {
    errors.storageBucket = "Storage bucket is required.";
  } else if (values.storageBucket.trim().length > 100) {
    errors.storageBucket = "Storage bucket must be 100 characters or fewer.";
  }

  if (!values.storagePath.trim()) {
    errors.storagePath = "Storage path is required.";
  } else if (values.storagePath.trim().length > 500) {
    errors.storagePath = "Storage path must be 500 characters or fewer.";
  }

  if (values.mimeType.trim().length > 120) {
    errors.mimeType = "MIME type must be 120 characters or fewer.";
  }

  if (!values.fileSize.trim()) {
    errors.fileSize = "File size is required.";
  } else {
    const parsed = Number(values.fileSize);
    if (!Number.isFinite(parsed) || parsed < 0) {
      errors.fileSize = "File size must be a non-negative number.";
    }
  }

  if (values.attachmentType.trim().length > 50) {
    errors.attachmentType = "Attachment type must be 50 characters or fewer.";
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
