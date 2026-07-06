// src/components/admin/UserMonitor.tsx
import React, { useState, useEffect, useMemo, useRef } from "react";
import { MoreVertical, Search, Filter, UserPlus, Eye, Edit2, Trash2 } from "lucide-react";
import { cn } from "../../lib/utils";

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  status: 'Active' | 'Inactive';
  addDate: string;
  lastActive: string;
  access: boolean;
  img?: string;
  desc?: string;
}

export const UserMonitor: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [openActionId, setOpenActionId] = useState<number | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [modalMode, setModalMode] = useState<'view' | 'edit'>('view');
  const [roleFilter, setRoleFilter] = useState("All");
  const [showFilter, setShowFilter] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newUser, setNewUser] = useState({ name: '', email: '', role: 'Agent', password: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filterRef = useRef<HTMLDivElement>(null);

  // Fetch live users from Laravel API
  useEffect(() => {
    const fetchUsers = async () => {
      const token = localStorage.getItem('makao_token');
      try {
        const res = await fetch('/api/v1/admin/users', {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });

        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

        const data = await res.json();
        setUsers(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Failed to fetch users:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  const filteredUsers = useMemo(() => {
    if (!Array.isArray(users)) return [];
    
    return users.filter(u => {
      const matchesSearch = u.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRole = roleFilter === "All" || u.role.toLowerCase() === roleFilter.toLowerCase();
      return matchesSearch && matchesRole;
    });
  }, [searchTerm, users, roleFilter]);

  const toggleUserAccess = async (user: User) => {
    const newAccessStatus = !user.access;
    try {
      const res = await fetch(`/api/v1/admin/users/${user.id}/access`, {
        method: 'PATCH',
        headers: { 
          'Authorization': `Bearer ${localStorage.getItem('makao_token')}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json' 
        },
        body: JSON.stringify({ access: newAccessStatus })
      });

      if (res.ok) {
        setUsers(prev => prev.map(u => u.id === user.id ? { ...u, access: newAccessStatus } : u));
      } else {
        alert("Failed to update access status.");
      }
    } catch (err) {
      console.error("Error updating access", err);
    }
  };

  const handleViewProfile = (id: number) => {
    setSelectedUser(users.find(u => u.id === id) || null);
    setModalMode('view');
    setOpenActionId(null);
  };

  const handleEditUser = (id: number) => {
    setSelectedUser(users.find(u => u.id === id) || null);
    setModalMode('edit');
    setOpenActionId(null);
  };

  const handleDeleteUser = async (id: number) => {
    if (!confirm("Are you sure you want to delete this user? This action cannot be undone.")) return;

    try {
      const res = await fetch(`/api/v1/admin/users/${id}`, {
        method: 'DELETE',
        headers: { 
          'Authorization': `Bearer ${localStorage.getItem('makao_token')}`,
          'Accept': 'application/json' 
        }
      });

      if (res.ok) {
        setUsers(prev => prev.filter(u => u.id !== id));
      } else {
        const errorData = await res.json();
        alert(errorData.message || "Failed to delete user.");
      }
    } catch (err) {
      alert("An error occurred while deleting the user.");
    } finally {
      setOpenActionId(null);
    }
  };

  const handleAddUser = async () => {
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/v1/admin/users', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('makao_token')}`,
          'Accept': 'application/json'
        },
        body: JSON.stringify(newUser)
      });

      if (res.ok) {
        const createdUser = await res.json();
        const fullUser: User = {
          ...createdUser,
          status: 'Active',
          addDate: new Date().toISOString(),
          lastActive: new Date().toISOString(),
          access: true,
        };

        setUsers(prev => [...prev, fullUser]); 
        setShowAddModal(false);
        setNewUser({ name: '', email: '', role: 'Agent', password: '' });
      } else {
        const errorData = await res.json();
        alert(errorData.message || "Failed to create user.");
      }
    } catch (err) {
      console.error("Error creating user", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Close menus on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      setOpenActionId(null);
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setShowFilter(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const UserSkeleton = () => (
    <tr className="animate-pulse border-b border-gray-50 dark:border-gray-800">
      <td className="p-4"><div className="w-4 h-4 bg-gray-200 dark:bg-gray-800 rounded" /></td>
      <td className="p-4 flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-800 shrink-0" />
        <div className="space-y-2 w-full">
          <div className="w-24 h-3 bg-gray-200 dark:bg-gray-800 rounded max-w-full" />
          <div className="w-16 h-2 bg-gray-100 dark:bg-gray-800 rounded max-w-full" />
        </div>
      </td>
      {[...Array(6)].map((_, i) => (
        <td key={i} className="p-4"><div className="w-16 h-3 bg-gray-200 dark:bg-gray-800 rounded max-w-full" /></td>
      ))}
    </tr>
  );

  return (
    <div className="bg-white dark:bg-[#141414] rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden flex flex-col h-full w-full min-w-0">
      
      {/* HEADER: Fluid flex layout handling wrap on narrow screens */}
      <div className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 dark:border-gray-800 shrink-0">
        <h2 className="text-lg sm:text-xl font-bold flex items-center gap-2 text-[#141414] dark:text-white truncate">
          User Details 
          <span className="text-gray-400 font-normal text-sm bg-gray-100 dark:bg-[#0A0A0A] px-2 py-0.5 rounded-md shrink-0">
            {users.length}
          </span>
        </h2>
        
        {/* CONTROLS: Scalable grid/flex combinations */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 w-full md:w-auto min-w-0">
          
          {/* Search Box */}
          <div className="relative w-full sm:w-56 md:w-64 shrink-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input 
              className="w-full pl-9 pr-4 py-2 bg-gray-50 dark:bg-[#0A0A0A] rounded-lg text-sm border border-transparent dark:border-gray-700 dark:text-gray-200 focus:border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all" 
              placeholder="Search users..." 
              onChange={(e) => setSearchTerm(e.target.value)} 
            />
          </div>
          
          {/* Buttons Layout */}
          <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto shrink-0">
            <div className="relative flex-1 sm:flex-none" ref={filterRef}>
              <button 
                onClick={(e) => { e.stopPropagation(); setShowFilter(!showFilter); }}
                className={cn(
                  "w-full px-3 py-2 border rounded-lg dark:border-gray-700 dark:text-gray-300 transition-colors flex items-center justify-center gap-2",
                  roleFilter !== "All" ? "bg-gray-100 dark:bg-gray-800 border-gray-300" : "hover:bg-gray-50 dark:hover:bg-gray-800"
                )}
              >
                <Filter size={16} className="shrink-0" />
                <span className="text-sm font-medium sm:hidden lg:block truncate">
                  Filter {roleFilter !== "All" && `(${roleFilter})`}
                </span>
              </button>

              {showFilter && (
                <div className="absolute right-0 top-full mt-2 w-40 bg-white dark:bg-[#1A1A1A] border dark:border-gray-700 rounded-lg shadow-xl z-50 p-2">
                  <div className="text-[10px] font-bold text-gray-400 uppercase px-2 mb-2">Role</div>
                  {['All', 'Admin', 'Agent', 'Client'].map((role) => (
                    <button
                      key={role}
                      onClick={() => { setRoleFilter(role); setShowFilter(false); }}
                      className={cn(
                        "w-full text-left px-2 py-1.5 text-xs rounded-md transition-colors",
                        roleFilter === role 
                          ? "bg-gray-100 dark:bg-gray-800 font-bold dark:text-white" 
                          : "hover:bg-gray-50 dark:hover:bg-[#262626] text-gray-600 dark:text-gray-300"
                      )}
                    >
                      {role}
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            <button
              onClick={() => setShowAddModal(true)}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 bg-[#141414] dark:bg-white text-white dark:text-[#141414] px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-transform active:scale-[0.98] hover:opacity-90"
            >
              <UserPlus size={16} className="shrink-0" /> Add User
            </button>
          </div>
        </div>
      </div>

      {/* TABLE DATA: Horizontal scroll protected with safe overflow padding */}
      <div className="flex-1 overflow-x-auto overflow-y-visible w-full custom-scrollbar min-h-[300px]">
        <table className="w-full text-left text-sm min-w-[850px]">
          <thead className="bg-gray-50/50 dark:bg-[#0A0A0A] text-gray-500 dark:text-gray-400 uppercase text-[10px] font-bold sticky top-0 z-10 backdrop-blur-sm">
            <tr>
              <th className="p-4 w-12"><input type="checkbox" className="dark:bg-[#0A0A0A] dark:border-gray-600 rounded cursor-pointer" /></th>
              <th className="p-4">User Name</th>
              <th className="p-4">Email Address</th>
              <th className="p-4">User Role</th>
              <th className="p-4">Status</th>
              <th className="p-4">Add Date</th>
              <th className="p-4">Last Active</th>
              <th className="p-4">Access</th>
              <th className="p-4 text-center w-16">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
            {loading ? (
              [...Array(5)].map((_, i) => <UserSkeleton key={i} />)
            ) : filteredUsers.length > 0 ? (
              filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50/50 dark:hover:bg-[#1A1A1A] group transition-colors">
                  <td className="p-4"><input type="checkbox" className="dark:bg-[#0A0A0A] dark:border-gray-600 rounded cursor-pointer" /></td>
                  
                  <td className="p-4 flex items-center gap-3">
                    <img src={user.img || `https://i.pravatar.cc/150?u=${user.id}`} className="w-8 h-8 rounded-full object-cover shrink-0 bg-gray-100" alt="" />
                    <div className="min-w-0">
                      <div className="font-bold text-[#141414] dark:text-white truncate max-w-[160px]">{user.name}</div>
                      <div className="text-xs text-gray-400 truncate max-w-[160px]">{user.desc || "No description"}</div>
                    </div>
                  </td>
                  
                  <td className="p-4 text-gray-600 dark:text-gray-400 max-w-[180px] truncate" title={user.email}>{user.email}</td>
                  <td className="p-4 font-bold text-gray-700 dark:text-gray-300 capitalize">{user.role}</td>
                  
                  <td className="p-4">
                    <span className={cn(
                      "px-2.5 py-1 rounded-full text-[10px] font-bold border whitespace-nowrap inline-flex items-center",
                      user.status === 'Active' 
                        ? "border-green-200 text-green-700 bg-green-50 dark:bg-green-900/20 dark:border-green-900/50" 
                        : "border-red-200 text-red-700 bg-red-50 dark:bg-red-900/20 dark:border-red-900/50"
                    )}>
                      {user.status}
                    </span>
                  </td>
                  
                  <td className="p-4 text-gray-500 dark:text-gray-400 whitespace-nowrap">{new Date(user.addDate).toLocaleDateString()}</td>
                  <td className="p-4 text-gray-500 dark:text-gray-400 font-medium whitespace-nowrap">{user.lastActive ? new Date(user.lastActive).toLocaleDateString() : 'N/A'}</td>
                  
                  <td className="p-4">
                    <div 
                      className={cn(
                        "w-9 h-5 rounded-full flex items-center px-1 cursor-pointer transition-colors shrink-0", 
                        user.access ? "bg-green-600 justify-end" : "bg-gray-300 dark:bg-gray-600 justify-start"
                      )} 
                      onClick={() => toggleUserAccess(user)}
                    >
                      <div className="w-3.5 h-3.5 bg-white rounded-full shadow-sm" />
                    </div>
                  </td>
                  
                  <td className="p-4 text-center relative">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenActionId(openActionId === user.id ? null : user.id);
                      }}
                      className="p-1.5 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    >
                      <MoreVertical size={16} className="text-gray-500 dark:text-gray-400" />
                    </button>
                    
                    {/* Action Dropdown positioned to prevent layout clipping */}
                    {openActionId === user.id && (
                      <div 
                        className="absolute right-12 top-2 w-36 bg-white dark:bg-[#1A1A1A] border border-gray-100 dark:border-gray-700 rounded-xl shadow-xl z-50 py-1.5 text-left"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button onClick={() => handleViewProfile(user.id)} className="w-full px-4 py-2 text-xs flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-[#262626] dark:text-gray-200 transition-colors">
                          <Eye size={14} className="shrink-0" /> View Profile
                        </button>
                        <button onClick={() => handleEditUser(user.id)} className="w-full px-4 py-2 text-xs flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-[#262626] dark:text-gray-200 transition-colors">
                          <Edit2 size={14} className="shrink-0" /> Edit Details
                        </button>
                        <div className="h-px bg-gray-100 dark:bg-gray-700 my-1 mx-2" />
                        <button onClick={() => handleDeleteUser(user.id)} className="w-full px-4 py-2 text-xs flex items-center gap-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                          <Trash2 size={14} className="shrink-0" /> Delete User
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={9} className="p-12 text-center text-gray-400 dark:text-gray-500 font-medium text-sm">
                  No users found matching your criteria.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* FOOTER: Maintains alignment on arbitrary resizes */}
      <div className="p-4 sm:p-5 flex justify-between items-center text-xs text-gray-500 dark:text-gray-400 font-medium border-t border-gray-100 dark:border-gray-800/50 bg-gray-50/50 dark:bg-[#0C0C0C] shrink-0">
        <span>Showing <strong className="text-gray-700 dark:text-gray-300">{filteredUsers.length}</strong> users</span>
      </div>

      {/* MODALS: Scaled constraints preventing off-screen bleeding */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          <div className="bg-white dark:bg-[#141414] p-5 sm:p-7 rounded-2xl w-full max-w-md border dark:border-gray-800 shadow-2xl relative">
            <button 
              onClick={() => setSelectedUser(null)} 
              className="absolute top-5 right-5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors bg-gray-50 dark:bg-gray-800 p-1.5 rounded-full"
            >
              ✕
            </button>
            <h3 className="text-lg sm:text-xl font-bold dark:text-white mb-6 pr-8">
              {modalMode === 'view' ? 'User Profile' : 'Edit User Details'}
            </h3>

            {modalMode === 'view' ? (
              <div className="space-y-4">
                <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-[#0A0A0A] rounded-xl mb-4 border border-gray-100 dark:border-gray-800">
                  <img src={selectedUser.img || `https://i.pravatar.cc/150?u=${selectedUser.id}`} className="w-14 h-14 rounded-full object-cover shrink-0" alt="" />
                  <div className="min-w-0">
                    <h4 className="font-bold text-gray-900 dark:text-white truncate text-base">{selectedUser.name}</h4>
                    <p className="text-sm text-gray-500 capitalize">{selectedUser.role}</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <p className="text-sm text-gray-500 flex items-center justify-between">Email: <span className="text-gray-900 dark:text-gray-200 font-medium truncate ml-4">{selectedUser.email}</span></p>
                  <p className="text-sm text-gray-500 flex items-center justify-between">Added: <span className="text-gray-900 dark:text-gray-200 font-medium">{new Date(selectedUser.addDate).toLocaleDateString()}</span></p>
                  <p className="text-sm text-gray-500 flex items-center justify-between">Status: <span className="text-gray-900 dark:text-gray-200 font-medium">{selectedUser.status}</span></p>
                </div>
              </div>
            ) : (
              <form className="space-y-5" onSubmit={(e) => e.preventDefault()}>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2 tracking-wider">Name</label>
                  <input defaultValue={selectedUser.name} className="w-full px-4 py-2.5 text-sm bg-gray-50 dark:bg-[#0A0A0A] border border-gray-200 dark:border-gray-700 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-[#141414] dark:focus:ring-white transition-all" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2 tracking-wider">Email</label>
                  <input defaultValue={selectedUser.email} className="w-full px-4 py-2.5 text-sm bg-gray-50 dark:bg-[#0A0A0A] border border-gray-200 dark:border-gray-700 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-[#141414] dark:focus:ring-white transition-all" />
                </div>
                <button type="submit" className="w-full bg-[#141414] dark:bg-white text-white dark:text-[#141414] py-3 rounded-xl font-bold text-sm transition-transform active:scale-[0.98] mt-4 hover:opacity-90">
                  Save Changes
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity" onClick={() => setShowAddModal(false)} />
          <div className="relative bg-white dark:bg-[#1A1A1A] w-full max-w-md rounded-2xl border border-gray-200 dark:border-gray-800 shadow-2xl p-5 sm:p-7 z-10">
            <button 
              onClick={() => setShowAddModal(false)} 
              className="absolute top-5 right-5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors bg-gray-50 dark:bg-gray-800 p-1.5 rounded-full"
            >
              ✕
            </button>
            <h3 className="text-lg sm:text-xl font-bold text-[#141414] dark:text-white mb-6 pr-8">Add New User</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1.5 tracking-wider">Full Name</label>
                <input 
                  onChange={(e) => setNewUser({...newUser, name: e.target.value})} 
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-[#0A0A0A] border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-[#141414] dark:focus:ring-white outline-none transition-all dark:text-white"
                  placeholder="John Doe"
                  value={newUser.name}
                />
              </div>
              
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1.5 tracking-wider">Email Address</label>
                <input 
                  onChange={(e) => setNewUser({...newUser, email: e.target.value})} 
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-[#0A0A0A] border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-[#141414] dark:focus:ring-white outline-none transition-all dark:text-white"
                  placeholder="john.doe@example.com"
                  value={newUser.email}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1.5 tracking-wider">Role</label>
                  <select
                    onChange={(e) => setNewUser({...newUser, role: e.target.value})}
                    value={newUser.role.toLowerCase()}
                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-[#0A0A0A] border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-[#141414] dark:focus:ring-white outline-none transition-all dark:text-white appearance-none cursor-pointer"
                  >
                    <option value="agent">Agent</option>
                    <option value="admin">Admin</option>
                    <option value="client">Client</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1.5 tracking-wider">Password</label>
                  <input
                    type="password"
                    onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-[#0A0A0A] border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-[#141414] dark:focus:ring-white outline-none transition-all dark:text-white"
                    placeholder="••••••••"
                    value={newUser.password}
                  />
                </div>
              </div>
              
              <button 
                onClick={handleAddUser}
                disabled={isSubmitting}
                className={cn(
                  "w-full bg-[#141414] dark:bg-white text-white dark:text-[#141414] py-3 rounded-xl font-bold text-sm transition-all mt-4",
                  isSubmitting ? "opacity-50 cursor-not-allowed" : "hover:opacity-90 active:scale-[0.98]"
                )}
              >
                {isSubmitting ? "Creating User..." : "Create User"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Styled Responsive Scrollbar via Global CSS Injection */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { height: 6px; width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 10px; }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb { background: #3f3f46; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #9ca3af; }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #52525b; }
      `}</style>
    </div>
  );
};

export default UserMonitor;