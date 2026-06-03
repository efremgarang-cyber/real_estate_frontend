import React, { useState, useEffect } from "react";
import {
  DndContext,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { Loader2, CreditCard, ShieldAlert, ShieldCheck, Search, Users, RefreshCw } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { formatCurrency, cn } from "../../../lib/utils";
import { useAuth } from "../../../lib/AuthContext";
import { Lead, KanbanStage } from "../../../types";
import { leadApi } from "../../../api/leads";
import { KanbanColumn } from "../../../components/KanbanColumn";
import { LeadDetailModal } from "../../../components/LeadDetailModal";

interface Column {
  id: KanbanStage;
  title: string;
  tasks: Lead[];
}

export const STAGE_META: Record<KanbanStage, { color: string; dot: string }> = {
  new: { color: "text-blue-600", dot: "bg-blue-500" },
  contacted: { color: "text-purple-600", dot: "bg-purple-500" },
  showing: { color: "text-indigo-600", dot: "bg-indigo-500" },
  offer: { color: "text-amber-600", dot: "bg-amber-500" },
  escrow: { color: "text-teal-600", dot: "bg-teal-500" },
  closed: { color: "text-green-600", dot: "bg-green-500" },
  lost: { color: "text-red-600", dot: "bg-red-500" },
};

export const AdminKanbanBoard: React.FC = () => {
  const { profile } = useAuth();
  const [columns, setColumns] = useState<Column[]>([
    { id: "new", title: "New Assignment", tasks: [] },
    { id: "offer", title: "Active Negotation", tasks: [] },
    { id: "closed", title: "Closed Portfolio", tasks: [] },
  ]);
  
  const [activeId, setActiveId] = useState<number | null>(null);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [loadingBoard, setLoadingBoard] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedAgentId, setSelectedAgentId] = useState<string>("all");
  const [adminLogNotification, setAdminLogNotification] = useState<string | null>(null);

  // Example placeholder state for team indexing inside multi-tenancy dashboard
  const [agentsList] = useState([
    { id: "all", name: "All Workspace Agents" },
    { id: "usr_1", name: "Alex Mwangi" },
    { id: "usr_2", name: "Sarah Kiprop" }
  ]);

  const fetchGlobalAgencyLeads = async () => {
    try {
      setLoadingBoard(true);
      // Admin calls the master endpoint (filtering handles by tenant_id on Laravel global scopes)
      const response = await leadApi.getAll(1); 
      const leads: Lead[] = response.data;
      
      // Filter workspace context dynamically if single agent selected
      const scopedLeads = selectedAgentId === "all"
        ? leads
        : leads.filter(l => l.agency_id === Number(selectedAgentId));

      setColumns([
        { id: "new", title: "New Assignment", tasks: scopedLeads.filter(l => l.kanban_stage === "new") },
        { id: "offer", title: "Active Negotiation", tasks: scopedLeads.filter(l => l.kanban_stage === "offer") },
        { id: "closed", title: "Closed Portfolio", tasks: scopedLeads.filter(l => l.kanban_stage === "closed") },
      ]);
    } catch (error) {
      console.error("Failed to sync structural admin data:", error);
    } finally {
      setLoadingBoard(false);
    }
  };

  useEffect(() => { fetchGlobalAgencyLeads(); }, [selectedAgentId]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const onDragStart = (event: any) => setActiveId(Number(event.active.id));

  const onDragEnd = async (event: any) => {
    const { active, over } = event;
    if (!over) { setActiveId(null); return; }

    const activeLeadId = Number(active.id);
    const fromColumn = columns.find(col => col.tasks.some(t => t.id === activeLeadId));
    let targetStageId = columns.find(col => col.id === over.id)?.id
      ?? columns.find(col => col.tasks.some(t => t.id === over.id))?.id;

    if (fromColumn && targetStageId && fromColumn.id !== targetStageId) {
      const activeLead = fromColumn.tasks.find(t => t.id === activeLeadId);
      
      // Admin Authorization Safeguard Override Notice
      if (fromColumn.id === 'closed') {
        setAdminLogNotification(`Administrative Override: Re-opening pipeline partition for deal card ID #${activeLeadId}.`);
      }

      setColumns(prev => prev.map(col => {
        if (col.id === fromColumn.id) return { ...col, tasks: col.tasks.filter(t => t.id !== activeLeadId) };
        if (col.id === targetStageId) return { ...col, tasks: [...col.tasks, { ...activeLead!, kanban_stage: targetStageId! }] };
        return col;
      }));

      try { 
        // Backend fires a secure Audit mutation logging the explicit Admin intervention
        await leadApi.updateKanbanStage(activeLeadId, targetStageId); 
      } catch { 
        fetchGlobalAgencyLeads(); 
      }
    }
    setActiveId(null);
  };

  const activeLead = activeId ? columns.flatMap(c => c.tasks).find(t => t.id === activeId) : null;

  // Real-time dynamic sorting matrix
  const filteredColumns = columns.map(col => ({
    ...col,
    tasks: col.tasks.filter(task => {
      const query = searchQuery.toLowerCase();
      return (
        task.name?.toLowerCase().includes(query) ||
        task.email?.toLowerCase().includes(query) ||
        task.phone?.toLowerCase().includes(query)
      );
    })
  }));

  // Calculate gross portfolio worth within active viewport arrays
  const calculatePipelineValue = (tasks: Lead[]) => {
    return tasks.reduce((acc, task) => acc + (task.value ? parseFloat(task.value) : 0), 0);
  };

  if (loadingBoard) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-white border border-neutral-200/60 flex items-center justify-center shadow-sm">
          <Loader2 className="animate-spin text-[#141414]" size={18} />
        </div>
        <p className="text-xs font-semibold text-neutral-400 tracking-widest uppercase">
          Reindexing system pipeline
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 h-full font-sans overflow-hidden">
      
      {/* Admin Module Header block */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-100 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <ShieldCheck size={16} className="text-emerald-600" />
            <h1 className="text-xl font-bold text-[#141414] tracking-tight">System Control: Cross-Tenant Pipeline</h1>
          </div>
          <p className="text-xs text-gray-500">Authorized Viewport: {profile?.name || "Agency Workspace Platform"}</p>
        </div>

        {/* Filters and Search Controllers */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="relative">
            <Users className="absolute left-3.5 top-3 text-gray-400" size={15} />
            <select
              value={selectedAgentId}
              onChange={(e) => setSelectedAgentId(e.target.value)}
              className="pl-9 pr-8 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-semibold text-[#141414] focus:outline-none focus:border-[#141414] shadow-sm appearance-none cursor-pointer"
            >
              {agentsList.map(agent => (
                <option key={agent.id} value={agent.id}>{agent.name}</option>
              ))}
            </select>
          </div>

          <div className="relative w-full max-w-xs">
            <Search className="absolute left-3.5 top-3 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Filter master records..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-medium focus:outline-none focus:border-[#141414] shadow-sm text-[#141414]"
            />
          </div>
        </div>
      </div>

      {/* Financial Valuation Ledger Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 shrink-0">
        {filteredColumns.map(col => (
          <div key={col.id} className="bg-white border border-gray-200/60 rounded-2xl p-4 flex items-center justify-between shadow-sm">
            <div>
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">{col.title}</p>
              <h3 className="text-lg font-black text-[#141414] tracking-tight">
                {formatCurrency(calculatePipelineValue(col.tasks))}
              </h3>
            </div>
            <span className={cn("px-2.5 py-1 rounded-full text-xs font-bold", STAGE_META[col.id].color, "bg-neutral-50 border border-current/10")}>
              {col.tasks.length} Leads
            </span>
          </div>
        ))}
      </div>

      {/* Main Board Layout Drop tracks */}
      <div className="flex-1 overflow-hidden">
        <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={onDragStart} onDragEnd={onDragEnd}>
          <div className="flex gap-4 h-full overflow-x-auto pb-4">
            {filteredColumns.map(col => (
              <div key={col.id} className="flex flex-col w-[350px] shrink-0 h-full">
                <div className="bg-[#fcfcfc] border border-gray-200/50 rounded-2xl p-3 flex-1 overflow-y-auto">
                  <KanbanColumn col={col} setSelectedLead={setSelectedLead} onRefresh={fetchGlobalAgencyLeads} onCloseDeal={async () => { await fetchGlobalAgencyLeads(); }} />
                </div>
              </div>
            ))}
          </div>
          
          {/* Overlay Drag Display element state */}
          <DragOverlay dropAnimation={{ duration: 200, easing: "cubic-bezier(0.18, 0.67, 0.6, 1.22)" }}>
            {activeLead ? (
              <div className="w-[310px] bg-white rounded-2xl p-4 border border-emerald-500 shadow-2xl cursor-grabbing scale-[1.02] ring-2 ring-emerald-500/10">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <span className="text-[9px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 mb-1 inline-block">
                      Admin Route
                    </span>
                    <h4 className="font-bold text-[#141414] text-base leading-tight mt-1">{activeLead.name}</h4>
                  </div>
                </div>
                <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                  <span className="text-xs font-bold text-neutral-400">Ledger Weight</span>
                  <span className="font-bold text-[#141414] text-sm">
                    {activeLead.value ? formatCurrency(parseFloat(activeLead.value)) : "Unvalued"}
                  </span>
                </div>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>

      {/* Logs and Toasts Notifications systems */}
      <AnimatePresence>
        {adminLogNotification && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, y: 20 }} 
            className="fixed bottom-6 right-6 z-[200] max-w-md bg-[#141414] text-white rounded-2xl p-4 shadow-2xl flex items-start gap-3 border border-neutral-800"
          >
            <ShieldAlert size={18} className="text-amber-500 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-xs font-medium text-neutral-200">{adminLogNotification}</p>
            </div>
            <button onClick={() => setAdminLogNotification(null)} className="text-[10px] uppercase font-bold tracking-wider text-neutral-400 hover:text-white transition-colors">
              Ack
            </button>
          </motion.div>
        )}
        {selectedLead && <LeadDetailModal leadId={selectedLead.id} onClose={() => { setSelectedLead(null); fetchGlobalAgencyLeads(); }} />}
      </AnimatePresence>
    </div>
  );
};