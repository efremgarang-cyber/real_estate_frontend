import { api } from '../lib/api';
import axios from 'axios';
import { PresignedUrlRequest, PresignedUrlResponse } from '../types';

export const vaultApi = {
  /**
   * 1. Get a secure AWS pre-signed upload URL from Laravel
   */
  getPresignedUploadUrl: async (payload: PresignedUrlRequest): Promise<PresignedUrlResponse> => {
    const response = await api.post<PresignedUrlResponse>('/v1/vault/presigned-upload-url', payload);
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
   */
  executeSecureUpload: async (file: File, documentType: 'kyc' | 'title_deed'): Promise<string> => {
    // Step 1: Request upload token & destination path
    const { upload_url, file_path } = await vaultApi.getPresignedUploadUrl({
      file_name: file.name,
      mime_type: file.type,
      document_type: documentType,
    });

    // Step 2: Upload raw binary directly to S3 bucket storage bypass
    await vaultApi.uploadFileToS3(upload_url, file, file.type);

    // Return S3 object reference key back for backend database persistence mapping
    return file_path;
  },
};