import { formatDateDb } from "@/lib/date-format-db";

const toNumberArray = (value) => {
  if (Array.isArray(value)) {
    return value
      .map((item) => Number(item))
      .filter((item) => Number.isFinite(item) && item > 0);
  }
  return String(value || "")
    .split(",")
    .map((item) => Number(item.trim()))
    .filter((item) => Number.isFinite(item) && item > 0);
};

const toDateArray = (value) => {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }
  return String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
};

export const buildRepeatRulePayload = (form) => {
  const dueDateValue = form?.due_date;
  const dueDate =
    dueDateValue instanceof Date
      ? dueDateValue
      : dueDateValue
        ? new Date(dueDateValue)
        : null;

  const payload = {
    target_user_id: Number(form.target_user_id),
    task_name: form.task_name,
    reason: form.reason || null,
    repeat_type: form.repeat_type,
    start_date: form.start_date || null,
    end_date: form.end_date || null,
    due_in_days: Number(form.due_in_days) || 1,
    status: "pending",
    approve_status: "pending",
    type: "progress",
    label: form.label ? String(form.label).toLowerCase() : null,
    target_amount: null,
    current_amount: 0,
    progress_percentage: 0,
    link_url: form.link_url || null,
    is_active: Boolean(form.is_active),
  };

  if (form.repeat_type === "weekly") {
    payload.weekdays = toNumberArray(form.weekdays);
  }
  if (form.repeat_type === "monthly") {
    payload.month_days = toNumberArray(form.month_days);
  }
  if (form.repeat_type === "specific_dates") {
    payload.specific_dates = toDateArray(form.specific_dates);
  }

  return payload;
};
