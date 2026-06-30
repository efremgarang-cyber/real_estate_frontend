import { KycDocument } from "../types";
import axios from "axios"; // Used to execute independent raw binary PUT streams directly to AWS S3
import { documentApi } from "../api/documents"; 

export const kycService = {
  /**
   * Handles the Secure AWS 2-Step Storage Pipeline
   * Targets Endpoint: POST /v1/vault/documents
   * Managed by DocumentUploadController.php@store
   */
  async addDocument(
    docData: Omit<KycDocument, "id" | "updatedAt"> & { file?: File }
  ): Promise<string | undefined> {
    try {
      if (!docData.file) {
        throw new Error("A physical file target is required for direct cloud uploads.");
      }

      // Step 1: Request an authorized AWS Presigned URL from the Laravel backend
       const response = await documentApi.generatePresignedUrl({
         file_name: docData.file.name,
         mime_type: docData.file.type,
         document_type: docData.type || '',
       });

      const { upload_url, file_path } = response.data;

      // Step 2: Stream the raw binary file context directly to AWS S3 using the ephemeral link
      await axios.put(upload_url, docData.file, {
        headers: { "Content-Type": docData.file.type }
      });

      // Return the final file path reference back to the caller component
      return file_path;
    } catch (error) {
      console.error("Failed executing secure AWS compliance pipeline:", error);
      throw error;
    }
  },

  /**
   * Modifies authorization state visibility flags on target validation blocks
   * Targets Endpoint: PATCH /v1/vault/documents/{id}/status
   */
  async updateStatus(docId: string, agencyId: string, status: KycDocument["status"]): Promise<void> {
    try {
      const numericId = parseInt(docId, 10);
      await documentApi.updateDocumentStatus(numericId, { status });
    } catch (error) {
      console.error(`Failed updating status verification flags on entry ${docId}:`, error);
      throw error;
    }
  },

  /**
   * Replaces Firebase's real-time listener with a short-polling loop strategy
   * Targets Endpoint: GET /v1/vault/documents
   */
  subscribeToAgencyKyc(agencyId: string, callback: (docs: KycDocument[]) => void): () => void {
    let isSubscribed = true;

    const fetchDocuments = async () => {
      try {
        const response = await documentApi.getAgencyDocuments({ agencyId });
        if (isSubscribed) {
          callback(response.data.data);
        }
      } catch (error) {
        console.error("Polling sync error on compliance records:", error);
      }
    };

    // Immediate initial execution
    fetchDocuments();

    // Query server for status updates changes every 10 seconds
    const intervalId = setInterval(fetchDocuments, 10000);

    // Returns structural cleanup callback hook for React's useEffect unmount cycles
    return () => {
      isSubscribed = false;
      clearInterval(intervalId);
    };
  }
};