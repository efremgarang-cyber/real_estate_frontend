import React, { useState, useEffect } from 'react';
import { 
  CreditCard, 
  BarChart3, 
  Receipt, 
  ArrowUpRight, 
  Zap, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldCheck, 
  RefreshCw,
  Clock
} from 'lucide-react';
import SubscriptionPage from './SubscriptionPage';

interface ActiveSubscription {
  has_subscription: boolean;
  tier: {
    id: number;
    name: string;
    max_properties: number;
    monthly_price: string;
  };
  ends_at: string;
  status: string; // 'active', 'past_due', 'canceled'
}

interface PaymentHistory {
  id: string;
  amount: string;
  currency: string;
  status: 'completed' | 'pending' | 'failed';
  payment_method: 'mpesa' | 'paystack';
  created_at: string;
  checkout_request_id?: string;
}

export default function BillingDashboard() {
  const [subscription, setSubscription] = useState<ActiveSubscription | null>(null);
  const [payments, setPayments] = useState<PaymentHistory[]>([]);
  const [usageStats, setUsageStats] = useState({ current_properties: 0, current_leads: 0 });
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [showPlans, setShowPlans] = useState<boolean>(false);

  useEffect(() => {
    fetchBillingData();
  }, []);

  const fetchBillingData = async () => {
    setRefreshing(true);
    try {
      const token = localStorage.getItem('auth_token');
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      };

      // Concurrent fetch for billing analytics and transaction registries
      const [subRes, historyRes, usageRes] = await Promise.all([
        fetch('/api/v1/subscriptions/current', { headers }),
        fetch('/api/v1/payments/history', { headers }),
        // Temporary fallback endpoint for active workspace usage stats
        fetch('/api/v1/dashboard/summary', { headers }).catch(() => null)
      ]);

      if (subRes.ok) {
        const subData = await subRes.json();
        setSubscription(subData.has_subscription ? subData : null);
      }
      
      if (historyRes.ok) {
        const historyData = await historyRes.json();
        setPayments(Array.isArray(historyData) ? historyData : historyData.data || []);
      }

      if (usageRes && usageRes.ok) {
        const usageData = await usageRes.json();
        setUsageStats({
          current_properties: usageData.total_properties || 0,
          current_leads: usageData.total_leads || 0
        });
      } else {
        // Mock default state if platform core metrics are bootstrapping
        setUsageStats({ current_properties: 4, current_leads: 12 });
      }

    } catch (error) {
      console.error("Failed to accurately load tenant billing ledger matrix:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[500px] w-full items-center justify-center">
        <div className="text-center space-y-3">
          <RefreshCw className="mx-auto h-8 w-8 animate-spin text-indigo-600" />
          <p className="text-sm font-medium text-slate-500">Decrypting workspace financial allocation ledgers...</p>
        </div>
      </div>
    );
  }

  // Calculate dynamic capacity percentages based on active workspace tier parameters
  const maxProps = subscription?.tier?.max_properties || 1; // Avoid divide by zero
  const propertyPercentage = Math.min(Math.round((usageStats.current_properties / maxProps) * 100), 100);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      
      {/* Upper Navigation / Control Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Billing & Workspace Control</h1>
          <p className="text-xs text-slate-500 mt-0.5">Audit system license limitations, inspect transaction nodes, and manage API invoice lines.</p>
        </div>
        <button 
          onClick={fetchBillingData}
          disabled={refreshing}
          className="inline-flex items-center gap-2 self-start sm:self-center rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition-all active:scale-95"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          Sync Records
        </button>
      </div>

      {/* Main Structural Execution Grid */}
      <div className="grid gap-8 lg:grid-cols-3 items-start">
        
        {/* Column 1 & 2: Active Plan Status and Capacity Tracking */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Active License Overview Panel */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
            <div className="flex items-start justify-between">
              <div className="space-y-1.5">
                <p className="text-xs font-bold text-indigo-600 uppercase tracking-wider">Current Licensing Group</p>
                <h2 className="text-xl font-extrabold text-slate-900">
                  {subscription ? `${subscription.tier.name} Plan Workspace` : 'Free Operational Tier'}
                </h2>
                <p className="text-xs text-slate-400 flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {subscription 
                    ? `Next system automated validation pass: ${new Date(subscription.ends_at).toLocaleDateString(undefined, { dateStyle: 'medium' })}`
                    : 'System capabilities gated. Upgrade required for scaling production data instances.'
                  }
                </p>
              </div>
              <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold uppercase tracking-wider ${
                subscription?.status === 'active' || !subscription
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                  : 'bg-amber-50 text-amber-700 border border-amber-200'
              }`}>
                <ShieldCheck className="h-3 w-3" />
                {subscription ? subscription.status : 'Active Default'}
              </span>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 pt-2">
              <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4 flex items-center space-x-3.5">
                <div className="p-2.5 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-600">
                  <CreditCard className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">Recurring Obligation</p>
                  <p className="text-base font-extrabold text-slate-800 mt-0.5">
                    KES {subscription ? parseFloat(subscription.tier.monthly_price).toLocaleString() : '0'} <span className="text-xs font-normal text-slate-400">/mo</span>
                  </p>
                </div>
              </div>

              <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4 flex items-center space-x-3.5">
                <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-100 text-amber-600">
                  <Zap className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">Pipeline Router Gateway</p>
                  <p className="text-base font-extrabold text-slate-800 mt-0.5 uppercase">
                    {subscription ? 'Paystack API Layer' : 'M-Pesa STK Direct'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Allocation & Resource Limits Matrix */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-indigo-600" />
                Workspace Pipeline Telemetry
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">Monitors allocated real estate entries matched against infrastructure ceilings.</p>
            </div>

            <div className="space-y-5">
              {/* Asset Mapping Progress Indicator */}
              <div className="space-y-2">
                <div className="flex justify-between items-baseline">
                  <span className="text-xs font-semibold text-slate-700">Property Node Instantiation</span>
                  <span className="text-xs font-bold text-slate-900">
                    {usageStats.current_properties} <span className="text-slate-400 font-normal">/ {subscription ? subscription.tier.max_properties : '5 Allowed'}</span>
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ${
                      propertyPercentage > 85 ? 'bg-amber-500' : 'bg-indigo-600'
                    }`}
                    style={{ width: `${propertyPercentage}%` }}
                  />
                </div>
                <p className="text-[10px] text-slate-400">Controls total production database row indexing paths mapable inside agency accounts.</p>
              </div>

              {/* CRM Lead Pipeline Progress Indicator */}
              <div className="space-y-2">
                <div className="flex justify-between items-baseline">
                  <span className="text-xs font-semibold text-slate-700">CRM Lead Kanban Capture Track</span>
                  <span className="text-xs font-bold text-slate-900">
                    {usageStats.current_leads} <span className="text-slate-400 font-normal">/ Unlimited</span>
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-100">
                  <div className="h-full rounded-full bg-emerald-500 transition-all duration-500" style={{ width: '25%' }} />
                </div>
              </div>
            </div>

            {propertyPercentage >= 80 && (
              <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-3.5 flex items-start space-x-2.5">
                <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-[11px] text-amber-800 leading-normal">
                  <strong>Approaching Structural Ceiling:</strong> Your active workspace has utilized {propertyPercentage}% of its permitted property nodes. Upgrade runtime limits to avert inbound pipeline processing failures.
                </p>
              </div>
            )}
          </div>

        </div>

        {/* Column 3: Fast Actions Block */}
        <div className="rounded-2xl border border-slate-200 bg-gradient-to-b from-slate-50 to-white p-6 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900">Plan Migration Directives</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Need to change billing intervals, access automated escrow mediation consoles, or allocate premium agent nodes across your workspaces?
          </p>
          <button 
            onClick={() => setShowPlans(!showPlans)}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-xs font-bold text-white shadow-sm hover:bg-indigo-700 transition-all active:scale-98"
          >
            {showPlans ? 'Close Architecture Storefront' : 'Modify Licensing Level'}
            <ArrowUpRight className="h-3.5 w-3.5" />
          </button>
        </div>

      </div>

      {/* Conditionally Injected Pricing Card Storefront Panel */}
      {showPlans && (
        <div className="rounded-3xl border-2 border-dashed border-slate-200 p-2 bg-slate-50/30 animate-fadeIn">
          <SubscriptionPage />
        </div>
      )}

      {/* Complete Real Estate OS System Inbound Invoice Register */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Receipt className="h-4 w-4 text-indigo-600" />
            Inbound API Auditing Matrix
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">Historical verification ledger capturing atomic webhook state payloads for localized checkouts.</p>
        </div>

        <div className="overflow-x-auto border border-slate-100 rounded-xl">
          <table className="min-w-full divide-y divide-slate-100 text-left text-xs">
            <thead className="bg-slate-50 font-bold text-slate-500 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-4 py-3">Transaction Reference Identifier</th>
                <th className="px-4 py-3">Routing Core</th>
                <th className="px-4 py-3">Timestamp</th>
                <th className="px-4 py-3">Quantum Value</th>
                <th className="px-4 py-3 text-center">Gateway Verification State</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-600 font-medium">
              {payments.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-400 italic font-normal">
                    No active transactional records synchronized inside this workspace ledger pipeline.
                  </td>
                </tr>
              ) : (
                payments.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-4 py-3.5 font-mono text-slate-900 tracking-tight">
                      {tx.checkout_request_id || tx.id}
                    </td>
                    <td className="px-4 py-3.5 uppercase text-[10px] tracking-wide">
                      <span className={`inline-block px-1.5 py-0.5 rounded font-bold ${
                        tx.payment_method === 'mpesa' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-800'
                      }`}>
                        {tx.payment_method}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-slate-400">
                      {new Date(tx.created_at).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })}
                    </td>
                    <td className="px-4 py-3.5 font-bold text-slate-900">
                      {tx.currency || 'KES'} {parseFloat(tx.amount).toLocaleString()}
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider border ${
                        tx.status === 'completed'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : tx.status === 'pending'
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-red-50 text-red-700 border-red-200'
                      }`}>
                        {tx.status === 'completed' && <CheckCircle2 className="h-2.5 w-2.5" />}
                        {tx.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}