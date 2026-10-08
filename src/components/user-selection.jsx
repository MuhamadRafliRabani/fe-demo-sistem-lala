import React, { useState } from "react";
import { useMemo } from "react";
import { Check, ChevronsUpDown, UserPlus, Users, X } from "lucide-react";
import { cn } from "@/lib/utils"; // Sesuaikan path utils Anda
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { getInitials } from "@/lib/get-initial";
import { useApiFetch } from "@/hooks/use-api-fetch";
import { useAuthStore } from "@/hooks/auth-store";
import { resolveImageUrl } from "@/lib/resolve-image-url";

export function UserSelection({
  label,
  placeholder = "Pilih item...",
  searchPlaceholder = "Cari...",
  emptyMessage = "Data tidak ditemukan.",
  value = [],
  onChange,
  error,
  disabled,
  icon = <Users size={14} className="text-gray-500" />,
}) {
  const [open, setOpen] = useState(false);
  const { user } = useAuthStore();

  const toggleOption = (optionValue) => {
    const newValue = value.includes(optionValue)
      ? value.filter((v) => v !== optionValue)
      : [...value, optionValue];
    onChange(newValue);
  };

  const clearAll = () => onChange([]);

  const { data: usersData, isLoading: isLoadingUsers } = useApiFetch(
    [["users"]],
    "/users",
    {
      paginate: 100,
      filter: {
        status: "active",
      },
    },
    user ? Number(user.role_id) === 1 : false,
  );

  const rawUsers = usersData?.data?.data || [];

  // Mapping data API ke format standar option yang diminta oleh komponen MultiSelect
  const userOptions = useMemo(() => {
    return rawUsers.map((u) => ({
      value: u.id,
      label: u.name,
      avatar: u.avatar,
      subtitle: u.role?.name || "No Role",
    }));
  }, [rawUsers]);

  // Filter selected options objects to display badges & avatars
  const selectedOptions = userOptions.filter((opt) =>
    value.includes(opt.value),
  );

  return (
    <div className="space-y-4">
      {/* Label Area */}
      {label && (
        <div className="flex items-center justify-between">
          <Label className="text-[13px] font-bold flex items-center gap-1.5 text-gray-700">
            {icon}
            {label}
          </Label>
          {value.length > 0 && (
            <span className="text-[11px] text-blue-700 font-bold bg-blue-50 border border-blue-100 px-2.5 py-1 rounded-md">
              {value.length} dipilih
            </span>
          )}
        </div>
      )}

      {/* Trigger & Dropdown */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild className="w-full">
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={disabled}
            className={cn(
              "w-full justify-between h-11 px-4 rounded-xl bg-white shadow-sm border",
              error
                ? "border-red-300 focus:ring-red-500"
                : "border-gray-300 focus:border-blue-500 focus:ring-blue-500",
              value.length === 0
                ? "text-gray-400 font-normal"
                : "text-gray-800",
            )}
          >
            <span className="flex items-center gap-2 truncate w-full">
              {value.length > 0 ? (
                <div className="flex -space-x-2 overflow-hidden">
                  {selectedOptions.slice(0, 5).map((opt) => (
                    <Avatar
                      key={opt.value}
                      className="inline-block size-6 ring-2 ring-white"
                    >
                      <AvatarImage
                        src={resolveImageUrl(opt.avatar)}
                        alt={opt.label}
                      />
                      <AvatarFallback className="text-[9px] text-blue-600 bg-blue-50">
                        {getInitials(opt.label)}
                      </AvatarFallback>
                    </Avatar>
                  ))}
                  {value.length > 5 && (
                    <div className="flex items-center justify-center size-6 rounded-full ring-2 ring-white text-[9px] font-medium text-gray-600 bg-gray-100">
                      +{value.length - 5}
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  {placeholder}
                </>
              )}
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 text-gray-500" />
          </Button>
        </PopoverTrigger>

        {/* Dropdown Content */}
        <PopoverContent
          className="w-[calc(100vw-16px)] max-w-[400px] p-0 border-gray-200 rounded-xl shadow-xl bg-white"
          align="start"
        >
          <Command className="bg-transparent">
            <CommandInput
              placeholder={searchPlaceholder}
              className="border-none focus:ring-0 text-gray-800"
            />
            <CommandList className="max-h-[220px] overflow-y-auto p-1">
              <CommandEmpty className="py-6 text-center text-sm text-gray-500">
                {emptyMessage}
              </CommandEmpty>
              <CommandGroup
                heading="Daftar Pilihan"
                className="text-gray-500 font-medium"
              >
                {userOptions.map((option) => {
                  const isSelected = value.includes(option.value);
                  return (
                    <CommandItem
                      key={option.value}
                      value={option.label} // Digunakan untuk pencarian
                      onSelect={() => toggleOption(option.value)}
                      className="flex items-center gap-3 py-2 px-3 rounded-lg cursor-pointer aria-selected:bg-blue-50 aria-selected:text-blue-700 hover:bg-blue-50 transition-colors"
                    >
                      <div
                        className={cn(
                          "flex items-center justify-center w-4 h-4 border rounded-sm mr-1 transition-all",
                          isSelected
                            ? "bg-blue-600 border-blue-600 text-white"
                            : "border-gray-300 bg-white",
                        )}
                      >
                        <Check
                          className={cn(
                            "w-3 h-3",
                            isSelected ? "opacity-100" : "opacity-0",
                          )}
                        />
                      </div>

                      <Avatar className="h-8 w-8">
                        <AvatarImage
                          src={resolveImageUrl(option.avatar)}
                          alt={option.label}
                        />
                        <AvatarFallback className="text-xs bg-blue-50 text-blue-600">
                          {getInitials(option.label)}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex flex-col flex-1 min-w-0">
                        <span
                          className={cn(
                            "text-sm truncate",
                            isSelected
                              ? "font-bold text-blue-800"
                              : "font-medium text-gray-800",
                          )}
                        >
                          {option.label}
                        </span>
                        {option.subtitle && (
                          <span className="text-xs text-gray-500 truncate">
                            {option.subtitle}
                          </span>
                        )}
                      </div>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Selected Badges Area */}
      {selectedOptions.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-1">
          {selectedOptions.map((opt) => (
            <Badge
              key={opt.value}
              variant="secondary"
              className="pl-1 pr-2 py-1 gap-2 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 shadow-sm transition-colors rounded-lg font-medium"
            >
              <Avatar className="h-5 w-5">
                <AvatarImage
                  src={resolveImageUrl(opt.avatar)}
                  alt={opt.label}
                />
                <AvatarFallback className="text-[9px] bg-blue-50 text-blue-600">
                  {getInitials(opt.label)}
                </AvatarFallback>
              </Avatar>
              <span className="text-xs">{opt.label}</span>
              <div
                role="button"
                tabIndex={0}
                className="ml-auto flex items-center justify-center p-0.5 rounded-full hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors cursor-pointer"
                onPointerDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  toggleOption(opt.value);
                }}
              >
                <X className="h-3 w-3" />
              </div>
            </Badge>
          ))}
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-lg px-2"
            onClick={clearAll}
          >
            Clear All
          </Button>
        </div>
      )}
    </div>
  );
}
