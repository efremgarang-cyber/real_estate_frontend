import axios from "axios";
import { GeneratePresignedUrlPayload, PresignedUrlResponse, KycDocument } from "../types";

// Replace this with your project's authenticated global Axios base instance if applicable
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api",
  headers: {
    "Content-Type": "application/json",
    "Accept": "application/json",
  }
});

// Automatically inject your bearer session tokens from localStorage/cookies if needed
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("auth_token");
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const documentApi = {
  /**
   * Targets Store Endpoint: POST /v1/vault/documents
   * Routes to DocumentUploadController.php@store
   */
  generatePresignedUrl(payload: GeneratePresignedUrlPayload) {
    return api.post<PresignedUrlResponse>("/v1/vault/documents", payload);
  },

  /**
   * Targets Status Endpoint: PATCH /v1/vault/documents/{id}/status
   */
  updateDocumentStatus(id: number, data: { status: KycDocument["status"] }) {
    return api.patch(`/v1/vault/documents/${id}/status`, data);
  },

  /**
   * Targets Query Collection Endpoint: GET /v1/vault/documents
   */
  getAgencyDocuments(params: { agencyId: string }) {
    return api.get<{ data: KycDocument[] }>("/v1/vault/documents", { params });
  }
};