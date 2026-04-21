import { useState } from "react";
import { Droppable } from "@hello-pangea/dnd";
import { Plus, Ellipsis, Pencil, Trash2, Grip } from "lucide-react";
import type { DraggableProvidedDragHandleProps } from "@hello-pangea/dnd";
import { supabase } from "../lib/supabase";
import { TicketCard } from "./TicketCard";
import { ColumnEditorModal } from "./ColumnEditorModal";
import { ConfirmModal } from "./ConfirmModal";
import type { Ticket, Column, Tag } from "../types";

interface ColumnProps {
  column: Column;
  isFirst?: boolean;
  tickets: Ticket[];
  tags: Record<string, Tag>;
  ticketTagMap: Record<string, string[]>;
  dragHandleProps?: DraggableProvidedDragHandleProps | null;
  onAddClick: () => void;
  onTicketClick: (ticket: Ticket) => void;
  onRefresh: () => void;
}

export function KanbanColumn({
  column,
  isFirst,
  tickets,
  tags,
  ticketTagMap,
  dragHandleProps,
  onAddClick,
  onTicketClick,
  onRefresh,
}: ColumnProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [editing, setEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleUpdate = async (name: string, color: string) => {
    await supabase
      .from("columns")
      .update({ name, color })
      .eq("id", column.id);
    setEditing(false);
    onRefresh();
  };

  const handleDelete = async () => {
    await supabase.from("columns").delete().eq("id", column.id);
    setShowDeleteConfirm(false);
    onRefresh();
  };

  return (
    <>
    {editing && (
      <ColumnEditorModal
        title="Rename Column"
        initialName={column.name}
        initialColor={column.color}
        onSave={handleUpdate}
        onCancel={() => setEditing(false)}
      />
    )}
    <div>
      <div
        className="flex items-center justify-between mb-3 pb-2 border-b-2"
        style={{ borderBottomColor: column.color }}
      >
        <div className="flex items-center gap-1">
          <div
            {...dragHandleProps}
            className="cursor-grab active:cursor-grabbing text-text-muted hover:text-text p-0.5 rounded"
          >
            <Grip size={14} />
          </div>
          <h2 className="text-lg text-text">
            {column.name}{" "}
            <span className="text-sm text-text-muted">({tickets.length})</span>
          </h2>
        </div>
        <div className="flex items-center gap-0.5">
          <button
            onClick={onAddClick}
            className="p-1.5 rounded-md text-text-muted hover:text-text hover:bg-hover transition-colors"
            aria-label={`Add task to ${column.name}`}
          >
            <Plus size={16} />
          </button>
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1.5 rounded-md text-text-muted hover:text-text hover:bg-hover transition-colors"
            >
              <Ellipsis size={16} />
            </button>
            {showMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
                <div className="absolute right-0 top-full mt-1 bg-card-bg border border-border rounded-lg shadow-lg z-20 w-36">
                  <button
                    onClick={() => { setShowMenu(false); setEditing(true); }}
                    className="flex items-center gap-2 w-full px-3 py-2 text-sm text-text hover:bg-hover transition-colors rounded-t-lg"
                  >
                    <Pencil size={14} /> Rename
                  </button>
                  <button
                    onClick={() => { setShowMenu(false); setShowDeleteConfirm(true); }}
                    className="flex items-center gap-2 w-full px-3 py-2 text-sm text-danger hover:bg-hover transition-colors rounded-b-lg"
                  >
                    <Trash2 size={14} /> Delete
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <Droppable droppableId={column.id} type="TICKET">
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`min-h-[200px] rounded-lg p-1 transition-colors ${snapshot.isDraggingOver ? "bg-hover" : ""}`}
          >
            {tickets.map((ticket, index) => {
              const ticketTags = (ticketTagMap[ticket.id] || [])
                .map((id) => tags[id])
                .filter(Boolean);
              return (
                <TicketCard
                  key={ticket.id}
                  ticket={ticket}
                  index={index}
                  tags={ticketTags}
                  columnColor={column.color}
                  onClick={() => onTicketClick(ticket)}
                />
              );
            })}
            {provided.placeholder}
            {isFirst && (
              <button
                onClick={onAddClick}
                className={`w-full border-2 border-dashed border-border rounded-lg text-text-muted hover:text-text hover:border-primary hover:bg-hover transition-colors ${tickets.length === 0 ? "py-8 text-lg" : "py-3 text-sm mt-1"}`}
              >
                + Add Task
              </button>
            )}
          </div>
        )}
      </Droppable>

      {showDeleteConfirm && (
        <ConfirmModal
          title="Delete Column"
          message={`This will delete "${column.name}" and all ${tickets.length} task${tickets.length !== 1 ? "s" : ""} in it. This cannot be undone.`}
          onConfirm={handleDelete}
          onCancel={() => setShowDeleteConfirm(false)}
        />
      )}
    </div>
    </>
  );
}
