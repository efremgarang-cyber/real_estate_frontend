/**
 * Lightweight stub for AI evaluator used during local development and typechecking.
 * This avoids pulling in the real Google GenAI SDK during builds.
 */
export const ArcAiEvaluator = {
  async evaluateSubmitedWork(_escrowId: string): Promise<{ decision: 'APPROVE' | 'REJECT'; reasoning: string } | null> {
    console.warn('ArcAiEvaluator.evaluateSubmitedWork is a stub in this environment.');
    return null;
  }
};
