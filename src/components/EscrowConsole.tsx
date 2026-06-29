import React, { useState } from 'react';
import { useEscrow, EscrowJob } from '../hooks/useEscrow';

interface Props {
  currentEscrow: EscrowJob;
  onUpdate: (updated: EscrowJob) => void;
  currentUserRole: 'TENANT' | 'LANDLORD' | 'INSPECTOR';
  currentUserId: string;
}

export const EscrowConsole: React.FC<Props> = ({ currentEscrow, onUpdate, currentUserRole, currentUserId }) => {
  const { submitHandover, verifyEscrow, loading, error } = useEscrow();
  const [docUrl, setDocUrl] = useState('');
  const [notes, setNotes] = useState('');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OPEN': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'FUNDED': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'SUBMITTED': return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'COMPLETED': return 'bg-green-100 text-green-800 border-green-300';
      case 'REFUNDED': return 'bg-red-100 text-red-800 border-red-300';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto bg-white rounded-xl shadow-md border border-gray-200 mt-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-800">Secure Escrow Ledger</h2>
        <span className={`px-3 py-1 text-xs font-semibold rounded-full border ${getStatusColor(currentEscrow.status)}`}>
          {currentEscrow.status}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-6">
        <div><span className="font-semibold text-gray-800">Escrow ID:</span> {currentEscrow.id}</div>
        <div><span className="font-semibold text-gray-800">Locked Amount:</span> KES {currentEscrow.amount.toLocaleString()}</div>
      </div>

      {error && <div className="p-3 mb-4 text-sm text-red-700 bg-red-50 rounded-lg border border-red-200">{error}</div>}

      {/* LANDLORD INTERACTION ACTION BLOCK */}
      {currentEscrow.status === 'FUNDED' && currentUserRole === 'LANDLORD' && (
        <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
          <h3 className="font-semibold text-sm text-gray-800 mb-2">Upload Property Handover Verification</h3>
          <input 
            type="text" 
            placeholder="Paste signed checklist URL link" 
            className="w-full p-2 border rounded text-sm mb-3 focus:ring-2 focus:ring-blue-500"
            value={docUrl}
            onChange={(e) => setDocUrl(e.target.value)}
          />
          <button 
            disabled={loading || !docUrl}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded text-sm transition"
            onClick={async () => {
              const res = await submitHandover(currentEscrow.id, currentUserId, docUrl);
              if (res) onUpdate(res);
            }}
          >
            {loading ? 'Processing Handshake...' : 'Lock In Handover Proof'}
          </button>
        </div>
      )}

      {/* PLATFORM EVALUATOR / SYSTEM INSPECTOR ADJUDICATION PANEL */}
      {currentEscrow.status === 'SUBMITTED' && currentUserRole === 'INSPECTOR' && (
        <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
          <h3 className="font-semibold text-sm text-gray-800 mb-2">Platform Verification Panel</h3>
          <p className="text-xs text-gray-500 mb-3">Review Uploaded Artifacts: <a href={currentEscrow.handover_documents_url} target="_blank" rel="noreferrer" className="text-blue-600 underline font-medium">View Handover Document</a></p>
          <textarea 
            placeholder="Add structural audit notes here..." 
            className="w-full p-2 border rounded text-sm mb-3 focus:ring-2 focus:ring-blue-500"
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
          <div className="flex gap-3">
            <button 
              disabled={loading}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white font-medium py-2 rounded text-sm transition"
              onClick={async () => {
                const res = await verifyEscrow(currentEscrow.id, 'RELEASE_TO_LANDLORD', notes);
                if (res) onUpdate(res);
              }}
            >
              Approve & Release Funds
            </button>
            <button 
              disabled={loading}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium py-2 rounded text-sm transition"
              onClick={async () => {
                const res = await verifyEscrow(currentEscrow.id, 'REFUND_TO_TENANT', notes);
                if (res) onUpdate(res);
              }}
            >
              Reject & Reverse Payment
            </button>
          </div>
        </div>
      )}
    </div>
  );
};