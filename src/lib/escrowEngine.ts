export const EscrowEngine = {
  async adjudicate(escrowId: string | number, decision: string, note?: string) {
    // Lightweight stub for adjudication used by aiEvaluator in development.
    console.info(`[EscrowEngine.adjudicate] escrow=${escrowId} decision=${decision} note=${note}`);
    return { success: true };
  },

  async createAgreement(payload: {
    clientId: string;
    providerId: string;
    evaluatorId?: string;
    budget: number;
    contractDetails?: string;
    durationDays?: number;
  }) {
    // Return a minimal escrow-like object compatible with UI usage
    const now = new Date().toISOString();
    return {
      id: `escrow-local-${Date.now()}`,
      client_id: payload.clientId,
      provider_id: payload.providerId,
      evaluator_id: payload.evaluatorId || null,
      budget: payload.budget,
      contract_details: payload.contractDetails || '',
      status: 'OPEN',
      deliverable_url: null,
      evaluation_notes: null,
      updated_at: now,
      created_at: now,
    };
  },

  async lockFunds(escrowId: string | number) {
    // Simulate transition to FUNDED
    const now = new Date().toISOString();
    return {
      id: escrowId,
      status: 'FUNDED',
      updated_at: now,
      deliverable_url: null,
      evaluation_notes: null,
    };
  },

  async submitDeliverable(escrowId: string | number, providerId: string | number, deliverableUrl: string) {
    // Simulate transition to SUBMITTED and attach deliverable link
    const now = new Date().toISOString();
    return {
      id: escrowId,
      provider_id: providerId,
      status: 'SUBMITTED',
      deliverable_url: deliverableUrl,
      evaluation_notes: null,
      updated_at: now,
    };
  },
};

export default EscrowEngine;
