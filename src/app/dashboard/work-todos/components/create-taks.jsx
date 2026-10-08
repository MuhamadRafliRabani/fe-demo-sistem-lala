"use client";
import { useState, useRef, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import {
  Paperclip,
  X,
  Check,
  ChevronLeft,
  Pencil,
  Link as LinkIcon,
  FileText,
  AlertCircle,
} from "lucide-react";
import { formatDateDb } from "@/lib/date-format-db";
import { toast } from "sonner";
import { DatePicker } from "@/components/date-picker";
import { useAuthStore } from "@/hooks/auth-store";
import { usePost } from "@/hooks/use-api-mutation";
import { useApiFetch } from "@/hooks/use-api-fetch";
import useCloudflareUpload from "@/hooks/useCloudflareUpload";
import MultiSelect from "@/components/MultiSelect";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";

const TRELLO_COLORS = [
  "bg-[#4bce97]",
  "bg-[#f5cd47]",
  "bg-[#fea362]",
  "bg-[#f87168]",
  "bg-[#9f8fef]",
  "bg-[#579dff]",
  "bg-[#6cc3e0]",
  "bg-[#94c748]",
  "bg-[#e774bb]",
  "bg-[#8590a2]",
];

const toCapitalizeWords = (value = "") =>
  String(value)
    .split("\n")
    .map((line) =>
      line
        .replace(/[ \t]+/g, " ")
        .trimStart()
        .replace(/\b\w/g, (char) => char.toUpperCase()),
    )
    .join("\n");

const DEFAULT_LABELS = [
  { id: "l1", text: "easy", color: "bg-[#4bce97]" },
  { id: "l2", text: "medium", color: "bg-[#f5cd47]" },
  { id: "l3", text: "hard", color: "bg-[#f87168]" },
  { id: "l4", text: "very hard", color: "bg-[#c9372c]" },
];

export function InlineCreateTask({
  columnId,
  onClose,
  onSuccess,
  selectedUsers,
}) {
  const { user } = useAuthStore();
  const isAdmin = [1, 11].includes(Number(user?.role_id));
  const [today] = useState(() => new Date());

  // 1. ENDPOINT DISESUAIKAN KE /work-tasks
  const { mutate, isPending } = usePost("/work-tasks", {
    invalidate: [["work-tasks"]],
  });

  const { register, handleSubmit, setValue, watch, reset } = useForm({
    defaultValues: {
      task_name: "",
      description: "",
      label: "",
      due_date: null,
      files: [],
      file: null,
      link_url: "",
      link_text: "",
    },
  });

  const [isAttachOpen, setIsAttachOpen] = useState(false);
  const attachRef = useRef(null);
  const isSubmittingRef = useRef(false);
  const [submitMode, setSubmitMode] = useState("add");
  const [assignees, setAssignees] = useState(() =>
    Array.isArray(selectedUsers) ? selectedUsers : [],
  );

  const {
    upload: uploadToCloudflare,
    error: cfError,
    reset: resetCF,
  } = useCloudflareUpload();
  const [isUploadingToCloudflare, setIsUploadingToCloudflare] = useState(false);

  const watchedFiles = watch("files");
  const watchedLink = watch("link_url");
  const currentLabel = watch("label");
  const watchedTaskName = watch("task_name");
  const watchedDescription = watch("description");
  const selectedFiles = useMemo(
    () => (Array.isArray(watchedFiles) ? watchedFiles : []),
    [watchedFiles],
  );
  const [filePreviews, setFilePreviews] = useState([]);

  const formatBytes = (bytes) => {
    const num = typeof bytes === "number" ? bytes : Number(bytes);
    if (!Number.isFinite(num) || num <= 0) return "0 B";
    const units = ["B", "KB", "MB", "GB"];
    const idx = Math.min(
      units.length - 1,
      Math.floor(Math.log(num) / Math.log(1024)),
    );
    return `${idx === 0 ? Math.round(num / 1024 ** idx) : Math.round((num / 1024 ** idx) * 10) / 10} ${units[idx]}`;
  };

  const getFileLabel = (file) =>
    String(file?.name || "")
      .split(".")
      .pop()
      .toUpperCase() || "FILE";

  const removeSelectedFile = (index) => {
    const next = [...selectedFiles];
    next.splice(index, 1);
    setValue("files", next, { shouldDirty: true });
    setValue("file", next[0] || null, { shouldDirty: true });
  };

  // LABEL STATE
  const [isLabelOpen, setIsLabelOpen] = useState(false);
  const [labelSearch, setLabelSearch] = useState("");
  const [editingLabel, setEditingLabel] = useState(null);
  const [savedLabels, setSavedLabels] = useState(() => {
    if (typeof window !== "undefined") {
      const local = localStorage.getItem("trello_custom_labels");
      if (local) return JSON.parse(local);
    }
    return DEFAULT_LABELS;
  });

  useEffect(() => {
    const next = selectedFiles.map((file) =>
      String(file?.type || "").startsWith("image/")
        ? URL.createObjectURL(file)
        : null,
    );
    setFilePreviews(next);
    return () =>
      next.forEach((url) => {
        if (url) URL.revokeObjectURL(url);
      });
  }, [selectedFiles]);

  useEffect(
    () =>
      localStorage.setItem("trello_custom_labels", JSON.stringify(savedLabels)),
    [savedLabels],
  );

  useEffect(() => {
    if (!isAdmin) {
      if (user?.id) setAssignees([user.id]);
      return;
    }
    if (Array.isArray(selectedUsers) && selectedUsers.length > 0)
      setAssignees(selectedUsers);
  }, [isAdmin, selectedUsers, user?.id]);

  const { data: usersRes } = useApiFetch(
    [["users-inline-create", "admin"]],
    "/users",
    { paginate: 200, filter: { status: "active" } },
    isAdmin,
  );
  const userOptions = (usersRes?.data?.data || []).map((u) => ({
    label: u?.name || `User #${u?.id}`,
    value: Number(u?.id),
  }));
  const filteredLabels = savedLabels.filter((l) =>
    l.text.toLowerCase().includes(labelSearch.toLowerCase()),
  );
  const selectedLabelObj = savedLabels.find(
    (l) => l.text === currentLabel && currentLabel !== "",
  );

  const handleSaveLabel = () => {
    if (!editingLabel) return;
    setSavedLabels(
      savedLabels.map((l) => (l.id === editingLabel.id ? editingLabel : l)),
    );
    if (currentLabel === editingLabel.text)
      setValue("label", editingLabel.text);
    setEditingLabel(null);
  };

  useEffect(() => {
    function handleClickOutside(e) {
      if (attachRef.current && !attachRef.current.contains(e.target))
        setIsAttachOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || []);
    const newFiles = [...selectedFiles, ...files];
    setValue("files", newFiles, { shouldDirty: true });
    setValue("file", newFiles[0] || null, { shouldDirty: true });
  };

  const onSubmit = async (data, mode = "add") => {
    if (isPending || isSubmittingRef.current || isUploadingToCloudflare) return;

    if (!data.task_name.trim()) return toast.error("Nama tugas wajib diisi!");
    if (!data.description?.trim()) return toast.error("Deskripsi wajib diisi!");
    if (!data.due_date) return toast.error("Due date wajib diisi!");
    if (!data.label) return toast.error("Label wajib diisi!");
    if (isAdmin && (!Array.isArray(assignees) || assignees.length === 0))
      return toast.error("Assignee wajib dipilih!");

    isSubmittingRef.current = true;
    setSubmitMode(mode);

    toast.promise(
      new Promise(async (resolve, reject) => {
        try {
          let newlyUploadedCF = [];
          if (selectedFiles.length > 0) {
            setIsUploadingToCloudflare(true);
            for (const file of selectedFiles) {
              const result = await uploadToCloudflare(file);
              newlyUploadedCF.push(result);
            }
            setIsUploadingToCloudflare(false);
          }

          // 2. SETUP PAYLOAD BARU (FLAT ARCHITECTURE)
          const formData = new FormData();
          const targetUsers = isAdmin ? assignees : [user?.id];

          targetUsers.forEach((id, index) => {
            formData.append(`user_ids[${index}]`, String(id));
          });

          formData.append("task_name", toCapitalizeWords(data.task_name));
          formData.append("description", toCapitalizeWords(data.description));
          formData.append("label", data.label.toLowerCase());
          formData.append("due_date", formatDateDb(data.due_date));
          formData.append("status", columnId || "pending");

          if (data.link_url) formData.append("link_url", data.link_url);

          if (newlyUploadedCF.length > 0) {
            newlyUploadedCF.forEach((attachment, index) => {
              formData.append(
                `cloudflare_attachments[${index}][key]`,
                attachment.key,
              );
              formData.append(
                `cloudflare_attachments[${index}][filename]`,
                attachment.filename,
              );
              formData.append(
                `cloudflare_attachments[${index}][size]`,
                attachment.size,
              );
              formData.append(
                `cloudflare_attachments[${index}][mime_type]`,
                attachment.mime_type,
              );
              formData.append(
                `cloudflare_attachments[${index}][cloudflare_url]`,
                attachment.cloudflare_url,
              );
            });
          }

          mutate(formData, {
            onSuccess: () => {
              isSubmittingRef.current = false;
              resetCF();
              onSuccess?.();
              if (mode === "createAgain") {
                reset({
                  task_name: "",
                  description: "",
                  file: null,
                  files: [],
                  link_url: "",
                  link_text: "",
                  label: data.label,
                  due_date: data.due_date,
                });
              } else {
                reset();
                onClose();
              }
              resolve();
            },
            onError: (err) => {
              isSubmittingRef.current = false;
              setIsUploadingToCloudflare(false);
              reject(
                err?.response?.data?.message || "Gagal membuat task di server.",
              );
            },
          });
        } catch (error) {
          isSubmittingRef.current = false;
          setIsUploadingToCloudflare(false);
          reject(`Gagal mengunggah file: ${error.message}`);
        }
      }),
      {
        loading:
          selectedFiles.length > 0 ? "Mengunggah file..." : "Menyimpan...",
        success:
          mode === "createAgain"
            ? "Tugas berhasil dibuat! Lanjut buat lagi."
            : "Tugas berhasil ditambahkan!",
        error: (msg) => msg,
      },
    );
  };

  return (
    <form
      onSubmit={handleSubmit((d) => onSubmit(d, "add"))}
      className="mb-4 bg-[#1e2732] rounded-xl p-3 shadow-lg ring-1 ring-[#fed818]/30 flex flex-col gap-2 w-full max-w-full overflow-visible"
    >
      {isAdmin && (
        <div className="w-full flex flex-col gap-2">
          <MultiSelect
            options={userOptions}
            value={Array.isArray(assignees) ? assignees : []}
            onChange={setAssignees}
            placeholder="Assign ke user..."
            searchable
            className="bg-[#152733] border-[#363430] text-[#fffdf5]"
          />
          <Separator />
        </div>
      )}

      <div className="flex items-center gap-1.5 justify-between flex-1 min-w-0">
        <Popover open={isLabelOpen} onOpenChange={setIsLabelOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              className="bg-[#152733] hover:bg-[#253645] border border-[#363430] text-[#cfc9bd] text-[11px] font-medium rounded px-2 h-[30px] min-w-[75px] max-w-[120px] transition-colors shrink-0 flex items-center gap-1.5"
            >
              {selectedLabelObj && (
                <span
                  className={`w-2 h-2 rounded-full ${selectedLabelObj.color} shrink-0`}
                />
              )}
              <span className="truncate">
                {currentLabel ? currentLabel.toUpperCase() : "Label.."}
              </span>
            </button>
          </PopoverTrigger>

          <PopoverContent
            className="w-[280px] p-0 bg-[#282e33] border-[#363430] shadow-xl rounded-lg"
            align="start"
          >
            {editingLabel ? (
              <div className="flex flex-col">
                <div className="flex items-center justify-between px-3 py-2.5 border-b border-[#a6c5e229]">
                  <button
                    type="button"
                    onClick={() => setEditingLabel(null)}
                    className="text-[#9fadbc] hover:text-[#b6c2cf] transition-colors p-1"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <span className="text-[13px] font-semibold text-[#b6c2cf]">
                    Edit Color
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsLabelOpen(false)}
                    className="text-[#9fadbc] hover:text-[#b6c2cf] transition-colors p-1"
                  >
                    <X size={16} />
                  </button>
                </div>
                <div className="p-3 flex flex-col gap-4">
                  <div className="bg-[#22272b] p-6 rounded flex items-center justify-center border border-[#a6c5e229]">
                    <div
                      className={`w-full max-w-[150px] h-8 rounded ${editingLabel.color} flex items-center px-3 text-[12px] font-bold text-[#1d2125] transition-colors overflow-hidden`}
                    >
                      <span className="truncate">
                        {editingLabel.text.toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-semibold text-[#9fadbc]">
                      Title
                    </label>
                    <input
                      type="text"
                      disabled
                      readOnly
                      value={editingLabel.text.toUpperCase()}
                      className="w-full bg-[#22272b] border border-[#a6c5e229] rounded px-2.5 py-1.5 text-xs text-[#9fadbc] opacity-70 cursor-not-allowed focus:outline-none"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-semibold text-[#9fadbc]">
                      Select a color
                    </label>
                    <div className="grid grid-cols-5 gap-2 mt-1">
                      {TRELLO_COLORS.map((color) => (
                        <button
                          key={color}
                          type="button"
                          onClick={() =>
                            setEditingLabel({ ...editingLabel, color })
                          }
                          className={`h-8 rounded ${color} ring-offset-[#282e33] transition-all relative ${editingLabel.color === color ? "ring-2 ring-[#579dff] scale-105" : "hover:opacity-80"}`}
                        >
                          {editingLabel.color === color && (
                            <Check
                              size={14}
                              className="text-[#1d2125] absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 font-bold"
                            />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <button
                      type="button"
                      onClick={handleSaveLabel}
                      className="flex-1 bg-[#579dff] hover:bg-[#85b8ff] text-[#1d2125] text-xs font-semibold py-2 rounded transition-colors"
                    >
                      Save Color
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col">
                <div className="flex items-center justify-between px-3 py-2.5 border-b border-[#a6c5e229] relative">
                  <span className="text-[13px] font-semibold text-[#b6c2cf] mx-auto">
                    Labels
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsLabelOpen(false)}
                    className="absolute right-3 text-[#9fadbc] hover:text-[#b6c2cf] transition-colors p-1"
                  >
                    <X size={16} />
                  </button>
                </div>
                <div className="p-3 flex flex-col gap-3">
                  <input
                    type="text"
                    placeholder="Search labels..."
                    value={labelSearch}
                    onChange={(e) => setLabelSearch(e.target.value)}
                    className="w-full bg-[#22272b] border border-[#a6c5e229] rounded px-2.5 py-1.5 text-xs text-[#b6c2cf] focus:outline-none focus:border-[#579dff] transition-colors"
                  />
                  <div className="flex flex-col gap-1 max-h-[220px] overflow-y-auto custom-scrollbar pr-1">
                    <div className="text-[11px] font-semibold text-[#9fadbc] mb-1">
                      Labels
                    </div>
                    {filteredLabels.map((l) => {
                      const isSelected =
                        currentLabel === l.text && l.text !== "";
                      return (
                        <div
                          key={l.id}
                          className="flex items-center gap-1.5 group"
                        >
                          <div
                            className={`w-4 h-4 rounded-sm border flex items-center justify-center shrink-0 cursor-pointer transition-colors ${isSelected ? "bg-[#579dff] border-[#579dff]" : "border-[#a6c5e229] hover:border-[#85b8ff]"}`}
                            onClick={() =>
                              setValue("label", isSelected ? "" : l.text)
                            }
                          >
                            {isSelected && (
                              <Check
                                size={12}
                                className="text-[#1d2125] font-bold"
                              />
                            )}
                          </div>
                          <div
                            onClick={() =>
                              setValue("label", isSelected ? "" : l.text)
                            }
                            className={`flex-1 h-8 rounded ${l.color} flex items-center px-3 cursor-pointer text-[12px] font-bold text-[#1d2125] hover:opacity-90 transition-opacity overflow-hidden`}
                          >
                            <span className="truncate">
                              {l.text.toUpperCase()}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setEditingLabel(l)}
                            className="w-8 h-8 flex items-center justify-center rounded hover:bg-[#a6c5e214] text-[#9fadbc] hover:text-[#b6c2cf] transition-colors shrink-0"
                          >
                            <Pencil size={14} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </PopoverContent>
        </Popover>

        <div className="flex-1 shrink-0 ">
          <DatePicker
            value={watch("due_date")}
            required={true}
            placeholder="Due date"
            label=""
            onChange={(date) => setValue("due_date", date)}
            className="w-full h-[30px]"
            inputClassName="text-[11px] h-[30px] rounded cursor-pointer transition-px-2"
          />
        </div>

        <div className="relative shrink-0" ref={attachRef}>
          <button
            type="button"
            onClick={() => setIsAttachOpen(!isAttachOpen)}
            className={`flex items-center justify-center w-[30px] h-[30px] rounded border transition-colors ${selectedFiles.length > 0 || watchedLink ? "bg-[#fed818]/10 border-[#fed818] text-[#fed818]" : "bg-[#152733] hover:bg-[#253645] border-[#363430] text-[#cfc9bd] hover:text-white"}`}
          >
            <Paperclip size={14} />
          </button>
          {isAttachOpen && (
            <div className="absolute top-full mt-2 right-0 w-[240px] bg-[#1e2732] border border-[#363430] rounded-xl shadow-2xl z-[60] overflow-hidden">
              <div className="flex items-center justify-between border-b border-[#363430] px-3 py-2.5">
                <h4 className="text-[13px] font-bold text-[#fffdf5] text-center flex-1">
                  Attach
                </h4>
                <button type="button" onClick={() => setIsAttachOpen(false)}>
                  <X
                    size={14}
                    className="text-[#cfc9bd] hover:text-[#fffdf5] transition-colors"
                  />
                </button>
              </div>
              <div className="p-3 flex flex-col gap-3">
                <div>
                  <label className="flex items-center justify-center w-full bg-[#152733] hover:bg-[#253645] border border-dashed border-[#363430] rounded-lg py-2 cursor-pointer transition-colors">
                    <span className="text-[11px] font-bold text-[#cfc9bd]">
                      Choose files...
                    </span>
                    <input
                      type="file"
                      multiple
                      className="hidden"
                      onChange={handleFileChange}
                    />
                  </label>
                </div>
                {cfError && (
                  <div className="flex items-center gap-2 p-2 bg-red-500/10 border border-red-500/30 rounded text-red-400 text-[10px]">
                    <AlertCircle size={12} />
                    {cfError}
                  </div>
                )}
                <div className="h-px w-full bg-[#363430]" />
                <div>
                  <input
                    type="text"
                    {...register("link_url")}
                    placeholder="Paste a link here..."
                    className="w-full bg-[#152733] border border-[#363430] rounded-md px-2.5 py-1.5 text-[11px] text-[#fffdf5] focus:outline-none focus:border-[#fed818]/50 placeholder-[#cfc9bd]/50"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setIsAttachOpen(false)}
                  className="w-full bg-[#135a86] hover:bg-[#1a74ad] text-white text-[11px] font-bold py-2 rounded-md transition-colors"
                >
                  Done
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-2 pt-1">
        <input
          value={watchedTaskName || ""}
          onChange={(e) =>
            setValue("task_name", toCapitalizeWords(e.target.value), {
              shouldDirty: true,
            })
          }
          autoFocus
          placeholder="Task Name"
          className="w-full bg-transparent border-none text-[#fffdf5] text-[14px] font-semibold placeholder:text-accent/50 placeholder:pl-1 focus:outline-none focus:ring-0 px-1 border-b-accent border-b"
        />
        <textarea
          value={watchedDescription || ""}
          onChange={(e) =>
            setValue("description", toCapitalizeWords(e.target.value), {
              shouldDirty: true,
            })
          }
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.ctrlKey) {
              e.preventDefault();
              e.currentTarget.blur();
            }
          }}
          placeholder="add description..."
          rows={2}
          className="w-full bg-[#152733]/50 border border-transparent rounded-lg px-2.5 py-2 text-[12px] text-[#cfc9bd] placeholder-[#cfc9bd]/40 focus:outline-none focus:border-[#363430] hover:border-[#363430] resize-none custom-scrollbar transition-colors"
        />
      </div>

      <div
        className={`grid transition-all duration-300 ease-in-out ${selectedFiles.length > 0 || watchedLink ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}
      >
        <div className="overflow-hidden">
          <div className="pt-2 flex flex-col gap-2">
            {selectedFiles.length > 0 && (
              <div className="rounded-lg overflow-hidden border border-[#363430] bg-[#152733]/30">
                <div className="max-h-[220px] overflow-auto divide-y divide-[#363430]">
                  {selectedFiles.map((file, idx) => (
                    <div
                      key={`${file?.name || "file"}-${idx}`}
                      className="px-3 py-2 flex items-center gap-3"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="text-[12px] font-semibold text-[#fffdf5] truncate">
                          {file?.name || "Untitled"}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeSelectedFile(idx)}
                        className="p-1.5 rounded-md hover:bg-[#363430]/50 text-[#cfc9bd] transition-colors"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {watchedLink && selectedFiles.length === 0 && (
              <div className="flex items-center gap-2.5 p-2 rounded-lg border border-[#363430] bg-[#152733]/50 relative group">
                <LinkIcon size={12} className="text-[#579dff]" />
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="text-[11px] font-semibold text-[#fffdf5] truncate leading-tight">
                    Website Link
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setValue("link_url", "")}
                  className="p-1.5 text-[#cfc9bd] hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X size={14} />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between pt-2 mt-1 border-t border-[#363430]/60 gap-2">
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="submit"
            disabled={isPending || isUploadingToCloudflare}
            onClick={() => setSubmitMode("add")}
            className="bg-[#fed818] hover:bg-[#e5c210] disabled:opacity-50 text-[#152733] text-xs font-bold px-3 py-1.5 rounded-md transition-colors shadow-sm"
          >
            {(isPending || isUploadingToCloudflare) && submitMode === "add"
              ? "..."
              : "Add"}
          </button>
          <button
            type="button"
            disabled={isPending || isUploadingToCloudflare}
            onClick={handleSubmit((d) => onSubmit(d, "createAgain"))}
            className="bg-[#135a86] hover:bg-[#1a74ad] disabled:opacity-50 text-white text-xs font-bold px-3 py-1.5 rounded-md transition-colors shadow-sm"
          >
            {(isPending || isUploadingToCloudflare) &&
            submitMode === "createAgain"
              ? "..."
              : "Create Again"}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-[#cfc9bd] hover:text-[#fffdf5] hover:bg-[#363430]/50 rounded-md transition-colors"
          >
            <X size={18} />
          </button>
        </div>
      </div>
    </form>
  );
}
