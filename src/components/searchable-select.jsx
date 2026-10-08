"use client";

import { useState, useMemo } from "react";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export default function SearchableSelect({
  options = [],
  value,
  onChange,
  placeholder = "Pilih data",
  labelKey = "label",
  valueKey = "value",
  groupKey = "group",
  disabled = false,
  showQuote = true,
  className,
  backgroundColor,
  icon: Icon,
  // "solid" = tampilan lama (blok warna penuh)
  // "soft"  = tanpa latar, border muncul saat hover (untuk kolom yang tidak utama)
  // "pill"  = badge berwarna tipis + panah (untuk Status, biar langsung kebaca)
  variant = "solid",
}) {
  const [open, setOpen] = useState(false);

  const items = useMemo(() => options ?? [], [options]);

  const selectedItem = useMemo(
    () => items.find((i) => i[valueKey] === value),
    [items, value, valueKey],
  );

  const groupedItems = useMemo(() => {
    const groups = {};
    const ungrouped = [];

    items.forEach((item) => {
      const groupName = item[groupKey];
      if (groupName) {
        if (!groups[groupName]) groups[groupName] = [];
        groups[groupName].push(item);
      } else {
        ungrouped.push(item);
      }
    });

    return { groups, ungrouped };
  }, [items, groupKey]);

  const isPill = variant === "pill";
  const isCompact = variant === "soft" || isPill;
  const tone =
    backgroundColor && backgroundColor !== "transparent"
      ? backgroundColor
      : null;

  // Pill: latar & border dibuat dari warna status, teks tetap warna default
  // supaya kontrasnya aman di light maupun dark mode.
  const triggerStyle = isPill
    ? tone
      ? {
          backgroundColor: `color-mix(in oklab, ${tone} 14%, transparent)`,
          borderColor: `color-mix(in oklab, ${tone} 35%, transparent)`,
        }
      : undefined
    : variant === "soft"
      ? undefined
      : {
          backgroundColor: backgroundColor
            ? `color-mix(in oklab, ${backgroundColor} 60%, transparent)`
            : `color-mix(in oklab, var(--color-input) 30%, transparent)`,
        };

  const triggerClass = isPill
    ? "group h-7 w-auto min-w-0 cursor-pointer justify-start gap-1.5 rounded-full border px-2.5 text-xs font-medium text-foreground shadow-none transition-colors hover:brightness-95 dark:hover:brightness-125"
    : variant === "soft"
      ? "group h-7 w-auto min-w-0 cursor-pointer justify-start gap-1.5 rounded-md border border-transparent bg-transparent px-2 text-xs font-medium text-foreground shadow-none transition-colors hover:border-border hover:bg-muted/60 dark:hover:bg-muted/60"
      : "w-full min-w-fit justify-between border shadow-xs hover:bg-accent hover:text-accent-foreground bg-input/30 dark:border-input dark:hover:bg-input/50";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          variant={isCompact ? "ghost" : undefined}
          style={triggerStyle}
          className={cn(triggerClass, className)}
        >
          {isCompact ? (
            <>
              {Icon ? (
                <Icon
                  className="size-3.5 shrink-0"
                  style={tone ? { color: tone } : undefined}
                />
              ) : tone ? (
                <span
                  className="size-1.5 shrink-0 rounded-full"
                  style={{ backgroundColor: tone }}
                />
              ) : null}
              <span className="truncate">
                {selectedItem ? selectedItem[labelKey] : placeholder}
              </span>
              <ChevronDown
                className={cn(
                  "size-3 shrink-0 transition-opacity group-hover:opacity-100",
                  isPill ? "opacity-50" : "opacity-40",
                )}
              />
            </>
          ) : (
            <>
              <div className="flex items-center text-left max-w-full overflow-hidden">
                {Icon && <Icon className="mr-2 h-4 w-4 shrink-0" />}
                <span className=" font-medium">
                  {selectedItem ? selectedItem[labelKey] : placeholder}
                </span>
              </div>

              {showQuote && <span className="opacity-60 shrink-0 ml-2">⌄</span>}
            </>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-[var(--radix-popover-trigger-width)] min-w-[200px] p-0">
        <Command>
          <CommandInput placeholder="Cari..." />

          <CommandList className="max-h-[300px] overflow-y-auto">
            <CommandEmpty>Data tidak ditemukan</CommandEmpty>

            {groupedItems.ungrouped.length > 0 && (
              <CommandGroup>
                {groupedItems.ungrouped.map((item) => (
                  <CommandItem
                    key={item[valueKey]}
                    value={`${item[labelKey]}`}
                    onSelect={() => {
                      onChange(item[valueKey]);
                      setOpen(false);
                    }}
                    className="font-medium cursor-pointer"
                  >
                    {item[labelKey]}
                    <Check
                      className={cn(
                        "ml-auto h-4 w-4 text-primary",
                        value === item[valueKey] ? "opacity-100" : "opacity-0",
                      )}
                    />
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {Object.entries(groupedItems.groups).map(
              ([groupName, groupItems]) => (
                <CommandGroup key={groupName} heading={groupName}>
                  {groupItems.map((item) => (
                    <CommandItem
                      key={item[valueKey]}
                      value={`${item[labelKey]} ${groupName}`}
                      onSelect={() => {
                        onChange(item[valueKey]);
                        setOpen(false);
                      }}
                      className="font-medium cursor-pointer pl-4"
                    >
                      {item[labelKey]}
                      <Check
                        className={cn(
                          "ml-auto h-4 w-4 text-primary",
                          value === item[valueKey]
                            ? "opacity-100"
                            : "opacity-0",
                        )}
                      />
                    </CommandItem>
                  ))}
                </CommandGroup>
              ),
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
