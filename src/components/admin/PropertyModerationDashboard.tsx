import React, { useEffect, useState } from 'react';
import { api } from '../../lib/api';

// Define the shape of a Property listing for type safety
interface Property {
    id: number;
    title: string;
    description: string;
    price: number;
    status: 'pending' | 'approved' | 'rejected';
    created_at: string;
}

const PropertyModerationDashboard: React.FC = () => {
    const [properties, setProperties] = useState<Property[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);

    // Fetch listings that need moderation or review
    const fetchPendingProperties = async () => {
        setIsLoading(true);
        setError(null);
        try {
            // Adjust the URL if your listing query route differs (e.g., /properties or an admin specific fetch)
            const response = await api.get('/properties');
            // If your API returns data wrap or pagination object, adapt accordingly
            const allProperties: Property[] = Array.isArray(response.data) ? response.data : response.data.data || [];
            setProperties(allProperties);
        } catch (err: any) {
            console.error('Failed to fetch properties for moderation:', err);
            setError('Could not load properties queue. Please check your database connection.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchPendingProperties();
    }, []);

    // Handle Approve / Reject action utilizing your Backend Route: 
    // Route::patch('/admin/properties/{property}/moderate', ...)
    const handleModerate = async (propertyId: number, status: 'approved' | 'rejected') => {
        setActionLoadingId(propertyId);
        try {
            await api.patch(`/admin/properties/${propertyId}/moderate`, { status });
            
            // Instantly update local UI state to remove or update the moderated property
            setProperties(prev => prev.filter(p => p.id !== propertyId));
            alert(`Listing has been successfully ${status}!`);
        } catch (err: any) {
            console.error(`Failed to moderate property ID ${propertyId}:`, err);
            alert(err.response?.data?.message || 'Failed to update property status.');
        } finally {
            setActionLoadingId(null);
        }
    };

    if (isLoading) {
        return <div style={{ padding: '20px', color: '#6b7280' }}>Loading properties queue...</div>;
    }

    return (
        <div style={{ padding: '24px', backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1f2937' }}>Global Property Moderation Feed</h2>
                    <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>Approve new submissions or take down non-compliant listings.</p>
                </div>
                <button 
                    onClick={fetchPendingProperties}
                    style={{ padding: '6px 12px', border: '1px solid #d1d5db', borderRadius: '6px', cursor: 'pointer', background: '#f9fafb' }}
                >
                    Refresh Queue
                </button>
            </div>

            {error && (
                <div style={{ padding: '12px', backgroundColor: '#fef2f2', color: '#b91c1c', borderRadius: '6px', marginBottom: '16px' }}>
                    {error}
                </div>
            )}

            {properties.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 0', color: '#9ca3af' }}>
                    🎉 No properties requiring moderation review at this time.
                </div>
            ) : (
                <div style={{ display: 'grid', gap: '16px' }}>
                    {properties.map((property) => (
                        <div 
                            key={property.id} 
                            style={{ 
                                padding: '16px', 
                                border: '1px solid #e5e7eb', 
                                borderRadius: '8px', 
                                display: 'flex', 
                                justifyContent: 'space-between', 
                                alignItems: 'center',
                                backgroundColor: property.status === 'pending' ? '#fbfcfe' : '#fff'
                            }}
                        >
                            <div style={{ maxWidth: '70%' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                    <h3 style={{ fontSize: '1.1rem', fontWeight: '600', color: '#111827', margin: 0 }}>
                                        {property.title}
                                    </h3>
                                    <span style={{ 
                                        fontSize: '0.75rem', 
                                        padding: '2px 8px', 
                                        borderRadius: '12px', 
                                        backgroundColor: '#f3f4f6', 
                                        color: '#374151',
                                        textTransform: 'uppercase',
                                        fontWeight: 'bold'
                                    }}>
                                        {property.status}
                                    </span>
                                </div>
                                <p style={{ fontSize: '0.875rem', color: '#4b5563', margin: '0 0 8px 0', lineBreak: 'anywhere' }}>
                                    {property.description || 'No description provided.'}
                                </p>
                                <span style={{ fontSize: '0.9rem', fontWeight: 'bold', color: '#059669' }}>
                                    ${property.price.toLocaleString()}
                                </span>
                            </div>

                            <div style={{ display: 'flex', gap: '10px' }}>
                                <button
                                    onClick={() => handleModerate(property.id, 'approved')}
                                    disabled={actionLoadingId !== null}
                                    style={{
                                        padding: '8px 14px',
                                        backgroundColor: '#10b981',
                                        color: '#fff',
                                        border: 'none',
                                        borderRadius: '6px',
                                        cursor: 'pointer',
                                        fontWeight: '500',
                                        opacity: actionLoadingId !== null ? 0.6 : 1
                                    }}
                                >
                                    {actionLoadingId === property.id ? 'Processing...' : 'Approve'}
                                </button>
                                <button
                                    onClick={() => handleModerate(property.id, 'rejected')}
                                    disabled={actionLoadingId !== null}
                                    style={{
                                        padding: '8px 14px',
                                        backgroundColor: '#ef4444',
                                        color: '#fff',
                                        border: 'none',
                                        borderRadius: '6px',
                                        cursor: 'pointer',
                                        fontWeight: '500',
                                        opacity: actionLoadingId !== null ? 0.6 : 1
                                    }}
                                >
                                    Reject / Take Down
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default PropertyModerationDashboard;