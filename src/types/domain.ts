export type UserRole = "customer" | "driver" | "admin";

export type DriverApprovalStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "suspended";

export type JobStatus =
  | "draft"
  | "submitted"
  | "matching"
  | "offered"
  | "assigned"
  | "in_progress"
  | "completed"
  | "cancelled";

export interface RecoveryJob {
  id: string;
  customerId: string;
  recoveryType: string;
  pickupPostcode: string;
  destinationPostcode?: string;
  vehicleRegistration?: string;
  vehicleType?: string;
  isUrgent: boolean;
  estimatedQuoteGbp?: number;
  status: JobStatus;
}
