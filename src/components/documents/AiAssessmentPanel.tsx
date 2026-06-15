interface AiAssessmentProps {
    status: 'pending' | 'ai_verified' | 'ai_flagged';
    score: number | null;
    reasoning: string | null;
}

export function AiAssessmentPanel({ status, score, reasoning }: AiAssessmentProps) {
    if (!status || status === 'pending') {
        return (
            <div className="mt-4 p-4 bg-gray-50">
                <span className="text-sm font-medium text-gray-500">AI Assessment: Pending processing...</span>
            </div>
        );
    }

    const isVerified = status === 'ai_verified';
    const statusText = isVerified ? 'VERIFIED' : 'FLAGGED';
    const textColor = isVerified ? 'text-green-600' : 'text-red-600';

    return (
        <div className="mt-4 p-4 bg-gray-50 flex flex-col gap-3">
            <h3 className="text-sm font-semibold text-gray-900">Makao Agent AI Analysis</h3>
            
            <div className="flex items-center gap-6 text-sm">
                <div>
                    Assessment: <span className={`font-bold ${textColor}`}>{statusText}</span>
                </div>
                {score !== null && (
                    <div>
                        Confidence: <span className="font-bold text-gray-900">{score}%</span>
                    </div>
                )}
            </div>

            {reasoning && (
                <div className="mt-2 text-sm text-gray-700 bg-white p-3 shadow-sm">
                    <strong>Reasoning:</strong> {reasoning}
                </div>
            )}
        </div>
    );
}