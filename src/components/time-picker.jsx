import { Input } from "./ui/input";

export function TimePicker({
  value = { hours: "00", minutes: "00" },
  onChange,
  step = 15,
  disabled = false,
}) {
  const update = (key, val) => {
    if (disabled) return;

    const safe =
      key === "hours"
        ? Math.min(23, Math.max(0, Number(val)))
        : Math.min(59, Math.max(0, Number(val)));

    onChange?.({
      ...value,
      [key]: String(safe).padStart(2, "0"),
    });
  };

  return (
    <div
      className={`flex items-center gap-2 w-full${
        disabled ? "opacity-50 pointer-events-none" : ""
      }`}
    >
      <Input
        type="number"
        min={0}
        max={23}
        disabled={disabled}
        value={value.hours}
        onChange={(e) => update("hours", e.target.value)}
        className="w-1/2 text-center"
      />
      :
      <Input
        type="number"
        min={0}
        max={59}
        step={step}
        disabled={disabled}
        value={value.minutes}
        onChange={(e) => update("minutes", e.target.value)}
        className="w-1/2 text-center"
      />
    </div>
  );
}
