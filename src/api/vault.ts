import { supabase } from "../lib/supabase";
import { api } from "../lib/api";

export const vaultApi = {
  executeSecureUpload: async (file: File, documentType: 'kyc' | 'title_deed' | 'property_image'): Promise<string> => {
    const bucketName = import.meta.env.VITE_SUPABASE_BUCKET;
    
    if (!bucketName) {
        throw new Error('Storage bucket name is missing from environment variables.');
    }

    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    
    // Nests Makao uploads in a dedicated folder
    const filePath = `makao/${documentType}s/${fileName}`; 

    const { error } = await supabase.storage
      .from(bucketName) 
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type
      });

    if (error) {
      console.error('Supabase upload error:', error);
      throw new Error('Failed to upload file to storage bucket.');
    }

    // CRITICAL FIX: Return the raw internal path, NOT the public URL.
    // This is what gets saved to the Laravel database as `s3_path`.
    return filePath; 
  },

  getDocuments: async (params?: { search?: string; category?: string; status?: string; date_range?: string }) => {
    return api.get('/v1/vault/documents', { params });
  },

  getSignedUrl: async (filePath: string): Promise<string> => {
    const bucketName = import.meta.env.VITE_SUPABASE_BUCKET;
    if (!bucketName || !filePath) return filePath;

    // If it's already a full HTTP URL (e.g., an external placeholder or old data), just return it
    if (filePath.startsWith('http')) return filePath;

    // Request a secure URL valid for 1 hour (3600 seconds) using the raw path
    const { data, error } = await supabase.storage
      .from(bucketName)
      .createSignedUrl(filePath, 3600);

    if (error || !data) {
      console.error("Failed to sign URL:", error);
      return filePath; // Fallback
    }

    return data.signedUrl;
  }
};