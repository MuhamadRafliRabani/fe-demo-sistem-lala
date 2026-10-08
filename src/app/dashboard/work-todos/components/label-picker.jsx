import { useState, useMemo, useRef, useEffect } from "react";
import { Plus, X, Check } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const DEFAULT_LABELS = [
  { id: "1", text: "Bug", color: "bg-[#ef5c48]" },
  { id: "2", text: "Feature", color: "bg-[#61bd4f]" },
  { id: "3", text: "Design", color: "bg-[#c377e0]" },
  { id: "4", text: "In Progress", color: "bg-[#0079bf]" },
  { id: "5", text: "Blocked", color: "bg-[#eb5a46]" },
  { id: "6", text: "Review", color: "bg-[#f2d600]" },
  { id: "7", text: "Done", color: "bg-[#519839]" },
  { id: "8", text: "Question", color: "bg-[#ff9f1a]" },
];

export default function LabelPicker({
  labels = DEFAULT_LABELS,
  value = "",
  onChange,
  placeholder = "Search labels...",
  triggerClassName = "",
  customTrigger = null,
  open: controlledOpen,
  onOpenChange: onControlledChange,
}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const searchRef = useRef(null);
  const [search, setSearch] = useState("");

  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled ? onControlledChange : setInternalOpen;

  useEffect(() => {
    if (open) {
      const timer = setTimeout(() => searchRef.current?.focus(), 50);
      return () => clearTimeout(timer);
    }
    setSearch("");
  }, [open]);

  const filteredLabels = useMemo(() => {
    const query = search.trim().toLowerCase();
    return query
      ? labels.filter((l) => l.text.toLowerCase().includes(query))
      : labels;
  }, [labels, search]);

  const handleToggle = (labelText) => {
    const next =
      value.toLowerCase() === labelText.toLowerCase() ? "" : labelText;
    onChange?.(next);
    if (next) setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      {/* ── Trigger ── */}
      <PopoverTrigger asChild>
        {customTrigger ?? (
          <button
            aria-label="Add label"
            aria-haspopup="dialog"
            aria-expanded={open}
            className={[
              "h-8 w-8 rounded bg-[#a6c5e214] hover:bg-[#a6c5e229]",
              "flex items-center justify-center text-[#b6c2cf]",
              "transition-colors focus-visible:outline-none",
              "focus-visible:ring-2 focus-visible:ring-[#579dff] focus-visible:ring-offset-1",
              triggerClassName,
            ]
              .filter(Boolean)
              .join(" ")}
          >
            <Plus size={16} />
          </button>
        )}
      </PopoverTrigger>

      <PopoverContent
        role="dialog"
        aria-label="Label picker"
        align="start"
        sideOffset={6}
        className="w-[280px] p-0 bg-[#282e33] border border-[#363430] shadow-xl rounded-lg"
      >
        <div className="flex flex-col p-3 gap-2">
          {/* Header */}
          <div className="relative flex items-center justify-center mb-1">
            <span className="text-xs font-bold text-[#b6c2cf]">Labels</span>
            <button
              aria-label="Close label picker"
              onClick={() => setOpen(false)}
              className="absolute right-0 text-[#9fadbc] hover:text-[#b6c2cf] transition-colors"
            >
              <X size={14} />
            </button>
          </div>

          <input
            ref={searchRef}
            type="text"
            placeholder={placeholder}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#22272b] border border-[#363430] rounded px-2.5 py-1.5
                       text-xs text-[#b6c2cf] placeholder-[#626f7a]
                       focus:outline-none focus:border-[#579dff] transition-colors"
          />

          <div
            role="listbox"
            aria-label="Available labels"
            className="flex flex-col gap-1 mt-1 max-h-[200px] overflow-y-auto custom-scrollbar"
          >
            {filteredLabels.length === 0 ? (
              <p className="text-xs text-[#626f7a] text-center py-3">
                No labels found.
              </p>
            ) : (
              filteredLabels.map((label) => (
                <LabelRow
                  key={label.id}
                  label={label}
                  isSelected={value.toLowerCase() === label.text.toLowerCase()}
                  onToggle={handleToggle}
                />
              ))
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

// ─── LabelRow (pure) ─────────────────────────────────────────────────────────

function LabelRow({ label, isSelected, onToggle }) {
  return (
    <div
      role="option"
      aria-selected={isSelected}
      onClick={() => onToggle(label.text)}
      className="flex items-center gap-1.5 group cursor-pointer"
    >
      {/* Checkbox indicator */}
      <div
        aria-hidden="true"
        className={[
          "w-4 h-4 rounded-sm border flex items-center justify-center shrink-0 transition-colors",
          isSelected
            ? "bg-[#579dff] border-[#579dff]"
            : "border-[#a6c5e229] group-hover:border-[#579dff]",
        ].join(" ")}
      >
        {isSelected && (
          <Check size={12} className="text-[#1d2125]" strokeWidth={3} />
        )}
      </div>

      {/* Color chip */}
      <div
        className={[
          "flex-1 h-8 rounded px-3 flex items-center",
          "text-[12px] font-bold text-[#1d2125] select-none",
          "hover:opacity-90 transition-opacity",
          label.color,
        ].join(" ")}
      >
        <span className="truncate">{label.text.toUpperCase()}</span>
      </div>
    </div>
  );
}
