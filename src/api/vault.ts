import { supabase } from "../lib/supabase";

export const vaultApi = {
  executeSecureUpload: async (file: File, documentType: 'kyc' | 'title_deed' | 'property_image'): Promise<string> => {
    const bucketName = import.meta.env.VITE_SUPABASE_BUCKET;
    
    if (!bucketName) {
        throw new Error('Storage bucket name is missing from environment variables.');
    }

    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    
    // Nests Makao uploads in a dedicated folder to separate them from Drive X files
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

    const { data: { publicUrl } } = supabase.storage
      .from(bucketName)
      .getPublicUrl(filePath);

    return publicUrl;
  },

  getSignedUrl: async (publicUrl: string): Promise<string> => {
    const bucketName = import.meta.env.VITE_SUPABASE_BUCKET;
    if (!bucketName || !publicUrl) return publicUrl;

    // Detect if the URL is an unsigned Supabase URL
    const pathMarker = `/object/public/${bucketName}/`;
    if (!publicUrl.includes(pathMarker)) return publicUrl; // Skip if it's already signed or external

    // Extract the raw file path (e.g., "makao/property_images/1780405189441.jpg")
    const filePath = publicUrl.split(pathMarker)[1];

    // Request a secure URL valid for 1 hour (3600 seconds)
    const { data, error } = await supabase.storage
      .from(bucketName)
      .createSignedUrl(filePath, 3600);

    if (error || !data) {
      console.error("Failed to sign URL:", error);
      return publicUrl; // Fallback to original if signing fails
    }

    return data.signedUrl;
  }
};