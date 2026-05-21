import React, { useState, useEffect } from "react";
import { 
  DndContext, 
  closestCorners, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors, 
  DragOverlay,
  useDroppable
} from "@dnd-kit/core";
import { 
  SortableContext, 
  sortableKeyboardCoordinates, 
  verticalListSortingStrategy,
  useSortable
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { 
  MoreHorizontal, 
  Mail, 
  Phone, 
  Calendar, 
  CreditCard,
  X,
  Plus,
  MessageSquare,
  History,
  Loader2,
  ArrowRight,
  ArrowLeft,
  CheckCircle2
} from "lucide-react";
import { cn, formatCurrency } from "../../lib/utils";
import { useAuth } from "../../../src/lib/AuthContext";
import { Lead, KanbanStage } from "../../types";
import { leadApi } from "../../api/leads"; // Custom API Layer mapped to LeadController & LeadKanbanController
import { motion, AnimatePresence } from "motion/react";

interface Column {
  id: KanbanStage;
  title: string;
  tasks: Lead[];
}

export const KanbanBoard: React.FC = () => {
  const { user } = useAuth();
  const [columns, setColumns] = useState<Column[]>([
    { id: "new", title: "1. New Leads", tasks: [] },
    { id: "offer", title: "2. Under Offer / Negotiating", tasks: [] },
    { id: "closed", title: "3. Closed & Paid", tasks: [] },
  ]);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [loadingBoard, setLoadingBoard] = useState<boolean>(true);

  // Fetch leads on mount or session resolution
  const fetchBoardLeads = async () => {
    if (!user) return;
    try {
      setLoadingBoard(true);
      const response = await leadApi.getAll(1); // Page 1 from LeadController pagination
      const leads = response.data;

      setColumns([
        { id: "new", title: "1. New Leads", tasks: leads.filter(l => l.kanban_stage === "new") },
        { id: "offer", title: "2. Under Offer / Negotiating", tasks: leads.filter(l => l.kanban_stage === "offer") },
        { id: "closed", title: "3. Closed & Paid", tasks: leads.filter(l => l.kanban_stage === "closed") },
      ]);
    } catch (error) {
      console.error("Failed to sync Kanban board data:", error);
    } finally {
      setLoadingBoard(false);
    }
  };

  useEffect(() => {
    fetchBoardLeads();
  }, [user?.id]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const onDragStart = (event: any) => {
    setActiveId(Number(event.active.id));
  };

  const onDragEnd = async (event: any) => {
    const { active, over } = event;
    if (!over) {
      setActiveId(null);
      return;
    }

    const activeLeadId = Number(active.id);
    const overId = over.id;

    let activeLead: Lead | undefined;
    let fromStage: KanbanStage | undefined;
    
    columns.forEach(col => {
      const lead = col.tasks.find(t => t.id === activeLeadId);
      if (lead) {
        activeLead = lead;
        fromStage = col.id;
      }
    });

    let targetStageId = columns.find(col => col.id === overId)?.id;
    if (!targetStageId) {
      targetStageId = columns.find(col => col.tasks.some(t => t.id === overId))?.id;
    }

    if (activeLead && targetStageId && fromStage !== targetStageId) {
      // Optimistic UI updates to keep drag smooth over network delay
      const updatedColumns = columns.map(col => {
        if (col.id === fromStage) {
          return { ...col, tasks: col.tasks.filter(t => t.id !== activeLeadId) };
        }
        if (col.id === targetStageId) {
          return { ...col, tasks: [...col.tasks, { ...activeLead!, kanban_stage: targetStageId! }] };
        }
        return col;
      });
      setColumns(updatedColumns);

      try {
        // Targets Patch endpoint: /v1/leads/{id}/kanban managed by LeadKanbanController.php
        await leadApi.updateKanbanStage(activeLeadId, targetStageId);
      } catch (error) {
        console.error("Failed to commit stage change to database, rolling back:", error);
        fetchBoardLeads(); // Fallback to database baseline on failure
      }
    }
    
    setActiveId(null);
  };

  const activeLead = activeId ? columns.flatMap(c => c.tasks).find(t => t.id === activeId) : null;

  if (loadingBoard) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="animate-spin text-gray-500" size={32} />
      </div>
    );
  }

  return (
    <div className="h-full">
      <div className="flex gap-6 h-full overflow-x-auto pb-4">
        <DndContext 
          sensors={sensors} 
          collisionDetection={closestCorners}
          onDragStart={onDragStart}
          onDragEnd={onDragEnd}
        >
          {columns.map((col) => (
            <KanbanColumn key={col.id} col={col} setSelectedLead={setSelectedLead} onRefresh={fetchBoardLeads} />
          ))}
          
          <DragOverlay>
            {activeLead ? (
              <div className="dashboard-card w-80 opacity-90 rotate-2 pointer-events-none shadow-2xl border-black border-2 bg-white p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 border italic bg-blue-50 border-blue-200 text-blue-600">
                      Moving Lead...
                    </span>
                    <h4 className="font-bold mt-2 text-base leading-none">
                      {activeLead.first_name} {activeLead.last_name}
                    </h4>
                  </div>
                </div>
                <p className="text-[10px] font-mono text-gray-500 italic">{activeLead.email}</p>
                <div className="mt-4 flex items-center justify-between opacity-50">
                  <CreditCard size={12} />
                  <span className="font-bold text-sm">
                    {activeLead.value ? formatCurrency(parseFloat(activeLead.value)) : "TBD"}
                  </span>
                </div>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>

      <AnimatePresence>
        {selectedLead && (
          <LeadDetailModal 
            leadId={selectedLead.id} 
            onClose={() => {
              setSelectedLead(null);
              fetchBoardLeads(); // Refresh columns to sync metrics adjusted inside modal
            }} 
          />
        )}
      </AnimatePresence>
    </div>
  );
};

/* ==========================================================================
   LEAD DETAIL MODAL
   ========================================================================== */
const LeadDetailModal = ({ leadId, onClose }: { leadId: number; onClose: () => void }) => {
  const [lead, setLead] = useState<Lead | null>(null);
  const [newNote, setNewNote] = useState("");
  const [offerPrice, setOfferPrice] = useState<number>(0); 
  const [loading, setLoading] = useState(true);
  const [updatingOffer, setUpdatingOffer] = useState(false);

  const fetchLeadDetails = async () => {
    try {
      setLoading(true);
      const response = await leadApi.getById(leadId);
      setLead(response.data);
      
      const initialValue = response.data.value ? parseFloat(response.data.value) : 0;
      setOfferPrice(isNaN(initialValue) ? 0 : initialValue);
    } catch (error) {
      console.error("Error reading singular lead database track:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeadDetails();
  }, [leadId]);

  const handleUpdateOffer = async () => {
    if (!lead) return;
    setUpdatingOffer(true);
    try {
      await leadApi.update(lead.id, { value: String(offerPrice) });
      await fetchLeadDetails();
    } catch (error) {
      console.error("Failed updating contract pipeline valuation:", error);
    } finally {
      setUpdatingOffer(false);
    }
  };

  const handleAddNote = async () => {
    if (!newNote.trim()) return;
    // Framework placeholder for your note-creation interaction layer
    console.log("Saving log interaction details:", newNote);
    setNewNote("");
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-[100] bg-[#141414]/90 flex items-center justify-center">
        <Loader2 className="animate-spin text-white" size={32} />
      </div>
    );
  }

  if (!lead) return null;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-[#141414]/90 flex items-center justify-end p-0 md:p-6"
    >
      <motion.div 
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className="w-full max-w-2xl h-full bg-white border-l border-[#141414] overflow-y-auto"
      >
        <div className="p-8 border-b border-[#141414] flex items-center justify-between sticky top-0 bg-white z-10">
          <div>
            <span className="text-[10px] font-mono uppercase italic text-gray-500 mb-1 block">Lead Profile</span>
            <h2 className="text-3xl font-black uppercase italic tracking-tighter">
              {lead.first_name} {lead.last_name}
            </h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="p-8 space-y-10">
          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-gray-50 border border-[#141414]/10">
              <span className="text-[9px] font-mono uppercase italic text-gray-400 block mb-1">Pipeline Stage</span>
              <span className="font-bold text-xs uppercase italic">{lead.kanban_stage}</span>
            </div>
            <div className="p-4 bg-gray-50 border border-[#141414]/10">
              <span className="text-[9px] font-mono uppercase italic text-gray-400 block mb-1">Contract Valuation</span>
              <span className="font-bold text-xs italic">
                {lead.value ? formatCurrency(parseFloat(lead.value)) : "TBD"}
              </span>
            </div>
            <div className="p-4 bg-gray-50 border border-[#141414]/10">
              <span className="text-[9px] font-mono uppercase italic text-gray-400 block mb-1">Contact Metadata</span>
              <span className="font-bold text-xs italic block truncate">{lead.phone || "No Phone Data"}</span>
            </div>
            <div className="p-4 bg-gray-50 border border-[#141414]/10">
              <span className="text-[9px] font-mono uppercase italic text-gray-400 block mb-1">Assignment Tracker</span>
              <span className="font-bold text-xs italic text-blue-600 block truncate">
                {lead.assigned_agent ? lead.assigned_agent.name : "Unassigned"}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            {/* Info & Negotiation */}
            <div className="space-y-6">
              <div className="dashboard-card border-[#141414] bg-gray-50 p-4">
                <h3 className="text-sm font-black uppercase italic mb-4 flex items-center gap-2">
                  <CreditCard size={16} /> Financial Overview
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-[9px] font-mono text-gray-400 uppercase italic mb-1">
                      Proposed Transaction Value (KES)
                    </label>
                    <div className="flex gap-2">
                      <input 
                        type="number" 
                        value={offerPrice || ""}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value);
                          setOfferPrice(isNaN(val) ? 0 : val);
                        }}
                        className="w-full bg-white border border-black px-3 py-1 font-mono text-sm font-bold focus:outline-none"
                      />
                      <button 
                        onClick={handleUpdateOffer}
                        disabled={updatingOffer}
                        className="bg-black text-white px-4 py-1 text-[10px] uppercase italic font-bold hover:bg-gray-800 disabled:opacity-50 whitespace-nowrap"
                      >
                        {updatingOffer ? "..." : "Update"}
                      </button>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-[#141414]/10">
                    <p className="text-[10px] text-gray-500 italic">
                      Adjusting value tracks changes via your custom Laravel transaction model logging layer.
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-black uppercase italic mb-4 flex items-center gap-2">
                  <MessageSquare size={16} /> Log Interaction
                </h3>
                <textarea 
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder={`Type internal summary comments here...`}
                  className="w-full h-32 p-4 border border-[#141414] font-mono text-sm uppercase italic placeholder:text-gray-300 resize-none focus:outline-none"
                />
                <button 
                  onClick={handleAddNote}
                  className="w-full mt-4 bg-black text-white font-bold uppercase italic py-2.5 text-xs flex items-center justify-center gap-2 hover:bg-gray-800 transition-colors"
                >
                  <Plus size={16} /> Update Client Properties
                </button>
              </div>
            </div>

            {/* Relational Activity Logs */}
            <div>
              <h3 className="text-sm font-black uppercase italic mb-4 flex items-center gap-2">
                <History size={16} /> Timeline / Interactions
              </h3>
              <div className="space-y-6 relative before:absolute before:left-3 before:top-2 before:bottom-0 before:w-px before:bg-gray-100">
                {lead.activities?.map((activity) => (
                  <div key={activity.id} className="relative pl-10">
                    <div className="absolute left-0 top-1 w-6 h-6 bg-white border border-[#141414] flex items-center justify-center">
                      <div className="w-1.5 h-1.5 bg-[#141414]" />
                    </div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-mono uppercase text-gray-400 italic">
                        {new Date(activity.created_at).toLocaleString()}
                      </span>
                    </div>
                    <div className="p-3 bg-gray-50 border border-[#141414]/5 text-sm italic">
                      {activity.description}
                    </div>
                  </div>
                ))}
                {(!lead.activities || lead.activities.length === 0) && (
                  <p className="text-xs font-mono uppercase italic text-gray-400 mt-8">
                    No timeline logs persisted yet.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

/* ==========================================================================
   KANBAN COLUMN COMPONENT
   ========================================================================== */
const KanbanColumn = ({ col, setSelectedLead, onRefresh }: { col: Column; setSelectedLead: (l: Lead) => void; onRefresh: () => void }) => {
  const { setNodeRef, isOver } = useDroppable({
    id: col.id,
  });

  return (
    <div className="flex-shrink-0 w-80 flex flex-col">
      <div className={cn(
        "flex items-center justify-between mb-4 bg-white border border-[#141414] px-4 py-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all",
        isOver && col.id === "closed" && "border-green-500 bg-green-50 shadow-[4px_4px_0px_0px_rgba(34,197,94,1)]",
        isOver && col.id !== "closed" && "border-blue-500 bg-blue-50/50 shadow-[4px_4px_0px_0px_rgba(59,130,246,1)]"
      )}>
        <div className="flex items-center gap-2">
          {col.id === "closed" && <CheckCircle2 size={14} className="text-green-500" />}
          <h3 className="font-bold text-xs uppercase italic truncate">{col.title}</h3>
        </div>
        <span className="font-mono text-[10px] bg-gray-100 px-2 py-0.5 border border-[#141414]/10">
          {col.tasks.length}
        </span>
      </div>
      
      <div 
        ref={setNodeRef}
        className={cn(
          "flex-1 space-y-4 min-h-[500px] transition-colors rounded-lg",
          isOver && col.id === "closed" && "bg-green-50/30 ring-2 ring-green-500/20 ring-inset",
          isOver && col.id !== "closed" && "bg-blue-50/30 ring-2 ring-blue-500/20 ring-inset"
        )}
      >
        <SortableContext items={col.tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-4 h-full">
            {col.tasks.map((task) => (
              <SortableTask key={task.id} task={task} onClick={() => setSelectedLead(task)} onRefresh={onRefresh} />
            ))}
          </div>
        </SortableContext>
      </div>
    </div>
  );
};

/* ==========================================================================
   SORTABLE TASK ITEM NODE
   ========================================================================== */
const SortableTask = ({ task, onClick, onRefresh }: { task: Lead; onClick: () => void; onRefresh: () => void }) => {
  const [transitioning, setTransitioning] = useState(false);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
  };

  const isNew = task.kanban_stage === "new";
  const isUnderOffer = task.kanban_stage === "offer";
  const isClosed = task.kanban_stage === "closed";

  const handleStageTransition = async (e: React.MouseEvent, toStage: KanbanStage) => {
    e.stopPropagation();
    setTransitioning(true);
    try {
      await leadApi.updateKanbanStage(task.id, toStage);
      onRefresh();
    } catch (err) {
      console.error("Transition operational failure:", err);
    } finally {
      setTransitioning(false);
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className={cn(
        "dashboard-card group hover:translate-y-[-2px] transition-all cursor-grab active:cursor-grabbing relative overflow-hidden bg-white border border-black p-4 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]",
        isDragging && "shadow-none border-dashed",
        isClosed && "bg-green-50/30 border-green-200"
      )}
    >
      {isClosed && (
        <div className="absolute top-0 right-0 p-2">
          <div className="bg-green-500 text-white text-[8px] font-bold px-2 py-0.5 rounded-full uppercase tracking-widest shadow-sm flex items-center gap-1">
            <CheckCircle2 size={10} /> Paid
          </div>
        </div>
      )}

      <div className="flex items-start justify-between mb-3">
        <div>
          <span className={cn(
            "text-[9px] font-mono uppercase px-1.5 py-0.5 border italic",
            task.assigned_to ? "bg-blue-50 border-blue-200 text-blue-600" : "bg-gray-50 border-gray-200 text-gray-600"
          )}>
            {task.assigned_to ? "Assigned Agent" : "Unassigned"}
          </span>
          <h4 className="font-bold mt-2 text-base leading-none">{task.first_name} {task.last_name}</h4>
        </div>
        <button className="text-gray-300 hover:text-black">
          <MoreHorizontal size={14} />
        </button>
      </div>
      
      <p className="text-[10px] font-mono text-gray-500 mb-4 truncate italic">{task.email}</p>
      
      {(isUnderOffer || isClosed) && (
        <div className="mb-4 space-y-2">
          <div className="flex items-center justify-between text-[9px] font-mono uppercase italic text-gray-400">
            <span>Stage Progress</span>
            <span>{isClosed ? "100%" : "50%"}</span>
          </div>
          <div className="w-full bg-gray-100 h-1.5 border border-[#141414]/10">
            <div 
              className={cn("h-full transition-all duration-1000", isClosed ? "bg-green-500 w-full" : "bg-orange-500 w-[50%]")} 
            />
          </div>
        </div>
      )}

      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          {isNew && (
            <button 
              onClick={(e) => handleStageTransition(e, "offer")}
              disabled={transitioning}
              className="flex-1 border border-black bg-black text-white py-2 text-[10px] flex items-center justify-center gap-1.5 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-[1px] active:translate-y-[1px] font-bold uppercase italic"
            >
              {transitioning ? <Loader2 size={12} className="animate-spin" /> : <ArrowRight size={12} />} 
              Start Negotiation
            </button>
          )}
          
          {isUnderOffer && (
            <>
              <button 
                onClick={(e) => handleStageTransition(e, "new")}
                disabled={transitioning}
                className="border border-black bg-white text-black py-2 px-3 text-[10px] flex items-center justify-center gap-1"
              >
                <ArrowLeft size={12} />
              </button>
              <button 
                onClick={(e) => handleStageTransition(e, "closed")}
                disabled={transitioning}
                className="flex-1 bg-green-500 text-white border border-black font-bold uppercase italic py-2 text-[10px] flex items-center justify-center gap-1.5 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-green-600 active:shadow-none active:translate-x-[1px] active:translate-y-[1px]"
              >
                {transitioning ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle2 size={12} />}
                Close & Pay
              </button>
            </>
          )}

          {isClosed && (
            <button 
              onClick={(e) => handleStageTransition(e, "offer")}
              disabled={transitioning}
              className="flex-1 border border-black border-dashed py-2 text-[10px] font-mono text-gray-600 hover:bg-gray-50"
            >
              Re-open Negotiation
            </button>
          )}
        </div>

        <div className="flex items-center justify-between mt-1 pt-3 border-t border-gray-100">
          <div className="flex items-center gap-1.5 text-gray-400">
            <CreditCard size={12} />
            <span className="text-[10px] font-mono uppercase">{isClosed ? "Commission Paid" : "Pipeline Valuation"}</span>
          </div>
          <div className="font-bold text-sm">
            {task.value ? formatCurrency(parseFloat(task.value)) : "TBD"}
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-3 gap-1 mt-4 pt-4 border-t border-gray-100 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={(e) => { e.stopPropagation(); window.location.href = `mailto:${task.email}`; }} className="flex items-center justify-center p-2 hover:bg-gray-50"><Mail size={12} /></button>
        <button onClick={(e) => { e.stopPropagation(); if(task.phone) window.location.href = `tel:${task.phone}`; }} className="flex items-center justify-center p-2 hover:bg-gray-50"><Phone size={12} /></button>
        <button onClick={(e) => e.stopPropagation()} className="flex items-center justify-center p-2 hover:bg-gray-50"><Calendar size={12} /></button>
      </div>
    </div>
  );
};