"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import DashboardLayout from "@/components/layouts/dashboard-layout";
import { RepeatRuleForm } from "./components/repeat-rule-form";
import { RepeatRuleList } from "./components/repeat-rule-list";
import { useRepeatRules } from "./hooks/use-repeat-rules";
import { buildRepeatRulePayload } from "./utils/build-repeat-rule-payload";
import { useAuthStore } from "@/hooks/auth-store";
import { usePost } from "@/hooks/use-api-mutation";

const defaultRepeatRuleForm = {
  target_user_id: "",
  task_name: "",
  reason: "",
  repeat_type: "daily",
  weekdays: [1, 2, 3, 4, 5],
  month_days: [1],
  specific_dates: [],
  start_date: "",
  end_date: "",
  due_in_days: 1, // Default 1 hari kerja
  label: "easy",
  link_url: "",
  file: null,
  file_path: "",
  remove_file: false,
  is_active: true,
};

const buildDefaultRepeatRuleForm = (user, isAdmin) => ({
  ...defaultRepeatRuleForm,
  target_user_id: isAdmin ? "" : String(user?.id || ""),
});

export default function WorkTodoAutoPushPage() {
  const { user, loadFromStorage } = useAuthStore();
  const isAdmin = Number(user?.role_id) === 1;
  const [repeatRuleForm, setRepeatRuleForm] = useState(() =>
    buildDefaultRepeatRuleForm(user, isAdmin),
  );
  const [editingRule, setEditingRule] = useState(null);
  useEffect(() => {
    loadFromStorage();
  }, [loadFromStorage]);

  const {
    repeatRules,
    repeatUsers,
    refetchRepeatRules,
    createRepeatRule,
    updateRepeatRule,
    deleteRepeatRule,
    isCreatingRepeatRule,
  } = useRepeatRules();

  const {
    mutate: updateRepeatRuleDetail,
    isPending: isUpdatingRepeatRuleDetail,
  } = usePost(
    () =>
      editingRule?.id
        ? `/work-todo-repeat-rules/${editingRule.id}?_method=PUT`
        : "/work-todo-repeat-rules/0",
    { invalidate: [["work-todo-repeat-rules"]] },
  );

  const availableAssignees = isAdmin
    ? repeatUsers
    : user?.id
      ? [{ id: user.id, name: user.name }]
      : [];

  const handleEditRule = (rule) => {
    setEditingRule(rule);
    setRepeatRuleForm({
      ...defaultRepeatRuleForm,
      target_user_id: String(rule.target_user_id || ""),
      task_name: rule.task_name || "",
      reason: rule.reason || "",
      repeat_type: rule.repeat_type || "daily",
      weekdays: Array.isArray(rule.weekdays) ? rule.weekdays : [1, 2, 3, 4, 5],
      month_days: Array.isArray(rule.month_days) ? rule.month_days : [1],
      specific_dates: Array.isArray(rule.specific_dates)
        ? rule.specific_dates
        : [],
      start_date: rule.start_date || "",
      end_date: rule.end_date || "",
      due_in_days: rule.due_in_days || 1,
      label: rule.label || "",
      link_url: rule.link_url || "",
      file: null,
      file_path: rule.file_path || "",
      remove_file: false,
      is_active: Boolean(rule.is_active),
    });
  };

  const handleCancelEdit = () => {
    setEditingRule(null);
    setRepeatRuleForm((prev) => ({
      ...defaultRepeatRuleForm,
      target_user_id: isAdmin ? prev.target_user_id : String(user?.id || ""),
    }));
  };

  const handleCreateRepeatRule = () => {
    const effectiveTargetUserId = isAdmin
      ? repeatRuleForm.target_user_id
      : String(user?.id || "");

    if (!effectiveTargetUserId) {
      toast.error("Assignee wajib dipilih");
      return;
    }
    if (!repeatRuleForm.task_name?.trim()) {
      toast.error("Task name wajib diisi");
      return;
    }
    if (repeatRuleForm.repeat_type === "weekly") {
      const days = Array.isArray(repeatRuleForm.weekdays)
        ? repeatRuleForm.weekdays
        : [];
      if (!days.length) {
        toast.error("Pilih minimal 1 hari untuk schedule weekly");
        return;
      }
    }
    if (repeatRuleForm.repeat_type === "monthly") {
      const monthDays = Array.isArray(repeatRuleForm.month_days)
        ? repeatRuleForm.month_days
        : [];
      if (!monthDays.length) {
        toast.error("Pilih minimal 1 tanggal untuk schedule monthly");
        return;
      }
    }
    if (repeatRuleForm.repeat_type === "specific_dates") {
      const dates = Array.isArray(repeatRuleForm.specific_dates)
        ? repeatRuleForm.specific_dates
        : [];
      if (!dates.length) {
        toast.error("Pilih minimal 1 tanggal untuk schedule custom");
        return;
      }
    }

    const payload = buildRepeatRulePayload({
      ...repeatRuleForm,
      target_user_id: effectiveTargetUserId,
    });
    const formData = new FormData();

    Object.entries(payload).forEach(([key, value]) => {
      if (value === undefined || value === null || value === "") return;
      if (Array.isArray(value)) {
        value.forEach((item, index) =>
          formData.append(`${key}[${index}]`, item),
        );
        return;
      }
      formData.append(key, value);
    });

    if (repeatRuleForm.file instanceof File) {
      formData.append("file", repeatRuleForm.file);
    }

    formData.append("due_in_days", repeatRuleForm.due_in_days);

    createRepeatRule(formData, {
      onSuccess: () => {
        toast.success("Repeat task berhasil disimpan");
        setRepeatRuleForm((prev) => ({
          ...defaultRepeatRuleForm,
          target_user_id: isAdmin
            ? prev.target_user_id
            : String(user?.id || ""),
        }));
        refetchRepeatRules();
      },
      onError: (err) => {
        toast.error(
          err?.response?.data?.message || "Gagal menyimpan repeat task",
        );
      },
    });
  };

  const handleUpdateRepeatRule = () => {
    if (!editingRule?.id) return;
    const effectiveTargetUserId = isAdmin
      ? repeatRuleForm.target_user_id
      : String(user?.id || "");

    if (!effectiveTargetUserId) {
      toast.error("Assignee wajib dipilih");
      return;
    }
    if (!repeatRuleForm.task_name?.trim()) {
      toast.error("Task name wajib diisi");
      return;
    }
    if (repeatRuleForm.repeat_type === "weekly") {
      const days = Array.isArray(repeatRuleForm.weekdays)
        ? repeatRuleForm.weekdays
        : [];
      if (!days.length) {
        toast.error("Pilih minimal 1 hari untuk schedule weekly");
        return;
      }
    }
    if (repeatRuleForm.repeat_type === "monthly") {
      const monthDays = Array.isArray(repeatRuleForm.month_days)
        ? repeatRuleForm.month_days
        : [];
      if (!monthDays.length) {
        toast.error("Pilih minimal 1 tanggal untuk schedule monthly");
        return;
      }
    }
    if (repeatRuleForm.repeat_type === "specific_dates") {
      const dates = Array.isArray(repeatRuleForm.specific_dates)
        ? repeatRuleForm.specific_dates
        : [];
      if (!dates.length) {
        toast.error("Pilih minimal 1 tanggal untuk schedule custom");
        return;
      }
    }

    const payload = buildRepeatRulePayload({
      ...repeatRuleForm,
      target_user_id: effectiveTargetUserId,
    });
    payload.reason = String(repeatRuleForm.reason || "");
    payload.label = repeatRuleForm.label
      ? String(repeatRuleForm.label).toLowerCase()
      : "";
    payload.link_url = String(repeatRuleForm.link_url || "");
    payload.is_active = Boolean(repeatRuleForm.is_active);
    if (repeatRuleForm.remove_file) {
      payload.remove_file = 1;
    }
    delete payload.status;
    delete payload.approve_status;
    delete payload.type;
    delete payload.target_amount;
    delete payload.current_amount;
    delete payload.progress_percentage;

    const allowEmpty = new Set(["reason", "label", "link_url"]);
    const formData = new FormData();
    Object.entries(payload).forEach(([key, value]) => {
      if (value === undefined || value === null) return;
      if (value === "" && !allowEmpty.has(key)) return;
      if (Array.isArray(value)) {
        value.forEach((item, index) =>
          formData.append(`${key}[${index}]`, item),
        );
        return;
      }
      formData.append(key, value);
    });

    if (repeatRuleForm.file instanceof File) {
      formData.append("file", repeatRuleForm.file);
    }

    // Explicitly send due_in_days
    formData.append("due_in_days", repeatRuleForm.due_in_days);
    formData.append("_method", "PUT");

    updateRepeatRuleDetail(formData, {
      onSuccess: () => {
        toast.success("Repeat task berhasil diupdate");
        setEditingRule(null);
        setRepeatRuleForm((prev) => ({
          ...defaultRepeatRuleForm,
          target_user_id: isAdmin
            ? prev.target_user_id
            : String(user?.id || ""),
        }));
        refetchRepeatRules();
      },
      onError: (err) => {
        toast.error(err?.response?.data?.message || "Gagal update repeat task");
      },
    });
  };

  const handleToggleRule = (rule) => {
    updateRepeatRule(
      { id: rule.id, is_active: !rule.is_active },
      {
        onSuccess: () => refetchRepeatRules(),
      },
    );
  };

  const handleDeleteRule = (rule) => {
    deleteRepeatRule(
      { id: rule.id },
      {
        onSuccess: () => {
          toast.success("Rule dihapus");
          refetchRepeatRules();
        },
      },
    );
  };

  return (
    <DashboardLayout
      title="Auto Push Work Todo"
      desc="Atur rule tugas berulang harian, mingguan, bulanan, dan tanggal spesifik."
    >
      <div className="flex h-full w-full bg-background overflow-hidden rounded-xl border border-border">
        <RepeatRuleForm
          repeatRuleForm={repeatRuleForm}
          setRepeatRuleForm={setRepeatRuleForm}
          repeatUsers={availableAssignees}
          isAdmin={isAdmin}
          currentUser={user}
          mode={editingRule ? "edit" : "create"}
          onSave={editingRule ? handleUpdateRepeatRule : handleCreateRepeatRule}
          onCancel={editingRule ? handleCancelEdit : undefined}
          isSaving={
            editingRule ? isUpdatingRepeatRuleDetail : isCreatingRepeatRule
          }
        />

        <RepeatRuleList
          repeatRules={repeatRules}
          repeatUsers={repeatUsers}
          onToggle={handleToggleRule}
          onDelete={handleDeleteRule}
          onEdit={handleEditRule}
        />
      </div>
    </DashboardLayout>
  );
}
