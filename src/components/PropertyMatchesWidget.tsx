import React, { useEffect, useState } from "react";
import { api } from "../lib/api";

interface AIMatchNotification {
  id: string;
  data: {
    property_id: number;
    lead_id: number;
    score: number;
    reasoning: string;
  };
  created_at: string;
}

export const PropertyMatchesWidget: React.FC = () => {
  const [notifications, setNotifications] = useState<AIMatchNotification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMatches = async () => {
      try {
        // Assuming you have a standard Laravel notification fetch endpoint
        const response = await api.get("/me/notifications?type=PropertyMatchFound");
        setNotifications(response.data);
      } catch (error) {
        console.error("Failed to fetch matches", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMatches();
  }, []);

  if (loading) return <div className="p-6 text-sm text-gray-500">Loading matches...</div>;

  if (notifications.length === 0) {
    return <div className="p-6 text-sm text-gray-500 border border-[#141414] bg-white">No new matches found.</div>;
  }

  return (
    <div className="bg-white border border-[#141414] p-6 shadow-[4px_4px_0px_0px_rgba(20,20,20,1)]">
      <h3 className="font-display text-xl font-bold text-[#141414] mb-4">
        AI Lead Matches
      </h3>
      <div className="space-y-4">
        {notifications.map((notification) => (
          <div key={notification.id} className="border-b border-gray-200 pb-4 last:border-0 last:pb-0">
            <div className="flex items-center justify-between mb-1">
              <span className="font-bold text-sm text-[#141414] uppercase tracking-wider">
                Lead #{notification.data.lead_id}
              </span>
              <span className="font-bold text-sm text-[#141414]">
                Score: {notification.data.score}%
              </span>
            </div>
            <p className="text-sm text-[#141414]">
              {notification.data.reasoning}
            </p>
            <div className="text-xs text-gray-500 mt-2">
              Property #{notification.data.property_id} • {new Date(notification.created_at).toLocaleDateString()}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};