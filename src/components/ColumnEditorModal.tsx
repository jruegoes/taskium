import { useState } from "react";

const PRESET_COLORS = [
  "#5b9bd5", "#e57373", "#f9d977", "#a8e6a1",
  "#ce93d8", "#ffb74d", "#4dd0e1", "#90a4ae",
];

interface ColumnEditorModalProps {
  title: string;
  initialName?: string;
  initialColor?: string;
  onSave: (name: string, color: string) => void;
  onCancel: () => void;
}

export function ColumnEditorModal({
  title,
  initialName = "",
  initialColor = PRESET_COLORS[0],
  onSave,
  onCancel,
}: ColumnEditorModalProps) {
  const [name, setName] = useState(initialName);
  const [color, setColor] = useState(initialColor);

  return (
    <div
      className="fixed inset-0 bg-overlay z-[80] flex items-center justify-center p-4"
      onClick={onCancel}
    >
      <div
        className="bg-card-bg border border-border rounded-xl p-6 w-full max-w-sm shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg text-text mb-4">{title}</h2>

        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && name.trim()) onSave(name.trim(), color);
            if (e.key === "Escape") onCancel();
          }}
          placeholder="Column name..."
          className="w-full border border-border rounded-lg px-3 py-2 mb-4 bg-board-bg text-text outline-none focus:border-primary"
          autoFocus
        />

        <div className="flex gap-2 mb-6">
          {PRESET_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              className={`w-8 h-8 rounded-full border-2 transition-transform ${color === c ? "border-text scale-110" : "border-transparent"}`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => name.trim() && onSave(name.trim(), color)}
            className="flex-1 bg-primary text-white rounded-lg px-4 py-2 hover:bg-primary-hover transition-colors"
          >
            Save
          </button>
          <button
            onClick={onCancel}
            className="flex-1 border border-border rounded-lg px-4 py-2 hover:bg-hover transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
