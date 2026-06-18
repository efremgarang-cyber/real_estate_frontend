import React, { useState } from "react";
import { X, Phone, DollarSign, Loader2, CheckCircle2 } from "lucide-react";

interface MpesaPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitPayment: (phoneNumber: string, amount: number) => Promise<{ success: boolean; message?: string }>;
  defaultAmount?: number;
  clientName?: string;
}

export const MpesaPaymentModal: React.FC<MpesaPaymentModalProps> = ({
  isOpen,
  onClose,
  onSubmitPayment,
  defaultAmount = 0,
  clientName = "Client",
}) => {
  const [phone, setPhone] = useState("");
  const [amount, setAmount] = useState(defaultAmount.toString());
  const [loading, setLoading] = useState(false);
  const [stkSent, setStkSent] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  // Clean and format phone number to strict Safaricom 254 format
  const formatKenyanPhone = (input: string): string | null => {
    let cleaned = input.replace(/\D/g, ""); // Strip non-numeric characters

    if (cleaned.startsWith("0")) {
      cleaned = "254" + cleaned.substring(1);
    } else if (cleaned.startsWith("7") || cleaned.startsWith("1")) {
      if (cleaned.length === 9) {
        cleaned = "254" + cleaned;
      }
    } else if (cleaned.startsWith("254")) {
      // already has country code
    } else {
      return null;
    }

    // Validate absolute standard length for Safaricom (2547XXXXXXXX or 2541XXXXXXXX)
    if (/^(2547|2541)\d{8}$/.test(cleaned)) {
      return cleaned;
    }
    return null;
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const formattedPhone = formatKenyanPhone(phone);
    if (!formattedPhone) {
      setErrorMessage("Enter a valid Kenyan number (e.g., 0712345678 or 0112345678)");
      return;
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setErrorMessage("Please specify a valid transaction deposit amount.");
      return;
    }

    setLoading(true);
    try {
      const result = await onSubmitPayment(formattedPhone, parsedAmount);
      if (result.success) {
        setStkSent(true);
      } else {
        setErrorMessage(result.message || "STK Push failed to initialize.");
      }
    } catch (err) {
      setErrorMessage("Network timeout connection error. Check Daraja backend logs.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-6 border border-gray-100 shadow-2xl relative animate-in zoom-in-95 duration-200">
        
        {/* Modal Window Top Closure Header */}
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-lg font-bold text-[#141414]">M-PESA Secure Deposit</h3>
            <p className="text-xs text-gray-400 mt-0.5">Trigger real-time lock verification via STK Push</p>
          </div>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-lg hover:bg-gray-50"
          >
            <X size={18} />
          </button>
        </div>

        {!stkSent ? (
          <form onSubmit={handlePaymentSubmit} className="space-y-4">
            
            {/* Context Workspace Info Card */}
            <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-100 text-xs text-gray-500">
              Contract Ledger Pipeline target: <span className="font-bold text-[#141414]">{clientName}</span>
            </div>

            {/* Field Instance: Phone Number Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Safaricom Mobile Number</label>
              <div className="relative">
                <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  required
                  placeholder="e.g. 0712345678"
                  disabled={loading}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#141414] focus:ring-1 focus:ring-[#141414] transition-all text-[#141414]"
                />
              </div>
            </div>

            {/* Field Instance: Amount Allocation Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Requested Safe Amount (Ksh)</label>
              <div className="relative">
                <DollarSign size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="number"
                  required
                  disabled={loading}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#141414] focus:ring-1 focus:ring-[#141414] transition-all font-semibold text-[#141414]"
                />
              </div>
            </div>

            {/* Dynamic Error Messaging Output Boundary */}
            {errorMessage && (
              <div className="text-xs font-medium text-red-500 bg-red-50 border border-red-100 rounded-xl p-3">
                {errorMessage}
              </div>
            )}

            {/* Dynamic Interactive Execution Action Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#1E3A1E] hover:bg-[#142614] text-white text-sm font-semibold py-3 rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Dispatched Validation Prompt...
                </>
              ) : (
                `Request Ksh ${parseFloat(amount || "0").toLocaleString()} STK Push`
              )}
            </button>
          </form>
        ) : (
          /* Post-Execution Verification Polling Context State */
          <div className="py-6 text-center space-y-4 animate-in fade-in duration-300">
            <div className="h-14 w-14 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-500 flex items-center justify-center mx-auto shadow-sm">
              <CheckCircle2 size={26} />
            </div>
            <div className="space-y-1.5 max-w-xs mx-auto">
              <h4 className="text-sm font-bold text-[#141414]">STK Push Dispatched Successfully</h4>
              <p className="text-xs text-gray-400 leading-normal">
                A request has been sent to client mobile handset. Enter M-PESA PIN to close the contract ledger.
              </p>
            </div>
            <button
              onClick={onClose}
              className="mt-2 text-xs font-semibold text-gray-500 hover:text-[#141414] underline underline-offset-4"
            >
              Return to Workspace
            </button>
          </div>
        )}
      </div>
    </div>
  );
};