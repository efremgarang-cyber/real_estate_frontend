import React, { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { 
  ArrowLeft, Loader2, CheckCircle2, AlertCircle, 
  Eye, EyeOff, KeyRound, X, ArrowRight
} from "lucide-react";
import { cn } from "@/src/lib/utils";
import { api } from "@/src/lib/api";
// --- TOAST NOTIFICATION SYSTEM ---
interface ToastNotification {
  id: string;
  type: "success" | "error";
  title: string;
  message: string;
}

const Toast: React.FC<{ notification: ToastNotification; onClose: () => void }> = ({ notification, onClose }) => {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsExiting(true);
      setTimeout(onClose, 400); 
    }, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div 
      className={cn(
        "w-80 sm:w-96 rounded-xl border shadow-xl p-4 flex items-start gap-3",
        notification.type === 'success' ? "bg-emerald-50 border-emerald-200" : "bg-red-50 border-red-200"
      )}
      style={{
        animation: isExiting 
          ? 'slideUpFadeOut 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards' 
          : 'slideDownFadeIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards'
      }}
    >
      <style>{`
        @keyframes slideDownFadeIn {
          from { opacity: 0; transform: translateY(-40px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes slideUpFadeOut {
          from { opacity: 1; transform: translateY(0) scale(1); }
          to { opacity: 0; transform: translateY(-40px) scale(0.95); }
        }
      `}</style>
      <div className="flex-shrink-0 mt-0.5">
        {notification.type === 'success' ? <CheckCircle2 className="text-emerald-600" size={18} /> : <AlertCircle className="text-red-600" size={18} />}
      </div>
      <div className="flex-1 min-w-0">
        <p className={cn("text-sm font-bold", notification.type === 'success' ? "text-emerald-900" : "text-red-900")}>
          {notification.title}
        </p>
        <p className={cn("text-sm mt-0.5 leading-snug", notification.type === 'success' ? "text-emerald-700" : "text-red-700")}>
          {notification.message}
        </p>
      </div>
      <button onClick={() => { setIsExiting(true); setTimeout(onClose, 400); }} className="flex-shrink-0 text-gray-400 hover:text-gray-800 transition-colors">
        <X size={16} />
      </button>
    </div>
  );
};

export const UpdatePasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Extract the email and code passed from the LoginPage
  const { email, code } = location.state || {};

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notifications, setNotifications] = useState<ToastNotification[]>([]);

  // Security check: If a user tries to visit this page directly without going through the forgot password flow
  useEffect(() => {
    if (!email || !code) {
      navigate('/login');
    }
  }, [email, code, navigate]);

  const addNotification = (type: "success" | "error", title: string, message: string) => {
    const newId = Math.random().toString(36).substring(2, 9);
    setNotifications((prev) => [...prev, { id: newId, type, title, message }]);
  };

  const removeNotification = (idToRemove: string) => {
    setNotifications((prev) => prev.filter(n => n.id !== idToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password.length < 8) {
      addNotification("error", "Invalid Password", "Password must be at least 8 characters long.");
      return;
    }
    if (password !== confirmPassword) {
      addNotification("error", "Mismatch", "The passwords you entered do not match.");
      return;
    }

    setIsSubmitting(true);

    try {
      // Hitting the REAL backend reset endpoint
      await api.post('/password/reset', { 
        email, 
        code,
        password, 
        password_confirmation: confirmPassword 
      });

      addNotification("success", "Password Updated", "Your password has been changed successfully. Redirecting to login...");
      
      setPassword("");
      setConfirmPassword("");

      // Redirect back to login after showing the success toast
      setTimeout(() => {
        navigate("/login");
      }, 3000);

    } catch (error: any) {
      const errMsg = error?.response?.data?.message || "Invalid or expired recovery code. Please request a new one.";
      addNotification("error", "Update Failed", errMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!email || !code) return null; // Prevent rendering if blocked by useEffect

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#f8f9fa] to-[#e9ecef] dark:from-[#0A0A0A] dark:to-[#111111] p-6 font-sans relative">
      
      {/* Toast Notification Container */}
      <div className="fixed top-4 right-4 z-[200] flex flex-col gap-3 pointer-events-none">
        {notifications.map(notif => (
          <div key={notif.id} className="pointer-events-auto">
            <Toast notification={notif} onClose={() => removeNotification(notif.id)} />
          </div>
        ))}
      </div>

      <div className="max-w-md w-full p-10 bg-white dark:bg-[#141414] border border-gray-200 dark:border-gray-800 rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.05)]">
        
        {/* Header Logo & Back Button */}
        <div className="flex flex-col items-center justify-center mb-6 relative">
          <Link 
            to="/login"
            className="absolute left-0 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#141414] dark:hover:text-white transition-colors"
            title="Back to login"
          >
            <ArrowLeft size={20} />
          </Link>
          <div className="w-16 h-16 bg-[#141414] dark:bg-black rounded-full flex items-center justify-center shadow-md">
            <KeyRound size={28} className="text-white" />
          </div>
        </div>

        <h1 className="font-display text-2xl font-bold text-center text-[#141414] dark:text-white mb-2">
          Set New Password
        </h1>
        <p className="text-sm text-center text-gray-500 dark:text-gray-400 mb-8">
          Your new password for <span className="font-bold">{email}</span> must be different from previously used passwords.
        </p>

        <form onSubmit={handleSubmit} className="space-y-5 text-left">
          
          {/* New Password Field */}
          <div>
            <label className="block text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1.5">
              New Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"} required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-[#0A0A0A] border border-gray-200 dark:border-gray-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#D4AF37] transition-all pr-12 text-sm text-[#141414] dark:text-white placeholder-gray-400"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#141414] dark:hover:text-white transition-colors"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Confirm Password Field */}
          <div>
            <label className="block text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1.5">
              Confirm New Password
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"} required
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-[#0A0A0A] border border-gray-200 dark:border-gray-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#D4AF37] transition-all pr-12 text-sm text-[#141414] dark:text-white placeholder-gray-400"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#141414] dark:hover:text-white transition-colors"
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit" disabled={isSubmitting || !password || !confirmPassword}
            className="w-full flex items-center justify-center gap-2 py-3.5 mt-4 bg-[#141414] dark:bg-white hover:bg-black dark:hover:bg-gray-100 text-white dark:text-[#141414] rounded-xl font-bold transition-transform hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:hover:scale-100 shadow-sm"
          >
            {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : "Reset Password"}
            {!isSubmitting && <ArrowRight size={18} />}
          </button>
        </form>

      </div>
    </div>
  );
};