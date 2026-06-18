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
  // Ensure 'users' is an array before filtering
  if (!Array.isArray(users)) return [];
  
  return users.filter(u => 
    u.name && u.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
}, [searchTerm, users]);

  if (loading) return <div className="p-10 text-center dark:text-gray-400">Loading User Data...</div>;

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
          <button className="p-2 border rounded-lg dark:border-gray-700 dark:text-gray-300"><Filter size={16} /></button>
          <button className="bg-[#141414] dark:bg-white text-white dark:text-[#141414] px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2"><UserPlus size={16} /> Add User</button>
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
          {filteredUsers.map((user) => (
            <tr key={user.id} className="border-b border-gray-50 dark:border-gray-800 hover:bg-gray-50/50 dark:hover:bg-[#1A1A1A]">
              <td className="p-4"><input type="checkbox" className="dark:bg-[#0A0A0A] dark:border-gray-600" /></td>
              <td className="p-4 flex items-center gap-3">
                <img src={user.img || `https://i.pravatar.cc/150?u=${user.id}`} className="w-8 h-8 rounded-full" alt="avatar" />
                <div><div className="font-bold text-[#141414] dark:text-white">{user.name}</div><div className="text-xs text-gray-400">{user.desc || "No description"}</div></div>
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
                  className={cn("w-10 h-5 rounded-full flex items-center px-1 cursor-pointer transition-colors", user.access ? "bg-green-600 justify-end" : "bg-gray-300 dark:bg-gray-600 justify-start")} 
                  onClick={() => setUsers(prev => prev.map(u => u.id === user.id ? {...u, access: !u.access} : u))}
                >
                  <div className="w-3 h-3 bg-white rounded-full" />
                </div>
              </td>
              <td className="p-4 text-center relative">
                <button onClick={() => setOpenActionId(openActionId === user.id ? null : user.id)}><MoreVertical size={16} className="text-gray-400" /></button>
                {openActionId === user.id && (
                  <div className="absolute right-10 top-0 w-36 bg-white dark:bg-[#1A1A1A] border dark:border-gray-700 rounded-lg shadow-xl z-50 py-1 text-left">
                    <button className="w-full px-4 py-2 text-xs flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-[#262626] dark:text-gray-200"><Eye size={14} /> View Profile</button>
                    <button className="w-full px-4 py-2 text-xs flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-[#262626] dark:text-gray-200"><Edit2 size={14} /> Edit Details</button>
                    <button className="w-full px-4 py-2 text-xs flex items-center gap-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"><Trash2 size={14} /> Delete User</button>
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Pagination Footer */}
      <div className="p-6 mt-auto flex justify-between items-center text-xs text-gray-500 dark:text-gray-400 font-medium">
        <span>Showing {filteredUsers.length} users</span>
      </div>
    </div>
  );
};