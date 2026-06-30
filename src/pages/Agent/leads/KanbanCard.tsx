import React, { useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { MoreHorizontal, Mail, Phone, Calendar, CreditCard, ArrowRight, ArrowLeft, CheckCircle2, Loader2 } from "lucide-react";
import { cn, formatCurrency } from "../../../lib/utils";
import { Lead, KanbanStage } from "../../../types";
import { leadApi } from "../../../api/leads";

interface KanbanCardProps {
  task: Lead;
  onClick: () => void;
  onRefresh: () => void;
  onCloseDeal: () => void;
}

export const KanbanCard: React.FC<KanbanCardProps> = ({ task, onClick, onRefresh, onCloseDeal }) => {
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

  // 🛡️ THE GATEKEEPER: Intercepts the handoff to Escrow
  const handleCloseDealCheck = (e: React.MouseEvent) => {
    e.stopPropagation();

    const missingFields = [];
    
    // Check for critical data required by the Escrow API
    if (!task.email) missingFields.push('Client Email');
    if (!task.phone) missingFields.push('Phone Number (M-Pesa)');
    if (!task.value || parseFloat(String(task.value)) <= 0) missingFields.push('Deal Value / Amount');

    // Fail gracefully if data is missing
    if (missingFields.length > 0) {
      alert(`⚠️ Cannot start Escrow. Missing the following details:\n\n- ${missingFields.join('\n- ')}\n\nPlease edit this lead and add these details before closing the deal.`);
      return; 
    }

    // If all clear, proceed to Escrow routing
    onCloseDeal();
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className={cn(
        "bg-white rounded-2xl p-5 shadow-[0_10px_30px_rgba(0,0,0,0.01)] border border-gray-100/80 cursor-grab active:cursor-grabbing group transition-all hover:shadow-[0_20px_40px_rgba(0,0,0,0.04)] flex flex-col w-full",
        isDragging && "shadow-none border-dashed border-gray-300",
        isClosed && "bg-gray-50/60"
      )}
    >
      {/* Card Header */}
      <div className="flex items-start justify-between mb-1">
        <div className="flex-1 min-w-0">
          <span className={cn(
            "text-[10px] font-extrabold tracking-wider uppercase block mb-1",
            isClosed ? "text-emerald-600" : task.assigned_to ? "text-blue-500" : "text-slate-400"
          )}>
            {isClosed ? "Commission Paid" : task.assigned_to ? "Assigned Agent" : "Unassigned"}
          </span>
          <h4 className="font-bold text-[#111111] text-base leading-tight truncate">{task.name}</h4>
        </div>
        <button title="prop" className="text-gray-300 hover:text-gray-600 transition-colors p-1 -mr-1" onClick={(e) => e.stopPropagation()}>
          <MoreHorizontal size={16} />
        </button>
      </div>
      
      <p className="text-xs font-medium text-gray-400 mb-5 truncate">{task.email}</p>
      
      {(isUnderOffer || isClosed) && (
        <div className="mb-5 space-y-1.5">
          <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400">
            <span>Stage Progress</span>
            <span className={isClosed ? "text-emerald-600" : "text-gray-800"}>{isClosed ? "100%" : "50%"}</span>
          </div>
          <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
            <div className={cn("h-full transition-all duration-1000 rounded-full", isClosed ? "bg-emerald-500 w-full" : "bg-black w-[50%]")} />
          </div>
        </div>
      )}

      <div className="flex flex-col gap-3 mt-auto">
        <div className="flex items-center gap-2">
          {isNew && (
            <button 
              onClick={(e) => handleStageTransition(e, "offer")}
              disabled={transitioning}
              className="w-full bg-[#111111] text-white rounded-xl py-2.5 text-xs font-bold flex items-center justify-center gap-2 hover:bg-black transition-colors disabled:opacity-50"
            >
              {transitioning ? <Loader2 size={14} className="animate-spin" /> : <ArrowRight size={14} />} 
              Start Negotiation
            </button>
          )}
          
          {isUnderOffer && (
            <>
              <button title="underoffer"
                onClick={(e) => handleStageTransition(e, "new")}
                disabled={transitioning}
                className="bg-[#f4fbf7] hover:bg-emerald-50 text-emerald-600 border border-emerald-100 p-2.5 rounded-xl transition-colors disabled:opacity-50"
              >
                {transitioning ? <Loader2 size={14} className="animate-spin" /> : <ArrowLeft size={16} />}
              </button>
              
              {/* 🛡️ REPLACED onClick with our Gatekeeper function */}
              <button 
                onClick={handleCloseDealCheck}
                disabled={transitioning}
                className="flex-1 bg-[#eefaf2] hover:bg-[#e4f5e9] text-[#167e43] text-xs font-bold py-2.5 px-4 rounded-xl flex items-center justify-center gap-1.5 border border-transparent transition-colors disabled:opacity-50"
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
              className="w-full border border-gray-200 rounded-xl py-2.5 text-xs font-semibold text-gray-500 hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Re-open Negotiation
            </button>
          )}
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <div className="flex items-center gap-1.5 text-slate-400">
            <span className="w-3 h-3 border border-gray-300 rounded-sm flex items-center justify-center">
              <CreditCard size={8} />
            </span>
            <span className="text-[10px] font-bold uppercase tracking-wider">Value</span>
          </div>
          <div className="font-bold text-gray-900 text-sm">
            {task.value ? formatCurrency(parseFloat(String(task.value))) : "TBD"}
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-gray-100 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        <button title="email" onClick={(e) => { e.stopPropagation(); window.location.href = `mailto:${task.email}`; }} className="flex items-center justify-center py-2 bg-gray-50 hover:bg-gray-100 rounded-xl text-gray-400 hover:text-gray-600 transition-colors"><Mail size={14} /></button>
        <button title="phone" onClick={(e) => { e.stopPropagation(); if(task.phone) window.location.href = `tel:${task.phone}`; }} className="flex items-center justify-center py-2 bg-gray-50 hover:bg-gray-100 rounded-xl text-gray-400 hover:text-gray-600 transition-colors"><Phone size={14} /></button>
        <button title="calendar" onClick={(e) => e.stopPropagation()} className="flex items-center justify-center py-2 bg-gray-50 hover:bg-gray-100 rounded-xl text-gray-400 hover:text-gray-600 transition-colors"><Calendar size={14} /></button>
      </div>
    </div>
  );
};