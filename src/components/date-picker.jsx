"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarIcon, XIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { TimePicker } from "./time-picker";
import { safeParseDate } from "@/lib/safeParseDate";

const DEFAULT_TIME = { hours: "00", minutes: "00" };

function formatDate(date) {
  if (!date) return "";
  return date.toLocaleDateString("en-US", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function getTimeFromDate(date) {
  if (!date) return DEFAULT_TIME;
  return {
    hours: String(date.getHours()).padStart(2, "0"),
    minutes: String(date.getMinutes()).padStart(2, "0"),
  };
}

function mergeDateAndTime(date, time) {
  if (!date) return null;
  const merged = new Date(date);
  merged.setHours(Number(time.hours), Number(time.minutes), 0, 0);
  return merged;
}

/**
 * DatePicker
 * - `inline={false}` (default): text input + icon that opens a calendar popover.
 * - `inline={true}`: calendar (and time picker) are always visible, no popover/input shown.
 * - `withTime={true}`: adds a time picker below the calendar and includes hours/minutes
 *   in the value passed to `onChange`.
 */
export function DatePicker({
  value = null,
  onChange,
  label = "Select Date",
  placeholder = "Pick a date",
  format = formatDate,
  disabled = false,
  id = "date-picker",
  className = "",
  inputClassName = "",
  withTime = false,
  required = false,
  inline = false,
}) {
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState(() => safeParseDate(value));
  const [time, setTime] = useState(() => getTimeFromDate(safeParseDate(value)));
  const [month, setMonth] = useState(() => safeParseDate(value) || new Date());
  const [inputValue, setInputValue] = useState("");

  const displayValue = (d, t) => {
    if (!d) return "";
    return withTime ? `${format(d)} ${t.hours}:${t.minutes}` : format(d);
  };

  // Keep internal state in sync whenever `value` changes from outside (e.g. form reset).
  useEffect(() => {
    const parsed = safeParseDate(value);
    const parsedTime = getTimeFromDate(parsed);

    setDate(parsed);
    setTime(parsedTime);
    setMonth(parsed || new Date());
    setInputValue(displayValue(parsed, parsedTime));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, withTime]);

  const handleTextInput = (text) => {
    setInputValue(text);

    if (!text.trim()) {
      setDate(null);
      onChange?.(null);
      return;
    }

    const parsed = new Date(text);
    if (!isNaN(parsed.getTime())) {
      setDate(parsed);
      setMonth(parsed);
      onChange?.(withTime ? mergeDateAndTime(parsed, time) : parsed);
    }
    // Invalid or half-typed input is left alone until blur (see handleBlur).
  };

  const handleBlur = () => {
    setInputValue(displayValue(date, time));
  };

  const handleSelectDate = (selected) => {
    if (!selected) return;

    setDate(selected);
    setMonth(selected);
    setInputValue(displayValue(selected, time));
    onChange?.(withTime ? mergeDateAndTime(selected, time) : selected);

    if (!withTime) setOpen(false);
  };

  const handleSelectTime = (newTime) => {
    if (!date) return;

    setTime(newTime);
    setInputValue(displayValue(date, newTime));
    onChange?.(mergeDateAndTime(date, newTime));
  };

  const handleClear = () => {
    setDate(null);
    setTime(DEFAULT_TIME);
    setInputValue("");
    onChange?.(null);
  };

  const showClearButton = Boolean(date) && !disabled;
  const showTriggerButton = !inline;

  const inputPadding = useMemo(() => {
    const iconCount = (showClearButton ? 1 : 0) + (showTriggerButton ? 1 : 0);
    if (iconCount === 2) return "pr-16";
    if (iconCount === 1) return "pr-10";
    return "";
  }, [showClearButton, showTriggerButton]);

  const calendarBlock = (
    <>
      <Calendar
        mode="single"
        selected={date || undefined}
        month={month}
        onMonthChange={setMonth}
        onSelect={handleSelectDate}
        captionLayout="dropdown"
        className="mx-auto w-auto"
        startMonth={new Date(2023, 0)}
        endMonth={new Date(2030, 11)}
      />

      {withTime && (
        <div className="border-t p-3">
          <TimePicker
            disabled={!date}
            value={time}
            onChange={handleSelectTime}
          />
        </div>
      )}
    </>
  );

  return (
    <div className={`flex flex-col gap-3 ${className}`}>
      {!inline && label ? (
        <Label htmlFor={id} className="text-sm font-medium">
          {label}
        </Label>
      ) : null}

      <div className="relative flex gap-2">
        <Input
          id={id}
          disabled={disabled}
          placeholder={placeholder}
          value={inputValue}
          onChange={(e) => handleTextInput(e.target.value)}
          onBlur={handleBlur}
          onFocus={() => !inline && !disabled && setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown" && !inline) {
              e.preventDefault();
              setOpen(true);
            }
          }}
          required={required}
          className={`${inputPadding} ${inputClassName || "bg-background"} ${inline ? "hidden" : ""}`}
        />

        {showClearButton && (
          <Button
            type="button"
            variant="ghost"
            aria-label="Hapus tanggal"
            onClick={handleClear}
            className={`absolute top-1/2 -translate-y-1/2 size-6 ${
              showTriggerButton ? "right-9" : "right-2"
            }`}
          >
            <XIcon className="size-3.5 text-muted-foreground" />
          </Button>
        )}

        {showTriggerButton && (
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                disabled={disabled}
                aria-label="Buka kalender"
                className="absolute top-1/2 right-2 size-6 -translate-y-1/2"
              >
                <CalendarIcon className="size-3.5 text-muted-foreground" />
              </Button>
            </PopoverTrigger>

            <PopoverContent
              className="w-auto p-0 overflow-hidden rounded-xl shadow-lg"
              align="end"
              sideOffset={10}
              alignOffset={-8}
            >
              {calendarBlock}
            </PopoverContent>
          </Popover>
        )}
      </div>

      {inline && (
        <div className="w-auto rounded-xl border bg-card shadow-sm overflow-hidden">
          {calendarBlock}
        </div>
      )}
    </div>
  );
}
