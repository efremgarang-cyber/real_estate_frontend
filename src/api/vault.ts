// src/api/vault.ts

import { api } from '../lib/api';
import axios from 'axios';
import { PresignedUrlRequest, PresignedUrlResponse, KycDocument, SecureDocumentType } from '../types';

export interface GetDocumentsParams {
  search?: string;
  category?: string;
  status?: string;
  date_range?: string;
  page?: number;
  limit?: number;
}

export const vaultApi = {
  /**
   * 1. Get a secure AWS pre-signed upload URL from Laravel
   */
  getPresignedUploadUrl: async (payload: PresignedUrlRequest): Promise<PresignedUrlResponse> => {
    // FIXED: Correct endpoint spelling
    const response = await api.post<PresignedUrlResponse>('/vault/presigned-upload-url', payload);
    return response.data;
  },

  /**
   * 2. Upload file binary directly to S3 storage bucket using the retrieved URL
   */
  uploadFileToS3: async (presignedUrl: string, file: File, mimeType: string): Promise<void> => {
    await axios.put(presignedUrl, file, {
      headers: {
        'Content-Type': mimeType,
      },
    });
  },

  /**
   * Orchestrated workflow execution helper
   * FIXED: Use 'file_category' instead of 'document_type' to match Laravel validation
   */
  executeSecureUpload: async (
    file: File, 
    documentType: SecureDocumentType, 
    clientId: string
  ): Promise<string> => {
    
    // Step 1: Request upload token & destination path from Laravel
    const { upload_url, file_path } = await vaultApi.getPresignedUploadUrl({
      client_filename: file.name,  // Required by Laravel validation
      mime_type: file.type,        // Maps to mime_type
      file_category: documentType, // CHANGED: 'document_type' -> 'file_category'
      client_id: clientId,         // Maps to client_id
    });

    // Step 2: Upload raw binary directly to S3 bucket storage bypass
    await vaultApi.uploadFileToS3(upload_url, file, file.type);

    // Return S3 object reference key back for backend database persistence mapping
    return file_path;
  },

  /**
   * 3. Get all documents with optional filters
   */
  getDocuments: async (params?: GetDocumentsParams): Promise<{ data: KycDocument[]; total: number }> => {
    const cleanedParams: Record<string, any> = {};

    if (params?.search) cleanedParams.search = params.search;
    if (params?.category && params.category !== 'all') cleanedParams.category = params.category;
    if (params?.status && params.status !== 'all') cleanedParams.status = params.status;
    if (params?.date_range && params.date_range !== 'all') cleanedParams.date_range = params.date_range;
    if (params?.page) cleanedParams.page = params.page;
    if (params?.limit) cleanedParams.limit = params.limit;

    const response = await api.get('/vault/documents', { params: cleanedParams });
    
    return {
      data: response.data.data || response.data || [],
      total: response.data.total || (response.data.data?.length || 0),
    };
  },

  /**
   * 4. Get single document by ID
   */
  getDocumentById: async (documentId: string | number): Promise<KycDocument> => {
    const response = await api.get(`vault/documents/${documentId}`);
    return response.data.data || response.data;
  },

  /**
   * 5. Update document status
   */
  updateDocumentStatus: async (documentId: string | number, status: string): Promise<KycDocument> => {
    const response = await api.patch(`/vault/documents/${documentId}/status`, { status });
    return response.data.data || response.data;
  },

  /**
   * 6. Delete document
   */
  deleteDocument: async (documentId: string | number): Promise<void> => {
    await api.delete(`/vault/documents/${documentId}`);
  },

  /**
   * 7. Get document download URL
   */
  getDocumentDownloadUrl: async (documentId: string | number): Promise<string> => {
    const response = await api.get(`/vault/documents/${documentId}/download`);
    return response.data.url || response.data.download_url;
  },
};