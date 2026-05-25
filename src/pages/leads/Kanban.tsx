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
import { Loader2, CreditCard, Sparkles, Plus } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { formatCurrency } from "../../lib/utils";
import { useAuth } from "../../../src/lib/AuthContext";
import { Lead, KanbanStage } from "../../types";
import { leadApi } from "../../api/leads";
import { KanbanColumn } from "../../components/KanbanColumn";
import { LeadDetailModal } from "../../components/LeadDetailModal";
import { NewLeadModal } from "@/src/components/NewLeadModal";
import { CloseDealModal } from "@/src/components/CloseDealModal";
import { cn } from "../../lib/utils";

interface Column {
  id: KanbanStage;
  title: string;
  tasks: Lead[];
}

export const STAGE_META: Record<KanbanStage, { color: string; dot: string }> = {
  new:       { color: "text-blue-600",   dot: "bg-blue-500" },
  contacted: { color: "text-purple-600", dot: "bg-purple-500" },
  showing:   { color: "text-indigo-600", dot: "bg-indigo-500" },
  offer:     { color: "text-amber-600",  dot: "bg-amber-500" },
  escrow:    { color: "text-teal-600",   dot: "bg-teal-500" },
  closed:    { color: "text-green-600",  dot: "bg-green-500" },
  lost:      { color: "text-red-600",    dot: "bg-red-500" },
};

const INITIAL_COLUMNS: Column[] = [
  { id: "new",    title: "New Leads",    tasks: [] },
  { id: "offer",  title: "Under Offer",  tasks: [] },
  { id: "closed", title: "Closed & Paid", tasks: [] },
];

export const KanbanBoard: React.FC = () => {
  const { user } = useAuth();
  const [columns, setColumns]           = useState<Column[]>(INITIAL_COLUMNS);
  const [activeId, setActiveId]         = useState<number | null>(null);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [loadingBoard, setLoadingBoard] = useState<boolean>(true);
  const [leadToClose, setLeadToClose] = useState<Lead | null>(null);
  const [showNewLeadModal, setShowNewLeadModal] = useState<boolean>(false);
  const [triggerRefresh, setTriggerRefresh]     = useState<number>(0);

  const fetchBoardLeads = async () => {
    if (!user) return;
    try {
      setLoadingBoard(true);
      const response = await leadApi.getAll(1);
      const leads: Lead[] = response.data;
      setColumns([
        { id: "new",    title: "New Leads",    tasks: leads.filter(l => l.kanban_stage === "new") },
        { id: "offer",  title: "Under Offer",  tasks: leads.filter(l => l.kanban_stage === "offer") },
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

    const activeLeadId  = Number(active.id);
    let activeLead: Lead | undefined;
    let fromStage: KanbanStage | undefined;

    columns.forEach(col => {
      const lead = col.tasks.find(t => t.id === activeLeadId);
      if (lead) { activeLead = lead; fromStage = col.id; }
    });

    let targetStageId = columns.find(col => col.id === over.id)?.id
      ?? columns.find(col => col.tasks.some(t => t.id === over.id))?.id;

    if (activeLead && targetStageId && fromStage !== targetStageId) {
      setColumns(prev => prev.map(col => {
        if (col.id === fromStage)     return { ...col, tasks: col.tasks.filter(t => t.id !== activeLeadId) };
        if (col.id === targetStageId) return { ...col, tasks: [...col.tasks, { ...activeLead!, kanban_stage: targetStageId! }] };
        return col;
      }));
      try {
        await leadApi.updateKanbanStage(activeLeadId, targetStageId);
      } catch {
        fetchBoardLeads();
      }
    }

    setActiveId(null);
  };

  const activeLead = activeId
    ? columns.flatMap(c => c.tasks).find(t => t.id === activeId)
    : null;

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

      {/* Toolbar */}
      <div className="flex items-center justify-between shrink-0 px-1">
        <div className="flex items-center gap-3">
          {columns.map(col => (
            <span key={col.id} className="flex items-center gap-1.5 text-xs font-semibold text-gray-400">
              <span className={cn("w-1.5 h-1.5 rounded-full", STAGE_META[col.id].dot)} />
              <span className={cn("font-bold", STAGE_META[col.id].color)}>{col.tasks.length}</span>
              {col.title}
            </span>
          ))}
        </div>
        <button
          onClick={() => setShowNewLeadModal(true)}
          className="flex items-center gap-2 bg-[#141414] hover:bg-black text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors shadow-sm"
        >
          <Plus size={14} />
          New Lead
        </button>
      </div>

      {/* Board */}
      <div className="flex-1 overflow-hidden">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={onDragStart}
          onDragEnd={onDragEnd}
        >
          <div className="flex gap-4 h-full overflow-x-auto pb-4">
            {columns.map(col => (
              // 1. UPDATED: Increased width from 300px to 350px
              <div key={col.id} className="flex flex-col w-[350px] shrink-0 h-full">

                {/* 2. UPDATED: Increased padding to p-3 to make the gray column visibly wider than the cards */}
                <div className="bg-[#f7f7f7] rounded-2xl p-3 flex-1 overflow-y-auto">
                  <KanbanColumn
                    col={col}
                    setSelectedLead={setSelectedLead}
                    onRefresh={fetchBoardLeads}
                    onCloseDeal={setLeadToClose}
                  />
                </div>

              </div>
            ))}
          </div>

          <DragOverlay dropAnimation={{ duration: 200, easing: "cubic-bezier(0.18, 0.67, 0.6, 1.22)" }}>
            {activeLead ? (
              <motion.div
                initial={{ rotate: 0, scale: 1 }}
                animate={{ rotate: 2, scale: 1.02 }}
                // 3. UPDATED: Adjusted dragging card to 310px to perfectly match the new inner card width
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

      {/* Modals */}
      <AnimatePresence>
        {selectedLead && (
          <LeadDetailModal
            leadId={selectedLead.id}
            onClose={() => { setSelectedLead(null); fetchBoardLeads(); }}
          />
        )}
        {showNewLeadModal && (
          <NewLeadModal
            onClose={() => setShowNewLeadModal(false)}
            onSuccess={() => {
              setShowNewLeadModal(false);
              setTriggerRefresh(prev => prev + 1);
            }}
          />
        )}
        {leadToClose && (
          <CloseDealModal
            lead={leadToClose}
            onClose={() => setLeadToClose(null)}
            onSuccess={() => {
              setLeadToClose(null);
              fetchBoardLeads();
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};