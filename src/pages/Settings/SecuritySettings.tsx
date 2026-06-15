import React from "react";
import { AlertCircle } from "lucide-react";

export const SecuritySettings = () => (
  <div className="space-y-6">
    <div className="flex justify-between items-center pb-6 border-b border-gray-100 dark:border-gray-900">
      <div>
        <p className="font-bold text-sm text-[#141414] dark:text-white">Two-Factor Authentication</p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Add an extra layer of security</p>
      </div>
      <button className="cursor-pointer px-4 py-2 bg-white dark:bg-[#141414] border border-gray-300 dark:border-gray-800 text-[#141414] dark:text-white rounded-xl text-xs font-bold hover:bg-gray-50 dark:hover:bg-[#1A1A1A] transition-colors">Enable 2FA</button>
    </div>
    <div className="flex justify-between items-center pb-6 border-b border-gray-100 dark:border-gray-900">
      <div>
        <p className="font-bold text-sm text-[#141414] dark:text-white">Session Management</p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Active sessions: Chrome on Mac, Safari on iPhone</p>
      </div>
      <button className="cursor-pointer text-xs font-bold text-red-500 hover:underline">Logout All</button>
    </div>
    <div className="flex justify-between items-center">
      <div>
        <p className="font-bold text-sm text-[#141414] dark:text-white">API Keys</p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Generate API keys for programmatic access</p>
      </div>
      <button className="cursor-pointer px-4 py-2 bg-white dark:bg-[#141414] border border-gray-300 dark:border-gray-800 text-[#141414] dark:text-white rounded-xl text-xs font-bold hover:bg-gray-50 dark:hover:bg-[#1A1A1A] transition-colors">Generate Key</button>
    </div>
    <div className="pt-6">
      <div className="border border-red-200 dark:border-red-900/40 bg-red-50 dark:bg-red-950/10 p-5 rounded-xl flex items-start gap-3">
        <AlertCircle size={20} className="text-red-600 shrink-0 mt-0.5" />
        <div>
          <p className="font-bold text-sm text-red-700 dark:text-red-400">Danger Zone</p>
          <p className="text-xs font-medium text-red-600 dark:text-red-500 mt-1">Permanently delete your account and all associated data.</p>
          <button className="cursor-pointer mt-3 text-xs font-bold text-red-700 dark:text-red-400 hover:underline">Delete Account</button>
        </div>
      </div>
    </div>
  </div>
);