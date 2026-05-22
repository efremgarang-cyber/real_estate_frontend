import React, { useState } from 'react';
import { Smartphone, ArrowRight, Home } from 'lucide-react';

// Assuming you are using TypeScript since LoginPage was .tsx
interface Property {
    id: string | number; // Changed from just 'number'
    title: string;
    location: string;
    price: string | number;
    status: string; // Updated to accept 'Active', 'Sold', etc., from your mock data
}

interface PropertyCardProps {
    property: Property;
}

export const PropertyCard: React.FC<PropertyCardProps> = ({ property }) => {
    const [isInitiating, setIsInitiating] = useState(false);
    const [phoneNumber, setPhoneNumber] = useState('');

    const handlePayment = async () => {
        if (!phoneNumber) {
            alert('Phone number is required.');
            return;
        }

        setIsInitiating(true);

        try {
            const response = await fetch('/api/payments/initiate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    // 'Authorization': `Bearer ${token}` 
                },
                body: JSON.stringify({
                    property_id: property.id,
                    phone_number: phoneNumber
                })
            });

            const data = await response.json();

            if (response.ok) {
                alert('Check your phone to enter your M-Pesa PIN.');
                // Polling logic will trigger next
            } else {
                alert(`Error: ${data.message}`);
            }
        } catch (error) {
            alert('Network error. Please try again.');
        } finally {
            setIsInitiating(false);
        }
    };

    return (
        <div className="p-8 bg-white rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.05)] flex flex-col space-y-6 font-sans">
            {/* Header */}
            <div className="flex items-start justify-between">
                <div>
                    <h3 className="text-xl font-bold text-[#141414] mb-1">{property.title}</h3>
                    <p className="text-sm font-medium text-gray-500">{property.location}</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center text-[#141414] shrink-0">
                    <Home size={20} />
                </div>
            </div>

            {/* Price and Status */}
            <div className="flex justify-between items-end pb-5 border-b border-gray-100">
                <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Price</p>
                    <span className="text-2xl font-bold text-[#141414]">
                        KES {Number(property.price).toLocaleString()}
                    </span>
                </div>
                
                {/* STRICT STATUS TEXT: Clean typography, no glow, no borders */}
                <div className="text-right">
                     <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Status</p>
                     <span className={property.status === 'active' ? 'text-green-600 font-bold uppercase text-sm tracking-wider' : 'text-gray-400 font-bold uppercase text-sm tracking-wider'}>
                        {property.status.replace('_', ' ')}
                    </span>
                </div>
            </div>

            {/* Payment Action */}
            {property.status === 'active' ? (
                <div className="pt-2 flex flex-col space-y-5">
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
                        disabled={isInitiating || !phoneNumber}
                        className="w-full flex items-center justify-center gap-2 py-3.5 bg-[#141414] hover:bg-black text-white rounded-xl font-medium transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {isInitiating ? 'Initiating Request...' : 'Pay with M-Pesa'}
                        {!isInitiating && <ArrowRight size={18} />}
                    </button>
                </div>
            ) : (
                <div className="pt-2 text-center p-4 bg-gray-50 rounded-xl border border-gray-100">
                    <p className="text-sm font-medium text-gray-500">This property is no longer available for purchase.</p>
                </div>
            )}
        </div>
    );
}