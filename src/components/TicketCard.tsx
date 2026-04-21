import { useState } from "react";
import { Draggable } from "@hello-pangea/dnd";
import type { Ticket, Tag } from "../types";
import "./RichEditor.css";

interface TicketCardProps {
  ticket: Ticket;
  index: number;
  tags: Tag[];
  columnColor?: string;
  onClick: () => void;
}

function formatDueDate(dateStr: string) {
  const due = new Date(dateStr + "T00:00:00");
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const diff = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  const label = due.toLocaleDateString(undefined, { month: "short", day: "numeric" });

  if (diff < 0) return { label, className: "text-danger" };
  if (diff === 0) return { label: "Today", className: "text-danger" };
  if (diff === 1) return { label: "Tomorrow", className: "text-inprogress" };
  return { label, className: "text-text-muted" };
}

export function TicketCard({ ticket, index, tags, columnColor, onClick }: TicketCardProps) {
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const due = ticket.due_date ? formatDueDate(ticket.due_date) : null;
  const allImages = ticket.images?.length > 0
    ? ticket.images
    : ticket.image_url
      ? [ticket.image_url]
      : [];

  return (
    <>
      <Draggable draggableId={ticket.id} index={index}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.draggableProps}
            {...provided.dragHandleProps}
            onClick={onClick}
            className={`bg-card-bg border border-border rounded-lg p-3 mb-2 cursor-pointer border-l-4 transition-shadow hover:shadow-md ${snapshot.isDragging ? "shadow-lg rotate-2" : ""}`}
            style={{
              ...provided.draggableProps.style,
              borderLeftColor: columnColor || "var(--color-border)",
            }}
          >
            <div className="flex items-start justify-between gap-2">
              <p className="text-base font-medium text-text leading-snug">
                {ticket.title}
              </p>
              {tags.length > 0 && (
                <div className="flex gap-1 flex-wrap justify-end shrink-0">
                  {tags.map((tag) => (
                    <span
                      key={tag.id}
                      className="px-1.5 py-0.5 rounded text-xs text-white leading-none"
                      style={{ backgroundColor: tag.color }}
                    >
                      {tag.name}
                    </span>
                  ))}
                </div>
              )}
            </div>
            {ticket.description && (
              <div
                className="ticket-description text-sm text-text-muted mt-1 line-clamp-3"
                dangerouslySetInnerHTML={{ __html: ticket.description }}
              />
            )}
            {allImages.length > 0 && (
              <div className="flex gap-1.5 mt-2 flex-wrap">
                {allImages.map((url, i) => (
                  <img
                    key={i}
                    src={url}
                    alt={`Attachment ${i + 1}`}
                    className="rounded h-12 w-12 object-cover cursor-zoom-in border border-border"
                    onClick={(e) => {
                      e.stopPropagation();
                      setLightboxUrl(url);
                    }}
                  />
                ))}
              </div>
            )}
            {due && (
              <p className={`text-sm mt-1.5 ${due.className}`}>
                Due: {due.label}
              </p>
            )}
          </div>
        )}
      </Draggable>

      {lightboxUrl && (
        <div
          className="fixed inset-0 bg-overlay z-[60] flex items-center justify-center p-4 cursor-zoom-out"
          onClick={(e) => { e.stopPropagation(); setLightboxUrl(null); }}
        >
          <button
            onClick={(e) => { e.stopPropagation(); setLightboxUrl(null); }}
            className="absolute top-4 right-4 z-[70] bg-card-bg rounded-full w-8 h-8 text-lg border border-border hover:bg-hover flex items-center justify-center"
          >
            ✕
          </button>
          <img
            src={lightboxUrl}
            alt="Full size"
            className="max-w-[90vw] max-h-[90vh] rounded-lg shadow-lg"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}
