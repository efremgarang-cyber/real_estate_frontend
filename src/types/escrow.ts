export interface EscrowMilestone {
  id: number;
  escrow_id: number;
  name: string;
  description: string | null;
  amount: number;
  status: 'pending' | 'approved' | 'released';
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
  amount: number;
  terms: string | null;
  status: 'pending_funding' | 'funded' | 'inspection' | 'closing' | 'completed' | 'disputed' | 'cancelled';
  funded_at: string | null;
  completed_at: string | null;
  created_by: number;
  created_at: string;
  updated_at: string;
  property?: {
    id: number;
    title: string;
    location: string;
  };
  buyer?: {
    id: number;
    name: string;
    email: string;
  };
  seller?: {
    id: number;
    name: string;
    email: string;
  };
  payments?: Array<{
    id: number;
    amount: number;
    status: string;
    receipt_number: string | null;
    paid_at: string | null;
  }>;
  milestones?: EscrowMilestone[];
}

export interface EscrowWithProgress extends Escrow {
  progress: number;
  total_paid: number;
  remaining: number;
  is_fully_funded: boolean;
}

export interface CreateEscrowPayload {
  property_id: number;
  amount: number;
  terms?: string;
}

export interface MilestonePayload {
  name: string;
  description?: string;
  amount: number;
}
