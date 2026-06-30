import React, { useState } from 'react';
import { Check, Building2, ShieldAlert, RefreshCw, Sliders } from 'lucide-react';

interface SubscriptionTier {
  id: number;
  name: string;
  slug: string;
  price_monthly: number;
  price_annual: number;
  max_properties: number;
  features: string[];
}

const mockTiers: SubscriptionTier[] = [
  {
    id: 1,
    name: 'Starter Workspace',
    slug: 'starter',
    price_monthly: 450000, // KES 4,500
    price_annual: 4320000, // KES 43,200 (10% off)
    max_properties: 10,
    features: [
      'Up to 10 active listings execution',
      'Basic tenant CRM ledger mapping',
      'Standard Escrow pipeline access',
      'Automated M-PESA gateway routing',
    ],
  },
  {
    id: 2,
    name: 'Vantage OS (Pro)',
    slug: 'pro',
    price_monthly: 1250000, // KES 12,500
    price_annual: 12000000, // KES 120,000 (20% off)
    max_properties: 50,
    features: [
      'Up to 50 active listings execution',
      'Advanced structural metrics engine',
      'Priority Escrow & automated dispute nodes',
      'Bulk KYC Vault credentials routing',
      'Multi-tenant workspace isolation keys',
    ],
  },
];

export default function SubscriptionPage() {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');
  const [showPipelineAlert, setShowPipelineAlert] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  // Active user subscription allocation tracking
  const currentSubscription = {
    tier_slug: 'pro',
    status: 'active',
    ends_at: '2026-07-09',
    properties_count: 18,
  };

  const activeTier = mockTiers.find((t) => t.slug === currentSubscription.tier_slug);

  const simulateGatewaySync = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      setShowPipelineAlert(false);
    }, 1200);
  };

  return (
    <div className="space-y-6 md:space-y-8 h-full animate-in fade-in duration-300 px-4 sm:px-6 md:px-0">
      {/* Page Layout Header */}
      <div className="border-b border-gray-200 pb-4 md:pb-5">
        <h3 className="text-lg md:text-xl font-bold text-[#141414] tracking-tight font-display">
          Workspace Licensing
        </h3>
        <p className="text-xs font-medium text-gray-500 mt-1">
          Manage tenant structural execution privileges and premium feature mapping tiers.
        </p>
      </div>

      {/* Operational Pipeline Interruption State Alert */}
      {showPipelineAlert && (
        <div className="bg-red-50/60 border border-red-200/80 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-[0_2px_12px_rgba(220,38,38,0.03)]">
          <div className="flex gap-3 items-start">
            <div className="bg-red-100 rounded-xl p-2 shrink-0 text-red-600 mt-0.5 sm:mt-0">
              <ShieldAlert size={18} strokeWidth={2.5} />
            </div>
            <div>
              <h4 className="text-xs font-bold text-red-900 tracking-tight">Operational Pipeline Interruption</h4>
              <p className="text-xs font-medium text-red-700/90 mt-0.5">
              Unable to sync pricing profiles. Verify gateway access or try again.
              </p>
            </div>
          </div>
          <button
            onClick={simulateGatewaySync}
            disabled={isSyncing}
            className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold text-red-800 bg-white border border-red-200 hover:bg-red-50 rounded-lg transition-all shadow-sm shrink-0 disabled:opacity-50 w-full sm:w-auto justify-center"
          >
            <RefreshCw size={12} className={isSyncing ? 'animate-spin' : ''} />
            {isSyncing ? 'Syncing...' : 'Retry Execution'}
          </button>
        </div>
      )}

      {/* Active Privilege Footprint Banner */}
      {activeTier && (
        <div className="bg-white border border-gray-100 rounded-2xl p-5 md:p-6 shadow-[0_4px_20px_rgba(0,0,0,0.01)] grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-6 items-center">
          <div className="space-y-2">
            <span className="text-[9px] font-bold uppercase tracking-widest bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-md border border-emerald-100 inline-block">
              Active Authorization
            </span>
            <h3 className="text-base md:text-lg font-bold text-[#141414] tracking-tight pt-1">{activeTier.name}</h3>
            <p className="text-xs font-medium text-gray-400">
              Next Allocation Block: <span className="text-gray-600 font-semibold">{currentSubscription.ends_at}</span>
            </p>
          </div>

          {/* Allocation Usage Progress Metrics */}
          <div className="space-y-2 w-full">
            <div className="flex justify-between text-xs font-medium flex-wrap gap-1">
              <span className="text-gray-400 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5" /> Core Database Slots
              </span>
              <span className="font-bold text-[#141414]">
                {currentSubscription.properties_count} / {activeTier.max_properties} Allocated
              </span>
            </div>
            <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-[#141414] h-full rounded-full transition-all duration-500"
                style={{ width: `${(currentSubscription.properties_count / activeTier.max_properties) * 100}%` }}
              />
            </div>
          </div>

          {/* Allocation Actions */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center md:justify-end gap-3">
            <button className="px-4 py-2 text-xs font-semibold text-gray-500 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 hover:text-[#141414] transition-colors">
              Deauthorize Plan
            </button>
            <button className="px-4 py-2 text-xs font-semibold text-white bg-[#141414] rounded-xl hover:bg-neutral-800 transition-colors shadow-sm">
              Modify Mapping
            </button>
          </div>
        </div>
      )}

      {/* Available Plans Control Block */}
      <div className="space-y-5 md:space-y-6 pt-2">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-[#141414] tracking-tight">Available Platform Plans</h3>
            <p className="text-xs font-medium text-gray-400 mt-0.5">
              Scale execution strategies seamlessly. Switch cycles or tiers to unlock extra feature controls.
            </p>
          </div>

          {/* Allocation Mode Segmented Selector */}
          <div className="bg-gray-200/60 p-1 rounded-xl flex items-center shrink-0 w-fit self-start sm:self-auto">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                billingCycle === 'monthly'
                  ? 'bg-white text-[#141414] shadow-sm'
                  : 'text-gray-500 hover:text-[#141414]'
              }`}
            >
              Monthly Billing
            </button>
            <button
              onClick={() => setBillingCycle('annual')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1 ${
                billingCycle === 'annual'
                  ? 'bg-white text-[#141414] shadow-sm'
                  : 'text-gray-500 hover:text-[#141414]'
              }`}
            >
              Annual Allocation
              <span className="text-[9px] bg-emerald-100 text-emerald-800 px-1 rounded font-extrabold uppercase">
                Save
              </span>
            </button>
          </div>
        </div>

        {/* Plan Tiers Grid Matrix - Responsive */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {mockTiers.map((tier) => {
            const isCurrent = currentSubscription.tier_slug === tier.slug;
            const computedPrice = billingCycle === 'monthly' ? tier.price_monthly : tier.price_annual;
            const cycleLabel = billingCycle === 'monthly' ? '/month' : '/year';

            return (
              <div
                key={tier.id}
                className={`bg-white rounded-2xl p-5 md:p-6 border transition-all relative flex flex-col justify-between ${
                  isCurrent ? 'border-[#141414] ring-1 ring-[#141414]' : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                {isCurrent && (
                  <span className="absolute -top-2.5 right-4 bg-[#141414] text-white text-[9px] uppercase tracking-widest px-2.5 py-0.5 rounded-full font-bold border border-neutral-800">
                    Active Authority
                  </span>
                )}

                <div>
                  <h4 className="text-sm font-bold text-[#141414] uppercase tracking-wide flex items-center gap-2">
                    <Sliders size={14} className="text-gray-400" />
                    {tier.name}
                  </h4>

                  <div className="mt-4 flex items-baseline text-[#141414]">
                    <span className="text-base font-bold tracking-tight">KES</span>
                    <span className="text-2xl md:text-3xl font-extrabold tracking-tight ml-1 font-mono">
                      {(computedPrice / 100).toLocaleString()}
                    </span>
                    <span className="ml-1.5 text-xs font-medium text-gray-400">{cycleLabel}</span>
                  </div>

                  <ul className="mt-5 md:mt-6 space-y-3 border-t border-gray-100 pt-4 md:pt-5">
                    {tier.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2.5 text-xs font-medium text-gray-600">
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <span className="leading-relaxed">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-5 md:pt-6 mt-5 md:mt-6 border-t border-gray-50">
                  <button
                    disabled={isCurrent}
                    className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition-all ${
                      isCurrent
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200/60'
                        : 'bg-white text-[#141414] border border-gray-200 hover:bg-gray-50 shadow-sm'
                    }`}
                  >
                    {isCurrent ? 'Current Context' : 'Reallocate Infrastructure'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}