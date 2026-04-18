import type { AdminUserSummary } from "@/lib/users/types";
import type { RoleCode } from "@/types/auth";

export type TicketPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

export type TicketStatus = "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED" | "REJECTED";

export type CommentType = "PUBLIC_REPLY" | "INTERNAL_NOTE" | "STATUS_NOTE";

export type TicketSummary = {
  id: number;
  ticketNumber: string;
  reporterUserId: number;
  reporterDisplayName: string;
  assignedStaffUserId: number | null;
  assignedStaffDisplayName: string | null;
  resourceId: number | null;
  resourceName: string | null;
  locationId: number | null;
  locationName: string | null;
  ticketCategoryId: number;
  ticketCategoryCode: string;
  ticketCategoryName: string;
  title: string;
  priority: TicketPriority;
  status: TicketStatus;
  createdAt: string;
  updatedAt: string;
  firstRespondedAt: string | null;
  resolvedAt: string | null;
  reconsiderationRequestCount: number;
  staffReviewCount: number;
  adminReviewCount: number;
};

export type TicketReportType = "SUMMARY" | "DETAIL";

export type TicketReportFormat = "PDF" | "CSV";

export type TicketReportStatus = "READY";

export type TicketAssignment = {
  id: number;
  assignedToUserId: number;
  assignedToDisplayName: string;
  assignedByUserId: number;
  assignedByDisplayName: string;
  assignmentNote: string | null;
  isActive: boolean;
  assignedAt: string;
  unassignedAt: string | null;
};

export type TicketDetail = {
  id: number;
  ticketNumber: string;
  reporterUserId: number;
  reporterEmail: string;
  reporterDisplayName: string;
  assignedStaffUserId: number | null;
  assignedStaffDisplayName: string | null;
  resourceId: number | null;
  resourceCode: string | null;
  resourceName: string | null;
  resourceCategoryName: string | null;
  locationId: number | null;
  locationName: string | null;
  locationBuilding: string | null;
  locationFloor: string | null;
  locationRoomIdentifier: string | null;
  locationDescription: string | null;
  ticketCategoryId: number;
  ticketCategoryCode: string;
  ticketCategoryName: string;
  title: string;
  description: string;
  priority: TicketPriority;
  status: TicketStatus;
  preferredContactName: string | null;
  preferredContactEmail: string | null;
  preferredContactPhone: string | null;
  resolutionSummary: string | null;
  rejectionReason: string | null;
  reconsiderationNote: string | null;
  firstRespondedAt: string | null;
  resolvedAt: string | null;
  rejectedAt: string | null;
  closedAt: string | null;
  reconsiderationRequestedAt: string | null;
  reconsiderationReviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
  reconsiderationRequestCount: number;
  staffReviewCount: number;
  adminReviewCount: number;
  assignmentHistory: TicketAssignment[];
};

export type TicketComment = {
  id: number;
  authorUserId: number;
  authorDisplayName: string;
  body: string;
  commentType: CommentType;
  parentCommentId: number | null;
  isEdited: boolean;
  editedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type TicketAttachment = {
  id: number;
  uploadedByUserId: number;
  uploadedByDisplayName: string;
  title: string;
  fileName: string;
  mimeType: string | null;
  fileSize: number;
  createdAt: string;
};

export type TicketCategorySummary = {
  id: number;
  code: string;
  name: string;
  description: string | null;
  isActive: boolean;
};

export type TicketCategoryDetail = {
  id: number;
  code: string;
  name: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type TicketResourceOption = {
  id: number;
  resourceCode: string;
  name: string;
  categoryId: number;
  categoryCode: string;
  categoryName: string;
  locationId: number;
  locationCode: string;
  locationName: string;
  capacity: number | null;
  status: "ACTIVE" | "OUT_OF_SERVICE" | "MAINTENANCE" | "INACTIVE";
  requiresApproval: boolean;
  imageUrl: string | null;
};

export type TicketLocationOption = {
  id: number;
  code: string;
  name: string;
  building: string | null;
  floor: string | null;
  roomIdentifier: string | null;
};

export type TicketFilters = {
  status?: TicketStatus | "";
  priority?: TicketPriority | "";
  ticketCategoryId?: number | "";
  search?: string;
};

export type CreateTicketRequest = {
  reporterUserId?: number;
  resourceId?: number;
  locationId?: number;
  ticketCategoryId: number;
  title: string;
  description: string;
  priority: TicketPriority;
  preferredContactName?: string;
  preferredContactEmail?: string;
  preferredContactPhone?: string;
};

export type CreateTicketSubmission = {
  request: CreateTicketRequest;
  attachments: TicketAttachmentUpload[];
};

export type UpdateTicketAssignmentRequest = {
  assignedStaffUserId: number;
  assignmentNote?: string;
};

export type UpdateTicketRequest = {
  resourceId?: number;
  locationId?: number;
  ticketCategoryId: number;
  title: string;
  description: string;
  priority: TicketPriority;
  preferredContactName?: string;
  preferredContactEmail?: string;
  preferredContactPhone?: string;
};

export type UpdateTicketStatusRequest = {
  status: TicketStatus;
  resolutionSummary?: string;
  rejectionReason?: string;
};

export type RequestTicketReconsiderationRequest = {
  note: string;
};

export type CreateTicketCommentRequest = {
  body: string;
  commentType: Extract<CommentType, "PUBLIC_REPLY" | "INTERNAL_NOTE">;
  parentCommentId?: number;
};

export type UpdateTicketCommentRequest = {
  body: string;
};

export type TicketAttachmentUpload = {
  file: File;
};

export type CreateTicketCategoryRequest = {
  code: string;
  name: string;
  description?: string;
  isActive?: boolean;
};

export type UpdateTicketCategoryRequest = {
  code?: string;
  name?: string;
  description?: string;
  isActive?: boolean;
};

export type TicketBundle = {
  detail: TicketDetail;
  comments: TicketComment[];
  attachments: TicketAttachment[];
};

export type TicketAttachmentDraft = {
  id: string;
  file: File | null;
  previewUrl: string | null;
  fileName: string;
  mimeType: string;
  fileSize: number | null;
};

export type CreateTicketFormValues = {
  reporterUserId: string;
  resourceId: string;
  locationId: string;
  ticketCategoryId: string;
  title: string;
  description: string;
  priority: TicketPriority;
  preferredContactName: string;
  preferredContactEmail: string;
  preferredContactPhone: string;
  attachments: TicketAttachmentDraft[];
};

export type TicketCommentFormValues = {
  body: string;
  commentType: Extract<CommentType, "PUBLIC_REPLY" | "INTERNAL_NOTE">;
};

export type TicketStatusFormValues = {
  status: TicketStatus | "";
  resolutionSummary: string;
  rejectionReason: string;
};

export type TicketAssignmentFormValues = {
  assignedStaffUserId: string;
  assignmentNote: string;
};

export type TicketCategoryFormValues = {
  code: string;
  name: string;
  description: string;
  isActive: boolean;
};

export type TicketWorkspaceBootstrap = {
  role: RoleCode;
  tickets: TicketSummary[];
  categories: TicketCategorySummary[];
  locations: TicketLocationOption[];
  resources: TicketResourceOption[];
  activeStaffUsers: AdminUserSummary[];
  reporterUsers: AdminUserSummary[];
  selectedBundle: TicketBundle | null;
};

export type ApiErrorResponse = {
  message?: string;
  code?: string;
  validationErrors?: Record<string, string>;
};

export type TicketReportRecord = {
  id: number;
  generatedByUserId: number;
  generatedByDisplayName: string;
  reportType: TicketReportType;
  format: TicketReportFormat;
  status: TicketReportStatus;
  recordCount: number;
  fileName: string;
  mimeType: string;
  filterSummary: string | null;
  summaryText: string | null;
  naturalLanguageRequest: string | null;
  generatedAt: string;
};

export type GenerateTicketReportRequest = {
  ticketId?: number;
  ticketNumber?: string;
  reportType: TicketReportType;
  format: TicketReportFormat;
  status?: TicketStatus;
  priority?: TicketPriority;
  ticketCategoryId?: number;
  locationId?: number;
  resourceId?: number;
  assignedStaffUserId?: number;
  reporterUserId?: number;
  startDate?: string;
  endDate?: string;
  naturalLanguageRequest?: string;
};

export type TicketReportAssistantInterpretRequest = {
  message: string;
};

export type TicketReportAssistantResponse = {
  assistantEnabled: boolean;
  needsClarification: boolean;
  clarificationQuestion: string | null;
  interpretationSummary: string | null;
  interpretedRequest: GenerateTicketReportRequest | null;
};

export type TicketAssistantIntent =
  | "STATUS_QUERY"
  | "HISTORY_SUMMARY"
  | "FAQ"
  | "CREATION_HELP"
  | "DUPLICATE_CHECK"
  | "PRIORITY_RECOMMENDATION"
  | "CATEGORY_RECOMMENDATION"
  | "REMINDER"
  | "RESOLUTION_EXPLANATION"
  | "COMMENT_ASSISTANT"
  | "REPORT_HELP"
  | "INSIGHTS"
  | "UNKNOWN";

export type TicketAssistantQueryRequest = {
  message: string;
  selectedTicketId?: number;
};

export type RefineTicketDescriptionRequest = {
  title?: string;
  description: string;
};

export type RefineTicketDescriptionResponse = {
  assistantEnabled: boolean;
  improvedDescription: string;
};

export type TicketAssistantResponse = {
  assistantEnabled: boolean;
  intent: TicketAssistantIntent;
  title: string;
  message: string;
  highlights: string[];
  suggestedActions: string[];
  relatedTickets: TicketSummary[];
  suggestedComment: string | null;
  improvedDescription: string | null;
  recommendedPriority: TicketPriority | null;
  recommendedCategoryId: number | null;
  recommendedCategoryCode: string | null;
  recommendedCategoryName: string | null;
  reportSuggestion: GenerateTicketReportRequest | null;
  reportSuggestionSummary: string | null;
};
