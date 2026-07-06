// src/pages/Admin/leads/AdminLeads.tsx
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
import { api } from "../../../lib/api"; 
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

export const AdminLeads: React.FC = () => {
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
      // Route targeting the unscoped global administrator collection endpoint
      const response = await api.get('/admin/leads');
      const leads: Lead[] = response.data?.data || response.data || [];
      
      // Fully mapped out state containers tracking all 7 Kanban stages
      setColumns([
        { id: "new", title: "New Leads", tasks: leads.filter(l => l.kanban_stage === "new") },
        { id: "contacted", title: "Contacted", tasks: leads.filter(l => l.kanban_stage === "contacted") },
        { id: "showing", title: "Showings", tasks: leads.filter(l => l.kanban_stage === "showing") },
        { id: "offer", title: "Under Offer", tasks: leads.filter(l => l.kanban_stage === "offer") },
        { id: "escrow", title: "Escrow Queue", tasks: leads.filter(l => l.kanban_stage === "escrow") },
        { id: "closed", title: "Closed & Paid", tasks: leads.filter(l => l.kanban_stage === "closed") },
        { id: "lost", title: "Archived/Lost", tasks: leads.filter(l => l.kanban_stage === "lost") },
      ]);
    } catch (error) {
      console.error("Global system pipeline sync failure:", error);
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

    if (STAGE_ORDER[targetStage] < STAGE_ORDER[activeLead.kanban_stage]) {
      setShowDeniedModal(true);
      return;
    }

    try {
      await leadApi.updateKanbanStage(activeLead.id, targetStage);
      fetchGlobalAdminPipeline();
    } catch (error) {
      console.error("Pipeline status modification override denied:", error);
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
        <p className="text-xs text-neutral-400 font-medium tracking-wide">Assembling cross-tenant pipeline...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 h-full w-full text-[#141414] dark:text-gray-100">
      {/* Header Summary Sub-Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0 px-1 mb-2">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white dark:bg-[#141414] rounded-xl border border-neutral-200 dark:border-gray-800 shadow-sm">
            <Sparkles className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#141414] dark:text-white tracking-tight">Pipeline Monitoring Hub</h1>
            <p className="text-xs text-neutral-500 dark:text-gray-400 font-medium uppercase tracking-wider">Global Admin Oversight Matrix</p>
          </div>
        </div>
        
        <div className="relative group">
          <Search className="absolute left-3 top-2.5 text-neutral-400 dark:text-gray-500 group-focus-within:text-indigo-600 transition-colors" size={16} />
          <input 
            type="text"
            placeholder="Search by name, email or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-4 py-2 bg-white dark:bg-[#141414] border border-neutral-200 dark:border-gray-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:focus:border-indigo-500 transition-all w-full md:w-[320px] shadow-sm"
          />
        </div>
      </div>

      {/* Kanban Board Container Context */}
      <div className="flex-1 overflow-hidden min-h-[65vh]">
        <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={onDragEnd}>
          <div className="flex gap-4 h-full overflow-x-auto pb-4 custom-horizontal-scrollbar">
            {filteredColumns.map((col) => (
              <div key={col.id} className="flex flex-col w-[320px] shrink-0 h-full bg-neutral-50 dark:bg-[#0A0A0A] rounded-2xl p-3 border border-neutral-200 dark:border-gray-800">
                <div className="flex items-center justify-between text-xs font-bold uppercase text-neutral-500 dark:text-gray-400 p-2 mb-1">
                  <span>{col.title}</span>
                  <span className="px-2 py-0.5 bg-neutral-200 dark:bg-neutral-800 rounded-md text-[10px]">
                    {col.tasks.length}
                  </span>
                </div>
                <div className="flex-1 overflow-y-auto pr-1 space-y-2">
                  <KanbanColumn 
                    col={col} 
                    setSelectedLead={setSelectedLead} 
                    onRefresh={fetchGlobalAdminPipeline} 
                    onCloseDeal={fetchGlobalAdminPipeline}
                  />
                </div>
              </div>
            ))}
          </div>
        </DndContext>
      </div>

      {/* Global Modals Layer */}
      <AnimatePresence>
        {selectedLead && (
          <LeadDetailModal leadId={selectedLead.id} onClose={() => setSelectedLead(null)} />
        )}
        {showDeniedModal && (
          <AccessDeniedModal onClose={() => setShowDeniedModal(false)} />
        )}
      </AnimatePresence>

      <style>{`
        .custom-horizontal-scrollbar::-webkit-scrollbar {
          height: 6px;
        }
        .custom-horizontal-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-horizontal-scrollbar::-webkit-scrollbar-thumb {
          background: #d1d5db;
          border-radius: 9999px;
        }
        .dark .custom-horizontal-scrollbar::-webkit-scrollbar-thumb {
          background: #262626;
        }
      `}</style>
    </div>
  );
};