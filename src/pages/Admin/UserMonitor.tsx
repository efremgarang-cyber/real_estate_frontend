import React, { useState, useMemo } from "react";
import { MoreVertical, Search, Filter, UserPlus, Eye, Edit2, Trash2 } from "lucide-react";
import { cn } from "../../lib/utils";

const INITIAL_USERS = [
  { id: 1, name: "Kathryn Murphy", desc: "Description Text", email: "nevaeh.simmons@example.com", role: "Admin", status: "Active", addDate: "March 23, 2013", lastActive: "July 14, 2015", access: true, img: "https://i.pravatar.cc/150?u=1" },
  { id: 2, name: "Savannah Nguyen", desc: "Description Text", email: "debbie.baker@example.com", role: "Admin", status: "Inactive", addDate: "October 24, 2018", lastActive: "May 31, 2015", access: false, img: "https://i.pravatar.cc/150?u=2" },
];

export const UserMonitor: React.FC = () => {
  const [users, setUsers] = useState(INITIAL_USERS);
  const [searchTerm, setSearchTerm] = useState("");
  const [openActionId, setOpenActionId] = useState<number | null>(null);

  const filteredUsers = useMemo(() => users.filter(u => u.name.toLowerCase().includes(searchTerm.toLowerCase())), [searchTerm, users]);

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col h-full">
      {/* Header */}
      <div className="p-6 flex justify-between items-center border-b border-gray-100">
        <h2 className="text-xl font-bold flex items-center gap-2">User Details <span className="text-gray-400 font-normal text-sm bg-gray-100 px-2 py-0.5 rounded-md">453</span></h2>
        <div className="flex items-center gap-3">
          <div className="relative w-64">
            <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
            <input className="w-full pl-10 pr-4 py-2 bg-gray-50 rounded-lg text-sm border" placeholder="Search goals" onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
          <button className="p-2 border rounded-lg"><Filter size={16} /></button>
          <button className="bg-[#141414] text-white px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2"><UserPlus size={16} /> Add User</button>
        </div>
      </div>

      {/* Table */}
      <table className="w-full text-left text-sm">
        <thead className="bg-gray-50/50 text-gray-500 uppercase text-[10px] font-bold">
          <tr>
            <th className="p-4"><input type="checkbox" /></th>
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
            <tr key={user.id} className="border-b border-gray-50 hover:bg-gray-50/50">
              <td className="p-4"><input type="checkbox" /></td>
              <td className="p-4 flex items-center gap-3">
                <img src={user.img} className="w-8 h-8 rounded-full" />
                <div><div className="font-bold">{user.name}</div><div className="text-xs text-gray-400">{user.desc}</div></div>
              </td>
              <td className="p-4 text-gray-600">{user.email}</td>
              <td className="p-4 font-bold text-gray-700">{user.role}</td>
              <td className="p-4">
                <span className={cn("px-2 py-1 rounded-full text-[10px] font-bold border", user.status === 'Active' ? "border-green-200 text-green-700 bg-green-50" : "border-red-200 text-red-700 bg-red-50")}>
                  {user.status}
                </span>
              </td>
              <td className="p-4 text-gray-500">{user.addDate}</td>
              <td className="p-4 text-gray-500 font-medium">{user.lastActive}</td>
              <td className="p-4"><div className={cn("w-10 h-5 rounded-full flex items-center px-1 cursor-pointer", user.access ? "bg-green-600 justify-end" : "bg-gray-300 justify-start")} onClick={() => setUsers(users.map(u => u.id === user.id ? {...u, access: !u.access} : u))}><div className="w-3 h-3 bg-white rounded-full" /></div></td>
              <td className="p-4 text-center relative">
                <button onClick={() => setOpenActionId(openActionId === user.id ? null : user.id)}><MoreVertical size={16} className="text-gray-400" /></button>
                {openActionId === user.id && (
                  <div className="absolute right-10 top-0 w-36 bg-white border rounded-lg shadow-xl z-50 py-1 text-left">
                    <button className="w-full px-4 py-2 text-xs flex items-center gap-2 hover:bg-gray-50"><Eye size={14} /> View Profile</button>
                    <button className="w-full px-4 py-2 text-xs flex items-center gap-2 hover:bg-gray-50"><Edit2 size={14} /> Edit Details</button>
                    <button className="w-full px-4 py-2 text-xs flex items-center gap-2 text-red-600 hover:bg-red-50"><Trash2 size={14} /> Delete User</button>
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Pagination Footer */}
      <div className="p-6 mt-auto flex justify-between items-center text-xs text-gray-500 font-medium">
        <span>Showing 1-10 from 56</span>
        <div className="flex gap-2">
          <button className="px-4 py-2 border rounded-lg hover:bg-gray-50">Previous</button>
          <button className="px-4 py-2 bg-black text-white rounded-lg">Next</button>
        </div>
      </div>
    </div>
  );
};