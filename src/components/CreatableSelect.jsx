"use client";

import { useState, useCallback, useMemo } from "react";
import { useApiFetch } from "@/hooks/use-api-fetch";
import { usePost } from "@/hooks/use-api-mutation";
import { cn } from "@/lib/utils";
import { Check, ChevronsUpDown, Loader2, Plus, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

/**
 * CreatableSelect — Custom select with inline "add new" capability using Shadcn UI.
 *
 * @param {object}   props
 * @param {string}   props.fetchUrl        - GET endpoint to fetch options
 * @param {string|string[]} props.fetchKey - React Query cache key
 * @param {object}   [props.fetchParams]   - Extra query params for GET
 * @param {string}   props.postUrl         - POST endpoint to create new option
 * @param {string[]} [props.invalidateKeys]- Query keys to invalidate after POST
 * @param {string}   [props.labelKey="name"]  - Key to use as display label
 * @param {string}   [props.valueKey="id"]    - Key to use as option value
 * @param {function} [props.createPayload]    - (inputValue) => payload object. Defaults to { [labelKey]: inputValue }
 * @param {function} [props.formatOption]     - Custom render fn: (option) => ReactNode
 * @param {any}      props.value            - Controlled value (matches valueKey)
 * @param {function} props.onChange          - (selectedOption) => void — receives the full option object
 * @param {string}   [props.placeholder]
 * @param {boolean}  [props.disabled]
 * @param {boolean}  [props.clearable]      - Show clear button when value is set
 * @param {string}   [props.className]      - Extra class for the wrapper
 * @param {string}   [props.createLabel]    - Label for "create" action. Default: 'Add "{query}"'
 * @param {boolean}  [props.enabled]        - Forward to useApiFetch enabled flag
 */
const CreatableSelect = ({
  fetchUrl,
  fetchKey,
  fetchParams,
  postUrl,
  invalidateKeys = [],
  labelKey = "name",
  valueKey = "id",
  createPayload,
  formatOption,
  value,
  onChange,
  placeholder = "Select or type to search…",
  disabled = false,
  clearable = true,
  className = "",
  createLabel,
  enabled,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [optimisticOptions, setOptimisticOptions] = useState([]);

  // ─── Data fetching ──────────────────────────────────────────────────
  const { data, isLoading, isError } = useApiFetch(
    fetchKey,
    fetchUrl,
    fetchParams,
    enabled,
  );

  const rawOptions = useMemo(() => {
    if (!data) return [];
    // Handle both { data: [...] } and plain array responses
    return Array.isArray(data) ? data : (data?.data ?? data?.items ?? []);
  }, [data]);

  // Merge server options with local optimistic ones (dedup by valueKey)
  const allOptions = useMemo(() => {
    const serverIds = new Set(rawOptions.map((o) => o[valueKey]));
    const newOnes = optimisticOptions.filter(
      (o) => !serverIds.has(o[valueKey]),
    );
    return [...rawOptions, ...newOnes];
  }, [rawOptions, optimisticOptions, valueKey]);

  // ─── Filtering ──────────────────────────────────────────────────────
  const filteredOptions = useMemo(() => {
    if (!query.trim()) return allOptions;
    const q = query.toLowerCase();
    return allOptions.filter((o) =>
      String(o[labelKey] ?? "")
        .toLowerCase()
        .includes(q),
    );
  }, [allOptions, query, labelKey]);

  const exactMatch = useMemo(
    () =>
      allOptions.some(
        (o) =>
          String(o[labelKey] ?? "").toLowerCase() ===
          query.trim().toLowerCase(),
      ),
    [allOptions, query, labelKey],
  );

  const showCreate = query.trim().length > 0 && !exactMatch;

  // ─── POST new option ─────────────────────────────────────────────────
  const { mutate: postNew, isPending: isCreating } = usePost(postUrl, {
    invalidate: invalidateKeys.map((k) => (Array.isArray(k) ? k : [k])),
    onSuccess: (responseData, inputVariables) => {
      const created = responseData?.data ?? responseData ?? inputVariables;
      setOptimisticOptions((prev) => [...prev, created]);
      onChange?.(created);
      setIsOpen(false);
      setQuery("");
    },
  });

  const handleCreate = useCallback(() => {
    const trimmed = query.trim();
    if (!trimmed || isCreating) return;

    const payload = createPayload
      ? createPayload(trimmed)
      : { [labelKey]: trimmed };

    postNew(payload);
  }, [query, isCreating, createPayload, labelKey, postNew]);

  // ─── Selection ──────────────────────────────────────────────────────
  const selectedOption = useMemo(
    () => allOptions.find((o) => o[valueKey] === value) ?? null,
    [allOptions, value, valueKey],
  );

  const handleSelect = useCallback(
    (option) => {
      onChange?.(option);
      setIsOpen(false);
      setQuery("");
    },
    [onChange],
  );

  const handleClear = useCallback(
    (e) => {
      e.stopPropagation();
      onChange?.(null);
      setQuery("");
    },
    [onChange],
  );

  // ─── Render helpers ──────────────────────────────────────────────────
  const createLabelText = createLabel
    ? createLabel.replace("{query}", query.trim())
    : `Add "${query.trim()}"`;

  const displayLabel = selectedOption
    ? formatOption
      ? formatOption(selectedOption)
      : String(selectedOption[labelKey] ?? "")
    : placeholder;

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={isOpen}
          disabled={disabled}
          className={cn(
            "w-full justify-between font-normal bg-background hover:bg-background",
            !selectedOption && "text-muted-foreground",
            className,
          )}
        >
          <span className="truncate">{displayLabel}</span>
          <div className="flex items-center shrink-0">
            {clearable && selectedOption && !disabled && (
              <div
                onClick={handleClear}
                className="p-1 hover:bg-muted rounded-md mr-1 text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Clear selection"
              >
                <X className="h-3.5 w-3.5" />
              </div>
            )}
            <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
          </div>
        </Button>
      </PopoverTrigger>

      {/* w-[--radix-popover-trigger-width] memastikan dropdown sama lebar dengan inputnya */}
      <PopoverContent className=" p-0" align="start">
        {/* shouldFilter={false} karena filtering dihandle manual via state `filteredOptions` */}
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Ketik untuk mencari atau menambah..."
            value={query}
            onValueChange={setQuery}
          />
          <CommandList className="max-h-[220px]">
            {isLoading && (
              <div className="p-4 text-sm flex items-center justify-center gap-2 text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" /> Memuat...
              </div>
            )}

            {isError && !isLoading && (
              <div className="p-4 text-sm text-center text-destructive">
                Gagal memuat data.
              </div>
            )}

            {!isLoading &&
              !isError &&
              filteredOptions.length === 0 &&
              !showCreate && (
                <CommandEmpty>Tidak ada data ditemukan.</CommandEmpty>
              )}

            <CommandGroup>
              {filteredOptions.map((option, idx) => (
                <CommandItem
                  key={option[valueKey] ?? idx}
                  value={String(option[valueKey] ?? idx)}
                  onSelect={() => handleSelect(option)}
                  className="cursor-pointer"
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4 text-primary",
                      value === option[valueKey] ? "opacity-100" : "opacity-0",
                    )}
                  />
                  <span className="truncate">
                    {formatOption
                      ? formatOption(option)
                      : String(option[labelKey] ?? "")}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>

            {/* Opsi "Buat Baru" jika query tidak sama persis dengan opsi yang ada */}
            {showCreate && (
              <CommandGroup>
                <CommandItem
                  value={`CREATE_${query}`}
                  onSelect={handleCreate}
                  disabled={isCreating}
                  className="cursor-pointer text-primary"
                >
                  {isCreating ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin text-primary" />
                  ) : (
                    <Plus className="mr-2 h-4 w-4 text-primary" />
                  )}
                  <span className="truncate font-medium">
                    {createLabelText}
                  </span>
                </CommandItem>
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export default CreatableSelect;
