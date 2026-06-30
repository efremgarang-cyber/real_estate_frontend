import React, { useState } from 'react';
import { api } from '../../lib/api'; // Corrected local api instance route configuration

interface GlobalNotificationFormProps {
  onNotificationSent?: () => void;
}

export const GlobalNotificationForm: React.FC<GlobalNotificationFormProps> = ({ onNotificationSent }) => {
  const [message, setMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim()) {
      setError('Notification message cannot be empty.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      // Direct post request payload hits your Laravel routing table endpoints smoothly
      const response = await api.post('/admin/notifications/global', { message });
      
      setSuccessMessage(response.data.message || 'Notification broadcasted successfully!');
      setMessage(''); // Reset internal form buffer
      
      if (onNotificationSent) {
        onNotificationSent();
      }
    } catch (err: any) {
      console.error('Failed to send global notification:', err);
      setError(err.response?.data?.message || 'An error occurred while broadcasting.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ padding: '24px', backgroundColor: '#fff', borderRadius: '8px', maxWidth: '500px', border: '1px solid #e5e7eb', textAlign: 'left' }}>
      <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '16px', color: '#1f2937' }}>
        Broadcast System Notification
      </h2>
      <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '16px' }}>
        This message will be sent immediately to every user's notification history page.
      </p>

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '16px' }}>
          <label htmlFor="message" style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '4px' }}>
            Global Message
          </label>
          <textarea
            id="message"
            rows={4}
            style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '6px', color: '#111827', resize: 'none' }}
            placeholder="Type system alert here (e.g., Scheduled maintenance at 10:00 PM)..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            disabled={isLoading}
            maxLength={255}
          />
          <span style={{ display: 'block', textAlign: 'right', fontSize: '0.75rem', color: '#9ca3af', marginTop: '4px' }}>
            {255 - message.length} characters remaining
          </span>
        </div>

        {error && (
          <div style={{ padding: '12px', backgroundColor: '#fef2f2', color: '#b91c1c', fontSize: '0.875rem', borderRadius: '6px', marginBottom: '16px' }}>
            {error}
          </div>
        )}

        {successMessage && (
          <div style={{ padding: '12px', backgroundColor: '#f0fdf4', color: '#15803d', fontSize: '0.875rem', borderRadius: '6px', marginBottom: '16px' }}>
            {successMessage}
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          style={{
            width: '100%',
            padding: '10px 16px',
            borderRadius: '6px',
            fontWeight: 500,
            color: '#fff',
            backgroundColor: isLoading ? '#93c5fd' : '#2563eb',
            border: 'none',
            cursor: isLoading ? 'not-allowed' : 'pointer'
          }}
        >
          {isLoading ? 'Broadcasting...' : 'Send to All Users'}
        </button>
      </form>
    </div>
  );
};

export default GlobalNotificationForm;