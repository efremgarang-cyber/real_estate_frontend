import React, { useState, useEffect } from 'react';
import { ShieldCheck, Scale, DollarSign, Activity } from 'lucide-react';
import { api } from '../../lib/api';

export const AdminDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Axios backend consumption block
    api.get('/admin/dashboard/metrics')
      .then(res => { setMetrics(res.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const resolveDispute = async (disputeId: number, action: 'refund_to_buyer' | 'released_to_seller') => {
    const notes = prompt("Enter required legal justification statement notes for record logging:");
    if (!notes || notes.length < 10) return alert("Justification text must contain at least 10 characters.");

    try {
      await api.post(`/admin/disputes/${disputeId}/resolve`, { action, notes });
      alert("Dispute record resolved successfully.");
      window.location.reload();
    } catch (err) {
      alert("Error processing dispute resolution.");
    }
  };

  if (loading) return <div className="p-12 text-center text-xs tracking-wider text-gray-400">Loading system metrics console...</div>;

  return (
    <div className="max-w-6xl mx-auto p-6 text-gray-900 bg-white font-sans">
      <h1 className="text-xl font-black mb-6 flex items-center gap-2">
        <ShieldCheck className="text-indigo-600" size={22} /> Makao Global Financial Administration
      </h1>

      {/* Aggregate Overview Metrics Layout Deck */}
      <div className="grid grid-cols-3 gap-6 mb-8">
        <div className="bg-gray-50 border border-gray-100 rounded-xl p-5">
          <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Total Locked Escrow Assets</span>
          <p className="text-2xl font-black mt-1">Ksh {(metrics?.total_locked_volume || 0).toLocaleString()}</p>
        </div>
        <div className="bg-gray-50 border border-gray-100 rounded-xl p-5">
          <span className="text-[10px] uppercase font-bold text-rose-500 tracking-wider">Active System Dispute Claims</span>
          <p className="text-2xl font-black text-rose-600 mt-1">{metrics?.disputes_count || 0}</p>
        </div>
        <div className="bg-gray-50 border border-gray-100 rounded-xl p-5">
          <span className="text-[10px] uppercase font-bold text-emerald-500 tracking-wider">Platform Revenue Core Cut</span>
          <p className="text-2xl font-black text-emerald-600 mt-1">Ksh {((metrics?.total_locked_volume || 0) * 0.015).toLocaleString()}</p>
        </div>
      </div>

      {/* Active Mediation Workspace Split Table */}
      <div className="border border-gray-100 rounded-xl overflow-hidden shadow-sm mb-6">
        <div className="bg-gray-50/50 px-5 py-4 border-b border-gray-100 flex items-center gap-2">
          <Scale size={16} className="text-gray-500" />
          <h2 className="text-sm font-bold text-gray-800">Pending System Arbitration Cases</h2>
        </div>

        {metrics?.disputes?.length === 0 ? (
          <p className="p-6 text-xs text-center text-gray-400">No active transaction disputes currently flagged.</p>
        ) : (
          <div className="divide-y divide-gray-100">
            {metrics?.disputes?.map((disp: any) => (
              <div key={disp.id} className="p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="max-w-xl">
                  <span className="text-[9px] bg-rose-100 text-rose-700 px-2 py-0.5 rounded font-bold uppercase tracking-wider">Dispute Claim #{disp.id}</span>
                  <p className="text-xs font-bold text-gray-900 mt-1">Reason: <span className="font-normal text-gray-600">{disp.reason}</span></p>
                  <p className="text-[11px] text-gray-400 mt-0.5">Filed by User ID: {disp.raised_by_id} against Escrow Asset Target ID: {disp.escrow_id}</p>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => resolveDispute(disp.id, 'refund_to_buyer')}
                    className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs px-4 py-2 rounded-lg"
                  >
                    Force Buyer Refund
                  </button>
                  <button 
                    onClick={() => resolveDispute(disp.id, 'released_to_seller')}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2 rounded-lg"
                  >
                    Force Seller Payout
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};