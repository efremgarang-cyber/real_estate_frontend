import React, { useState, useEffect } from "react";
import {
  DndContext,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { Loader2, Sparkles, Search } from "lucide-react";
import { AnimatePresence } from "motion/react";
import { Lead, KanbanStage } from "../../../types";
import { leadApi } from "../../../api/leads";
import { KanbanColumn } from "../../../components/KanbanColumn";
import { LeadDetailModal } from "../../../components/LeadDetailModal";
import { AccessDeniedModal } from "../../../components/AccessDeniedModal";

interface Column {
  id: KanbanStage;
  title: string;
  tasks: Lead[];
}

const STAGE_ORDER: Record<KanbanStage, number> = {
  new: 0,
  contacted: 1,
  showing: 2,
  offer: 3,
  escrow: 4,
  closed: 5,
  lost: 6,
};

export const AdminLeadsDashboard: React.FC = () => {
  const [columns, setColumns] = useState<Column[]>([]);
  const [loadingBoard, setLoadingBoard] = useState<boolean>(true);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [showDeniedModal, setShowDeniedModal] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const fetchGlobalAdminPipeline = async () => {
    try {
      setLoadingBoard(true);
      const response = await leadApi.getAll(1);
      const leads: Lead[] = response.data || [];
      
      setColumns([
        { id: "new", title: "New Leads", tasks: leads.filter(l => l.kanban_stage === "new") },
        { id: "offer", title: "Under Offer", tasks: leads.filter(l => l.kanban_stage === "offer") },
        { id: "closed", title: "Closed & Paid", tasks: leads.filter(l => l.kanban_stage === "closed") },
      ]);
    } catch (error) {
      console.error("Pipeline sync failed:", error);
    } finally {
      setLoadingBoard(false);
    }
  };

  useEffect(() => {
    fetchGlobalAdminPipeline();
  }, []);

  const onDragEnd = async (event: any) => {
    const { active, over } = event;
    if (!over) return;

    const activeLead = columns.flatMap(c => c.tasks).find(t => t.id === Number(active.id));
    const targetStage = over.id as KanbanStage;

    if (!activeLead || activeLead.kanban_stage === targetStage) return;

    // Governance: Block and show modal for backward movement
    if (STAGE_ORDER[targetStage] < STAGE_ORDER[activeLead.kanban_stage]) {
      setShowDeniedModal(true);
      return;
    }

    try {
      await leadApi.updateKanbanStage(activeLead.id, targetStage);
      fetchGlobalAdminPipeline();
    } catch (error) {
      console.error("Pipeline update denied:", error);
    }
  };

  const filteredColumns = columns.map(col => ({
    ...col,
    tasks: col.tasks.filter(t => 
      t.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
      t.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.phone?.toString().includes(searchQuery)
    )
  }));

  if (loadingBoard) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="animate-spin text-neutral-400" size={32} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 h-full w-full text-[#141414]">
      {/* Header */}
      <div className="flex items-center justify-between shrink-0 px-1 mb-2">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white rounded-xl border border-neutral-200 shadow-sm">
            <Sparkles className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#141414] tracking-tight">Pipeline Monitoring Hub</h1>
            <p className="text-xs text-neutral-500 font-medium uppercase tracking-wider">Global Admin Oversight Matrix</p>
          </div>
        </div>
        
        <div className="relative group">
          <Search className="absolute left-3 top-2.5 text-neutral-400 group-focus-within:text-indigo-600 transition-colors" size={16} />
          <input 
            type="text"
            placeholder="Search by name, email or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-4 py-2 bg-white border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all w-[320px] shadow-sm"
          />
        </div>
      </div>

      {/* Board */}
      <div className="flex-1 overflow-hidden">
        <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={onDragEnd}>
          <div className="flex gap-4 h-full overflow-x-auto pb-4">
            {filteredColumns.map((col) => (
              <div key={col.id} className="flex flex-col w-[360px] shrink-0 h-full bg-neutral-50 rounded-2xl p-3 border border-neutral-200">
                <div className="text-xs font-bold uppercase text-neutral-500 p-2">
                  {col.title} ({col.tasks.length})
                </div>
                <KanbanColumn 
                  col={col} 
                  setSelectedLead={setSelectedLead} 
                  onRefresh={fetchGlobalAdminPipeline} 
                  onCloseDeal={fetchGlobalAdminPipeline}
                />
              </div>
            ))}
          </div>
        </DndContext>
      </div>

      {/* Modals Layer */}
      <AnimatePresence>
        {selectedLead && (
          <LeadDetailModal leadId={selectedLead.id} onClose={() => setSelectedLead(null)} />
        )}
        {showDeniedModal && (
          <AccessDeniedModal onClose={() => setShowDeniedModal(false)} />
        )}
      </AnimatePresence>
    </div>
  );
};