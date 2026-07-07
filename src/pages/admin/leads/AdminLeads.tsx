import React, { useState } from "react";
import { Search, MessageSquare, CheckCircle2 } from "lucide-react";
import { Lead } from "../../../types"
// Assuming Trevor's KanbanCard is available. If it's specific to the Agent folder, 
// you may need to move it to a shared components folder like '@/src/components/KanbanCard'
import { KanbanCard } from "../../Agent/leads/KanbanCard"; 

export const AdminLeads = () => {
  // Mocking global lead data state for Admin
  const [leads, setLeads] = useState<Lead[]>([
    {
      id: 1,
      agency_id: 1,
      assigned_to: null,
      name: "John Smith",
      email: "john.smith@example.com",
      phone: "+254700000000",
      kanban_stage: "offer" as any, // Type assertion may be needed depending on your KanbanStage definition
      value: "150000.00",
      created_at: "2026-07-06T10:00:00.000000Z",
      updated_at: "2026-07-06T10:00:00.000000Z"
    }
  ]);

  const handleRefresh = () => {
    console.log("Refreshing admin dashboard view...");
    // Trigger global refetch here
  };

  const handleViewLeadDetails = (lead: Lead) => {
    console.log(`Opening admin detail view for lead ID: ${lead.id}`);
    // Admins view details/reassign rather than trigger the checkout escrow pipeline
  };

  const newLeads = leads.filter(l => l.kanban_stage === "new");
  const offerLeads = leads.filter(l => l.kanban_stage === "offer");
  const closedLeads = leads.filter(l => l.kanban_stage === "closed");

  return (
    <div className="flex-1 flex flex-col p-8 overflow-y-auto bg-[#f1f1ee] min-h-screen text-gray-800">
      
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Agency Leads Overview</h1>
          <p className="text-sm font-medium text-gray-500 mt-1">Monitor all agent pipelines and lead statuses.</p>
        </div>
        
        <div className="relative w-full max-w-sm">
          <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-gray-400">
            <Search size={16} />
          </span>
          <input 
            type="text" 
            placeholder="Search leads, emails, or assigned agents..." 
            className="w-full bg-white text-sm pl-11 pr-4 py-2.5 rounded-xl shadow-xs border border-transparent focus:outline-none focus:border-gray-300 placeholder-gray-400 font-medium transition-all"
          />
        </div>
      </header>

      <div className="flex flex-wrap items-center gap-5 text-xs font-semibold text-gray-400 mb-6 px-1">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-blue-500"></span>
          <span>{newLeads.length} Global New</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-amber-500"></span>
          <span className="text-gray-600">{offerLeads.length} Global Under Offer</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          <span>{closedLeads.length} Global Closed</span>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-5 items-start">
        
        {/* COLUMN 1: NEW LEADS */}
        <div className="bg-[#f8f8f6] rounded-2xl p-4 flex flex-col min-h-[550px] border border-gray-200/40">
          <div className="flex justify-between items-center mb-4 px-1">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-800">New Leads</h3>
            <span className="text-xs font-bold text-gray-400 bg-gray-200/50 w-5 h-5 flex items-center justify-center rounded-md">{newLeads.length}</span>
          </div>
          <div className="flex flex-col gap-3">
            {offerLeads.map(lead => (
              <KanbanCard 
                key={lead.id} 
                task={lead} 
                onClick={() => handleViewLeadDetails(lead)} 
                onRefresh={handleRefresh} 
                onCloseDeal={() => alert("Action restricted: Admins cannot process direct escrow checkouts.")}
              />
            ))}
          </div>
        </div>

        {/* COLUMN 2: UNDER OFFER */}
        <div className="bg-[#f8f8f6] rounded-2xl p-4 flex flex-col min-h-[550px] border border-gray-200/40">
          <div className="flex justify-between items-center mb-4 px-1">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-800">Under Offer</h3>
            <span className="text-xs font-bold text-gray-500 bg-gray-200/80 w-5 h-5 flex items-center justify-center rounded-md">{offerLeads.length}</span>
          </div>
          <div className="flex flex-col gap-3">
            {offerLeads.map(lead => (
              <KanbanCard 
                key={lead.id} 
                task={lead} 
                onClick={() => handleViewLeadDetails(lead)} 
                onRefresh={handleRefresh} 
                onCloseDeal={() => alert("Action restricted: Admins cannot process direct escrow checkouts.")}
              />
            ))}
          </div>
        </div>

        {/* COLUMN 3: CLOSED & PAID */}
        <div className="bg-[#f8f8f6] rounded-2xl p-4 flex flex-col min-h-[550px] border border-gray-200/40">
          <div className="flex justify-between items-center mb-4 px-1">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 size={13} className="text-emerald-500" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-800">Closed & Paid</h3>
            </div>
            <span className="text-xs font-bold text-gray-400 bg-gray-200/50 w-5 h-5 flex items-center justify-center rounded-md">{closedLeads.length}</span>
          </div>
          <div className="flex flex-col gap-3">
            {closedLeads.map(lead => (
              <KanbanCard 
                key={lead.id} 
                task={lead} 
                onClick={() => handleViewLeadDetails(lead)} 
                onRefresh={handleRefresh} 
                onCloseDeal={() => alert("Action restricted: Admins cannot process direct escrow checkouts.")}
              />
            ))}
          </div>
        </div>

      </div>

      <button className="fixed bottom-6 right-6 bg-[#1a1a1a] hover:bg-black text-white p-4 rounded-full shadow-lg transition-transform hover:scale-105">
        <MessageSquare size={22} fill="currentColor" />
      </button>

    </div>
  );
};