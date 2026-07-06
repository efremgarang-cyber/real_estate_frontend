// src/components/admin/UserMonitor.tsx
import React, { useState, useEffect, useMemo } from "react";
import { MoreVertical, Search, Filter, UserPlus, Eye, Edit2, Trash2 } from "lucide-react";
import { cn } from "../../lib/utils";

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  status: 'Active' | 'Inactive';
  addDate: string; // From created_at
  lastActive: string; // From last_active_at
  access: boolean;
  img?: string;
  desc?: string;
}

export const UserMonitor: React.FC = () => {
  // Initialize as an empty array
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

  // Fetch live users from Laravel API
  useEffect(() => {
  const fetchUsers = async () => {
  // Retrieve the token you stored during your login flow
  const token = localStorage.getItem('makao_token'); 
  console.log("Token being sent:", token);
  try {
    const res = await fetch('/api/v1/admin/users', {
      method: 'GET',
      headers: {
        'Accept': 'application/json', // IMPORTANT: Prevents the redirect-to-login error
        'Authorization': `Bearer ${token}` // IMPORTANT: Passes authentication to Sanctum
      }
    });

    if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
    }

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
    
    // This logic now correctly handles 'Admin', 'Agent', and 'Client'
    const matchesRole = roleFilter === "All" || 
                        u.role.toLowerCase() === roleFilter.toLowerCase();
    
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
      // Update local state only if the server confirms success
      setUsers(prev => prev.map(u => 
        u.id === user.id ? { ...u, access: newAccessStatus } : u
      ));
    } else {
      console.error("Failed to update access");
      alert("Failed to update access status.");
    }
  } catch (err) {
    console.error("Error updating access", err);
  }
};
// 1. Handlers for your actions
const handleViewProfile = (id: number) => {
 const user = users.find(u => u.id === id) || null;
  setSelectedUser(user);
  setModalMode('view');
  setOpenActionId(null);
};

const handleEditUser = (id: number) => {
 const user = users.find(u => u.id === id) || null;
  setSelectedUser(user);
  setModalMode('edit');
  setOpenActionId(null);
};

const handleDeleteUser = async (id: number) => {
  if (confirm("Are you sure you want to delete this user?")) {
    // API Call to Laravel (requires the route added to your api.php)
    try {
      const res = await fetch(`/api/v1/admin/users/${id}`, {
        method: 'DELETE',
        headers: { 
          'Authorization': `Bearer ${localStorage.getItem('makao_token')}`,
          'Accept': 'application/json' 
        }
      });
      if (res.ok) setUsers(users.filter(u => u.id !== id));
    } catch (err) {
      console.error("Delete failed", err);
    }
  }
  setOpenActionId(null);
};
const handleAddUser = async () => {
  const res = await fetch('/api/v1/admin/users', {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('makao_token')}`
    },
    body: JSON.stringify(newUser)
  });

  if (res.ok) {
    const createdUser = await res.json();
    setUsers([...users, createdUser]); // Update UI list
    setShowAddModal(false);
  }
};



const UserSkeleton = () => (
  <tr className="animate-pulse border-b border-gray-50 dark:border-gray-800">
    <td className="p-4"><div className="w-4 h-4 bg-gray-200 dark:bg-gray-800 rounded" /></td>
    <td className="p-4 flex items-center gap-3">
      <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-800" />
      <div className="space-y-2">
        <div className="w-24 h-3 bg-gray-200 dark:bg-gray-800 rounded" />
        <div className="w-16 h-2 bg-gray-100 dark:bg-gray-800 rounded" />
      </div>
    </td>
    {[...Array(6)].map((_, i) => (
      <td key={i} className="p-4"><div className="w-16 h-3 bg-gray-200 dark:bg-gray-800 rounded" /></td>
    ))}
  </tr>
);

// 2. Click-away listener to close menu
useEffect(() => {
  const handleClickOutside = () => setOpenActionId(null);
  document.addEventListener("click", handleClickOutside);
  return () => document.removeEventListener("click", handleClickOutside);
}, []);



  

  return (
    <div className="bg-white dark:bg-[#141414] rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden flex flex-col h-full">
      {/* Header */}
      <div className="p-6 flex justify-between items-center border-b border-gray-100 dark:border-gray-800">
        <h2 className="text-xl font-bold flex items-center gap-2 text-[#141414] dark:text-white">
          User Details <span className="text-gray-400 font-normal text-sm bg-gray-100 dark:bg-[#0A0A0A] px-2 py-0.5 rounded-md">{users.length}</span>
        </h2>
        <div className="flex items-center gap-3">
          <div className="relative w-64">
            <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
            <input 
              className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-[#0A0A0A] rounded-lg text-sm border dark:border-gray-700 dark:text-gray-200" 
              placeholder="Search users..." 
              onChange={(e) => setSearchTerm(e.target.value)} 
            />
          </div>
         
              <div className="relative">
                <button 
                  onClick={() => setShowFilter(!showFilter)}
                  className={cn(
                    "p-2 border rounded-lg dark:border-gray-700 dark:text-gray-300 transition-colors",
                    roleFilter !== "All" ? "bg-gray-100 dark:bg-gray-800 border-gray-300" : ""
                  )}
                >
                  <Filter size={16} />
                </button>

                {showFilter && (
                  <div className="absolute right-0 top-12 w-40 bg-white dark:bg-[#1A1A1A] border dark:border-gray-700 rounded-lg shadow-xl z-50 p-2">
                    <div className="text-[10px] font-bold text-gray-400 uppercase px-2 mb-2">Filter by Role</div>
                                      {['All', 'Admin', 'Agent', 'Client'].map((role) => (
                        <button
                          key={role}
                          onClick={() => {
                            setRoleFilter(role);
                            setShowFilter(false);
                          }}
                          className={cn(
                            "w-full text-left px-2 py-1.5 text-xs rounded-md hover:bg-gray-50 dark:hover:bg-[#262626] dark:text-gray-200",
                            roleFilter === role ? "bg-gray-100 dark:bg-gray-800 font-bold" : ""
                          )}
                        >
                          {role}
                        </button>
                      ))}
                                        </div>
                )}
              </div>
          <button            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1 bg-[#141414] dark:bg-white text-white dark:text-[#141414] px-3 py-2 rounded-lg text-sm font-bold"
          >
            <UserPlus size={16} /> Add User
          </button>
        </div>
      </div>

      {/* Table */}
      <table className="w-full text-left text-sm">
        <thead className="bg-gray-50/50 dark:bg-[#0A0A0A] text-gray-500 dark:text-gray-400 uppercase text-[10px] font-bold">
          <tr>
            <th className="p-4"><input type="checkbox" className="dark:bg-[#0A0A0A] dark:border-gray-600" /></th>
            <th className="p-4">User Name</th>
            <th className="p-4">Email Address</th>
            <th className="p-4">User Role</th>
            <th className="p-4">Status</th>
            <th className="p-4">Add Date</th>
            <th className="p-4">Last Active</th>
            <th className="p-4">Access</th>
            <th className="p-4 text-center">Action</th>
          </tr>
        </thead>
                  <tbody>
            {loading ? (
              
              [...Array(5)].map((_, i) => <UserSkeleton key={i} />)
            ) : filteredUsers.length > 0 ? (
             
              filteredUsers.map((user) => (
                <tr key={user.id} className="border-b border-gray-50 dark:border-gray-800 hover:bg-gray-50/50 dark:hover:bg-[#1A1A1A]">
                  <td className="p-4"><input type="checkbox" className="dark:bg-[#0A0A0A] dark:border-gray-600" /></td>
                  <td className="p-4 flex items-center gap-3">
                    <img src={user.img || `https://i.pravatar.cc/150?u=${user.id}`} className="w-8 h-8 rounded-full" alt="avatar" />
                    <div>
                      <div className="font-bold text-[#141414] dark:text-white">{user.name}</div>
                      <div className="text-xs text-gray-400">{user.desc || "No description"}</div>
                    </div>
                  </td>
                  <td className="p-4 text-gray-600 dark:text-gray-400">{user.email}</td>
                  <td className="p-4 font-bold text-gray-700 dark:text-gray-300 capitalize">{user.role}</td>
                  <td className="p-4">
                    <span className={cn("px-2 py-1 rounded-full text-[10px] font-bold border", user.status === 'Active' ? "border-green-200 text-green-700 bg-green-50 dark:bg-green-900/20 dark:border-green-900/50" : "border-red-200 text-red-700 bg-red-50 dark:bg-red-900/20 dark:border-red-900/50")}>
                      {user.status}
                    </span>
                  </td>
                  <td className="p-4 text-gray-500 dark:text-gray-400">{new Date(user.addDate).toLocaleDateString()}</td>
                  <td className="p-4 text-gray-500 dark:text-gray-400 font-medium">{user.lastActive ? new Date(user.lastActive).toLocaleDateString() : 'N/A'}</td>
                  <td className="p-4">
                    <div 
                      className={cn(
                        "w-10 h-5 rounded-full flex items-center px-1 cursor-pointer transition-colors", 
                        user.access ? "bg-green-600 justify-end" : "bg-gray-300 dark:bg-gray-600 justify-start"
                      )} 
                      onClick={() => toggleUserAccess(user)}
                    >
                      <div className="w-3 h-3 bg-white rounded-full" />
                    </div>
                  </td>
                  <td className="p-4 text-center relative">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenActionId(openActionId === user.id ? null : user.id);
                      }}
                    >
                      <MoreVertical size={16} className="text-gray-400" />
                    </button>
                    {openActionId === user.id && (
                      <div 
                        className="absolute right-10 top-0 w-36 bg-white dark:bg-[#1A1A1A] border dark:border-gray-700 rounded-lg shadow-xl z-50 py-1 text-left"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button onClick={() => handleViewProfile(user.id)} className="w-full px-4 py-2 text-xs flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-[#262626] dark:text-gray-200">
                          <Eye size={14} /> View Profile
                        </button>
                        <button onClick={() => handleEditUser(user.id)} className="w-full px-4 py-2 text-xs flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-[#262626] dark:text-gray-200">
                          <Edit2 size={14} /> Edit Details
                        </button>
                        <button onClick={() => handleDeleteUser(user.id)} className="w-full px-4 py-2 text-xs flex items-center gap-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20">
                          <Trash2 size={14} /> Delete User
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              // Handle empty state if no users match search/filter
              <tr>
                <td colSpan={9} className="p-10 text-center text-gray-500">No users found.</td>
              </tr>
            )}
          </tbody>
      </table>
                            {selectedUser && (
            <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
              <div className="bg-white dark:bg-[#141414] p-6 rounded-2xl w-full max-w-md border dark:border-gray-800 shadow-2xl">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-bold dark:text-white">
                    {modalMode === 'view' ? 'User Profile' : 'Edit User Details'}
                  </h3>
                  <button onClick={() => setSelectedUser(null)} className="text-gray-400 hover:text-gray-600">✕</button>
                </div>

                {modalMode === 'view' ? (
                  <div className="space-y-4">
                    <p className="text-sm text-gray-500">Name: <span className="text-gray-900 dark:text-gray-200">{selectedUser.name}</span></p>
                    <p className="text-sm text-gray-500">Email: <span className="text-gray-900 dark:text-gray-200">{selectedUser.email}</span></p>
                    <p className="text-sm text-gray-500">Role: <span className="text-gray-900 dark:text-gray-200">{selectedUser.role}</span></p>
                  </div>
                ) : (
                  <form className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Name</label>
                      <input defaultValue={selectedUser.name} className="w-full p-2 bg-gray-50 dark:bg-[#0A0A0A] border dark:border-gray-700 rounded-lg" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Email</label>
                      <input defaultValue={selectedUser.email} className="w-full p-2 bg-gray-50 dark:bg-[#0A0A0A] border dark:border-gray-700 rounded-lg" />
                    </div>
                    <button type="submit" className="w-full bg-[#141414] dark:bg-white text-white dark:text-[#141414] py-2 rounded-lg font-bold">Save Changes</button>
                  </form>
                )}
              </div>
            </div>
          )}
                 {showAddModal && (
  <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
    {/* Backdrop with Blur */}
    <div 
      className="absolute inset-0 bg-black/30 backdrop-blur-sm transition-opacity" 
      onClick={() => setShowAddModal(false)}
    />
    
    {/* Modal Content */}
    <div className="relative bg-white dark:bg-[#1A1A1A] w-full max-w-md rounded-2xl border border-gray-200 dark:border-gray-800 shadow-2xl p-8 animate-in fade-in zoom-in duration-200">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold text-[#141414] dark:text-white">Add New User</h3>
        <button 
          onClick={() => setShowAddModal(false)} 
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
        >✕</button>
      </div>

      <div className="space-y-5">
        <div>
          <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5 tracking-wider">Full Name</label>
          <input 
            onChange={(e) => setNewUser({...newUser, name: e.target.value})} 
            className="w-full px-4 py-2.5 bg-gray-50 dark:bg-[#0A0A0A] border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-[#141414] dark:focus:ring-white outline-none transition-all dark:text-white"
            placeholder="John Doe"
          />
        </div>
        
        <div>
          <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5 tracking-wider">Email Address</label>
          <input 
            onChange={(e) => setNewUser({...newUser, email: e.target.value})} 
            className="w-full px-4 py-2.5 bg-gray-50 dark:bg-[#0A0A0A] border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-[#141414] dark:focus:ring-white outline-none transition-all dark:text-white"
            placeholder="john.doe@example.com"
          />
        </div>


        <div>
          <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5 tracking-wider">Role</label>
          <select
            onChange={(e) => setNewUser({...newUser, role: e.target.value})}
            className="w-full px-4 py-2.5 bg-gray-50 dark:bg-[#0A0A0A] border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-[#141414] dark:focus:ring-white outline-none transition-all dark:text-white"
          >
            <option value="agent">Agent</option>
            <option value="admin">Admin</option>
            <option value="client">Client</option>
          </select>
        </div>

        <div>
          <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5 tracking-wider">Password</label>
          <input
            type="password"
            onChange={(e) => setNewUser({...newUser, password: e.target.value})}
            className="w-full px-4 py-2.5 bg-gray-50 dark:bg-[#0A0A0A] border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-[#141414] dark:focus:ring-white outline-none transition-all dark:text-white"
            placeholder="••••••••"
          />
        </div>
        <button 
          onClick={handleAddUser}
          className="w-full bg-[#141414] dark:bg-white text-white dark:text-[#141414] py-3 rounded-xl font-bold text-sm hover:opacity-90 transition-opacity mt-2"
        >
          Create User
        </button>
      </div>
    </div>
  </div>
)}
      {/* Pagination Footer */}
      <div className="p-6 mt-auto flex justify-between items-center text-xs text-gray-500 dark:text-gray-400 font-medium">
        <span>Showing {filteredUsers.length} users</span>
      </div>
    </div>
  );
};