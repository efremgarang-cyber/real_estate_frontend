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
import { Loader2, CreditCard, Sparkles, Lock, Search } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { formatCurrency, cn } from "../../lib/utils";
import { useAuth } from "../../../src/lib/AuthContext";
import { Lead, KanbanStage } from "../../types";
import { leadApi } from "../../api/leads";
import { KanbanColumn } from "../../components/KanbanColumn";
import { LeadDetailModal } from "../../components/LeadDetailModal";
import { CloseDealModal } from "../../components/CloseDealModal";

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

const INITIAL_COLUMNS: Column[] = [
  { id: "new", title: "New Leads", tasks: [] },
  { id: "offer", title: "Under Offer", tasks: [] },
  { id: "closed", title: "Closed & Paid", tasks: [] },
];

export const KanbanBoard: React.FC = () => {
  const { user } = useAuth();
  const [columns, setColumns] = useState<Column[]>(INITIAL_COLUMNS);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [loadingBoard, setLoadingBoard] = useState<boolean>(true);
  const [leadToClose, setLeadToClose] = useState<Lead | null>(null);
  const [triggerRefresh, setTriggerRefresh] = useState<number>(0);
  const [notification, setNotification] = useState<{ message: string } | null>(null);
  
  // New State: Live query storage for searching
  const [searchQuery, setSearchQuery] = useState<string>("");

  const fetchBoardLeads = async () => {
    if (!user) return;
    try {
      setLoadingBoard(true);
      const response = await leadApi.getAll(1);
      const leads: Lead[] = response.data;
      setColumns([
        { id: "new", title: "New Leads", tasks: leads.filter(l => l.kanban_stage === "new") },
        { id: "offer", title: "Under Offer", tasks: leads.filter(l => l.kanban_stage === "offer") },
        { id: "closed", title: "Closed & Paid", tasks: leads.filter(l => l.kanban_stage === "closed") },
      ]);
    } catch (error) {
      console.error("Failed to sync Kanban board data:", error);
    } finally {
      setLoadingBoard(false);
    }
  };

  useEffect(() => { fetchBoardLeads(); }, [user?.id, triggerRefresh]);

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

    if (fromColumn?.id === 'closed') {
      setNotification({ message: "This deal is finalized and cannot be moved." });
      setActiveId(null);
      return;
    }

    let targetStageId = columns.find(col => col.id === over.id)?.id
      ?? columns.find(col => col.tasks.some(t => t.id === over.id))?.id;

    if (fromColumn && targetStageId && fromColumn.id !== targetStageId) {
      const activeLead = fromColumn.tasks.find(t => t.id === activeLeadId);
      setColumns(prev => prev.map(col => {
        if (col.id === fromColumn.id) return { ...col, tasks: col.tasks.filter(t => t.id !== activeLeadId) };
        if (col.id === targetStageId) return { ...col, tasks: [...col.tasks, { ...activeLead!, kanban_stage: targetStageId! }] };
        return col;
      }));
      try { await leadApi.updateKanbanStage(activeLeadId, targetStageId); } 
      catch { fetchBoardLeads(); }
    }
    setActiveId(null);
  };

  const activeLead = activeId ? columns.flatMap(c => c.tasks).find(t => t.id === activeId) : null;

  // Derived State: Perform real-time filtering without mutating source column states
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

  if (loadingBoard) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-[#f4f4f4] flex items-center justify-center">
          <Loader2 className="animate-spin text-[#141414]" size={18} />
        </div>
        <p className="text-xs font-semibold text-gray-400 tracking-widest uppercase">
          Loading pipeline
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 h-full font-sans overflow-hidden">
      
      {/* Toolbar - Global Pipeline Summary & Live Filter Search Input */}
      <div className="flex items-center justify-between shrink-0 px-1 gap-4">
        <div className="flex items-center gap-3">
          {columns.map(col => (
            <span key={col.id} className="flex items-center gap-1.5 text-xs font-semibold text-gray-400">
              <span className={cn("w-1.5 h-1.5 rounded-full", STAGE_META[col.id].dot)} />
              <span className={cn("font-bold", STAGE_META[col.id].color)}>{col.tasks.length}</span>
              {col.title}
            </span>
          ))}
        </div>
        
        {/* Search Input Component replacing the manual create selection button */}
        <div className="relative w-full max-w-xs">
          <Search className="absolute left-3.5 top-3 text-gray-400" size={16} />
          <input
            type="text"
            placeholder="Search by name, email or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:border-[#141414] shadow-sm transition-all text-[#141414]"
          />
        </div>
      </div>

      {/* Board Layout (Renders the Filtered Data Subset) */}
      <div className="flex-1 overflow-hidden">
        <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={onDragStart} onDragEnd={onDragEnd}>
          <div className="flex gap-4 h-full overflow-x-auto pb-4">
            {filteredColumns.map(col => (
              <div key={col.id} className="flex flex-col w-[350px] shrink-0 h-full">
                <div className="bg-[#f7f7f7] rounded-2xl p-3 flex-1 overflow-y-auto">
                  <KanbanColumn col={col} setSelectedLead={setSelectedLead} onRefresh={fetchBoardLeads} onCloseDeal={setLeadToClose} />
                </div>
              </div>
            ))}
          </div>
          
          <DragOverlay dropAnimation={{ duration: 200, easing: "cubic-bezier(0.18, 0.67, 0.6, 1.22)" }}>
            {activeLead ? (
              <motion.div
                initial={{ rotate: 0, scale: 1 }}
                animate={{ rotate: 2, scale: 1.02 }}
                className="w-[310px] bg-white rounded-2xl p-4 border border-gray-100 shadow-xl cursor-grabbing"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-blue-500 block mb-1">
                      Moving
                    </span>
                    <h4 className="font-bold text-[#141414] text-base leading-tight">
                      {activeLead.name}
                    </h4>
                    <p className="text-xs text-gray-400 mt-0.5">{activeLead.email}</p>
                  </div>
                  <div className="w-8 h-8 rounded-xl bg-[#f4f4f4] flex items-center justify-center shrink-0">
                    <Sparkles size={14} className="text-gray-400" />
                  </div>
                </div>
                <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                  <CreditCard size={13} className="text-gray-300" />
                  <span className="font-bold text-[#141414] text-sm">
                    {activeLead.value ? formatCurrency(parseFloat(activeLead.value)) : "TBD"}
                  </span>
                </div>
              </motion.div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>

      {/* Modals & Centered Notifications */}
      <AnimatePresence>
        {notification && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center bg-[#141414]/20 backdrop-blur-[2px] p-6">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white border border-gray-100 shadow-2xl rounded-3xl p-6 w-full max-w-sm flex flex-col items-center text-center gap-4">
              <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center">
                <Lock size={20} className="text-red-600" />
              </div>
              <div>
                <h4 className="text-lg font-bold text-[#141414]">Access Denied</h4>
                <p className="text-sm text-gray-500 mt-1">{notification.message}</p>
              </div>
              <button onClick={() => setNotification(null)} className="w-full py-3 mt-2 bg-gray-100 hover:bg-gray-200 text-gray-900 rounded-xl font-bold transition-colors">
                Dismiss
              </button>
            </motion.div>
          </div>
        )}
        {selectedLead && <LeadDetailModal leadId={selectedLead.id} onClose={() => { setSelectedLead(null); fetchBoardLeads(); }} />}
        {leadToClose && <CloseDealModal lead={leadToClose} onClose={() => setLeadToClose(null)} onSuccess={() => { setLeadToClose(null); fetchBoardLeads(); }} />}
      </AnimatePresence>
    </div>
  );
};