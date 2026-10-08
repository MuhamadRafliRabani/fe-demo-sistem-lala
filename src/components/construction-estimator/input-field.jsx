"use client";

export function InputField({
  label,
  value,
  onChange,
  icon: Icon,
  placeholder,
  suffix,
  className = "",
  disabled = false,
  type = "number",
}) {
  const showIcon = !!Icon;
  const inputClassName = [
    "w-full",
    showIcon ? "pl-10 pr-12" : "pl-3 pr-10",
    "py-3 bg-input border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-ring focus:bg-background transition-all outline-none font-medium text-foreground placeholder:text-muted-foreground",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="relative group">
      {label && (
        <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wide mb-1.5">
          {label}
        </label>
      )}
      <div className="relative flex items-center">
        {showIcon && (
          <div className="absolute left-3 text-muted-foreground group-focus-within:text-primary transition-colors">
            <Icon size={18} />
          </div>
        )}
        <input
          type={type}
          {...(type === "number" ? { min: "0", step: "0.01" } : {})}
          value={type === "number" && value === 0 ? "" : value}
          onChange={(e) => {
            if (type === "number") {
              onChange(parseFloat(e.target.value) || 0);
            } else {
              onChange(e.target.value);
            }
          }}
          placeholder={placeholder}
          disabled={disabled}
          className={inputClassName}
        />
        {suffix && (
          <span className="absolute right-4 text-muted-foreground text-sm font-medium bg-input pl-2">
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
}
