import React, { useState, useEffect } from "react";
import { 
  DndContext, 
  closestCorners, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors, 
  DragOverlay
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
import { NewLeadModal } from "@/src/components/NewLeadModal"; // Clear modal association layer
import { cn } from "../../lib/utils";

interface Column {
  id: KanbanStage;
  title: string;
  tasks: Lead[];
}

export const STAGE_META: Record<KanbanStage, { color: string; dot: string }> = {
  new:       { color: "text-blue-600 font-bold", dot: "bg-blue-600" },
  contacted: { color: "text-purple-600 font-bold", dot: "bg-purple-600" },
  showing:   { color: "text-indigo-600 font-bold", dot: "bg-indigo-600" },
  offer:     { color: "text-amber-600 font-bold", dot: "bg-amber-600" },
  escrow:    { color: "text-teal-600 font-bold", dot: "bg-teal-600" },
  closed:    { color: "text-green-600 font-bold", dot: "bg-green- green" },
  lost:      { color: "text-red-600 font-bold", dot: "bg-red-600" },
};

export const KanbanBoard: React.FC = () => {
  const { user } = useAuth();
  const [columns, setColumns] = useState<Column[]>([
    { id: "new",    title: "New Leads",    tasks: [] },
    { id: "offer",  title: "Under Offer",  tasks: [] },
    { id: "closed", title: "Closed & Paid", tasks: [] },
  ]);
  const [activeId, setActiveId]       = useState<number | null>(null);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [loadingBoard, setLoadingBoard] = useState<boolean>(true);
  const [showUploadModal, setShowUploadModal] = useState<boolean>(false);
  const [triggerRefresh, setTriggerRefresh] = useState<number>(0);

  const fetchBoardLeads = async () => {
    if (!user) return;
    try {
      setLoadingBoard(true);
      const response = await leadApi.getAll(1);
      const leads = response.data;
      setColumns([
        { id: "new",    title: "New Leads",    tasks: leads.filter((l: Lead) => l.kanban_stage === "new") },
        { id: "offer",  title: "Under Offer",  tasks: leads.filter((l: Lead) => l.kanban_stage === "offer") },
        { id: "closed", title: "Closed & Paid", tasks: leads.filter((l: Lead) => l.kanban_stage === "closed") },
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
    const overId = over.id;

    let activeLead: Lead | undefined;
    let fromStage: KanbanStage | undefined;

    columns.forEach(col => {
      const lead = col.tasks.find(t => t.id === activeLeadId);
      if (lead) { activeLead = lead; fromStage = col.id; }
    });

    let targetStageId = columns.find(col => col.id === overId)?.id;
    if (!targetStageId) {
      targetStageId = columns.find(col => col.tasks.some(t => t.id === overId))?.id;
    }

    if (activeLead && targetStageId && fromStage !== targetStageId) {
      setColumns(columns.map(col => {
        if (col.id === fromStage)    return { ...col, tasks: col.tasks.filter(t => t.id !== activeLeadId) };
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
    <div className="space-y-6 font-sans h-full flex flex-col">
      {/* Top Utility Button Action Row */}
      <div className="flex justify-end items-center px-1">
        <button 
          onClick={() => setShowUploadModal(true)}
          className="flex items-center gap-2 bg-[#141414] hover:bg-black text-white px-5 py-3 rounded-xl font-medium transition-colors text-sm shadow-sm"
        >
          <Plus size={16} /> New Lead
        </button>
      </div>

      <div className="flex gap-4 h-full overflow-x-auto pb-6 items-start flex-1">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={onDragStart}
          onDragEnd={onDragEnd}
        >
          {columns.map((col) => (
            <div key={col.id} className="flex flex-col min-w-[300px] max-w-[300px]">
              {/* Column header */}
              <div className="flex items-center justify-between mb-3 px-1">
                <div className="flex items-center gap-2">
                  <span className={cn(
                    "inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider",
                    STAGE_META[col.id].color
                  )}>
                    <span className={cn("w-1.5 h-1.5 rounded-full", STAGE_META[col.id].dot)} />
                    {col.title}
                  </span>
                </div>
                <span className="text-xs font-bold text-gray-400 tabular-nums">
                  {col.tasks.length}
                </span>
              </div>

              {/* Column body */}
              <div className="bg-[#f7f7f7] rounded-2xl p-2 flex-1 min-h-[200px]">
                <KanbanColumn
                  col={col}
                  setSelectedLead={setSelectedLead}
                  onRefresh={fetchBoardLeads}
                />
              </div>
            </div>
          ))}

          <DragOverlay dropAnimation={{
            duration: 200,
            easing: "cubic-bezier(0.18, 0.67, 0.6, 1.22)",
          }}>
            {activeLead ? (
              <motion.div
                initial={{ rotate: 0, scale: 1 }}
                animate={{ rotate: 2, scale: 1.02 }}
                className="w-[300px] bg-white rounded-2xl p-4 border border-gray-100 shadow-xl cursor-grabbing"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-blue-500 block mb-1">
                      Moving
                    </span>
                    <h4 className="font-display font-bold text-[#141414] text-base leading-tight">
                      {activeLead.name}
                    </h4>
                    <p className="text-xs text-gray-400 mt-0.5">{activeLead.email}</p>
                  </div>
                  <div className="w-8 h-8 rounded-xl bg-[#f4f4f4] flex items-center justify-center flex-shrink-0">
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

      <AnimatePresence>
        {selectedLead && (
          <LeadDetailModal
            leadId={selectedLead.id}
            onClose={() => { setSelectedLead(null); fetchBoardLeads(); }}
          />
        )}
        {showUploadModal && (
          <NewLeadModal 
            onClose={() => setShowUploadModal(false)}
            onSuccess={() => {
              setShowUploadModal(false);
              setTriggerRefresh(prev => prev + 1);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};