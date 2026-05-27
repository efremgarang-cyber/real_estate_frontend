import React from 'react';
import { Loader2, PhoneCall, CheckCircle2, XCircle } from 'lucide-react';

interface MpesaPaymentModalProps {
  isOpen: boolean;
  phoneNumber: string;
  amount: number;
  status: "idle" | "pending" | "completed" | "failed"; // ✅ Track states explicitly
}

export const MpesaPaymentModal: React.FC<MpesaPaymentModalProps> = ({ 
  isOpen, 
  phoneNumber, 
  amount, 
  status 
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-[2rem] bg-white p-8 text-center shadow-2xl border border-neutral-100 animate-in fade-in zoom-in-95 duration-200 font-sans">
        
        {/* 🟡 1. PENDING VIEW */}
        {(status === "pending" || status === "idle") && (
          <>
            {/* Animated STK Push Icon Indicator */}
            <div className="relative mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
              <PhoneCall className="h-8 w-8 animate-bounce" />
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-20"></span>
            </div>

            <h3 className="mt-4 text-xl font-bold text-neutral-900">Request Sent Securely</h3>
            
            <p className="mt-2 text-sm text-neutral-500 px-4">
              An STK Push has been sent to <span className="font-semibold text-neutral-800">+{phoneNumber}</span>. 
              Please check your phone to enter your M-Pesa PIN.
            </p>

            {/* Dynamic Billing Summary Box */}
            <div className="my-5 rounded-xl bg-neutral-50 p-4 border border-neutral-200/60 text-left">
              <div className="flex justify-between text-xs text-neutral-500">
                <span>Transaction Type</span>
                <span className="font-medium text-neutral-700">Property Deposit / Activation</span>
              </div>
              <div className="mt-1 flex justify-between text-sm font-semibold text-neutral-800">
                <span>Amount Due</span>
                <span className="text-emerald-600">KES {amount.toLocaleString()}</span>
              </div>
            </div>

            {/* Polling Loader Status */}
            <div className="flex items-center justify-center gap-2 text-sm font-medium text-neutral-600">
              <Loader2 className="h-4 w-4 animate-spin text-neutral-900" />
              <span>Awaiting secure payment callback...</span>
            </div>
          </>
        )}

        {/* 🟢 2. COMPLETED / SUCCESS VIEW */}
        {status === "completed" && (
          <div className="py-4 animate-in fade-in zoom-in-95 duration-300">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <CheckCircle2 className="h-10 w-10" />
            </div>

            <h3 className="mt-4 text-2xl font-bold text-neutral-900">Payment Successful!</h3>
            
            <p className="mt-2 text-sm text-neutral-500 px-4">
              Your payment of <span className="font-bold text-neutral-800">KES {amount.toLocaleString()}</span> has been processed successfully. 
            </p>

            <div className="mt-6 text-xs text-emerald-600 font-medium bg-emerald-50 border border-emerald-100 py-3 px-4 rounded-xl">
              Workspace activated cleanly. Handshake complete!
            </div>
          </div>
        )}

        {/* 🔴 3. FAILED / CANCELLED VIEW */}
        {status === "failed" && (
          <div className="py-4 animate-in fade-in zoom-in-95 duration-300">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-red-600">
              <XCircle className="h-10 w-10" />
            </div>

            <h3 className="mt-4 text-2xl font-bold text-neutral-900">Transaction Cancelled</h3>
            
            <p className="mt-2 text-sm text-neutral-500 px-4">
              The STK Push request was explicitly rejected, timed out, or cancelled directly on device <span className="font-semibold text-neutral-800">+{phoneNumber}</span>.
            </p>

            <div className="mt-6 text-xs text-red-600 font-medium bg-red-50 border border-red-100 py-3 px-4 rounded-xl">
              No funds were drawn. Please verify details and try again.
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default MpesaPaymentModal;