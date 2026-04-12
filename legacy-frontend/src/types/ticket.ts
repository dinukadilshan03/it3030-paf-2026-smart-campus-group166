export type TicketStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED' | 'REJECTED';
export type TicketPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface TicketAssignment {
  id: number;
  ticketId: number;
  technicianId: number;
  technicianName: string;
  technicianEmail: string;
  assignedById: number;
  assignedByName: string;
  assignedAt: string;
}

export interface TicketComment {
  id: number;
  ticketId: number;
  userId: number;
  userName: string;
  userEmail: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface TicketAttachment {
  id: number;
  ticketId: number;
  fileName: string;
  fileUrl: string;
  fileType: string | null;
  fileSize: number | null;
  uploadedAt: string;
}

export interface TicketSummary {
  id: number;
  resourceId: number;
  resourceName: string;
  resourceType: string | null;
  resourceLocation: string | null;
  reportedById: number;
  reportedByName: string;
  reportedByEmail: string;
  category: string;
  priority: TicketPriority;
  description: string;
  status: TicketStatus;
  preferredContact: string | null;
  resolutionNotes: string | null;
  rejectionReason: string | null;
  currentAssignment: TicketAssignment | null;
  createdAt: string;
  updatedAt: string;
}

export interface TicketDetails {
  ticket: TicketSummary;
  assignments: TicketAssignment[];
  comments: TicketComment[];
  attachments: TicketAttachment[];
}

export interface TicketFilters {
  status?: string;
  priority?: string;
  category?: string;
  search?: string;
}

export interface TicketWorkflowUpdate {
  status: TicketStatus;
  resolutionNotes?: string;
  rejectionReason?: string;
}
