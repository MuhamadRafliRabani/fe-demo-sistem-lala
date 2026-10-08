import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  X,
  CheckCircle2,
  Target,
  AlignLeft,
  CalendarDays,
  Check,
  ChevronsUpDown,
  UserPlus,
  Users,
  Bubbles,
  Layers,
  TrendingUp,
  Percent,
  MessageSquare,
  Paperclip, // Tambahan icon Paperclip
  FileText,
  Image as ImageIcon,
} from "lucide-react";

import { useForm } from "react-hook-form";
import { usePost } from "@/hooks/use-api-mutation";
import { useDateRange } from "@/lib/date-range";
import { formatDateDb } from "@/lib/date-format-db";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
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
import { Label } from "@/components/ui/label";
import { useApiFetch } from "@/hooks/use-api-fetch";
import { cn } from "@/lib/utils";
import { getInitials } from "@/lib/get-initial";
import { useAuthStore } from "@/hooks/auth-store";
import { DatePicker } from "@/components/date-picker";
import { resolveImageUrl } from "@/lib/resolve-image-url";
import { usePost as usePostMutation } from "@/hooks/use-api-mutation";

export const CreateTaskModal = ({ isOpen, onClose, columnId, onSuccess }) => {
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [openCombobox, setOpenCombobox] = useState(false);
  const [attachmentTab, setAttachmentTab] = useState("file"); // State Tab Lampiran baru
  const { start } = useDateRange("today");
  const { user } = useAuthStore();

  const { mutate, isPending } = usePost("/work-todos", {
    invalidate: [["work-todos"]],
  });
  const { mutate: sendNotification } = usePostMutation("/notifications/send");

  // Fetch users for the recipient list
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

  const users = usersData?.data?.data || [];

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      users: [],
      task_name: "",
      due_date: null,
      approve_status: Number(user?.role_id) === 1 ? "approved" : "pending",
      reason: "",
      type: "quantity", // default
      target_amount: 0,
      current_amount: 0,
      progress_percentage: 0,
      file: null, // Default value file baru
      files: [],
      link_url: "", // Default value link URL baru
    },
  });

  const taskType = watch("type");
  const taskName = watch("task_name");
  const selectedFiles = watch("files") || [];
  const [selectedFilePreviews, setSelectedFilePreviews] = useState([]);

  const formatBytes = (bytes) => {
    const num = typeof bytes === "number" ? bytes : Number(bytes);
    if (!Number.isFinite(num) || num <= 0) return "0 B";
    const units = ["B", "KB", "MB", "GB"];
    const idx = Math.min(
      units.length - 1,
      Math.floor(Math.log(num) / Math.log(1024)),
    );
    const value = num / 1024 ** idx;
    const rounded = idx === 0 ? Math.round(value) : Math.round(value * 10) / 10;
    return `${rounded} ${units[idx]}`;
  };

  const getFileLabel = (file) => {
    const name = String(file?.name || "");
    const ext = name.includes(".") ? name.split(".").pop() : "";
    const normalized = String(ext || "")
      .trim()
      .toUpperCase();
    return normalized || "FILE";
  };

  const removeSelectedFile = (index) => {
    const next = Array.isArray(selectedFiles) ? [...selectedFiles] : [];
    next.splice(index, 1);
    setValue("files", next);
    setValue("file", next[0] || null);
  };

  // Reset form saat modal dibuka/ditutup
  useEffect(() => {
    if (isOpen) {
      reset({
        users: [],
        task_name: "",
        due_date: null,
        approve_status: Number(user?.role_id) === 1 ? "approved" : "pending",
        reason: "",
        type: "quantity",
        target_amount: 0,
        current_amount: 0,
        progress_percentage: 0,
        file: null,
        files: [],
        link_url: "",
      });
      setSelectedUsers([]); // reset juga selected users
      setAttachmentTab("file"); // reset tab lampiran
    }
  }, [isOpen, reset, user]);

  useEffect(() => {
    const files = Array.isArray(selectedFiles) ? selectedFiles : [];
    const next = files.map((file) => {
      const isImg = String(file?.type || "").startsWith("image/");
      return isImg ? URL.createObjectURL(file) : null;
    });
    setSelectedFilePreviews(next);
    return () => {
      next.forEach((url) => {
        if (url) URL.revokeObjectURL(url);
      });
    };
  }, [selectedFiles]);

  // Fungsi toggle user yang dibutuhkan oleh CommandItem
  const toggleUser = (userId) => {
    setSelectedUsers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId],
    );
  };

  if (!isOpen) return null;

  // Best Practice: Tambahkan parameter keepOpen untuk membedakan fungsi Create biasa & Create Again
  const onSubmit = (data, keepOpen = false) => {
    // Kalkulasi logic persentase otomatis
    let finalProgress = data.progress_percentage || 0;

    if (data.type === "quantity") {
      const curr = parseFloat(data.current_amount) || 0;
      const tgt = parseFloat(data.target_amount) || 1;
      finalProgress = Math.min(100, Math.round((curr / tgt) * 100));
    } else if (data.type === "checklist") {
      finalProgress = columnId === "done" ? 100 : 0;
    }

    // Menggunakan FormData agar bisa mengirim File
    const formData = new FormData();

    // Data Induk Todo
    formData.append("date", formatDateDb(start));

    selectedUsers.forEach((id, index) => {
      formData.append(`users[${index}]`, id);
    });

    // Data Item (karena Laravel expect array of items)
    formData.append("items[0][task_name]", data.task_name);
    formData.append("items[0][status]", columnId || "pending");
    formData.append("items[0][type]", data.type);
    formData.append("items[0][progress_percentage]", finalProgress);

    // Memastikan due_date dan approve_status hanya ada di dalam items
    if (data.due_date) {
      formData.append("items[0][due_date]", formatDateDb(data.due_date));
    }

    formData.append(
      "items[0][approve_status]",
      Number(user?.role_id) === 1
        ? "approved"
        : data.approve_status || "pending",
    );

    if (data.reason) {
      if (Number(user?.role_id) === 1) {
        formData.append("items[0][note]", data.reason);
      }
      formData.append("items[0][reason]", data.reason);
    }
    if (data.type === "quantity") {
      formData.append("items[0][target_amount]", data.target_amount);
      formData.append("items[0][current_amount]", data.current_amount);
    }
    if (data.link_url) formData.append("items[0][link_url]", data.link_url);

    if (Array.isArray(data.files) && data.files.length > 0) {
      data.files.forEach((file, index) => {
        if (file instanceof File) {
          formData.append(`items[0][files][${index}]`, file);
        }
      });
    } else if (data.file instanceof File) {
      formData.append("items[0][file]", data.file);
    }

    selectedUsers.forEach((id, index) => {
      formData.append(`items[0][assigned_users][${index}]`, id);
    });

    toast.promise(
      new Promise((resolve, reject) => {
        // mutate dipanggil menggunakan formData
        mutate(formData, {
          onSuccess: (res) => {
            onSuccess?.();
            if (Number(user?.role_id) === 1 && selectedUsers.length > 0) {
              sendNotification({
                title: "Tugas Baru Ditugaskan",
                message: `Anda ditugaskan: ${data.task_name}`,
                type: "todo.assign",
                data: { task_name: data.task_name, due_date: data.due_date },
                recipients: selectedUsers.map((id) => ({ type: "user", id })),
              });
            }

            if (keepOpen) {
              reset();
              setSelectedUsers([]);
              setAttachmentTab("file");
            } else {
              onClose();
            }
            resolve();
          },
          onError: (err) => {
            const msg =
              err?.response?.data?.message || "Gagal membuat task baru";
            reject(msg);
          },
        });
      }),
      {
        loading: "Menyimpan tugas...",
        success: "Tugas berhasil ditambahkan!",
        error: (msg) => msg,
      },
    );
  };

  // Label Status Dinamis
  const getStatusBadge = () => {
    switch (columnId) {
      case "pending":
        return (
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-100 text-red-700 text-xs font-bold">
            <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div> To Do
          </span>
        );
      case "on_progress":
        return (
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-bold">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div> In
            Progress
          </span>
        );
      case "done":
        return (
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-bold">
            <CheckCircle2 size={12} /> Done
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-900/50 backdrop-blur-sm p-4 transition-all duration-300">
      {/* BEST PRACTICE RESPONSIVE & MENCEGAH OVERFLOW: 
        1. max-h-[90vh] membatasi tinggi container 90% dari layar
        2. flex flex-col menyusun layout header, body, footer agar terbagi rapi
      */}
      <div className="w-full max-w-[550px] max-h-[90vh] flex flex-col rounded-[20px] bg-white shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* HEADER MODAL - flex-none agar tidak menciut saat layar kecil */}
        <div className="flex-none flex items-center justify-between px-6 py-5 border-b border-gray-100 bg-gray-50/50">
          <div>
            <h2 className="text-[18px] font-bold text-gray-800 leading-none mb-1.5">
              Create New Task
            </h2>
            <div className="flex items-center gap-2 text-xs font-medium text-gray-500">
              <CalendarDays size={14} />
              <span>{formatDateDb(start)}</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {getStatusBadge()}
            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 hover:bg-gray-200 hover:text-gray-600 transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* BODY MODAL (FORM) - flex-1 & overflow-y-auto agar bisa discroll secara mandiri jika konten kepanjangan */}
        <form
          id="taskForm"
          onSubmit={handleSubmit((data) => onSubmit(data, false))}
          className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar"
        >
          {/* NAMA TASK */}
          <div>
            <label className="flex items-center text-[13px] font-bold text-gray-700 mb-1.5">
              <Bubbles size={14} className="mr-1.5 text-gray-500" />
              Nama Task <span className="text-red-500 ml-1">*</span>
            </label>
            <input
              autoFocus
              type="text"
              {...register("task_name", { required: true })}
              placeholder="Contoh: Buat laporan leads hari ini..."
              className={`w-full rounded-xl border ${
                errors.task_name
                  ? "border-red-300 focus:ring-red-500"
                  : "border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              } px-4 py-3 text-sm text-gray-800 focus:outline-none focus:ring-1 transition-all shadow-sm`}
            />
            {errors.task_name && (
              <p className="text-red-500 text-xs mt-1 font-medium">
                Nama task wajib diisi.
              </p>
            )}
            <p className="text-[11px] text-gray-400 mt-1.5 font-medium flex justify-end">
              {taskName?.length || 0} karakter
            </p>
          </div>

          {Number(user?.role_id) === 1 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-[13px] font-bold flex items-center gap-1.5 text-gray-700">
                  <Users size={14} className="text-gray-500" />
                  Penerima Pesan
                </Label>
                {selectedUsers.length > 0 && (
                  <span className="text-[11px] text-blue-700 font-bold bg-blue-50 border border-blue-100 px-2.5 py-1 rounded-md">
                    {selectedUsers.length} dipilih
                  </span>
                )}
              </div>

              <Popover open={openCombobox} onOpenChange={setOpenCombobox}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={openCombobox}
                    className={cn(
                      `w-full justify-between h-11 px-4 rounded-xl bg-white! shadow-sm border ${
                        errors.task_name
                          ? "border-red-300 focus:ring-red-500"
                          : "border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                      }`,
                      selectedUsers.length === 0 && "text-gray-400 font-normal",
                      selectedUsers.length > 0 && "text-gray-800",
                    )}
                  >
                    <span className="flex items-center gap-2 truncate">
                      {selectedUsers.length > 0 ? (
                        <div className="flex -space-x-2 overflow-hidden">
                          {selectedUsers.slice(0, 5).map((id) => {
                            const userObj = users.find((u) => u.id === id);
                            return (
                              <Avatar
                                key={id}
                                className="inline-block size-6 ring-2 ring-white"
                              >
                                <AvatarImage
                                  src={resolveImageUrl(userObj?.avatar)}
                                  alt={userObj?.name}
                                />
                                <AvatarFallback className="text-[9px] text-blue-600 bg-blue-50">
                                  {getInitials(userObj?.name)}
                                </AvatarFallback>
                              </Avatar>
                            );
                          })}
                          {selectedUsers.length > 5 && (
                            <div className="flex items-center justify-center size-6 rounded-full ring-2 ring-white text-[9px] font-medium text-gray-600 bg-gray-100">
                              +{selectedUsers.length - 5}
                            </div>
                          )}
                        </div>
                      ) : (
                        <>
                          <UserPlus className="w-4 h-4" />
                          Pilih anggota tim...
                        </>
                      )}
                    </span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 text-gray-500" />
                  </Button>
                </PopoverTrigger>

                <PopoverContent
                  className="w-[400px] p-0 border-gray-200 rounded-xl shadow-xl bg-white"
                  align="start"
                >
                  <Command className="bg-transparent">
                    <CommandInput
                      placeholder="Cari nama atau role..."
                      className="border-none focus:ring-0 text-gray-800"
                    />
                    <CommandList className="max-h-[220px] overflow-y-auto p-1 custom-scrollbar">
                      <CommandEmpty className="py-6 text-center text-sm text-gray-500">
                        User tidak ditemukan.
                      </CommandEmpty>
                      <CommandGroup
                        heading="Daftar User"
                        className="text-gray-500 font-medium"
                      >
                        {users.map((userObj) => {
                          const isSelected = selectedUsers.includes(userObj.id);
                          return (
                            <CommandItem
                              key={userObj.id}
                              value={userObj.name}
                              onSelect={() => toggleUser(userObj.id)}
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
                                  src={resolveImageUrl(userObj.avatar)}
                                  alt={userObj.name}
                                />
                                <AvatarFallback className="text-xs bg-blue-50 text-blue-600">
                                  {getInitials(userObj.name)}
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
                                  {userObj.name}
                                </span>
                                <span className="text-xs text-gray-500 truncate">
                                  {userObj.role?.name || "No Role"}
                                </span>
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
              {selectedUsers.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {selectedUsers.map((id) => {
                    const userObj = users.find((u) => u.id === id);
                    if (!userObj) return null;
                    return (
                      <Badge
                        key={id}
                        variant="secondary"
                        className="pl-1 pr-2 py-1 gap-2 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 shadow-sm transition-colors rounded-lg font-medium"
                      >
                        <Avatar className="h-5 w-5">
                          <AvatarImage
                            src={userObj.avatar}
                            alt={userObj.name}
                          />
                          <AvatarFallback className="text-[9px] bg-blue-50 text-blue-600">
                            {getInitials(userObj.name)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-xs">{userObj.name}</span>
                        <X
                          className="h-3.5 w-3.5 cursor-pointer text-gray-400 hover:text-red-500 transition-colors ml-auto"
                          onClick={() => toggleUser(id)}
                        />
                      </Badge>
                    );
                  })}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-lg px-2"
                    onClick={() => setSelectedUsers([])}
                  >
                    Clear All
                  </Button>
                </div>
              )}
            </div>
          )}

          <div>
            <label className="flex items-center text-[13px] font-bold text-gray-700 mb-1.5">
              <Bubbles size={14} className="mr-1.5 text-gray-500" />
              Tanggal Selesai <span className="text-red-500 ml-1">*</span>
            </label>
            <DatePicker
              required={true}
              placeholder="Pilih tanggal selesai..."
              label=""
              onChange={(date) => setValue("due_date", date)}
              className="w-full"
              inputClassName="bg-white! text-gray-700"
            />
            {errors.due_date && (
              <p className="text-red-500 text-xs mt-1 font-medium">
                Tanggal selesai wajib diisi.
              </p>
            )}
          </div>

          {/* TIPE TASK (RADIO CARDS) */}
          <div>
            <label className="flex items-center text-[13px] font-bold text-gray-700 mb-2">
              <Layers size={14} className="mr-1.5 text-gray-500" />
              Pilih Tipe Task
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Card Quantity */}
              <label
                className={`cursor-pointer flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${
                  taskType === "quantity"
                    ? "border-blue-500 bg-blue-50/50"
                    : "border-gray-100 hover:border-gray-200 bg-white"
                }`}
              >
                <input
                  type="radio"
                  value="quantity"
                  {...register("type")}
                  className="hidden"
                />
                <Target
                  size={20}
                  className={
                    taskType === "quantity"
                      ? "text-blue-600 mb-1.5"
                      : "text-gray-400 mb-1.5"
                  }
                />
                <span
                  className={`text-xs font-bold ${
                    taskType === "quantity" ? "text-blue-700" : "text-gray-500"
                  }`}
                >
                  Quantity
                </span>
              </label>

              {/* Card Progress */}
              <label
                className={`cursor-pointer flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${
                  taskType === "progress"
                    ? "border-blue-500 bg-blue-50/50"
                    : "border-gray-100 hover:border-gray-200 bg-white"
                }`}
              >
                <input
                  type="radio"
                  value="progress"
                  {...register("type")}
                  className="hidden"
                />
                <AlignLeft
                  size={20}
                  className={
                    taskType === "progress"
                      ? "text-blue-600 mb-1.5"
                      : "text-gray-400 mb-1.5"
                  }
                />
                <span
                  className={`text-xs font-bold ${
                    taskType === "progress" ? "text-blue-700" : "text-gray-500"
                  }`}
                >
                  Progress
                </span>
              </label>

              {/* Card Checklist */}
              <label
                className={`cursor-pointer flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${
                  taskType === "checklist"
                    ? "border-blue-500 bg-blue-50/50"
                    : "border-gray-100 hover:border-gray-200 bg-white"
                }`}
              >
                <input
                  type="radio"
                  value="checklist"
                  {...register("type")}
                  className="hidden"
                />
                <CheckCircle2
                  size={20}
                  className={
                    taskType === "checklist"
                      ? "text-blue-600 mb-1.5"
                      : "text-gray-400 mb-1.5"
                  }
                />
                <span
                  className={`text-xs font-bold ${
                    taskType === "checklist" ? "text-blue-700" : "text-gray-500"
                  }`}
                >
                  Checklist
                </span>
              </label>
            </div>
          </div>

          {/* DYNAMIC FIELDS BERDASARKAN TIPE */}
          <div className="bg-gray-50/50 rounded-xl p-4 border border-gray-100/80">
            {taskType === "quantity" && (
              <div className="flex flex-col sm:flex-row gap-4 animate-in fade-in slide-in-from-bottom-2 duration-200">
                <div className="flex-1">
                  <label className="flex items-center text-xs font-bold text-gray-700 mb-1.5">
                    <Target size={14} className="mr-1.5 text-gray-500" />
                    Target Quantity <span className="text-red-500 ml-1">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    {...register("target_amount", { required: true, min: 0.1 })}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-sm bg-white text-gray-800"
                  />
                  {errors.target_amount && (
                    <p className="text-red-500 text-[10px] mt-1 font-medium">
                      Harap isi target yang valid.
                    </p>
                  )}
                </div>

                <div className="flex-1">
                  <label className="flex items-center text-xs font-bold text-gray-700 mb-1.5">
                    <TrendingUp size={14} className="mr-1.5 text-gray-500" />
                    Sudah Tercapai
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    {...register("current_amount")}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-sm bg-white text-gray-800"
                  />
                </div>
              </div>
            )}

            {taskType === "progress" && (
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-200">
                <label className="flex items-center text-xs font-bold text-gray-700 mb-1.5 justify-between w-full">
                  <div className="flex items-center">
                    <Percent size={14} className="mr-1.5 text-gray-500" />
                    Progress Awal (%)
                  </div>
                  <span className="text-blue-600">
                    {watch("progress_percentage") || 0}%
                  </span>
                </label>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    {...register("progress_percentage")}
                    className="w-full h-2 rounded-lg appearance-none cursor-pointer accent-blue-600 bg-white"
                  />
                  <input
                    type="number"
                    min="0"
                    max="100"
                    {...register("progress_percentage")}
                    className="w-16 rounded-lg border border-gray-300 px-2 py-1.5 text-sm text-center focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white text-gray-800"
                  />
                </div>
              </div>
            )}

            {taskType === "checklist" && (
              <div className="flex items-center gap-3 py-2 animate-in fade-in duration-200">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-orange-100 text-orange-600">
                  <CheckCircle2 size={20} />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-800">
                    Tugas Ceklis Singkat
                  </p>
                  <p className="text-xs text-gray-500 font-medium">
                    Tugas ini akan langsung 100% jika dipindah ke Done.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* LAMPIRAN (FILE / URL) */}
          <div>
            <label className="flex items-center text-[13px] font-bold text-gray-700 mb-1.5">
              <Paperclip size={14} className="mr-1.5 text-gray-500" />
              Lampiran (Opsional)
            </label>
            <div className="bg-gray-50/50 rounded-xl p-4 border border-gray-100/80">
              {/* Tab Navigasi Lampiran */}
              <div className="flex gap-1 mb-4 p-1 bg-gray-200/50 rounded-lg w-fit">
                <button
                  type="button"
                  onClick={() => setAttachmentTab("file")}
                  className={cn(
                    "px-4 py-1.5 text-xs font-bold rounded-md transition-all",
                    attachmentTab === "file"
                      ? "bg-white text-gray-800 shadow-sm"
                      : "text-gray-500 hover:text-gray-700",
                  )}
                >
                  Upload File
                </button>
                <button
                  type="button"
                  onClick={() => setAttachmentTab("url")}
                  className={cn(
                    "px-4 py-1.5 text-xs font-bold rounded-md transition-all",
                    attachmentTab === "url"
                      ? "bg-white text-gray-800 shadow-sm"
                      : "text-gray-500 hover:text-gray-700",
                  )}
                >
                  Tautan (URL)
                </button>
              </div>

              {/* Tab Content: File Upload */}
              {attachmentTab === "file" && (
                <div className="animate-in fade-in duration-200">
                  <input
                    type="file"
                    multiple
                    onChange={(e) => {
                      if (e.target.files && e.target.files.length > 0) {
                        const files = Array.from(e.target.files);
                        setValue("files", files);
                        setValue("file", files[0]);
                      } else {
                        setValue("files", []);
                        setValue("file", null);
                      }
                    }}
                    className="w-full text-sm text-gray-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 border border-gray-300 rounded-xl cursor-pointer bg-white transition-all focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  {Array.isArray(selectedFiles) && selectedFiles.length > 0 ? (
                    <div className="mt-3 rounded-xl border border-gray-200 bg-white overflow-hidden">
                      <div className="px-3 py-2 border-b border-gray-100 flex items-center justify-between">
                        <div className="text-[11px] font-bold text-gray-700">
                          {selectedFiles.length} file dipilih
                        </div>
                        <div className="text-[11px] text-gray-500 font-mono">
                          {formatBytes(
                            selectedFiles.reduce(
                              (sum, f) => sum + (Number(f?.size) || 0),
                              0,
                            ),
                          )}
                        </div>
                      </div>
                      <div className="max-h-[160px] overflow-auto divide-y divide-gray-100">
                        {selectedFiles.map((file, idx) => {
                          const isImg = String(file?.type || "").startsWith(
                            "image/",
                          );
                          const previewUrl =
                            Array.isArray(selectedFilePreviews) &&
                            selectedFilePreviews[idx]
                              ? selectedFilePreviews[idx]
                              : null;
                          const fileLabel = getFileLabel(file);
                          return (
                            <div
                              key={`${file?.name || "file"}-${idx}`}
                              className="px-3 py-2 flex items-center gap-3"
                            >
                              <div className="w-[110px] h-[80px] rounded-lg bg-gray-50 border border-gray-200 overflow-hidden shrink-0 flex items-center justify-center">
                                {isImg && previewUrl ? (
                                  <img
                                    src={previewUrl}
                                    alt={file?.name || "image"}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full flex flex-col items-center justify-center gap-1">
                                    <div className="text-[10px] font-bold text-gray-700">
                                      {fileLabel}
                                    </div>
                                    <div className="text-gray-500">
                                      <FileText size={16} />
                                    </div>
                                  </div>
                                )}
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="text-[12px] font-semibold text-gray-800 truncate">
                                  {file?.name || "Untitled"}
                                </div>
                                <div className="text-[10px] text-gray-500 font-mono">
                                  {formatBytes(file?.size || 0)}
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => removeSelectedFile(idx)}
                                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-800 transition-colors"
                                aria-label="Hapus file"
                              >
                                <X size={16} />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : null}
                  <p className="text-[10px] text-gray-400 mt-2">
                    Bisa pilih banyak file sekaligus. Format didukung: JPG, PNG,
                    PDF, DOCX, XLSX (Max 10MB/file)
                  </p>
                </div>
              )}

              {/* Tab Content: Link URL */}
              {attachmentTab === "url" && (
                <div className="animate-in fade-in duration-200">
                  <input
                    type="url"
                    {...register("link_url")}
                    placeholder="https://contoh-link-dokumen.com/..."
                    className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm text-gray-800 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-sm bg-white"
                  />
                  <p className="text-[10px] text-gray-400 mt-2">
                    Pastikan tautan dapat diakses oleh publik atau anggota tim.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* REASON / KETERANGAN */}
          <div>
            <label className="flex items-center text-[13px] font-bold text-gray-700 mb-1.5">
              <MessageSquare size={14} className="mr-1.5 text-gray-500" />
              Alasan / Keterangan Tambahan
            </label>
            <textarea
              {...register("reason")}
              placeholder="Tambahkan catatan khusus untuk tugas ini..."
              onKeyDown={(e) => {
                if (e.key === "Enter" && e.ctrlKey) return;
                if (e.key === "Enter") {
                  e.preventDefault();
                  e.currentTarget.blur();
                }
              }}
              className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm text-gray-800 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 min-h-[90px] resize-none shadow-sm bg-white"
            />
          </div>
        </form>

        {/* FOOTER ACTION - flex-none agar tetap ada di bagian paling bawah layar */}
        <div className="flex-none px-6 py-4 bg-gray-50 border-t border-gray-100 flex flex-wrap items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl text-sm font-bold text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 hover:text-gray-800 transition-colors shadow-sm"
          >
            Batalkan
          </button>

          {/* BEST PRACTICE: Menyisipkan argumen kedua (true) ke onSubmit agar modal tidak tertutup setelah sukses */}
          <button
            type="button"
            onClick={handleSubmit((data) => onSubmit(data, true))}
            disabled={isPending}
            className="px-5 py-2.5 rounded-xl text-sm font-bold text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 hover:text-gray-800 disabled:opacity-70 transition-colors shadow-sm"
          >
            Create & Create Again
          </button>

          <button
            type="submit"
            form="taskForm" // Mengarah ke id tag form di atas
            disabled={isPending}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-70 disabled:cursor-not-allowed transition-all shadow-sm shadow-blue-200 active:scale-95"
          >
            {isPending ? (
              <>
                <svg
                  className="animate-spin h-4 w-4 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Menyimpan...
              </>
            ) : (
              "Create Task"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
