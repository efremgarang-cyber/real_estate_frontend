// 📁 File: src/api/escrow.ts
//const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000/api/v1';
// 📁 File: src/api/escrow.ts

// ⚡ Replace 'makao_backend_folder' with the actual folder name of your Laravel app inside htdocs
const API_BASE = 'http://127.0.0.1:8000/api/v1';
// Helper to handle fetch responses safely without parsing HTML errors as JSON
const handleResponse = async (response: Response) => {
  if (!response.ok) {
    const errorText = await response.text();
    let errorMessage = 'Request failed';
    try {
      const errorJson = JSON.parse(errorText);
      errorMessage = errorJson.error || errorJson.message || errorMessage;
    } catch {
      errorMessage = `Server Error (${response.status}): Path endpoint mismatch or backend offline.`;
    }
    throw new Error(errorMessage);
  }
  return await response.json();
};

export const escrowApi = {
  // Get all escrow agreements
  getAll: async () => {
    // Fixed: Ensure no trailing slash or path mismatch is causing the 404 in image_f1b13c.png
    const res = await fetch(`${API_BASE}/escrow`);
    return await handleResponse(res);
  },

  // Initialize a wallet or general platform deposit via Paystack
  initializeDeposit: async (payload: { amount: number; email: string }) => {
    const res = await fetch(`${API_BASE}/deposit/initialize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return await handleResponse(res);
  },

  // Initialize escrow and get Paystack payment link
  initialize: async (payload: {
    clientEmail: string;
    providerEmail: string;
    providerPhone: string;
    amount: number;
    description?: string;
  }) => {
    const res = await fetch(`${API_BASE}/escrow`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return await handleResponse(res);
  },

  // Release funds (transfer to provider)
  release: async (escrowId: string | number) => {
    const res = await fetch(`${API_BASE}/escrow/release`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ escrowId }),
    });
    return await handleResponse(res);
  },

  // Refund funds to client
  refund: async (escrowId: string | number) => {
    const res = await fetch(`${API_BASE}/escrow/refund`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ escrowId }),
    });
    return await handleResponse(res);
  },

  // Get a single escrow by ID
  getOne: async (escrowId: string | number) => {
    const res = await fetch(`${API_BASE}/escrow/${escrowId}`);
    return await handleResponse(res);
  },

  // Validate deliverable with AI
  validateDeliverable: async (payload: {
    escrowId: string | number;
    deliverableImageUrl: string;
    criteriaVerificationRules: string;
  }) => {
    const res = await fetch(`${API_BASE}/agent/escrow/validate-deliverable`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return await handleResponse(res);
  },
};