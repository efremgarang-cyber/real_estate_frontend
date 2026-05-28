// ==========================================
// 1. Shared & Generic API Formats
// ==========================================

export interface SuccessMessage {
  message: string;
}

export interface APICollectionResponse<T> {
  data: T[];
}

export interface PaginatedMetaLink {
  url: string | null;
  label: string;
  active: boolean;
}

export interface PaginatedResponseLinks {
  first: string;
  last: string;
  prev: string | null;
  next: string | null;
}

export interface PaginatedResponseMeta {
  current_page: number;
  from: number | null;
  last_page: number;
  links: PaginatedMetaLink[];
  path: string;
  per_page: number;
  to: number | null;
  total: number;
}

// Global wrap for Laravel's standard Paginated Resources
export interface PAGINATED_RESPONSE<T> {
  data: T[];
  links: PaginatedResponseLinks;
  meta: PaginatedResponseMeta;
}

// ==========================================
// 2. Authentication & User Workspace
// ==========================================
export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  agency_code: string; 
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface User {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'broker' | 'agent';
  agency_id: number | null;
}

export interface UserProfile {
  id: number;
  email: string;
  role: 'Admin' | 'Agent';
  agencyId: number;
  name: string;
}

export interface AuthResponse {
  token: string;
  user: User;
  profile?: UserProfile | null;
}

// ==========================================
// 3. Team & Agent Management
// ==========================================

export interface Agent {
  id: number;
  agency_id: number;
  name: string;
  email: string;
  role: 'agent';
  created_at: string;
  updated_at: string;
}

export interface CreateAgentPayload extends LoginCredentials {
  name: string;
}

// ==========================================
// 4. Property Engine
// ==========================================

export type PropertyStatus = 'Active' | 'Pending' | 'Sold' | 'Expired';

export interface PropertyImage {
  id: number;
  property_id: number;
  url: string;
  created_at: string;
}

export interface Property {
  id: number;
  agency_id: number;
  title: string;
  price: string; // Decimals usually arrive as strings from backend JSON
  address: string;
  beds: number;
  baths: number;
  sqft: number;
  description: string | null;
  status: PropertyStatus;
  images?: PropertyImage[] | string[]; // Backed by relationship or direct array serialization
  expires_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreatePropertyPayload {
  title: string;
  price: number | string;
  address: string;
  beds: number;
  baths: number;
  sqft: number;
  description?: string;
  status?: PropertyStatus;
  expires_at?: string;
}

export type UpdatePropertyPayload = Partial<CreatePropertyPayload>;

// ==========================================
// 5. CRM Pipeline & Kanban Leads
// ==========================================

export type KanbanStage = 'new' | 'contacted' | 'showing' | 'offer' | 'escrow' | 'closed' | 'lost';

export interface LeadActivity {
  id: number;
  lead_id: number;
  description: string;
  created_at: string;
}

export interface LeadDocument {
  id: number;
  lead_id: number;
  title: string;
  file_path: string;
  created_at: string;
}

export interface Lead {
  id: number;
  agency_id: number;
  assigned_to: number | null;
  name: string;
  email: string;
  phone: string | null;
  kanban_stage: KanbanStage;
  value: string | null;
  assigned_agent?: Agent | null;
  activities?: LeadActivity[];
  documents?: LeadDocument[];
  created_at: string;
  updated_at: string;
}

export interface Interaction {
  id: string;
  leadId: string;
  agencyId: string;
  agentId: string;
  type: string;
  notes: string;
  date: string;
}

export interface CreateLeadPayload {
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  kanban_stage?: KanbanStage;
  value?: number | string;
  assigned_to?: number;
}

export interface KycDocument {
  id: string;
  agencyId: string;
  userId?: string;
  type: 'passport' | 'national_id' | 'title_deed' | 'utility_bill' | string;
  status: 'pending' | 'approved' | 'rejected';
  filePath: string;
  fileName: string;
  updatedAt: string;
}

// Payload contract specifically matching GenerateUploadUrlRequest.php parameters
export interface GeneratePresignedUrlPayload {
  file_name: string;
  mime_type: string;
  document_type: string; // e.g., 'kyc', 'title_deed'
}

// Response signature matching DocumentUploadController.php response
export interface PresignedUrlResponse {
  upload_url: string;
  file_path: string;
  expires_in: number;
}

export type UpdateLeadPayload = Partial<CreateLeadPayload>;

// ==========================================
// 6. Secure Vault (AWS S3 Ingestion)
// ==========================================

export type SecureDocumentType = 'kyc' | 'title_deed';

export interface PresignedUrlRequest {
  file_name: string;
  mime_type: string;
  document_type: SecureDocumentType;
}

export interface PresignedUrlResponse {
  upload_url: string;
  file_path: string;
  expires_in: number;
}