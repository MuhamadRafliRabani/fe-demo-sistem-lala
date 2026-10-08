"use client";

import { useState } from "react";
import { usePost, usePut, useRemove } from "@/hooks/use-api-mutation";
import { toast } from "sonner";

// ---------------------------------------------------------------------------
// Payload builder
// ---------------------------------------------------------------------------
function buildCreatePayload(type, formData) {
  // 1. PENYESUAIAN AMAN: import_id dihapus agar backend yg tentukan secara dinamis
  const base = { ...formData };

  // 2. PENYESUAIAN AMAN: sort_order dikirim untuk SEMUA tipe data (Section, Subsection, Item)
  base.sort_order =
    formData.sort_order !== "" && formData.sort_order != null
      ? Number(formData.sort_order)
      : null;

  if (type === "subsection" || type === "item") {
    base.section_id = Number(formData.section_id);
  }

  if (type === "item") {
    base.subsection_id = formData.subsection_id
      ? Number(formData.subsection_id)
      : null;
    base.harga_total = Number(formData.harga_total || 0);
  }

  return base;
}

// ---------------------------------------------------------------------------
// Default empty form per type
// ---------------------------------------------------------------------------
export const INITIAL_FORM = {
  section: () => ({
    kode: "",
    nama: "",
    sort_order: "",
  }),
  subsection: (preset = {}) => ({
    section_id: preset.section_id ?? "",
    kode: "",
    nama: "",
    sort_order: "", // Ditambahkan ke inisial form
  }),
  item: (preset = {}) => ({
    section_id: preset.section_id ?? "",
    subsection_id: preset.subsection_id ?? "",
    kode: "",
    nama: "",
    satuan: "",
    harga_total: "",
    sort_order: "", // Ditambahkan ke inisial form
  }),
};

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------
export function useAhspCrud({ refetch } = {}) {
  // ── Inline edit ──────────────────────────────────────────────────────────
  const [editingId, setEditingId] = useState(null);
  const [editFormData, setEditFormData] = useState({});

  // ── Create modal ─────────────────────────────────────────────────────────
  const [createModal, setCreateModal] = useState({
    open: false,
    type: null,
    formData: {},
    allowedTypes: ["section", "subsection", "item"],
  });

  // ── Mutations ────────────────────────────────────────────────────────────
  const { mutate: deleteData, isPending: isDeleting } = useRemove(
    ({ type, id }) => `/master/ahsp/${type}s/${id}`,
    {
      invalidate: [
        ["ahsp-items"],
        ["ahsp-sections"],
        ["ahsp-grouped-sections"],
        ["ahsp-sections-modal"],
        ["ahsp-subsections-modal"],
      ],
    },
  );
  const { mutate: updateData, isPending: isUpdating } = usePut(
    ({ type, id }) => `/master/ahsp/${type}s/${id}`,
    {
      invalidate: [
        ["ahsp-items"],
        ["ahsp-sections"],
        ["ahsp-grouped-sections"],
        ["ahsp-sections-modal"],
        ["ahsp-subsections-modal"],
      ],
    },
  );
  const { mutate: createData, isPending: isCreating } = usePost(
    ({ type }) => `/master/ahsp/${type}s`,
    {
      invalidate: [
        ["ahsp-items"],
        ["ahsp-sections"],
        ["ahsp-grouped-sections"],
        ["ahsp-sections-modal"],
        ["ahsp-subsections-modal"],
      ],
    },
  );

  const notify = {
    success: (msg) => toast.success(msg),
    error: (err, fb) => toast.error(err?.response?.data?.message || fb),
  };

  // ── Delete ────────────────────────────────────────────────────────────────
  const handleDelete = (type, id) => {
    if (!confirm(`Yakin ingin menghapus ${type} ini beserta isinya?`)) return;
    deleteData(
      { type, id },
      {
        onSuccess: () => {
          notify.success(`${type} berhasil dihapus.`);
          refetch?.();
        },
        onError: (err) => notify.error(err, "Gagal menghapus data."),
      },
    );
  };

  // ── Edit (inline) ─────────────────────────────────────────────────────────
  const handleEditClick = (type, dataObj) => {
    setEditingId(`${type}-${dataObj.id}`);
    setEditFormData({ ...dataObj });
    setCreateModal((p) => ({ ...p, open: false }));
  };

  const handleSaveEdit = (type, id) => {
    updateData(
      { type, id, ...editFormData },
      {
        onSuccess: () => {
          notify.success("Perubahan berhasil disimpan.");
          setEditingId(null);
          setEditFormData({});
          refetch?.();
        },
        onError: (err) => notify.error(err, "Gagal menyimpan perubahan."),
      },
    );
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditFormData({});
  };

  // ── Create modal ──────────────────────────────────────────────────────────
  const openCreateModal = (allowedTypes = null, preset = {}) => {
    const types = allowedTypes ?? ["section", "subsection", "item"];
    const autoType = types.length === 1 ? types[0] : null;

    setCreateModal({
      open: true,
      type: autoType,
      formData: autoType ? (INITIAL_FORM[autoType]?.(preset) ?? {}) : {},
      allowedTypes: types,
      preset,
    });

    setEditingId(null);
    setEditFormData({});
  };

  const closeCreateModal = () =>
    setCreateModal({
      open: false,
      type: null,
      formData: {},
      allowedTypes: ["section", "subsection", "item"],
    });

  const selectCreateType = (type) =>
    setCreateModal((prev) => ({
      ...prev,
      type,
      formData:
        INITIAL_FORM[type]?.(type === "section" ? {} : (prev.preset ?? {})) ??
        {},
    }));

  const setCreateFormData = (updaterOrValue) =>
    setCreateModal((prev) => ({
      ...prev,
      formData:
        typeof updaterOrValue === "function"
          ? updaterOrValue(prev.formData)
          : updaterOrValue,
    }));

  const handleSaveCreate = () => {
    const { type, formData } = createModal;
    if (!type) return;

    const payload = buildCreatePayload(type, formData);
    createData(
      { ...payload, type },
      {
        onSuccess: () => {
          notify.success(`${type} berhasil ditambahkan.`);
          closeCreateModal();
          refetch?.();
        },
        onError: (err) => notify.error(err, "Gagal menambahkan data."),
      },
    );
  };

  // ── Derived ───────────────────────────────────────────────────────────────
  const isEditing = (type, id) => editingId === `${type}-${id}`;

  return {
    // Edit
    editFormData,
    setEditFormData,
    isUpdating,
    isEditing,
    handleEditClick,
    handleSaveEdit,
    handleCancelEdit,
    // Create modal
    createModal,
    setCreateFormData,
    isCreating,
    openCreateModal,
    closeCreateModal,
    selectCreateType,
    handleSaveCreate,
    // Delete
    isDeleting,
    handleDelete,
  };
}
