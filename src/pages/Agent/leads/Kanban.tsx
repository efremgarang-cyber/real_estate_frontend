import React, { useState } from "react";
import { useNavigate } from "react-router-dom"; // Hook to seamlessly switch dashboard panels
import { Search, MessageSquare, CheckCircle2 } from "lucide-react";
import { KanbanCard } from "./KanbanCard"; 
import { Lead } from "../../../types";

export default function Kanban() {
  const navigate = useNavigate();

  // Mocking lead data state
  const [leads, setLeads] = useState<Lead[]>([
    {
      id: 1,
      name: "John Smith",
      email: "john.smith@example.com",
      phone: "+254700000000",
      kanban_stage: "offer",
      agency_id: 1,
      assigned_to: null, 
      value: "150000.00",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ]);

  const handleRefresh = () => {
    console.log("Refreshing dashboard view...");
    // Real API refetching logic hooks here to load updated webhook states
  };

  // Triggered when an agent executes 'Close & Pay' on an active lead card
// Triggered when an agent executes 'Close & Pay' on an active lead card
const handleCloseDeal = (lead: Lead) => {
  console.log(`Initializing checkout initialization flow for lead ID: ${lead.id}`);
  
  // Align perfectly with the EscrowPage pipeline bridge input requirements
  navigate("/agent/escrows", { 
    state: { 
      leadContext: {
        leadId: lead.id, // Passed down so your backend can cross-reference it
        clientName: lead.name,
        clientEmail: lead.email,
        amount: lead.value,
        description: `Property Deal for ${lead.name}`,
        // provider variables can remain blank for the agent to complete manually
      }
    } 
  });
};
  // Filter arrays by operational stage categories
  const newLeads = leads.filter(l => l.kanban_stage === "new");
  const offerLeads = leads.filter(l => l.kanban_stage === "offer");
  const closedLeads = leads.filter(l => l.kanban_stage === "closed");

  return (
    <div className="flex-1 flex flex-col p-8 overflow-y-auto bg-[#f1f1ee] min-h-screen text-gray-800">
      
      {/* Top Header Row */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Leads</h1>
        
        {/* Search Bar Input Layout */}
        <div className="relative w-full max-w-sm">
          <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-gray-400">
            <Search size={16} />
          </span>
          <input 
            type="text" 
            placeholder="Search by name, email or phone..." 
            className="w-full bg-white text-sm pl-11 pr-4 py-2.5 rounded-xl shadow-xs border border-transparent focus:outline-none focus:border-gray-300 placeholder-gray-400 font-medium transition-all"
          />
        </div>
      </header>

      {/* Aggregate Indicators row */}
      <div className="flex flex-wrap items-center gap-5 text-xs font-semibold text-gray-400 mb-6 px-1">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-blue-500"></span>
          <span>{newLeads.length} New Leads</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-amber-500"></span>
          <span className="text-gray-600">{offerLeads.length} Under Offer</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          <span>{closedLeads.length} Closed & Paid</span>
        </div>
      </div>

      {/* Board Column Wrapper */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-5 items-start">
        
        {/* COLUMN 1: NEW LEADS */}
        <div className="bg-[#f8f8f6] rounded-2xl p-4 flex flex-col min-h-[550px] border border-gray-200/40">
          <div className="flex justify-between items-center mb-4 px-1">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-800">New Leads</h3>
            <span className="text-xs font-bold text-gray-400 bg-gray-200/50 w-5 h-5 flex items-center justify-center rounded-md">{newLeads.length}</span>
          </div>
          <div className="flex flex-col gap-3">
            {newLeads.map(lead => (
              <KanbanCard 
                key={lead.id} 
                task={lead} 
                onClick={() => {}} 
                onRefresh={handleRefresh} 
                onCloseDeal={() => handleCloseDeal(lead)} 
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
                onClick={() => {}} 
                onRefresh={handleRefresh} 
                onCloseDeal={() => handleCloseDeal(lead)} 
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
                onClick={() => {}} 
                onRefresh={handleRefresh} 
                onCloseDeal={() => handleCloseDeal(lead)} 
              />
            ))}
          </div>
        </div>

      </div>

      {/* Floating Chat Icon Action */}
      <button className="fixed bottom-6 right-6 bg-[#1a1a1a] hover:bg-black text-white p-4 rounded-full shadow-lg transition-transform hover:scale-105">
        <MessageSquare size={22} fill="currentColor" />
      </button>

    </div>
  );
}