import { useEffect, useState } from 'react';
import { Check, X, ShieldAlert } from 'lucide-react';
import {
  getSubscriptionPlans,
  SubscriptionPlan,
} from '../../api/subscription';
import { initiateSubscriptionPayment } from '../../api/subscription'; // add this fn, see below
import MpesaPaymentModal from '../../components/payments/MpesaPaymentModal'; // reuse your escrow STK modal component

type BillingCycle = 'monthly' | 'yearly';

function formatKes(amount: number) {
  return new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: 'KES',
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function PlansPage() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('yearly');
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const fetchPlans = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getSubscriptionPlans();
      setPlans(data);
    } catch (err) {
      setError('Unable to reach the core subscriptions service. Check deployment link connectivity.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const handleSubscribeClick = (plan: SubscriptionPlan) => {
    setSelectedPlan(plan);
    setShowPaymentModal(true);
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
            onClick={fetchPlans}
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

      {plans.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-2xl p-10 text-center shadow-sm">
          <p className="text-gray-400 text-sm">
            No active plans found. Run the subscription plan seeder on the backend.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          {plans.map((plan) => {
            const price =
              billingCycle === 'monthly'
                ? plan.monthly_price_kes
                : Math.round(plan.yearly_price_kes / 12);
            const billedYearly = plan.yearly_price_kes;

            return (
              <div
                key={plan.id}
                className={`rounded-2xl border shadow-sm p-6 flex flex-col ${
                  plan.is_popular
                    ? 'bg-[#141414] border-[#141414] text-white md:-translate-y-2'
                    : 'bg-white border-gray-100 text-[#141414]'
                }`}
              >
                {plan.is_popular && (
                  <span className="self-start mb-3 text-[10px] uppercase tracking-wider bg-white/10 text-white px-2.5 py-1 rounded-full">
                    Popular
                  </span>
                )}

                <h3 className="text-lg font-semibold">{plan.name}</h3>
                <p
                  className={`text-sm mt-1 ${
                    plan.is_popular ? 'text-gray-400' : 'text-gray-500'
                  }`}
                >
                  {plan.tagline}
                </p>

                <div className="mt-6 flex items-baseline gap-1">
                  <span className="text-3xl font-semibold">
                    {formatKes(price)}
                  </span>
                  <span
                    className={`text-sm ${
                      plan.is_popular ? 'text-gray-400' : 'text-gray-500'
                    }`}
                  >
                    /month
                  </span>
                </div>
                {billingCycle === 'yearly' && (
                  <p
                    className={`text-xs mt-1 ${
                      plan.is_popular ? 'text-gray-400' : 'text-gray-400'
                    }`}
                  >
                    {formatKes(billedYearly)} billed yearly
                  </p>
                )}

                <div
                  className={`h-px my-6 ${
                    plan.is_popular ? 'bg-white/10' : 'bg-gray-100'
                  }`}
                />

                <ul className="space-y-3 flex-1">
                  {plan.features.map((f, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-sm">
                      {f.included ? (
                        <Check
                          size={16}
                          className={
                            plan.is_popular ? 'text-emerald-400' : 'text-emerald-500'
                          }
                        />
                      ) : (
                        <X
                          size={16}
                          className={
                            plan.is_popular ? 'text-gray-600' : 'text-gray-300'
                          }
                        />
                      )}
                      <span
                        className={
                          !f.included
                            ? plan.is_popular
                              ? 'text-gray-500 line-through'
                              : 'text-gray-300 line-through'
                            : ''
                        }
                      >
                        {f.label}
                      </span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handleSubscribeClick(plan)}
                  className={`mt-6 w-full py-2.5 rounded-xl text-sm font-medium transition ${
                    plan.is_popular
                      ? 'bg-white text-[#141414] hover:bg-gray-100'
                      : 'bg-[#141414] text-white hover:bg-black'
                  }`}
                >
                  Subscribe
                </button>
              </div>
            );
          })}
        </div>
      )}

      {showPaymentModal && selectedPlan && (
        <MpesaPaymentModal
          amount={
            billingCycle === 'monthly'
              ? selectedPlan.monthly_price_kes
              : selectedPlan.yearly_price_kes
          }
          description={`${selectedPlan.name} — ${billingCycle} subscription`}
          onSubmit={async (phoneNumber: string) => {
            await initiateSubscriptionPayment({
              plan_id: selectedPlan.id,
              billing_cycle: billingCycle,
              phone_number: phoneNumber,
            });
          }}
          onClose={() => setShowPaymentModal(false)}
        />
      )}
    </div>
  );
}