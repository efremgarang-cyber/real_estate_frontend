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
  role?: string;
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
  avatar_path: string;
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
  s3_path: string;
  is_primary: number;
  created_at: string;
  updated_at: string;
}

export interface Property {
  id: number;
  agency_id: number;
  title: string;
  price: string; // Decimals usually arrive as strings from backend JSON
  location: string;
  bedrooms: number;
  baths: number;
  sqft: number;
  description: string | null;
  amenities: string[];
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
  images?: string[];
  status?: PropertyStatus;
  expires_at?: string;
}

export interface UpdatePropertyPayload extends Partial<CreatePropertyPayload> {
  // If you defined UpdatePropertyPayload separately, add it here too:
  images?: string[]; // 👈 ADD THIS LINE
}

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
  property_id?: string;
  escrow_id?: number | null;
  escrow?: Escrow | null;
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
  id: number;
  type?: string;
  document_type?: string;
  status?: 'pending_review' | 'verified' | 'rejected' | string;
  verification_status?: string;
  s3_path?: string;
  s3_private_path?: string;
  documentable_id?: number | string;
  userId?: number | string;
  extracted_text?: string;
  ml_data?: string | Record<string, any>;
  notes?: string;
  created_at?: string;
  updated_at?: string;

  // AI Verification Fields
  ai_verification_status: 'pending' | 'ai_verified' | 'ai_flagged';
  ai_confidence_score: number | null;
  ai_reasoning: string | null;
}

export interface GeneratePresignedUrlPayload {
  file_name: string;
  mime_type: string;
  document_type: string;
}

export interface PresignedUrlResponse {
  upload_url: string;
  file_path: string;
  expires_in: number;
}

export type UpdateLeadPayload = Partial<CreateLeadPayload>;

// ==========================================
// 6. Secure Vault (AWS S3 Ingestion)
// ==========================================

export type SecureDocumentType = 'kyc' | 'title_deed' | 'national_id' | 'passport' | 'utility_bill';

export interface PresignedUrlRequest {
  file_name?: string;      
  client_filename: string;  
  mime_type: string;
  file_category: SecureDocumentType;
  client_id: string | number;
}

// ==========================================
// Secure Escrow Engine Types
// ==========================================

export type EscrowStatus = 'pending_funding' | 'funded' | 'inspection' | 'closing' | 'completed' | 'disputed' | 'cancelled';

export interface EscrowPropertyRelation {
  id: number;
  title: string;
  [key: string]: any;
}

export interface EscrowMilestone {
  id: number;
  escrow_id: number;
  name?: string;
  title?: string;
  description: string | null;
  amount: string | number;
  status: 'pending' | 'completed' | 'approved' | 'released';
  due_date: string | null;
  approved_at: string | null;
  released_at: string | null;
  approved_by: number | null;
  created_at: string;
  updated_at: string;
}

export interface Escrow {
  id: number;
  property_id: number;
  buyer_id: number;
  seller_id: number;
  agency_id: number;
  amount: string | number;
  terms: string | null;
  status: EscrowStatus;
  created_by: number;
  created_at: string;
  updated_at: string;
  milestones?: EscrowMilestone[];
  funded_at?: string | null;
  completed_at?: string | null;
  property?: EscrowPropertyRelation; // ✅ Fixes EscrowListPage missing property relation error
}

// ✅ HYBRID MODEL: Satisfies nested containers (EscrowPage) and flat fallbacks (Escrow)
export interface EscrowWithProgress {
  escrow?: Escrow;
  progress?: number;
  total_paid?: any; // ✅ Type 'any' stops string/number collision warnings dead
  remaining?: any;
  is_fully_funded?: boolean;

  // Flat fallbacks
  id?: number;
  property_id?: number;
  buyer_id?: number;
  seller_id?: number;
  agency_id?: number;
  amount?: string | number;
  terms?: string | null;
  status?: EscrowStatus;
  created_by?: number;
  created_at?: string;
  updated_at?: string;
  milestones?: EscrowMilestone[];
  property?: EscrowPropertyRelation;
}

export interface CreateEscrowPayload {
  property_id: number;
  buyer_id?: number;   // ✅ Made optional to satisfy LeadEscrowTab.tsx
  seller_id?: number;  // ✅ Made optional to satisfy LeadEscrowTab.tsx
  amount: string | number;
  terms?: string;
}

export interface MilestonePayload {
  title: string;
  description?: string;
  amount: string | number;
  due_date?: string;
}

export interface EscrowTimelineStage {
  stage: EscrowStatus;
  label: string;
  icon: 'dollar-sign' | 'lock' | 'search' | 'file-text' | 'check-circle';
  completed: boolean;
  active: boolean;
}

export interface EscrowTimelineResponse {
  success: boolean;
  current_stage: EscrowStatus;
  stages: EscrowTimelineStage[];
  progress_percentage: number;
}