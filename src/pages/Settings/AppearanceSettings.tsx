import React from "react";
import { Moon, Sun } from "lucide-react";
import { cn } from "../../lib/utils";
import { useTheme } from "../../lib/ThemeContext";

export const AppearanceSettings = () => {
  const { isDark, toggleTheme } = useTheme();

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-sm font-bold text-[#141414] dark:text-white mb-3">Theme Preference</h3>
        <div className="grid grid-cols-2 gap-4 max-w-md">
          <button 
            onClick={() => { if (isDark) toggleTheme(); }} 
            className={cn(
              "cursor-pointer p-4 border-2 rounded-xl transition-all flex flex-col items-center justify-center gap-2", 
              !isDark 
                ? "border-[#141414] dark:border-white bg-gray-50 dark:bg-[#141414] text-[#141414] dark:text-white" 
                : "border-gray-100 dark:border-gray-900 text-gray-400 hover:border-gray-300 dark:hover:border-gray-800 hover:text-[#141414] dark:hover:text-white"
            )}
          >
            <Sun size={20} />
            <span className="text-xs font-bold uppercase tracking-wider">Light</span>
          </button>
          
          <button 
            onClick={() => { if (!isDark) toggleTheme(); }} 
            className={cn(
              "cursor-pointer p-4 border-2 rounded-xl transition-all flex flex-col items-center justify-center gap-2", 
              isDark 
                ? "border-[#141414] dark:border-white bg-gray-50 dark:bg-[#141414] text-[#141414] dark:text-white" 
                : "border-gray-100 dark:border-gray-900 text-gray-400 hover:border-gray-300 dark:hover:border-gray-800 hover:text-[#141414] dark:hover:text-white"
            )}
          >
            <Moon size={20} />
            <span className="text-xs font-bold uppercase tracking-wider">Dark</span>
          </button>
        </div>
      </div>
      <div>
        <h3 className="text-sm font-bold text-[#141414] dark:text-white mb-3">Accent Color</h3>
        <div className="flex gap-3">
          {["#141414", "#3B82F6", "#EF4444", "#10B981", "#F59E0B"].map((color) => (
            <button 
              key={color} 
              title={`Select ${color}`} 
              className="cursor-pointer w-10 h-10 rounded-full border-2 border-white dark:border-[#0A0A0A] shadow-sm transition-transform hover:scale-110" 
              style={{ backgroundColor: color }} 
            />
          ))}
        </div>
      </div>
    </div>
  );
};