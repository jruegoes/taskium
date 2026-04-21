import { useState, useEffect } from "react";
import { DragDropContext, Droppable, Draggable, type DropResult } from "@hello-pangea/dnd";
import { Plus } from "lucide-react";
import { supabase } from "../lib/supabase";
import { KanbanColumn } from "./Column";
import { CreateTicketModal } from "./CreateTicketModal";
import { TicketDetailModal } from "./TicketDetailModal";
import { ColumnEditorModal } from "./ColumnEditorModal";
import type { Ticket, Column, Tag } from "../types";

interface KanbanBoardProps {
  projectId: string;
  columns: Column[];
  tickets: Ticket[];
  setTickets: React.Dispatch<React.SetStateAction<Ticket[]>>;
  onRefresh: () => void;
}

export function KanbanBoard({
  projectId,
  columns,
  tickets,
  setTickets,
  onRefresh,
}: KanbanBoardProps) {
  const [createModal, setCreateModal] = useState<{ columnId: string } | null>(null);
  const [detailTicket, setDetailTicket] = useState<Ticket | null>(null);
  const [showAddColumn, setShowAddColumn] = useState(false);
  const [localColumns, setLocalColumns] = useState(columns);
  const [tags, setTags] = useState<Tag[]>([]);
  const [ticketTagMap, setTicketTagMap] = useState<Record<string, string[]>>({});

  useEffect(() => {
    setLocalColumns(columns);
  }, [columns]);

  // Open ticket from URL hash on load
  useEffect(() => {
    const hash = window.location.hash;
    if (hash.startsWith("#ticket-") && tickets.length > 0) {
      const ticketId = hash.replace("#ticket-", "");
      const ticket = tickets.find((t) => t.id === ticketId);
      if (ticket) setDetailTicket(ticket);
    }
  }, [tickets]);

  const openTicket = (ticket: Ticket) => {
    setDetailTicket(ticket);
    window.history.replaceState(null, "", `${window.location.pathname}#ticket-${ticket.id}`);
  };

  const closeTicket = () => {
    setDetailTicket(null);
    window.history.replaceState(null, "", window.location.pathname);
  };

  const loadTagData = async () => {
    const [{ data: tagsData }, { data: ttData }] = await Promise.all([
      supabase.from("tags").select("*").eq("project_id", projectId),
      supabase.from("ticket_tags").select("ticket_id, tag_id"),
    ]);
    if (tagsData) setTags(tagsData);
    if (ttData) {
      const map: Record<string, string[]> = {};
      for (const row of ttData) {
        if (!map[row.ticket_id]) map[row.ticket_id] = [];
        map[row.ticket_id].push(row.tag_id);
      }
      setTicketTagMap(map);
    }
  };

  useEffect(() => {
    loadTagData();
  }, [projectId]);

  const handleRefresh = () => {
    onRefresh();
    loadTagData();
  };

  const ticketsByColumn = (columnId: string) =>
    tickets
      .filter((t) => t.column_id === columnId)
      .sort((a, b) => a.position - b.position);

  const handleDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId, type } = result;
    if (!destination) return;
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    )
      return;

    // Column reordering
    if (type === "COLUMN") {
      const reordered = [...localColumns];
      const [moved] = reordered.splice(source.index, 1);
      reordered.splice(destination.index, 0, moved);
      const updated = reordered.map((col, i) => ({ ...col, position: i }));
      setLocalColumns(updated);

      for (const col of updated) {
        await supabase
          .from("columns")
          .update({ position: col.position })
          .eq("id", col.id);
      }
      onRefresh();
      return;
    }

    // Ticket reordering
    const newColumnId = destination.droppableId;
    const ticket = tickets.find((t) => t.id === draggableId);
    if (!ticket) return;

    const updatedTickets = tickets.map((t) => {
      if (t.id === draggableId) {
        return { ...t, column_id: newColumnId, position: destination.index };
      }
      return t;
    });

    const destTickets = updatedTickets
      .filter((t) => t.column_id === newColumnId && t.id !== draggableId)
      .sort((a, b) => a.position - b.position);

    destTickets.splice(destination.index, 0, {
      ...ticket,
      column_id: newColumnId,
      position: destination.index,
    });

    const finalTickets = updatedTickets
      .filter((t) => t.column_id !== newColumnId)
      .concat(destTickets.map((t, i) => ({ ...t, position: i })));

    setTickets(finalTickets);

    const updates = destTickets.map((t, i) => ({
      id: t.id,
      column_id: newColumnId,
      position: i,
      updated_at: new Date().toISOString(),
    }));

    for (const update of updates) {
      await supabase
        .from("tickets")
        .update({
          column_id: update.column_id,
          position: update.position,
          updated_at: update.updated_at,
        })
        .eq("id", update.id);
    }
  };

  const handleAddColumn = async (name: string, color: string) => {
    await supabase.from("columns").insert({
      project_id: projectId,
      name,
      color,
      position: localColumns.length,
    });
    setShowAddColumn(false);
    onRefresh();
  };

  const tagById = Object.fromEntries(tags.map((t) => [t.id, t]));

  return (
    <>
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="board" type="COLUMN" direction="horizontal">
          {(provided) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className="flex gap-6 px-6 pb-6 pt-2 overflow-x-auto flex-1"
            >
              {localColumns.map((col, i) => {
                const colTickets = ticketsByColumn(col.id);
                return (
                  <Draggable key={col.id} draggableId={`col-${col.id}`} index={i}>
                    {(dragProvided, dragSnapshot) => (
                      <div
                        ref={dragProvided.innerRef}
                        {...dragProvided.draggableProps}
                        className={`min-w-[250px] max-w-[400px] flex-shrink-0 ${dragSnapshot.isDragging ? "opacity-80 z-50" : ""}`}
                        style={{
                          ...dragProvided.draggableProps.style,
                          width: 350,
                        }}
                      >
                        <KanbanColumn
                          column={col}
                          isFirst={i === 0}
                          tickets={colTickets}
                          tags={tagById}
                          ticketTagMap={ticketTagMap}
                          dragHandleProps={dragProvided.dragHandleProps}
                          onAddClick={() => setCreateModal({ columnId: col.id })}
                          onTicketClick={openTicket}
                          onRefresh={onRefresh}
                        />
                      </div>
                    )}
                  </Draggable>
                );
              })}
              {provided.placeholder}

              {localColumns.length < 7 && (
                <div className="flex-shrink-0 self-start">
                  <button
                    onClick={() => setShowAddColumn(true)}
                    className="p-2 rounded-lg border border-border text-text-muted hover:text-text hover:bg-hover transition-colors bg-card-bg"
                    title="Add column"
                  >
                    <Plus size={18} />
                  </button>
                </div>
              )}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      {showAddColumn && (
        <ColumnEditorModal
          title="Add Column"
          onSave={handleAddColumn}
          onCancel={() => setShowAddColumn(false)}
        />
      )}

      {createModal && (
        <CreateTicketModal
          projectId={projectId}
          columnId={createModal.columnId}
          nextPosition={ticketsByColumn(createModal.columnId).length}
          onClose={() => setCreateModal(null)}
          onCreated={handleRefresh}
        />
      )}

      {detailTicket && (
        <TicketDetailModal
          ticket={detailTicket}
          columns={localColumns}
          onClose={closeTicket}
          onUpdated={handleRefresh}
        />
      )}
    </>
  );
}
