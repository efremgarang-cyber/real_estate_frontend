import { GoogleGenAI, Type } from '@google/genai';
import { supabase } from '../supabase';
import { EscrowEngine } from './escrowEngine';

// Initialize the Google Gen AI SDK (Automatically pulls GEMINI_API_KEY from process.env)
const ai = new GoogleGenAI();

interface EvaluationResult {
  decision: 'APPROVE' | 'REJECT';
  reasoning: string;
}

export const ArcAiEvaluator = {
  /**
   * Automatically inspects a submitted escrow job and triggers financial settlement.
   * @param escrowId Unique identifier of the target arc_escrow row.
   */
  async evaluateSubmitedWork(escrowId: string): Promise<EvaluationResult | null> {
    try {
      // 1. Fetch the exact contract terms and submission artifacts from Supabase
      const { data: escrow, error: dbError } = await supabase
        .from('arc_escrows')
        .select('contract_details, deliverable_url, status')
        .eq('id', escrowId)
        .single();

      if (dbError || !escrow) {
        throw new Error(`Failed to retrieve escrow contract data: ${dbError?.message}`);
      }

      // Pre-flight check: Ensure the escrow state machine is locked at SUBMITTED
      if (escrow.status !== 'SUBMITTED') {
        throw new Error(`Escrow ${escrowId} is in status '${escrow.status}'. Evaluation requires 'SUBMITTED'.`);
      }

      // 2. Execute the evaluation request using Gemini 2.5 Flash with structured schema enforcement
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
          `You are an elite autonomous escrow validation agent enforcing the ERC-8183 protocol. Your job is to strictly compare the Contract Rules against the Provided Deliverable Proof.
          
          CONTRACT RULES/CRITERIA:
          "${escrow.contract_details}"
          
          PROVIDED DELIVERABLE PROOF OR LINK:
          "${escrow.deliverable_url}"
          
          Determine if the criteria have been completely and honestly fulfilled. If they are met, choose "APPROVE". If there are missing requirements, deviations, or unverifiable entries, choose "REJECT".`
        ],
        config: {
          // Enforce strict JSON output matching our internal TypeScript interface
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              decision: { 
                type: Type.STRING, 
                enum: ['APPROVE', 'REJECT'],
                description: 'The final, definitive verdict on the escrow contract.'
              },
              reasoning: { 
                type: Type.STRING, 
                description: 'A brief, objective, 2-sentence explanation justifying the decision.'
              }
            },
            required: ['decision', 'reasoning']
          }
        }
      });

      const responseText = response.text;
      if (!responseText) {
        throw new Error('Gemini API returned an empty execution payload.');
      }

      // 3. Parse the verified structural output
      const result: EvaluationResult = JSON.parse(responseText);

      // 4. Commit the result to the state engine to finalize the lifecycle
      await EscrowEngine.adjudicate(escrowId, result.decision, `[AI Autonomous Agent]: ${result.reasoning}`);

      return result;

    } catch (err: any) {
      console.error(`🚨 Escrow AI Evaluation Failure [ID: ${escrowId}]:`, err.message);
      
      // Production Fallback: Log failure trace to the database so the contract isn't permanently stuck
      await supabase
        .from('arc_escrows')
        .update({ evaluation_notes: `AI Thread Fault: ${err.message}. Awaiting manual administrator intervention.` })
        .eq('id', escrowId);

      return null;
    }
  }
};