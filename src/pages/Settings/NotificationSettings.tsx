import React from "react";

export const NotificationSettings = () => (
  <div className="space-y-6">
    {[
      { label: "Email notifications", desc: "Receive updates via email", enabled: true },
      { label: "Push notifications", desc: "Browser push notifications", enabled: false },
      { label: "Slack integration", desc: "Get alerts in Slack", enabled: true },
      { label: "Weekly digest", desc: "Summary of weekly activity", enabled: false },
    ].map((item, i) => (
      <div key={i} className="flex justify-between items-center pb-4 border-b border-gray-50 dark:border-gray-900 last:border-0 last:pb-0">
        <div>
          <p className="font-bold text-[#141414] dark:text-white text-sm">{item.label}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{item.desc}</p>
        </div>
        <input 
          title={item.label} 
          type="checkbox" 
          defaultChecked={item.enabled} 
          className="cursor-pointer w-4 h-4 accent-[#141414] dark:accent-white" 
        />
      </div>
    ))}
  </div>
);