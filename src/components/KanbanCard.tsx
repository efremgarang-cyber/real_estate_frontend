import React, { useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { MoreHorizontal, Mail, Phone, Calendar, CreditCard, ArrowRight, ArrowLeft, CheckCircle2, Loader2 } from "lucide-react";
import { cn, formatCurrency } from "../lib/utils";
import { Lead, KanbanStage } from "../types";
import { leadApi } from "../api/leads";

interface KanbanCardProps {
  task: Lead;
  onClick: () => void;
  onRefresh: () => void;
}

export const KanbanCard: React.FC<KanbanCardProps> = ({ task, onClick, onRefresh }) => {
  const [transitioning, setTransitioning] = useState(false);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
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
        "bg-white rounded-2xl p-5 shadow-[0_10px_30px_rgba(0,0,0,0.02)] border border-gray-100 cursor-grab active:cursor-grabbing group transition-all hover:shadow-[0_20px_50px_rgba(0,0,0,0.05)] flex flex-col",
        isDragging && "shadow-none border-dashed border-gray-300",
        isClosed && "bg-gray-50/50"
      )}
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          {/* STRICT STATUS TEXT: No backgrounds, no borders */}
          <span className={cn(
            "text-xs font-bold uppercase tracking-wider block mb-1",
            task.assigned_to ? "text-blue-600" : "text-gray-400",
            isClosed && "text-green-600"
          )}>
            {isClosed ? "Commission Paid" : task.assigned_to ? "Assigned Agent" : "Unassigned"}
          </span>
          <h4 className="font-bold text-[#141414] text-lg leading-tight">{task.name}</h4>
        </div>
        <button className="text-gray-300 hover:text-[#141414] transition-colors p-1" onClick={(e) => e.stopPropagation()}>
          <MoreHorizontal size={18} />
        </button>
      </div>
      
      <p className="text-sm font-medium text-gray-500 mb-5 truncate">{task.email}</p>
      
      {(isUnderOffer || isClosed) && (
        <div className="mb-5 space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-gray-400">
            <span>Stage Progress</span>
            <span className={isClosed ? "text-green-600" : "text-gray-600"}>{isClosed ? "100%" : "50%"}</span>
          </div>
          <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
            <div 
              className={cn("h-full transition-all duration-1000 rounded-full", isClosed ? "bg-green-500 w-full" : "bg-[#141414] w-[50%]")} 
            />
          </div>
        </div>
      )}

      <div className="flex flex-col gap-3 mt-auto">
        <div className="flex items-center gap-2">
          {isNew && (
            <button 
              onClick={(e) => handleStageTransition(e, "offer")}
              disabled={transitioning}
              className="w-full bg-[#141414] text-white rounded-xl py-2.5 text-xs font-bold flex items-center justify-center gap-2 hover:bg-black transition-colors disabled:opacity-50"
            >
              {transitioning ? <Loader2 size={14} className="animate-spin" /> : <ArrowRight size={14} />} 
              Start Negotiation
            </button>
          )}
          
          {isUnderOffer && (
            <>
              <button 
                onClick={(e) => handleStageTransition(e, "new")}
                disabled={transitioning}
                className="bg-gray-100 text-[#141414] rounded-xl py-2.5 px-3 flex items-center justify-center hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                <ArrowLeft size={16} />
              </button>
              <button 
                onClick={(e) => handleStageTransition(e, "closed")}
                disabled={transitioning}
                className="flex-1 bg-green-50 hover:bg-green-100 text-green-700 rounded-xl font-bold py-2.5 text-xs flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
              >
                {transitioning ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                Close & Pay
              </button>
            </>
          )}

          {isClosed && (
            <button 
              onClick={(e) => handleStageTransition(e, "offer")}
              disabled={transitioning}
              className="w-full border border-gray-200 rounded-xl py-2.5 text-xs font-semibold text-gray-500 hover:bg-gray-50 transition-colors"
            >
              Re-open Negotiation
            </button>
          )}
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <div className="flex items-center gap-1.5 text-gray-400">
            <CreditCard size={14} />
            <span className="text-xs font-semibold uppercase tracking-wider">Value</span>
          </div>
          <div className="font-bold text-[#141414] text-sm">
            {task.value ? formatCurrency(parseFloat(task.value)) : "TBD"}
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-gray-100 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={(e) => { e.stopPropagation(); window.location.href = `mailto:${task.email}`; }} className="flex items-center justify-center py-2 bg-gray-50 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors"><Mail size={14} /></button>
        <button onClick={(e) => { e.stopPropagation(); if(task.phone) window.location.href = `tel:${task.phone}`; }} className="flex items-center justify-center py-2 bg-gray-50 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors"><Phone size={14} /></button>
        <button onClick={(e) => e.stopPropagation()} className="flex items-center justify-center py-2 bg-gray-50 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors"><Calendar size={14} /></button>
      </div>
    </div>
  );
};