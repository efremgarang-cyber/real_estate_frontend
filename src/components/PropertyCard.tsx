import React, { useState, useEffect, useRef } from 'react';
import { Smartphone, ArrowRight, Home, Loader2, CheckCircle2, XCircle, Bed, Bath, Maximize, FileDown } from 'lucide-react';
import { api } from '../lib/api'; 
import { Property } from '../types';

interface PropertyCardProps {
    property?: Property | null;
}

type PaymentStep = 'idle' | 'sending_stk' | 'waiting_for_pin' | 'success' | 'failed';

export const PropertyCard: React.FC<PropertyCardProps> = ({ property }) => {
    const [phoneNumber, setPhoneNumber] = useState('');
    const [paymentStep, setPaymentStep] = useState<PaymentStep>('idle');
    const [errorMessage, setErrorMessage] = useState('');
    const [mpesaReceipt, setMpesaReceipt] = useState('');
    
    const checkoutRequestIdRef = useRef<string | null>(null);
    const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        return () => stopPolling();
    }, []);

    const stopPolling = () => {
        if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
        }
    };

    const startPollingStatus = (checkoutRequestId: string) => {
        stopPolling(); 
        
        let attempts = 0;
        const maxAttempts = 24; 

        pollingIntervalRef.current = setInterval(async () => {
            attempts++;
            if (attempts > maxAttempts) {
                stopPolling();
                setErrorMessage('Transaction timed out. Please try again.');
                setPaymentStep('failed');
                return;
            }

            try {
                const response = await api.get(`/payments/status/${checkoutRequestId}`);
                const data = response.data;

                if (data.success) {
                    if (data.status === 'completed') {
                        stopPolling();
                        setMpesaReceipt(data.receipt_number || '');
                        setPaymentStep('success');
                    } else if (data.status === 'failed') {
                        stopPolling();
                        setErrorMessage('STK Push was cancelled or rejected by the user.');
                        setPaymentStep('failed');
                    }
                }
            } catch (error) {
                console.warn('Polling background iteration skipped:', error);
            }
        }, 2500);
    };

    const handlePayment = async () => {
        if (!phoneNumber || !property?.id) return;

        setErrorMessage('');
        setPaymentStep('sending_stk');

        try {
            const cleanPhoneNumber = phoneNumber.replace(/\+/g, '').trim();

            const response = await api.post('/payments/stk-push', {
                property_id: property.id,
                phone_number: cleanPhoneNumber
            });

            const data = response.data;
            const checkoutId = data.daraja?.CheckoutRequestID || data.payment?.checkout_request_id;

            if ((data.success || data.daraja?.CheckoutRequestID) && checkoutId) {
                checkoutRequestIdRef.current = checkoutId;
                setPaymentStep('waiting_for_pin');
                startPollingStatus(checkoutId);
            } else {
                setErrorMessage(data.message || 'Failed to dispatch secure request payload.');
                setPaymentStep('failed');
            }
        } catch (error: any) {
            const backendMessage = error.response?.data?.message;
            setErrorMessage(backendMessage || 'Failed to establish backend initialization handshake.');
            setPaymentStep('failed');
        }
    };

    const handleDownloadBrochure = () => {
        // Assumes your API/backend provides a 'brochure_url' or similar field
        // @ts-ignore - adjust based on your exact Property type definition
        const brochureUrl = property?.brochure_url || property?.brochureUrl;
        
        if (brochureUrl) {
            window.open(brochureUrl, '_blank');
        } else {
            alert('A brochure is not currently available for this property.');
        }
    };

    if (!property) {
        return (
            <div className="p-8 bg-white rounded-4xl shadow-[0_20px_50px_rgba(0,0,0,0.05)] flex flex-col space-y-6 animate-pulse">
                <div className="flex justify-between items-start">
                    <div className="space-y-2 w-2/3">
                        <div className="h-6 bg-gray-200 rounded-lg w-3/4"></div>
                        <div className="h-4 bg-gray-100 rounded-lg w-1/2"></div>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-gray-100 shrink-0"></div>
                </div>
                <div className="h-12 bg-gray-50 rounded-xl w-full mt-4"></div>
            </div>
        );
    }

    const isPropertyActive = property?.status?.toLowerCase() === 'active';

    return (
        <div className="p-8 bg-white rounded-4xl shadow-[0_20px_50px_rgba(0,0,0,0.05)] flex flex-col space-y-6 font-sans relative overflow-hidden">
            
            <div className="flex items-start justify-between">
                <div>
                    <h3 className="text-xl font-bold text-[#141414] mb-1">{property.title}</h3>
                    <p className="text-sm font-medium text-gray-500">{property.location || property.location || 'Location pending'}</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center text-[#141414] shrink-0">
                    <Home size={20} />
                </div>
            </div>

            <div className="flex items-center gap-5 pb-5 border-b border-gray-100">
                <div className="flex items-center gap-2 text-gray-600">
                    <Bed size={18} className="text-gray-400" />
                    <span className="text-sm font-semibold">{property.bedrooms || property.bedrooms || 0} <span className="font-medium text-gray-400">Beds</span></span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                    <Bath size={18} className="text-gray-400" />
                    <span className="text-sm font-semibold">{property.baths || property.baths || 0} <span className="font-medium text-gray-400">Baths</span></span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                    <Maximize size={18} className="text-gray-400" />
                    <span className="text-sm font-semibold">{property.sqft ? property.sqft.toLocaleString() : 0} <span className="font-medium text-gray-400">Sqft</span></span>
                </div>
            </div>

            <div className="flex justify-between items-end pb-5 border-b border-gray-100">
                <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Price</p>
                    <span className="text-2xl font-bold text-[#141414]">
                        KES {Number(property.price || 0).toLocaleString()}
                    </span>
                </div>
                
                <div className="text-right">
                     <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Status</p>
                     <span className={isPropertyActive ? 'text-green-600 font-bold uppercase text-sm tracking-wider' : 'text-gray-400 font-bold uppercase text-sm tracking-wider'}>
                        {property.status ? property.status.replace('_', ' ') : 'UNKNOWN'}
                    </span>
                </div>
            </div>

            {/* NEW: Download Brochure Action */}
            <button 
                onClick={handleDownloadBrochure}
                className="w-full flex items-center justify-center gap-2 py-3 bg-white border border-gray-200 hover:border-gray-300 text-[#141414] rounded-xl font-medium transition-colors"
            >
                <FileDown size={18} /> Download Brochure
            </button>

            {isPropertyActive ? (
                <div className="min-h-35 flex flex-col justify-center border-t border-gray-100 pt-5">
                    
                    {paymentStep === 'idle' && (
                        <div className="flex flex-col space-y-5">
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                                    M-Pesa Number
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                                        <Smartphone size={18} />
                                    </div>
                                    <input 
                                        type="text" 
                                        placeholder="2547XXXXXXXX" 
                                        value={phoneNumber}
                                        onChange={(e) => setPhoneNumber(e.target.value)}
                                        className="w-full pl-12 pr-4 py-3.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-[#141414] focus:ring-1 focus:ring-[#141414] transition-all text-sm"
                                    />
                                </div>
                            </div>
                            <button 
                                onClick={handlePayment} 
                                disabled={!phoneNumber || phoneNumber.length < 10}
                                className="w-full flex items-center justify-center gap-2 py-3.5 bg-[#141414] hover:bg-black text-white rounded-xl font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                Pay with M-Pesa <ArrowRight size={18} />
                            </button>
                        </div>
                    )}

                    {paymentStep === 'sending_stk' && (
                        <div className="flex flex-col items-center justify-center space-y-3 py-4 text-center">
                            <Loader2 className="w-8 h-8 text-[#141414] animate-spin" />
                            <p className="text-sm font-semibold text-[#141414]">Connecting Secure Gateway...</p>
                            <p className="text-xs text-gray-400">Requesting M-Pesa checkout authorization</p>
                        </div>
                    )}

                    {paymentStep === 'waiting_for_pin' && (
                        <div className="flex flex-col items-center justify-center space-y-4 py-3 text-center bg-gray-50 rounded-2xl p-5 border border-dashed border-gray-200 animate-pulse">
                            <div className="relative flex items-center justify-center">
                                <div className="absolute w-12 h-12 rounded-full bg-green-100 animate-ping opacity-75"></div>
                                <Smartphone className="w-8 h-8 text-green-600 relative z-10" />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-[#141414] mb-0.5">STK Push Dispatched!</p>
                                <p className="text-xs text-gray-500 px-2 leading-relaxed">
                                    Check your phone screen for the prompt overlay and provide your M-Pesa PIN to finalize contract.
                                </p>
                            </div>
                            <div className="flex items-center gap-1.5 text-[11px] font-medium text-gray-400">
                                <Loader2 className="w-3 h-3 animate-spin" /> Awaiting validation feedback...
                            </div>
                        </div>
                    )}

                    {paymentStep === 'success' && (
                        <div className="flex flex-col items-center justify-center space-y-3 py-4 text-center text-green-600 bg-green-50/50 rounded-2xl p-5 border border-green-100">
                            <CheckCircle2 className="w-12 h-12" />
                            <div>
                                <p className="text-base font-bold text-[#141414]">Payment Authenticated!</p>
                                {mpesaReceipt && (
                                    <p className="text-xs font-mono font-medium text-green-700 mt-1 bg-green-100/60 px-2 py-0.5 rounded">
                                        Receipt: {mpesaReceipt}
                                    </p>
                                )}
                            </div>
                            <button 
                                onClick={() => { setPaymentStep('idle'); setPhoneNumber(''); }}
                                className="mt-1 text-xs font-semibold text-gray-500 hover:text-[#141414] underline underline-offset-4"
                            >
                                Back to property board
                            </button>
                        </div>
                    )}

                    {paymentStep === 'failed' && (
                        <div className="flex flex-col items-center justify-center space-y-3 py-4 text-center text-red-500 bg-red-50/50 rounded-2xl p-5 border border-red-100">
                            <XCircle className="w-11 h-11" />
                            <div>
                                <p className="text-sm font-bold text-[#141414]">Transaction Disrupted</p>
                                <p className="text-xs text-gray-500 px-2 mt-1 leading-relaxed">{errorMessage}</p>
                            </div>
                            <button 
                                onClick={() => setPaymentStep('idle')}
                                className="mt-2 text-xs font-bold text-[#141414] bg-white border border-gray-200 shadow-sm px-4 py-2 rounded-xl hover:bg-gray-50 transition-colors"
                            >
                                Try Again
                            </button>
                        </div>
                    )}

                </div>
            ) : (
                <div className="pt-2 text-center p-4 bg-gray-50 rounded-xl border border-gray-100 mt-5">
                    <p className="text-sm font-medium text-gray-500">This property is no longer available for purchase.</p>
                </div>
            )}
        </div>
    );
};