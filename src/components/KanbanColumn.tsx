import React from "react";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CheckCircle2 } from "lucide-react";
import { cn } from "../lib/utils";
import { Lead, KanbanStage } from "../types";
import { KanbanCard } from "./KanbanCard";

interface Column {
  id: KanbanStage;
  title: string;
  tasks: Lead[];
}

interface KanbanColumnProps {
  col: Column;
  setSelectedLead: (l: Lead) => void;
  onRefresh: () => void;
}

export const KanbanColumn: React.FC<KanbanColumnProps> = ({ col, setSelectedLead, onRefresh }) => {
  const { setNodeRef, isOver } = useDroppable({
    id: col.id,
  });

  return (
    <div className="flex-shrink-0 w-80 flex flex-col font-sans">
      <div className="flex items-center justify-between mb-4 px-1">
        <div className="flex items-center gap-2">
          {col.id === "closed" && <CheckCircle2 size={16} className="text-green-500" />}
          <h3 className="font-bold text-[#141414] text-sm uppercase tracking-wider">{col.title}</h3>
        </div>
        <span className="text-xs font-bold text-gray-400">
          {col.tasks.length}
        </span>
      </div>
      
      <div 
        ref={setNodeRef}
        className={cn(
          "flex-1 p-2 min-h-[500px] transition-colors rounded-3xl",
          isOver ? "bg-gray-100/50" : "bg-transparent"
        )}
      >
        <SortableContext items={col.tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-4 h-full">
            {col.tasks.map((task) => (
              <KanbanCard key={task.id} task={task} onClick={() => setSelectedLead(task)} onRefresh={onRefresh} />
            ))}
          </div>
        </SortableContext>
      </div>
    </div>
  );
};