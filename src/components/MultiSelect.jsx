"use client";

import { useState, useEffect } from "react";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Check, ChevronDown, X } from "lucide-react";
import { cn } from "@/lib/utils";

export default function MultiSelect({
  name = "",
  options = [],
  value = [],
  onChange,
  placeholder = "Select options",
  className = "",
  searchable = false,
}) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(value);
  const [search, setSearch] = useState("");

  useEffect(() => {
    setSelected(value);
  }, [value]);

  const toggleItem = (val) => {
    const updated =
      selected.includes(val) ?
        selected.filter((v) => v !== val)
      : [...selected, val];

    setSelected(updated);
    onChange?.(updated);
  };

  const removeItem = (val, e) => {
    e.stopPropagation(); // Prevent opening popover when clicking X
    const updated = selected.filter((v) => v !== val);
    setSelected(updated);
    onChange?.(updated);
  };

  const getSelectedItems = () => {
    return selected
      .map((val) => options.find((o) => o.value === val))
      .filter(Boolean);
  };

  const filteredOptions =
    searchable && search ?
      options.filter((item) =>
        item.label.toLowerCase().includes(search.toLowerCase()),
      )
    : options;

  const renderSelectedItems = () => {
    const selectedItems = getSelectedItems();
    if (!selectedItems.length) return null;

    return (
      <div className="flex flex-wrap gap-1.5 items-center flex-1 min-w-0">
        {selectedItems.map((item) => {
          // Default badge style for all filters
          return (
            <div
              key={item.value}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 text-xs font-medium border border-gray-200 dark:border-gray-700 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              <span>{item.label}</span>
              <button
                type="button"
                onClick={(e) => removeItem(item.value, e)}
                className="ml-0.5 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-full p-0.5 transition-colors"
                aria-label={`Remove ${item.label}`}
              >
                <X className="h-3 w-3 text-gray-600 dark:text-gray-400" />
              </button>
            </div>
          );
        })}
      </div>
    );
  };

  const selectedItems = getSelectedItems();

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-between text-left font-normal min-h-[2.5rem] h-auto py-2",
            selected.length === 0 && "text-muted-foreground",
            className,
          )}
        >
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {selectedItems.length > 0 ?
              renderSelectedItems()
            : <span className="text-muted-foreground">{placeholder}</span>}
          </div>
          <ChevronDown className="h-4 w-4 opacity-50 shrink-0 ml-2" />
        </Button>
      </PopoverTrigger>

      <PopoverContent className="basis-1/3 p-0" align="start">
        <div className="max-h-64 overflow-y-auto">
          {searchable && (
            <div className="p-2 border-b">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari..."
                className="w-full rounded-md border border-input bg-background px-2 py-1 text-xs outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>
          )}
          {filteredOptions.length === 0 ?
            <div className="px-3 py-2 text-sm text-muted-foreground text-center">
              No options available
            </div>
          : filteredOptions.map((item) => {
              const isSelected = selected.includes(item.value);
              return (
                <div
                  key={item.value}
                  onClick={() => toggleItem(item.value)}
                  className={cn(
                    "flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-accent transition-colors",
                    isSelected && "bg-accent/50",
                  )}
                >
                  <span className={isSelected ? "font-medium" : ""}>
                    {item.label}
                  </span>
                  {isSelected && (
                    <Check className="h-4 w-4 text-primary shrink-0" />
                  )}
                </div>
              );
            })
          }
        </div>
      </PopoverContent>
    </Popover>
  );
}
