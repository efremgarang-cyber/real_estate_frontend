import { useEffect, useState } from 'react';
import { Check, ShieldAlert, Loader2 } from 'lucide-react';
import {
  subscriptionApi,
  SubscriptionTier,
  CurrentSubscription,
} from '../api/subscription';

type BillingCycle = 'monthly' | 'yearly';


function formatKes(amount: number) {
  return new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: 'KES',
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function SubscriptionPage() {
  const [tiers, setTiers] = useState<SubscriptionTier[]>([]);
  const [current, setCurrent] = useState<CurrentSubscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('yearly');

  // M-Pesa flow state
  const [selectedTier, setSelectedTier] = useState<SubscriptionTier | null>(null);
  const [showMpesaModal, setShowMpesaModal] = useState(false);
  const [phone, setPhone] = useState('');
  const [mpesaSubmitting, setMpesaSubmitting] = useState(false);
  const [mpesaPolling, setMpesaPolling] = useState(false);
  const [mpesaError, setMpesaError] = useState<string | null>(null);
  const [mpesaSuccess, setMpesaSuccess] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [tiersData, currentData] = await Promise.all([
        subscriptionApi.getTiers(),
        subscriptionApi.getCurrent().catch(() => null),
      ]);
      setTiers(tiersData.filter((t) => t.is_active));
      setCurrent(currentData);
    } catch (err) {
      setError('Unable to reach the core subscriptions service. Check deployment link connectivity.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);


  const openMpesaModal = (tier: SubscriptionTier) => {
    setSelectedTier(tier);
    setPhone('');
    setMpesaError(null);
    setMpesaSuccess(false);
    setShowMpesaModal(true);
  };

  const pollPaymentStatus = async (checkoutRequestId: string) => {
    setMpesaPolling(true);
    const maxAttempts = 20;
    let attempts = 0;

    const poll = async (): Promise<void> => {
      attempts += 1;
      try {
        const res = await subscriptionApi.checkPaymentStatus(checkoutRequestId);
        if (res.status === 'completed') {
          setMpesaPolling(false);
          setMpesaSuccess(true);
          await fetchData();
          return;
        }
        if (res.status === 'failed') {
          setMpesaPolling(false);
          setMpesaError('Payment failed or was cancelled on your phone. Please try again.');
          return;
        }
        if (attempts >= maxAttempts) {
          setMpesaPolling(false);
          setMpesaError('We have not received confirmation yet. Check your M-Pesa messages, or try again.');
          return;
        }
        setTimeout(poll, 3000);
      } catch {
        if (attempts >= maxAttempts) {
          setMpesaPolling(false);
          setMpesaError('Could not confirm payment status. Please try again.');
          return;
        }
        setTimeout(poll, 3000);
      }
    };

    poll();
  };

  const handleMpesaSubmit = async () => {
    if (!selectedTier) return;
    if (!/^0[7|1]\d{8}$/.test(phone) && !/^254[7|1]\d{8}$/.test(phone)) {
      setMpesaError('Enter a valid Safaricom number, e.g. 0712345678');
      return;
    }
    setMpesaSubmitting(true);
    setMpesaError(null);
    try {
      const res = await subscriptionApi.subscribeMpesa(selectedTier.slug, billingCycle, phone);
      if (res.success) {
        pollPaymentStatus(res.checkout_request_id);
      } else {
        setMpesaError(res.message || 'Could not start the M-Pesa prompt.');
      }
    } catch (err) {
      setMpesaError('Could not start the M-Pesa prompt. Please try again.');
    } finally {
      setMpesaSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse h-8 w-40 bg-gray-100 rounded mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-96 bg-gray-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="flex items-start gap-3 bg-red-50 border border-red-100 rounded-2xl p-5">
          <ShieldAlert className="text-red-500 mt-0.5" size={20} />
          <div className="flex-1">
            <p className="font-medium text-red-900">Could not load plans</p>
            <p className="text-sm text-red-500 mt-1">{error}</p>
          </div>
          <button
            onClick={fetchData}
            className="px-4 py-2 text-sm font-medium bg-white border border-gray-100 rounded-xl shadow-sm hover:bg-gray-50"
          >
            Force Reload
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-2">
        <p className="text-xs uppercase tracking-wider text-gray-400 font-medium">
          Subscription
        </p>
        <h1 className="text-2xl font-semibold text-[#141414]">Plans</h1>
        <p className="text-sm text-gray-500 mt-1">
          Scale your agency's workspace tier and unlock premium listing capacity.
        </p>
      </div>

      {current && current.status === 'active' && (
        <div className="mb-6 bg-emerald-50 border border-emerald-100 rounded-2xl px-5 py-3 text-sm text-emerald-800">
          You're currently on the <span className="font-medium">{current.plan}</span> plan
          {current.ends_at ? ` — renews on ${new Date(current.ends_at).toLocaleDateString('en-KE')}` : ''}.
        </div>
      )}

      {/* Billing toggle */}
      <div className="flex justify-end mb-6">
        <div className="inline-flex bg-gray-100 rounded-full p-1">
          <button
            onClick={() => setBillingCycle('monthly')}
            className={`px-4 py-1.5 text-sm rounded-full transition ${
              billingCycle === 'monthly'
                ? 'bg-white shadow-sm text-[#141414] font-medium'
                : 'text-gray-500'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setBillingCycle('yearly')}
            className={`px-4 py-1.5 text-sm rounded-full transition flex items-center gap-1.5 ${
              billingCycle === 'yearly'
                ? 'bg-white shadow-sm text-[#141414] font-medium'
                : 'text-gray-500'
            }`}
          >
            Yearly
            <span className="text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full font-semibold">
              SAVE
            </span>
          </button>
        </div>
      </div>

      {tiers.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-2xl p-10 text-center shadow-sm">
          <p className="text-gray-400 text-sm">
            No active enterprise plans compiled inside database records. Run seeder routines.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start w-full max-w-full overflow-x-hidden">
          {tiers.map((tier, i) => {
            const isPopular = i === 1;
            const yearlyAvailable = tier.yearly_price != null;
            const price =
              billingCycle === 'monthly' || !yearlyAvailable
                ? tier.monthly_price
                : Math.round((tier.yearly_price as number) / 12);
            const isCurrent = current?.tier_slug === tier.slug && current?.status === 'active';

            return (
              <div
                key={tier.id}
                className={`min-w-0 rounded-2xl border shadow-sm p-6 flex flex-col ${
                  isPopular
                    ? 'bg-[#141414] border-[#141414] text-white md:-translate-y-2'
                    : 'bg-white border-gray-100 text-[#141414]'
                }`}
              >
                {isPopular && (
                  <span className="self-start mb-3 text-[10px] uppercase tracking-wider bg-white/10 text-white px-2.5 py-1 rounded-full">
                    Popular
                  </span>
                )}

                <h3 className="text-lg font-semibold">{tier.name}</h3>
                <p className={`text-sm mt-1 ${isPopular ? 'text-gray-400' : 'text-gray-500'}`}>
                  Up to {tier.max_properties} active {tier.max_properties === 1 ? 'listing' : 'listings'}
                </p>

                <div className="mt-6 flex items-baseline gap-1 flex-wrap">
                  <span className="text-2xl md:text-3xl font-semibold break-words">
                    {formatKes(price)}
                  </span>
                  <span className={`text-sm whitespace-nowrap ${isPopular ? 'text-gray-400' : 'text-gray-500'}`}>
                    /month
                  </span>
                </div>
                {billingCycle === 'yearly' && yearlyAvailable && (
                  <p className="text-xs mt-1 text-gray-400">
                    {formatKes(tier.yearly_price as number)} billed yearly
                  </p>
                )}

                <div className={`h-px my-6 ${isPopular ? 'bg-white/10' : 'bg-gray-100'}`} />

                <ul className="space-y-3 flex-1">
                  {tier.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-sm">
                      <Check size={16} className={isPopular ? 'text-emerald-400' : 'text-emerald-500'} />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                {isCurrent ? (
                  <button
                    disabled
                    className={`mt-6 w-full py-2.5 rounded-xl text-sm font-medium ${
                      isPopular ? 'bg-white/10 text-gray-300' : 'bg-gray-100 text-gray-400'
                    }`}
                  >
                    Current Plan
                  </button>
                ) : (
                  <div className="mt-6 space-y-2">
                    <button
                      onClick={() => openMpesaModal(tier)}
                      className={`w-full py-2.5 rounded-xl text-sm font-medium transition ${
                        isPopular
                          ? 'bg-white text-[#141414] hover:bg-gray-100'
                          : 'bg-[#141414] text-white hover:bg-black'
                      }`}
                    >
                      Pay with M-Pesa
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* M-Pesa STK Modal */}
      {showMpesaModal && selectedTier && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 w-full max-w-sm p-6">
            {!mpesaPolling && !mpesaSuccess && (
              <>
                <p className="text-xs uppercase tracking-wider text-gray-400 font-medium mb-1">
                  M-Pesa Payment
                </p>
                <h3 className="text-lg font-semibold text-[#141414] mb-4">
                  {selectedTier.name} —{' '}
                  {formatKes(
                    billingCycle === 'monthly' || selectedTier.yearly_price == null
                      ? selectedTier.monthly_price
                      : (selectedTier.yearly_price as number)
                  )}
                </h3>
                <label className="text-sm text-gray-500 mb-1 block">Safaricom number</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="0712345678"
                  className="w-full border border-gray-100 rounded-xl px-4 py-2.5 text-sm mb-2 focus:outline-none focus:ring-2 focus:ring-[#141414]/10"
                />
                {mpesaError && <p className="text-xs text-red-500 mb-2">{mpesaError}</p>}
                <div className="flex gap-2 mt-4">
                  <button
                    onClick={() => setShowMpesaModal(false)}
                    className="flex-1 py-2.5 rounded-xl text-sm font-medium border border-gray-100 text-gray-500 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleMpesaSubmit}
                    disabled={mpesaSubmitting || !phone}
                    className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-[#141414] text-white hover:bg-black disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {mpesaSubmitting && <Loader2 size={14} className="animate-spin" />}
                    {mpesaSubmitting ? 'Sending…' : 'Send STK Push'}
                  </button>
                </div>
              </>
            )}

            {mpesaPolling && (
              <div className="text-center py-6">
                <Loader2 className="animate-spin mx-auto mb-3 text-[#141414]" size={28} />
                <p className="text-sm font-medium text-[#141414]">Check your phone</p>
                <p className="text-xs text-gray-500 mt-1">
                  Enter your M-Pesa PIN to complete payment of{' '}
                  {formatKes(
                    billingCycle === 'monthly' || selectedTier.yearly_price == null
                      ? selectedTier.monthly_price
                      : (selectedTier.yearly_price as number)
                  )}
                  .
                </p>
              </div>
            )}

            {mpesaSuccess && (
              <div className="text-center py-6">
                <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-3">
                  <Check className="text-emerald-600" size={22} />
                </div>
                <p className="text-sm font-medium text-[#141414]">Payment confirmed</p>
                <p className="text-xs text-gray-500 mt-1">
                  You're now on the {selectedTier.name} plan.
                </p>
                <button
                  onClick={() => setShowMpesaModal(false)}
                  className="mt-4 w-full py-2.5 rounded-xl text-sm font-medium bg-[#141414] text-white hover:bg-black"
                >
                  Done
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}