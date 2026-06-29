import React, { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { 
  ShieldCheck, 
  User, 
  Clock, 
  Activity, 
  AlertCircle, 
  Search, 
  Filter, 
  Download, 
  RefreshCw,
  Eye,
  Trash2,
  Edit,
  LogIn,
  LogOut,
  Settings,
  UserPlus,
  UserMinus,
  Lock,
  Unlock,
  X
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// Types
interface AuditLog {
  id: number;
  action: string;
  description: string | null;
  created_at: string;
  user_name: string | null;
  user_id?: number | null;
  ip_address?: string | null;
  user_agent?: string | null;
}

interface FilterOptions {
  action: string;
  dateRange: 'today' | 'week' | 'month' | 'all';
  searchTerm: string;
  userFilter: string;
  ipFilter: string;
}

// Normalize action string for consistent matching
const normalizeAction = (action: string): string => {
  if (!action) return 'unknown';
  return action.toLowerCase().trim();
};

// Check if action is a login-related event
const isLoginAction = (action: string): boolean => {
  if (!action) return false;
  const normalized = normalizeAction(action);
  return normalized.includes('login') || 
         normalized.includes('log in') || 
         normalized.includes('signin') || 
         normalized.includes('sign in') ||
         normalized === 'login';
};

// Check if action is a logout-related event
const isLogoutAction = (action: string): boolean => {
  if (!action) return false;
  const normalized = normalizeAction(action);
  return normalized.includes('logout') || 
         normalized.includes('log out') || 
         normalized.includes('signout') || 
         normalized.includes('sign out') ||
         normalized === 'logout';
};

// Action icon mapping with more variations
const actionIcons: Record<string, React.ReactNode> = {
  'login': <LogIn size={14} />,
  'log in': <LogIn size={14} />,
  'signin': <LogIn size={14} />,
  'sign in': <LogIn size={14} />,
  'logout': <LogOut size={14} />,
  'log out': <LogOut size={14} />,
  'signout': <LogOut size={14} />,
  'sign out': <LogOut size={14} />,
  'create': <UserPlus size={14} />,
  'created': <UserPlus size={14} />,
  'adding': <UserPlus size={14} />,
  'delete': <UserMinus size={14} />,
  'deleted': <UserMinus size={14} />,
  'removing': <UserMinus size={14} />,
  'update': <Edit size={14} />,
  'updated': <Edit size={14} />,
  'editing': <Edit size={14} />,
  'view': <Eye size={14} />,
  'viewed': <Eye size={14} />,
  'viewing': <Eye size={14} />,
  'settings': <Settings size={14} />,
  'setting': <Settings size={14} />,
  'configuration': <Settings size={14} />,
  'lock': <Lock size={14} />,
  'locked': <Lock size={14} />,
  'unlock': <Unlock size={14} />,
  'unlocked': <Unlock size={14} />,
  'default': <Activity size={14} />
};

// Action color mapping with more variations
const actionColors: Record<string, string> = {
  'login': 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/30',
  'log in': 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/30',
  'signin': 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/30',
  'logout': 'text-gray-500 bg-gray-50 dark:bg-gray-900/30',
  'log out': 'text-gray-500 bg-gray-50 dark:bg-gray-900/30',
  'signout': 'text-gray-500 bg-gray-50 dark:bg-gray-900/30',
  'create': 'text-blue-500 bg-blue-50 dark:bg-blue-950/30',
  'created': 'text-blue-500 bg-blue-50 dark:bg-blue-950/30',
  'delete': 'text-red-500 bg-red-50 dark:bg-red-950/30',
  'deleted': 'text-red-500 bg-red-50 dark:bg-red-950/30',
  'update': 'text-amber-500 bg-amber-50 dark:bg-amber-950/30',
  'updated': 'text-amber-500 bg-amber-50 dark:bg-amber-950/30',
  'view': 'text-purple-500 bg-purple-50 dark:bg-purple-950/30',
  'viewed': 'text-purple-500 bg-purple-50 dark:bg-purple-950/30',
  'settings': 'text-indigo-500 bg-indigo-50 dark:bg-indigo-950/30',
  'lock': 'text-orange-500 bg-orange-50 dark:bg-orange-950/30',
  'locked': 'text-orange-500 bg-orange-50 dark:bg-orange-950/30',
  'unlock': 'text-teal-500 bg-teal-50 dark:bg-teal-950/30',
  'unlocked': 'text-teal-500 bg-teal-50 dark:bg-teal-950/30',
  'default': 'text-gray-500 bg-gray-50 dark:bg-gray-900/30'
};

// Get the base action for matching
const getBaseAction = (action: string): string => {
  const normalized = normalizeAction(action);
  const knownActions = ['login', 'logout', 'create', 'delete', 'update', 'view', 'settings', 'lock', 'unlock'];
  for (const known of knownActions) {
    if (normalized.includes(known) || known.includes(normalized)) {
      return known;
    }
  }
  return normalized;
};

// Utility function for relative time
const formatRelativeTime = (dateString: string): string => {
  if (!dateString) return 'Just now';
  
  try {
    const now = new Date();
    const past = new Date(dateString.replace(' ', 'T'));
    
    if (isNaN(past.getTime())) return 'Just now';
    
    const elapsed = now.getTime() - past.getTime();
    const msPerMinute = 60 * 1000;
    const msPerHour = msPerMinute * 60;
    const msPerDay = msPerHour * 24;

    if (elapsed < msPerMinute) return 'Just now';
    if (elapsed < msPerHour) return Math.round(elapsed / msPerMinute) + 'm ago';
    if (elapsed < msPerDay) return Math.round(elapsed / msPerHour) + 'h ago';
    if (elapsed < msPerDay * 7) return Math.round(elapsed / msPerDay) + 'd ago';
    return new Date(past).toLocaleDateString();
  } catch {
    return 'Just now';
  }
};

// Filter Component
const FilterBar: React.FC<{
  filters: FilterOptions;
  onFilterChange: (filters: FilterOptions) => void;
  onRefresh: () => void;
  isLoading: boolean;
  onExport: () => void;
  totalCount: number;
  filteredCount: number;
}> = ({ 
  filters, 
  onFilterChange, 
  onRefresh, 
  isLoading, 
  onExport,
  totalCount,
  filteredCount 
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const clearFilters = () => {
    onFilterChange({
      action: 'all',
      dateRange: 'all',
      searchTerm: '',
      userFilter: '',
      ipFilter: ''
    });
  };

  const hasActiveFilters = filters.searchTerm || filters.userFilter || filters.ipFilter || filters.action !== 'all' || filters.dateRange !== 'all';

  return (
    <div className="bg-white dark:bg-[#111111] rounded-2xl border border-gray-100 dark:border-gray-800 p-4">
      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="flex-1 min-w-[200px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            placeholder="Search activities..."
            value={filters.searchTerm}
            onChange={(e) => onFilterChange({ ...filters, searchTerm: e.target.value })}
            className="w-full pl-9 pr-4 py-2 bg-gray-50 dark:bg-[#1A1A1A] border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
          />
        </div>

        {/* Action Filter */}
        <select
          value={filters.action}
          onChange={(e) => onFilterChange({ ...filters, action: e.target.value })}
          className="px-4 py-2 bg-gray-50 dark:bg-[#1A1A1A] border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
        >
          <option value="all">All Actions</option>
          <option value="login">Login</option>
          <option value="logout">Logout</option>
          <option value="create">Create</option>
          <option value="update">Update</option>
          <option value="delete">Delete</option>
          <option value="view">View</option>
          <option value="settings">Settings</option>
          <option value="lock">Lock</option>
          <option value="unlock">Unlock</option>
        </select>

        {/* Date Range Filter */}
        <select
          value={filters.dateRange}
          onChange={(e) => onFilterChange({ ...filters, dateRange: e.target.value as FilterOptions['dateRange'] })}
          className="px-4 py-2 bg-gray-50 dark:bg-[#1A1A1A] border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
        >
          <option value="today">Today</option>
          <option value="week">This Week</option>
          <option value="month">This Month</option>
          <option value="all">All Time</option>
        </select>

        {/* Refresh Button */}
        <button
          onClick={onRefresh}
          disabled={isLoading}
          className="p-2 bg-gray-50 dark:bg-[#1A1A1A] border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          title="Refresh logs"
        >
          <RefreshCw size={18} className={`${isLoading ? 'animate-spin' : ''}`} />
        </button>

        {/* Toggle Advanced Filters */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={`p-2 bg-gray-50 dark:bg-[#1A1A1A] border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-all ${isExpanded ? 'bg-indigo-50 dark:bg-indigo-950/30 border-indigo-300 dark:border-indigo-800' : ''}`}
          title="Advanced filters"
        >
          <Filter size={18} />
        </button>

        {/* Export Button */}
        <button
          onClick={onExport}
          disabled={filteredCount === 0}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Download size={16} /> Export
        </button>

        {/* Filter Count Badge */}
        {hasActiveFilters && (
          <span className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">
            {filteredCount} of {totalCount}
          </span>
        )}
      </div>

      {/* Advanced Filters */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-medium text-gray-500 block mb-1.5">Filter by User</label>
                  <input
                    type="text"
                    placeholder="Enter username..."
                    value={filters.userFilter}
                    onChange={(e) => onFilterChange({ ...filters, userFilter: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-[#1A1A1A] border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 block mb-1.5">Filter by IP Address</label>
                  <input
                    type="text"
                    placeholder="Enter IP address..."
                    value={filters.ipFilter}
                    onChange={(e) => onFilterChange({ ...filters, ipFilter: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-[#1A1A1A] border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                  />
                </div>
                <div className="flex items-end">
                  <button
                    onClick={clearFilters}
                    className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    <X size={16} /> Clear All Filters
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Log Card Component
const LogCard: React.FC<{ log: AuditLog; index: number }> = ({ log, index }) => {
  const normalizedAction = normalizeAction(log.action || '');
  const baseAction = getBaseAction(normalizedAction);
  const Icon = actionIcons[normalizedAction] || actionIcons[baseAction] || actionIcons.default;
  const colorClass = actionColors[normalizedAction] || actionColors[baseAction] || actionColors.default;
  const isSystem = !log.user_name;

  // Determine status indicator color based on action
  const getStatusColor = () => {
    if (isSystem) return 'bg-gray-400';
    if (isLoginAction(log.action || '')) return 'bg-emerald-400';
    if (isLogoutAction(log.action || '')) return 'bg-red-400';
    return 'bg-emerald-400'; // Default to green for other actions
  };

  // Determine status label based on action
  const getStatusLabel = () => {
    if (isSystem) return 'system';
    if (isLoginAction(log.action || '')) return 'active';
    if (isLogoutAction(log.action || '')) return 'offline';
    return 'active';
  };

  const statusColor = getStatusColor();
  const statusLabel = getStatusLabel();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="group relative flex flex-col justify-between p-5 bg-white dark:bg-[#111111] border border-gray-100 dark:border-gray-800 rounded-2xl hover:shadow-xl hover:border-indigo-200 dark:hover:border-indigo-900 transition-all duration-300"
    >
      {/* Status indicator */}
      {!isSystem && (
        <div className="absolute top-3 right-3 flex items-center gap-1.5">
          <span className={`w-1.5 h-1.5 ${statusColor} rounded-full animate-pulse`} />
          <span className="text-[10px] text-gray-400">{statusLabel}</span>
        </div>
      )}

      <div className="flex justify-between items-start mb-4">
        <div className={`p-2.5 rounded-xl ${colorClass}`}>
          {Icon}
        </div>
        <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 bg-gray-50 dark:bg-[#1A1A1A] px-2.5 py-1 rounded-md">
          {log.action || 'unknown'}
        </span>
      </div>
      
      <div>
        <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
          {log.user_name || 'System'}
          {isSystem && (
            <span className="text-[10px] font-normal text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">
              System
            </span>
          )}
        </h4>
        
        {log.description && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
            {log.description}
          </p>
        )}
        
        <div className="flex items-center gap-3 mt-3 text-gray-400">
          <Clock size={12} />
          <span className="text-xs">{formatRelativeTime(log.created_at)}</span>
          {log.ip_address && (
            <>
              <span className="w-px h-3 bg-gray-200 dark:bg-gray-700" />
              <span className="text-xs font-mono">{log.ip_address}</span>
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
};

// Stats Summary Component
const StatsSummary: React.FC<{ logs: AuditLog[] }> = ({ logs }) => {
  const stats = useMemo(() => {
    const total = logs.length;
    const uniqueUsers = new Set(logs.map(l => l.user_name).filter(Boolean)).size;
    const today = new Date().toDateString();
    const todayLogs = logs.filter(l => new Date(l.created_at).toDateString() === today).length;
    
    const actionCounts = logs.reduce((acc, log) => {
      const action = log.action || 'unknown';
      acc[action] = (acc[action] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const topAction = Object.entries(actionCounts)
      .sort((a, b) => b[1] - a[1])[0];

    return { total, uniqueUsers, todayLogs, topAction };
  }, [logs]);

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-[#111111] rounded-2xl border border-gray-100 dark:border-gray-800 p-4"
      >
        <p className="text-xs text-gray-400 font-medium">Total Activities</p>
        <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stats.total}</p>
      </motion.div>
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white dark:bg-[#111111] rounded-2xl border border-gray-100 dark:border-gray-800 p-4"
      >
        <p className="text-xs text-gray-400 font-medium">Unique Users</p>
        <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stats.uniqueUsers}</p>
      </motion.div>
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white dark:bg-[#111111] rounded-2xl border border-gray-100 dark:border-gray-800 p-4"
      >
        <p className="text-xs text-gray-400 font-medium">Today's Activity</p>
        <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stats.todayLogs}</p>
      </motion.div>
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white dark:bg-[#111111] rounded-2xl border border-gray-100 dark:border-gray-800 p-4"
      >
        <p className="text-xs text-gray-400 font-medium">Top Action</p>
        <p className="text-lg font-bold text-gray-900 dark:text-white mt-1 capitalize">
          {stats.topAction?.[0] || 'N/A'}
        </p>
        <p className="text-xs text-gray-400">{stats.topAction?.[1] || 0} occurrences</p>
      </motion.div>
    </div>
  );
};

// Main Audit Logs Component
const AuditLogs: React.FC = () => {
  const [allLogs, setAllLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [visibleCount, setVisibleCount] = useState(15);
  const [filters, setFilters] = useState<FilterOptions>({
    action: 'all',
    dateRange: 'all',
    searchTerm: '',
    userFilter: '',
    ipFilter: ''
  });
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Apply filters to logs (client-side filtering)
  const filteredLogs = useMemo(() => {
    let result = allLogs;

    // Filter by search term
    if (filters.searchTerm) {
      const term = filters.searchTerm.toLowerCase();
      result = result.filter(log =>
        log.user_name?.toLowerCase().includes(term) ||
        log.action?.toLowerCase().includes(term) ||
        log.description?.toLowerCase().includes(term) ||
        log.ip_address?.includes(term)
      );
    }

    // Filter by action - IMPROVED with multiple matching strategies
    if (filters.action !== 'all') {
      const selectedAction = filters.action.toLowerCase();
      result = result.filter(log => {
        if (!log.action) return false;
        
        const logAction = log.action.toLowerCase();
        const baseLogAction = getBaseAction(logAction);
        
        // Check multiple matching strategies:
        // 1. Exact match
        if (logAction === selectedAction) return true;
        // 2. Base action match (e.g., "logged in" matches "login")
        if (baseLogAction === selectedAction) return true;
        // 3. Contains match (e.g., "user_login" matches "login")
        if (logAction.includes(selectedAction)) return true;
        // 4. Selected action is contained in log action (e.g., "login" matches "user_login")
        if (selectedAction.includes(logAction)) return true;
        
        return false;
      });
    }

    // Filter by date range
    if (filters.dateRange !== 'all') {
      const now = new Date();
      const filterDate = new Date();
      
      switch (filters.dateRange) {
        case 'today':
          filterDate.setHours(0, 0, 0, 0);
          result = result.filter(log => 
            new Date(log.created_at) >= filterDate
          );
          break;
        case 'week':
          filterDate.setDate(filterDate.getDate() - 7);
          result = result.filter(log => 
            new Date(log.created_at) >= filterDate
          );
          break;
        case 'month':
          filterDate.setMonth(filterDate.getMonth() - 1);
          result = result.filter(log => 
            new Date(log.created_at) >= filterDate
          );
          break;
      }
    }

    // Filter by user
    if (filters.userFilter) {
      const userTerm = filters.userFilter.toLowerCase();
      result = result.filter(log => 
        log.user_name?.toLowerCase().includes(userTerm)
      );
    }

    // Filter by IP
    if (filters.ipFilter) {
      result = result.filter(log => 
        log.ip_address?.includes(filters.ipFilter)
      );
    }

    // Sort by most recent first
    return result.sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }, [allLogs, filters]);

  // Export to CSV function
  const exportToCSV = useCallback(() => {
    if (filteredLogs.length === 0) return;

    const headers = ["ID", "User", "Action", "Description", "IP Address", "Timestamp"];
    const rows = filteredLogs.map(log => [
      log.id,
      log.user_name || 'System',
      log.action || 'unknown',
      `"${(log.description || '').replace(/"/g, '""')}"`,
      log.ip_address || '',
      log.created_at
    ]);

    const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `audit-logs-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }, [filteredLogs]);

  // Fetch logs function
  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('makao_token');
      
      if (!token) {
        console.warn('No authentication token found');
        setLoading(false);
        return;
      }

      const response = await fetch('/api/v1/admin/logs', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setAllLogs(data);
      setVisibleCount(15);
    } catch (error) {
      console.error('Failed to fetch audit logs:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Get visible logs for pagination
  const visibleLogs = useMemo(() => {
    return filteredLogs.slice(0, visibleCount);
  }, [filteredLogs, visibleCount]);

  // Load more handler
  const loadMore = useCallback(() => {
    setVisibleCount(prev => prev + 15);
  }, []);

  // Initial fetch and polling
  useEffect(() => {
    fetchLogs();

    // Set up polling every 30 seconds
    pollingIntervalRef.current = setInterval(fetchLogs, 30000);

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, [fetchLogs]);

  return (
    <div className="space-y-6">
      {/* Stats Summary */}
      <StatsSummary logs={filteredLogs} />

      {/* Filter Bar */}
      <FilterBar
        filters={filters}
        onFilterChange={setFilters}
        onRefresh={fetchLogs}
        isLoading={loading}
        onExport={exportToCSV}
        totalCount={allLogs.length}
        filteredCount={filteredLogs.length}
      />

      {/* Logs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          [...Array(6)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-100 dark:bg-[#1A1A1A] animate-pulse rounded-2xl" />
          ))
        ) : visibleLogs.length > 0 ? (
          visibleLogs.map((log, index) => (
            <LogCard key={log.id} log={log} index={index} />
          ))
        ) : (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="col-span-full py-20 text-center text-gray-400"
          >
            <AlertCircle className="mx-auto mb-3 opacity-50" size={32} />
            <p className="text-sm font-medium">No activities found</p>
            <p className="text-xs mt-1">Try adjusting your filters</p>
          </motion.div>
        )}
      </div>

      {/* Load More Pagination */}
      {visibleCount < filteredLogs.length && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex justify-center pt-4"
        >
          <button 
            onClick={loadMore}
            className="px-6 py-2.5 bg-white dark:bg-[#111111] border border-gray-200 dark:border-gray-800 rounded-xl text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex items-center gap-2"
          >
            Load More ({visibleCount} of {filteredLogs.length})
          </button>
        </motion.div>
      )}
    </div>
  );
};

// Main Page Component
export const AdminSecurityPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50/50 via-white to-gray-50/50 dark:from-[#050505] dark:via-[#0A0A0A] dark:to-[#050505] p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header Section */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-center justify-between gap-4"
        >
          <div className="flex items-center gap-4">
            <div className="p-4 bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-2xl shadow-xl shadow-indigo-500/20">
              <ShieldCheck className="text-white" size={28} />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
                Security Center
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                Real-time overview of system-wide activity and authentication logs
              </p>
            </div>
          </div>
        </motion.div>

        {/* Audit Logs */}
        <AuditLogs />
      </div>
    </div>
  );
};

export default AuditLogs;