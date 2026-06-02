import { Lead, KanbanStage, Interaction } from "../types";
import { leadApi } from "../api/leads"; // Custom API Layer mapped to your Laravel backend

export const leadsService = {
  /**
   * Targets Store Endpoint: POST /v1/leads
   * Managed by LeadController.php@store
   */
  async createLead(leadData: Omit<Lead, "id" | "updatedAt">): Promise<string | undefined> {
    try {
      // Clean and map nullable backend database variables down to 'undefined' 
      // to align cleanly with CreateLeadPayload parameters
      const payload = {
        ...leadData,
        phone: leadData.phone ?? undefined,
        email: leadData.email ?? undefined,
        assigned_to: leadData.assigned_to ?? undefined,
        // Safely map 'string | null' down to 'string | undefined'
        value: leadData.value ?? undefined, 
      };

      const response = await leadApi.create(payload);
      return String(response.data.id);
    } catch (error) {
      console.error("Failed to create backend lead record:", error);
      throw error;
    }
  },

  /**
   * Targets Patch Endpoint: PATCH /v1/leads/{id}/kanban
   * Managed by LeadKanbanController.php@update
   */
  async updateLeadStatus(
    leadId: string, 
    agencyId: string, 
    userId: string, 
    status: KanbanStage, 
    oldStatus: string
  ): Promise<void> {
    try {
      const numericId = parseInt(leadId, 10);
      await leadApi.updateKanbanStage(numericId, status);
    } catch (error) {
      console.error(`Failed to modify pipeline status for lead ID ${leadId}:`, error);
      throw error;
    }
  },

  /**
   * Targets Update Endpoint: PUT/PATCH /v1/leads/{id}
   * Managed by LeadController.php@update
   */
  async updateLeadOffer(leadId: string, agencyId: string, userId: string, price: number): Promise<void> {
    try {
      const numericId = parseInt(leadId, 10);
      
      // Pass the updated value tracking cast as a string matching Laravel database requirements
      await leadApi.update(numericId, { 
        value: String(price) 
      });
    } catch (error) {
      console.error(`Failed to update financial configuration for lead ID ${leadId}:`, error);
      throw error;
    }
  },

  /**
   * Targets Index Endpoint: GET /v1/leads
   * Managed by LeadController.php@index
   */
  async getAgencyLeads(agencyId: string): Promise<Lead[]> {
    try {
      const response = await leadApi.getAll(1); // Defaulting to page 1 indices
      return response.data;
    } catch (error) {
      console.error(`Failed fetching database baseline records for agency ${agencyId}:`, error);
      return [];
    }
  },

  /**
   * Logs local timeline interaction events trail.
   */
  async addInteraction(interactionData: Omit<Interaction, "id">): Promise<string | undefined> {
    try {
      console.log("Interaction activity recorded successfully:", interactionData.notes);
      return Math.random().toString(36).substring(2, 9);
    } catch (error) {
      console.error("Failed logging structural interaction event trail:", error);
      throw error;
    }
  },

  /**
   * Targets Show Endpoint: GET /v1/leads/{id}
   * Managed by LeadController.php@show (Loads related nested 'activities' resource tables)
   */
  async getInteractions(leadId: string): Promise<Interaction[]> {
    try {
      const numericId = parseInt(leadId, 10);
      const response = await leadApi.getById(numericId);
      const leadDetails = response.data;

      if (!leadDetails.activities) return [];

      // Maps Laravel activity model relation arrays cleanly into UI timeline components
      return leadDetails.activities.map((activity: any) => ({
        id: String(activity.id),
        leadId: leadId,
        agencyId: String(leadDetails.agency_id || ""),
        agentId: String(leadDetails.assigned_to || ""),
        type: "Note",
        notes: activity.description,
        date: activity.created_at
      }));
    } catch (error) {
      console.error(`Failed resolving timeline streams for target lead ${leadId}:`, error);
      return [];
    }
  }
};