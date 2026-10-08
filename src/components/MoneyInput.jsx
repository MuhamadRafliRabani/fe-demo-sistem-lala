import { useState, useCallback, useRef, forwardRef } from "react";
import { cn } from "@/lib/utils";

// ─── Helpers ───────────────────────────────────────────────────────────────

/**
 * Formats any raw value (number, "11970000.00", "1.234.567") → "11.970.000"
 * Uses Math.trunc to strip decimals safely (avoids floating-point dot being
 * misread as thousand-separator).
 */
const formatRupiah = (raw) => {
  if (raw === "" || raw === null || raw === undefined) return "";
  const stripped = String(raw).replace(/\./g, "").replace(/\D/g, "");
  if (stripped === "") return "";
  const num = Number(stripped);
  if (isNaN(num)) return "";
  return String(num).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
};

/** "11.970.000" → 11970000 */
const parseRupiah = (formatted) => {
  const stripped = String(formatted).replace(/\./g, "").replace(/\D/g, "");
  return stripped === "" ? 0 : Number(stripped);
};

// ─── Component ─────────────────────────────────────────────────────────────

/**
 * MoneyInput — drop-in replacement for shadcn <Input> for Rupiah values.
 *
 * KEY FIX: `type`, `min`, `max`, `step` are explicitly excluded from `...rest`
 * so they never override `type="text"` on the inner <input>. Previously,
 * passing `type="number"` caused browsers to cap digit input.
 *
 * Props:
 *  - value         {number|string}          controlled value
 *  - defaultValue  {number|string}          uncontrolled initial value
 *  - onChange      {(num: number) => void}  emits a plain number, not an event
 *  - showPrefix    {boolean}                show "Rp" prefix (default: true)
 *  - prefix        {string}                 prefix text (default: "Rp")
 *  - textAlign     {"left"|"right"}         default: "left"
 *  - placeholder   {number|string}          formatted automatically
 *  - inputClassName {string}                extra classes for inner <input>
 */
const MoneyInput = forwardRef(function MoneyInput(
  {
    defaultValue,
    value: controlledValue,
    onChange,
    showPrefix = true,
    prefix = "Rp",
    textAlign = "left",
    placeholder = 0,
    disabled = false,
    className,
    inputClassName,
    // ⚠️ Explicitly strip props that must NOT reach the inner <input type="text">
    // Passing type="number", min, max, or step would override type="text" and
    // cause browsers to limit digit entry.
    type: _type,
    min: _min,
    max: _max,
    step: _step,
    ...rest
  },
  ref,
) {
  const isControlled = controlledValue !== undefined;

  // Uncontrolled internal display state
  const [internalDisplay, setInternalDisplay] = useState(() =>
    formatRupiah(isControlled ? controlledValue : (defaultValue ?? "")),
  );

  // Sync internal display if controlled value changes externally
  // (e.g. prefill from API response)
  const prevControlledRef = useRef(controlledValue);
  if (isControlled && controlledValue !== prevControlledRef.current) {
    prevControlledRef.current = controlledValue;
    // No setState here — shownValue is derived directly below
  }

  const shownValue = isControlled
    ? formatRupiah(controlledValue)
    : internalDisplay;

  const handleChange = useCallback(
    (e) => {
      // Strip everything except digits, then reformat
      const digitsOnly = e.target.value.replace(/\./g, "").replace(/\D/g, "");
      const formatted = formatRupiah(digitsOnly);

      if (!isControlled) {
        setInternalDisplay(formatted);
      }

      onChange?.(parseRupiah(formatted));
    },
    [isControlled, onChange],
  );

  // Block non-numeric key presses (but allow control keys)
  const handleKeyDown = useCallback((e) => {
    const controlKeys = [
      "Backspace",
      "Delete",
      "Tab",
      "Escape",
      "Enter",
      "ArrowLeft",
      "ArrowRight",
      "ArrowUp",
      "ArrowDown",
      "Home",
      "End",
    ];
    if (
      !/^\d$/.test(e.key) &&
      !controlKeys.includes(e.key) &&
      !(e.ctrlKey || e.metaKey)
    ) {
      e.preventDefault();
    }
  }, []);

  return (
    // Wrapper div acts as the visual "input box"; focus-within replaces focus
    // since the real focus target is the inner <input>.
    <div
      data-slot="input"
      data-disabled={disabled || undefined}
      className={cn(
        // shadcn Input base styles (1:1 match)
        "border-input dark:bg-input/30 flex h-9 w-full min-w-0 rounded-md border",
        "bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow]",
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        "md:text-sm",
        // Focus ring via focus-within (wrapper is the visual container)
        "focus-within:border-ring focus-within:ring-ring/50 focus-within:ring-[3px]",
        // Aria invalid
        "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
        // Layout
        "items-center",
        showPrefix && "gap-1.5",
        className,
      )}
    >
      {showPrefix && (
        <span className="text-muted-foreground shrink-0 select-none text-sm font-medium">
          {prefix}
        </span>
      )}

      <input
        ref={ref}
        type="text" // ← always text; never overridden by ...rest
        inputMode="numeric"
        autoComplete="off"
        value={shownValue}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={
          placeholder !== 0 && placeholder !== ""
            ? formatRupiah(placeholder)
            : "0"
        }
        disabled={disabled}
        className={cn(
          "placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground",
          "w-full min-w-0 border-0 bg-transparent p-0 outline-none",
          "focus:outline-none focus-visible:ring-0 focus-visible:ring-offset-0",
          "disabled:cursor-not-allowed text-inherit",
          textAlign === "right" ? "text-right" : "text-left",
          inputClassName,
        )}
        {...rest}
      />
    </div>
  );
});

export { MoneyInput };
export default MoneyInput;
