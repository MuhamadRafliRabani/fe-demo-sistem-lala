import {
  X,
  AlignLeft,
  Calendar,
  Paperclip,
  Trash2,
  Check,
  Circle,
  Plus,
  CheckSquare,
  MoreHorizontal,
  Image as ImageIcon,
  FileText,
  Eye,
  ChevronDown,
  ExternalLink,
  MessageSquare,
  Download,
  Tag,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";

import { DatePicker } from "@/components/date-picker";
import { formatDateDb } from "@/lib/date-format-db";
import { toTitleCase } from "@/lib/to-title-case";
import { resolveImageUrl } from "@/lib/resolve-image-url";
import { downloadFile } from "@/lib/download-file";
import { usePost, usePut, useRemove } from "@/hooks/use-api-mutation";
import { useApiFetch } from "@/hooks/use-api-fetch";
import { useTodoComments } from "@/hooks/use-todo-comments";
import { useAuthStore } from "@/hooks/auth-store";
import useCloudflareUpload from "@/hooks/useCloudflareUpload";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import LabelPicker from "../components/label-picker";
import { formatDate } from "@/lib/date-format";

const THEME = {
  primary: "#135a86",
  card: "#22272b",
  secondary: "#fed818",
};

const DEFAULT_LABELS = [
  { id: "l1", text: "EASY", color: "bg-[#4bce97]" },
  { id: "l2", text: "MEDIUM", color: "bg-[#f5cd47]" },
  { id: "l3", text: "HARD", color: "bg-[#f87168]" },
  { id: "l4", text: "VERY HARD", color: "bg-[#c9372c]" },
  { id: "l5", text: "MANDATORY", color: "bg-[#579dff]" },
];

const isImageFile = (v = "") => /\.(jpg|jpeg|png|gif|webp)$/i.test(v);
const toCapitalizeWords = (v = "") =>
  String(v)
    .split("\n")
    .map((line) =>
      line
        .replace(/[ \t]+/g, " ")
        .trimStart()
        .replace(/\b\w/g, (c) => c.toUpperCase()),
    )
    .join("\n");

const formatBytes = (bytes) => {
  const n = typeof bytes === "number" ? bytes : Number(bytes);
  if (!Number.isFinite(n) || n <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const idx = Math.min(
    units.length - 1,
    Math.floor(Math.log(n) / Math.log(1024)),
  );
  const val = n / 1024 ** idx;
  return `${idx === 0 ? Math.round(val) : Math.round(val * 10) / 10} ${units[idx]}`;
};

const getFileExtLabel = (file) => {
  const name = String(file?.name || "");
  return (
    (name.includes(".") ? name.split(".").pop() : "").trim().toUpperCase() ||
    "FILE"
  );
};

const getDomain = (url) => {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
};

const checklistProgress = (items = []) => {
  if (!items.length) return 0;
  return Math.round(
    (items.filter((i) => i.is_done).length / items.length) * 100,
  );
};

function UserAvatar({
  src,
  name = "U",
  size = 8,
  bgColor = "#579dff",
  textColor = "#1d2125",
}) {
  const initial = String(name).charAt(0).toUpperCase();
  const dim = `w-${size} h-${size}`;
  return src ? (
    <img
      src={resolveImageUrl(src)}
      alt={name}
      className={`${dim} rounded-full object-cover shrink-0`}
    />
  ) : (
    <div
      className={`${dim} rounded-full flex items-center justify-center shrink-0 font-bold`}
      style={{
        backgroundColor: bgColor,
        color: textColor,
        fontSize: size <= 6 ? 10 : 14,
      }}
    >
      {initial}
    </div>
  );
}

function FileThumbnail({ src, label, className = "w-[110px] h-[80px]" }) {
  return (
    <div
      className={`${className} bg-[#1d2125] rounded border border-[#a6c5e229] overflow-hidden shrink-0 flex items-center justify-center text-xs text-[#b6c2cf] font-bold`}
    >
      {src ? (
        <img src={src} alt="preview" className="w-full h-full object-cover" />
      ) : (
        <div className="flex flex-col items-center justify-center gap-1 w-full h-full">
          <span className="text-[10px] font-bold text-[#b6c2cf]">
            {label || "FILE"}
          </span>
          <FileText size={16} className="text-[#9fadbc]" />
        </div>
      )}
    </div>
  );
}

function ProgressBar({ percent }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-[11px] text-[#9fadbc] w-6">{percent}%</span>
      <div className="flex-1 h-2 bg-[#091e420f] rounded-full overflow-hidden border border-[#a6c5e229]">
        <div
          className="h-full transition-all duration-300"
          style={{
            width: `${percent}%`,
            backgroundColor: percent === 100 ? "#4bce97" : THEME.primary,
          }}
        />
      </div>
    </div>
  );
}

export const EditTaskModal = ({
  isOpen,
  onClose,
  task,
  mutate,
  isPending,
  updateLocalTask,
  refreshKanban,
}) => {
  const [isMounted, setIsMounted] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isLabelPickerOpen, setIsLabelPickerOpen] = useState(false);
  const [isAttachOpen, setIsAttachOpen] = useState(false);
  const [isAssigneeOpen, setIsAssigneeOpen] = useState(false);

  const [assigneeSearch, setAssigneeSearch] = useState("");
  const [attachmentLinkInput, setAttachmentLinkInput] = useState("");
  const [commentInput, setCommentInput] = useState("");

  const [savedLabels, setSavedLabels] = useState(DEFAULT_LABELS);
  const [checklists, setChecklists] = useState([]);
  const [attachments, setAttachments] = useState([]);

  const [formData, setFormData] = useState({
    task_name: "",
    reason: "",
    due_date: null,
    label: "",
    link_url: "",
    file: null,
    remove_evidence: false,
  });

  const [checklistTitleEdits, setChecklistTitleEdits] = useState({});
  const [editingChecklistItemKey, setEditingChecklistItemKey] = useState(null);
  const [checklistItemEdits, setChecklistItemEdits] = useState({});
  const [newItemTexts, setNewItemTexts] = useState({});
  const [showChecklistComposer, setShowChecklistComposer] = useState({});

  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editingCommentText, setEditingCommentText] = useState("");
  const [replyToCommentId, setReplyToCommentId] = useState(null);
  const [isSendingComment, setIsSendingComment] = useState(false);

  const { upload: uploadToCloudflare, isUploading: isUploadingToCloudflare } =
    useCloudflareUpload();

  const attachRef = useRef(null);
  const initializingRef = useRef(false);
  const initializedTaskIdRef = useRef(null);
  const debounceRef = useRef(null);

  const authState = useAuthStore((state) => state || {});
  const user = authState?.user || null;
  const isAdmin = Number(user?.role_id) === 1;

  const { data: usersData } = useApiFetch(
    [["users"]],
    "/users",
    { paginate: 100, filter: { status: "active" } },
    isAdmin && isOpen,
  );

  const userList = usersData?.data?.data || [];
  const filteredUsers = userList.filter(
    (u) =>
      u.id !== 1 &&
      u.id !== 11 &&
      u.name.toLowerCase().includes(assigneeSearch.toLowerCase()),
  );

  // UBAH SEMUA URL HOOK API KE /work-tasks/...
  const { mutate: createChecklist } = usePost(
    () => `/work-tasks/${task?.id}/checklists`,
    { invalidate: [["work-tasks"]] },
  );
  const { mutate: removeChecklist } = useRemove(
    (p) => `/work-tasks/${task?.id}/checklists/${p.checklistId}`,
    { invalidate: [["work-tasks"]] },
  );
  const { mutate: updateChecklist } = usePut(
    (p) => `/work-tasks/${task?.id}/checklists/${p.checklistId}`,
    { invalidate: [["work-tasks"]] },
  );
  const { mutate: createChecklistItem } = usePost(
    (p) => `/work-tasks/${task?.id}/checklists/${p.checklistId}/items`,
    { invalidate: [["work-tasks"]] },
  );
  const { mutate: updateChecklistItem } = usePut(
    (p) =>
      `/work-tasks/${task?.id}/checklists/${p.checklistId}/items/${p.itemId}`,
    { invalidate: [["work-tasks"]] },
  );
  const { mutate: removeChecklistItem } = useRemove(
    (p) =>
      `/work-tasks/${task?.id}/checklists/${p.checklistId}/items/${p.itemId}`,
    { invalidate: [["work-tasks"]] },
  );

  const { mutate: addAttachment, isPending: isAttaching } = usePost(
    () => `/work-tasks/${task?.id}/attachments`,
    { invalidate: [["work-tasks"]] },
  );
  const { mutate: removeAttachment } = useRemove(
    (p) => `/work-tasks/${task?.id}/attachments/${p.attachmentId}`,
    { invalidate: [["work-tasks"]] },
  );

  const { mutate: deleteTodoItem } = useRemove(
    () => `/work-tasks/${task?.id}`,
    { invalidate: [["work-tasks"]] },
  );

  const { mutate: updateComment } = usePut(
    (p) => `/work-tasks/${task?.id}/comments/${p.commentId}`,
  );
  const { mutate: deleteComment } = useRemove(
    (p) => `/work-tasks/${task?.id}/comments/${p.commentId}`,
  );

  // Catatan: Pastikan hook ini juga mengakses API endpoint yang sesuai dengan sistem baru
  const {
    comments,
    addComment,
    refetch: refetchComments,
  } = useTodoComments(task?.id, { enabled: isOpen && !!task?.id });

  useEffect(() => {
    setIsMounted(true);
    const stored = localStorage.getItem("trello_custom_labels");
    if (stored) setSavedLabels(JSON.parse(stored));
  }, []);

  useEffect(() => {
    localStorage.setItem("trello_custom_labels", JSON.stringify(savedLabels));
  }, [savedLabels]);

  useEffect(() => {
    if (!isOpen || !task?.id) return;
    if (initializedTaskIdRef.current === task.id) return;

    initializedTaskIdRef.current = task.id;
    initializingRef.current = true;

    setFormData({
      task_name: task.task_name || "",
      reason: task.reason || task.description || "",
      due_date: task.due_date ? new Date(task.due_date) : null,
      label: task.label || "",
      link_url: task.link_url || task.url || "",
      file: null,
      remove_evidence: false,
    });
    setChecklists(task.checklists || []);
    setChecklistTitleEdits(
      (task.checklists || []).reduce(
        (acc, c) => ({ ...acc, [c.id]: c.title || "Checklist" }),
        {},
      ),
    );

    const hasNewAttachments = task.attachments?.length > 0;
    setAttachments(
      hasNewAttachments
        ? task.attachments
        : [
            ...(task.file
              ? [
                  {
                    id: `legacy-file-${task.id}`,
                    type: "file",
                    file_path: task.file,
                    original_name: String(task.file).split("/").pop(),
                    is_legacy: true,
                  },
                ]
              : []),
            ...(task.link_url || task.url
              ? [
                  {
                    id: `legacy-link-${task.id}`,
                    type: "link",
                    link_url: task.link_url || task.url,
                    is_legacy: true,
                  },
                ]
              : []),
          ],
    );

    setAttachmentLinkInput("");
    setShowChecklistComposer({});
    setReplyToCommentId(null);

    const t = setTimeout(() => {
      initializingRef.current = false;
    }, 50);
    return () => clearTimeout(t);
  }, [isOpen, task?.id]);

  useEffect(() => {
    if (isOpen) return;
    initializedTaskIdRef.current = null;
    initializingRef.current = false;
  }, [isOpen]);

  useEffect(() => {
    const handler = (e) => {
      if (attachRef.current && !attachRef.current.contains(e.target))
        setIsAttachOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    if (!isOpen || !task?.id || initializingRef.current) return;
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      saveTodoItem(
        {
          task_name: formData.task_name,
          reason: formData.reason,
          link_url: formData.link_url,
        },
        { silent: true },
      );
    }, 650);
    return () => clearTimeout(debounceRef.current);
  }, [
    formData.task_name,
    formData.reason,
    formData.link_url,
    isOpen,
    task?.id,
  ]);

  const saveTodoItem = (partial, options = {}) => {
    if (!task?.id) return;
    const merged = { ...formData, ...partial };

    // PAYLOAD DIUBAH AGAR SESUAI DENGAN API BARU (WorkTaskController@update)
    const payload = {
      id: String(task.id),
      task_name: merged.task_name || "",
      description: merged.reason || "", // API BARU MINTA 'description', BUKAN 'reason'
      label: merged.label || "",
      status: partial.status || task.status,
      link_url: merged.link_url || "",
    };

    if (partial.target_user_id) payload.user_id = partial.target_user_id;
    if (merged.due_date) payload.due_date = formatDateDb(merged.due_date);
    else if (Object.prototype.hasOwnProperty.call(partial, "due_date"))
      payload.due_date = null;
    if (Object.prototype.hasOwnProperty.call(partial, "approve_status"))
      payload.approve_status = partial.approve_status;
    if (partial.remove_evidence) payload.remove_evidence = true;

    mutate(payload, {
      onSuccess: (res) => {
        const nextDueDate = merged.due_date
          ? formatDateDb(merged.due_date)
          : null;
        const nextApproveStatus = Object.prototype.hasOwnProperty.call(
          partial,
          "approve_status",
        )
          ? partial.approve_status
          : task?.approve_status;
        const currentLink = task?.link_url || task?.url || "";
        const isSame =
          (task?.task_name || "") === (merged.task_name || "") &&
          (task?.reason || "") === (merged.reason || "") &&
          (task?.label || "") === (merged.label || "") &&
          currentLink === (merged.link_url || "") &&
          (task?.due_date || null) === nextDueDate &&
          (task?.approve_status || null) === (nextApproveStatus || null) &&
          !partial.remove_evidence;

        const returned = res?.data || res;
        if (!isSame || returned) {
          updateLocalTask({
            ...task,
            task_name: returned?.task_name || merged.task_name,
            reason: merged.reason,
            label: merged.label,
            due_date: returned?.due_date || nextDueDate,
            status: returned?.status || task?.status,
            approve_status: returned?.approve_status || nextApproveStatus,
            url: merged.link_url,
            link_url: merged.link_url,
            file: partial.remove_evidence ? null : task?.file,
          });
        }
        if (options.successMessage) toast.success(options.successMessage);
        options.onSuccess?.();
      },
      onError: (err) => {
        if (!options.silent)
          toast.error(
            err?.response?.data?.message || "Gagal menyimpan perubahan",
          );
      },
    });
  };

  const handleToggleLabel = (value) => {
    setFormData((prev) => ({ ...prev, label: value }));
    saveTodoItem({ label: value });
  };

  const handleStatusChange = (newStatus) => {
    if (!updateLocalTask || !mutate) return;
    updateLocalTask({ ...task, status: newStatus });
    mutate(
      { id: task.id, status: newStatus },
      { onError: () => updateLocalTask(task) },
    );
  };

  const handleDeleteTodo = () => {
    deleteTodoItem({ todoId: task?.id || "" }, { onSuccess: onClose });
  };

  const handleSetApproveStatus = (nextStatus) => {
    if (!isAdmin || !task?.id) return;
    saveTodoItem(
      { approve_status: nextStatus },
      {
        successMessage: `Status diubah menjadi ${nextStatus}`,
        onSuccess: () => {
          updateLocalTask({ ...task, approve_status: nextStatus });
          onClose();
        },
      },
    );
  };

  const handleUploadAndSaveFiles = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setIsAttachOpen(false);

    const uploadProcess = async () => {
      const cfResults = [];
      for (const file of files) {
        const result = await uploadToCloudflare(file);
        cfResults.push(result);
      }
      const cloudflarePayload = cfResults.map((res) => ({
        key: res.key,
        filename: res.filename,
        size: res.size,
        mime_type: res.mime_type,
        cloudflare_url: res.cloudflare_url,
      }));

      return new Promise((resolve, reject) => {
        addAttachment(
          { cloudflare_attachments: cloudflarePayload },
          {
            onSuccess: (res) => {
              setAttachments((prev) => [...prev, ...(res?.data || [])]);
              resolve(res);
            },
            onError: (err) => reject(err),
          },
        );
      });
    };

    toast.promise(uploadProcess(), {
      loading: `Mengunggah ${files.length} file ke Cloudflare...`,
      success: `Berhasil menyimpan ${files.length} file!`,
      error: "Gagal mengunggah file ke Cloudflare",
    });

    e.target.value = null;
  };

  const handleAddLinkAttachment = () => {
    const link = attachmentLinkInput.trim();
    if (!link) return;
    addAttachment(
      { link_urls: [link] },
      {
        onSuccess: (res) => {
          setAttachments((prev) => [...prev, ...(res?.data || [])]);
          setAttachmentLinkInput("");
          setIsAttachOpen(false);
          toast.success("Link berhasil ditambahkan");
        },
        onError: (err) =>
          toast.error(err?.response?.data?.message || "Gagal menambah link"),
      },
    );
  };

  const handleDeleteAttachment = (attachment) => {
    if (attachment.is_legacy) {
      if (attachment.type === "file") {
        setFormData((prev) => ({ ...prev, file: null, remove_evidence: true }));
        saveTodoItem({ remove_evidence: true });
      } else {
        setFormData((prev) => ({ ...prev, link_url: "" }));
        saveTodoItem({ link_url: "" });
      }
      setAttachments((prev) => prev.filter((a) => a.id !== attachment.id));
      return;
    }
    removeAttachment(
      { attachmentId: attachment.id },
      {
        onSuccess: () =>
          setAttachments((prev) => prev.filter((a) => a.id !== attachment.id)),
      },
    );
  };

  const downloadFromUrl = async (url, filename) => {
    const response = await fetch(url);
    if (!response.ok) throw new Error("Network response was not ok");
    const blob = await response.blob();
    const blobUrl = window.URL.createObjectURL(blob);
    const link = Object.assign(document.createElement("a"), {
      href: blobUrl,
      download: filename || "download",
    });
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(blobUrl);
  };

  const handleDownloadAttachment = async (attachment) => {
    if (attachment.type === "link") {
      window.open(attachment.link_url, "_blank", "noopener,noreferrer");
      return;
    }
    if (attachment.type !== "file") return;
    if (attachment.storage_type === "cloudflare") {
      if (!attachment.download_url) return;
      toast.info(`Menyiapkan unduhan: ${attachment.original_name}`);
      try {
        await downloadFromUrl(
          attachment.download_url,
          attachment.original_name,
        );
      } catch (error) {
        console.error("Download failed, opening in new tab instead.", error);
        window.open(attachment.download_url, "_blank");
      }
      return;
    }

    if (!attachment.file_path) return;
    try {
      const name =
        attachment.original_name ??
        String(attachment.file_path).split("/").pop();
      await downloadFile(
        `/download?path=${encodeURIComponent(attachment.file_path)}`,
        name,
      );
    } catch {
      toast.error("Gagal mendownload file");
    }
  };

  const handleCreateChecklist = () => {
    createChecklist(
      { title: "Checklist" },
      {
        onSuccess: (res) => {
          const created = res?.data || res;
          setChecklists((prev) => [
            ...prev,
            { ...created, items: created.items || [] },
          ]);
          setChecklistTitleEdits((prev) => ({
            ...prev,
            [created.id]: created.title || "Checklist",
          }));
        },
        onError: (err) =>
          toast.error(
            err?.response?.data?.message || "Gagal menambah checklist",
          ),
      },
    );
  };
  const handleUpdateChecklistTitle = (checklistId) => {
    const title = (checklistTitleEdits[checklistId] || "").trim();
    if (!title) {
      toast.error("Judul checklist wajib diisi");
      return;
    }
    updateChecklist(
      { checklistId, title },
      {
        onSuccess: () =>
          setChecklists((prev) =>
            prev.map((c) => (c.id === checklistId ? { ...c, title } : c)),
          ),
      },
    );
  };
  const handleAddChecklistItem = (checklistId) => {
    const content = (newItemTexts[checklistId] || "").trim();
    if (!content) return;
    createChecklistItem(
      { checklistId, content },
      {
        onSuccess: (res) => {
          const created = res?.data || res;
          setChecklists((prev) =>
            prev.map((c) =>
              c.id !== checklistId
                ? c
                : { ...c, items: [...(c.items || []), created] },
            ),
          );
          setNewItemTexts((prev) => ({ ...prev, [checklistId]: "" }));
          setShowChecklistComposer((prev) => ({
            ...prev,
            [checklistId]: false,
          }));
        },
      },
    );
  };
  const startEditChecklistItem = (checklistId, item) => {
    const key = `${checklistId}:${item.id}`;
    setEditingChecklistItemKey(key);
    setChecklistItemEdits((prev) => ({ ...prev, [key]: item.content ?? "" }));
  };
  const cancelEditChecklistItem = () => setEditingChecklistItemKey(null);
  const saveEditChecklistItem = (checklistId, item) => {
    const key = `${checklistId}:${item.id}`;
    const next = String(checklistItemEdits[key] ?? "").trim();
    const previous = String(item.content ?? "").trim();
    if (!next) {
      toast.error("Item checklist tidak boleh kosong");
      setChecklistItemEdits((prev) => ({ ...prev, [key]: previous }));
      return;
    }
    if (next === previous) {
      setEditingChecklistItemKey(null);
      return;
    }
    updateChecklistItem(
      { checklistId, itemId: item.id, content: next },
      {
        onSuccess: () => {
          setChecklists((prev) =>
            prev.map((c) =>
              c.id !== checklistId
                ? c
                : {
                    ...c,
                    items: (c.items || []).map((it) =>
                      it.id === item.id ? { ...it, content: next } : it,
                    ),
                  },
            ),
          );
          setEditingChecklistItemKey(null);
        },
      },
    );
  };
  const handleSendComment = () => {
    const message = commentInput.trim();
    if (!message) return;
    setIsSendingComment(true);
    addComment(
      { message, parent_id: replyToCommentId || undefined },
      {
        onSuccess: () => {
          setCommentInput("");
          setReplyToCommentId(null);
          refetchComments();
          setIsSendingComment(false);
          toast.success("Komentar terkirim");
        },
        onError: (err) => {
          toast.error(
            err?.response?.data?.message || "Gagal mengirim komentar",
          );
          setIsSendingComment(false);
        },
      },
    );
  };
  const handleSaveEditComment = (commentId) => {
    const message = editingCommentText.trim();
    if (!message) {
      setEditingCommentId(null);
      return;
    }
    updateComment(
      { commentId, message },
      {
        onSuccess: () => {
          setEditingCommentId(null);
          refetchComments();
        },
        onError: (err) =>
          toast.error(
            err?.response?.data?.message || "Gagal mengubah komentar",
          ),
      },
    );
  };
  const handleDeleteComment = (commentId) => {
    deleteComment(
      { commentId },
      {
        onSuccess: refetchComments,
        onError: (err) =>
          toast.error(
            err?.response?.data?.message || "Gagal menghapus komentar",
          ),
      },
    );
  };

  const openCommentPanelWithMention = (mentionText) => {
    setCommentInput((prev) => {
      if (!prev.trim()) return mentionText;
      if (prev.includes(mentionText)) return prev;
      return `${prev}\n${mentionText}`;
    });
  };

  const renderMessageWithMentions = (message = "") =>
    message.split(/(@[a-zA-Z0-9._-]+)/g).map((part, idx) =>
      /^@[a-zA-Z0-9._-]+$/.test(part) ? (
        <span key={idx} className="text-[#6cc3e0] font-semibold">
          {part}
        </span>
      ) : (
        <span key={idx}>{part}</span>
      ),
    );

  const selectedLabelObj = savedLabels.find(
    (l) => l.text.toLowerCase() === formData.label.toLowerCase(),
  );
  const fileAttachments = useMemo(
    () => attachments.filter((a) => a.type === "file"),
    [attachments],
  );
  const coverAttachment = fileAttachments[0] || null;
  const coverPath = coverAttachment?.file_path
    ? resolveImageUrl(coverAttachment.file_path)
    : "";
  const hasImageCover = Boolean(coverPath) && isImageFile(coverPath);
  const topLevelComments = useMemo(
    () => comments.filter((c) => !c.parent_id),
    [comments],
  );
  const repliesByParentId = useMemo(
    () =>
      comments.reduce((acc, c) => {
        if (!c.parent_id) return acc;
        acc[c.parent_id] = [...(acc[c.parent_id] || []), c];
        return acc;
      }, {}),
    [comments],
  );

  const ADD_ITEMS = [
    {
      icon: Tag,
      label: "Labels",
      desc: "Organize, categorize",
      action: () => {
        setIsAddOpen(false);
        setIsLabelPickerOpen(true);
      },
    },
    {
      icon: CheckSquare,
      label: "Checklist",
      desc: "Add subtasks",
      action: () => {
        setIsAddOpen(false);
        handleCreateChecklist();
      },
    },
    {
      icon: Paperclip,
      label: "Attachment",
      desc: "Add files or links",
      action: () => {
        setIsAddOpen(false);
        setIsAttachOpen(true);
      },
    },
  ];

  if (!isMounted || !isOpen || !task?.id) return null;

  return createPortal(
    <div className="fixed inset-0 z-110 flex items-center justify-center bg-black/75 p-4 sm:p-8 backdrop-blur-[1px] transition-all duration-300">
      <div
        className="w-full max-w-[1040px] h-[90vh] sm:h-[85vh] flex flex-col rounded-xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200 relative border border-[#a6c5e229]"
        style={{ backgroundColor: THEME.card }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── TOP BAR ────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-[#a6c5e229] bg-[#22272b]">
          <Popover open={isAssigneeOpen} onOpenChange={setIsAssigneeOpen}>
            <PopoverTrigger asChild>
              <button className="flex items-center gap-1.5 rounded px-3 py-1.5 text-[12px] font-semibold text-[#b6c2cf] bg-[#a6c5e214] hover:bg-[#a6c5e229] transition-colors uppercase">
                {task.user_name
                  ? toTitleCase(task.user_name.split(" ")[0])
                  : task.todo_user?.name || "UNASSIGNED"}
                <ChevronDown size={14} />
              </button>
            </PopoverTrigger>
            {isAdmin && (
              <PopoverContent
                className="w-[280px] p-0 bg-[#282e33] border-[#363430] shadow-xl rounded-lg"
                align="start"
              >
                <div className="flex flex-col p-3 gap-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-[#b6c2cf] mx-auto">
                      Assignee
                    </span>
                    <X
                      size={14}
                      className="cursor-pointer text-[#9fadbc] absolute right-3"
                      onClick={() => setIsAssigneeOpen(false)}
                    />
                  </div>
                  <input
                    type="text"
                    placeholder="Search user..."
                    value={assigneeSearch}
                    onChange={(e) => setAssigneeSearch(e.target.value)}
                    className="w-full bg-[#22272b] border border-[#363430] rounded px-2.5 py-1.5 text-xs text-[#b6c2cf] focus:outline-none focus:border-[#579dff]"
                  />
                  <div className="flex flex-col gap-1 mt-2 max-h-[200px] overflow-y-auto custom-scrollbar">
                    {filteredUsers.map((u) => {
                      const isSelected = task.todo_user?.id === u.id;
                      return (
                        <div
                          key={u.id}
                          className="flex items-center gap-2 group cursor-pointer hover:bg-[#a6c5e214] p-1.5 rounded"
                          onClick={() => {
                            if (isSelected) return;
                            saveTodoItem(
                              { target_user_id: u.id },
                              {
                                successMessage: "Berhasil memindahkan tugas",
                                onSuccess: () => {
                                  setIsAssigneeOpen(false);
                                  onClose();
                                  if (refreshKanban)
                                    setTimeout(refreshKanban, 100);
                                },
                              },
                            );
                          }}
                        >
                          <div className="w-6 h-6 rounded-full overflow-hidden shrink-0">
                            <UserAvatar src={u.avatar} name={u.name} size={6} />
                          </div>
                          <div className="flex-1 min-w-0 flex items-center justify-between">
                            <span className="text-[12px] font-semibold text-[#b6c2cf] truncate">
                              {u.name}
                            </span>
                            {isSelected && (
                              <Check size={14} className="text-[#579dff]" />
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </PopoverContent>
            )}
          </Popover>

          <div className="flex items-center gap-1.5 text-[#9fadbc]">
            <button className="p-2 rounded hover:bg-[#a6c5e214] hover:text-[#b6c2cf] transition-colors">
              <ImageIcon size={18} />
            </button>
            <button className="p-2 rounded hover:bg-[#a6c5e214] hover:text-[#b6c2cf] transition-colors">
              <Eye size={18} />
            </button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="p-2 rounded hover:bg-[#a6c5e214] hover:text-[#b6c2cf] transition-colors">
                  <MoreHorizontal size={18} />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="z-[9999]" align="end">
                <DropdownMenuLabel className="text-[12px] text-[#9fadbc]">
                  Approval
                </DropdownMenuLabel>
                <DropdownMenuRadioGroup
                  value={task?.approve_status || "pending"}
                  onValueChange={handleSetApproveStatus}
                >
                  <DropdownMenuRadioItem value="approved">
                    Approve
                  </DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="rejected">
                    Reject
                  </DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="pending">
                    Req Approve
                  </DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
                <DropdownMenuSeparator />
                {isAdmin && (
                  <>
                    <DropdownMenuLabel className="text-[12px] text-[#9fadbc]">
                      Status Pengerjaan
                    </DropdownMenuLabel>
                    <DropdownMenuRadioGroup
                      value={task?.status || "pending"}
                      onValueChange={handleStatusChange}
                    >
                      <DropdownMenuRadioItem value="pending">
                        Pending
                      </DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="on_progress">
                        On Progress
                      </DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="done">
                        Done
                      </DropdownMenuRadioItem>
                    </DropdownMenuRadioGroup>
                    <DropdownMenuSeparator />
                  </>
                )}
                <DropdownMenuItem
                  variant="destructive"
                  onClick={handleDeleteTodo}
                >
                  <Trash2 className="h-4 w-4" /> Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <button
              onClick={onClose}
              className="p-2 rounded hover:bg-[#a6c5e214] hover:text-[#b6c2cf] transition-colors ml-2"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* ── MAIN LAYOUT (two-column) ────────────────────────────────────── */}
        <div className="flex flex-1 md:flex-row flex-col max-sm:h-full overflow-hidden bg-[#22272b]">
          {/* ── LEFT COLUMN ──────────────────────────────────────────────── */}
          <div className="flex-[2] flex flex-col overflow-y-auto custom-scrollbar relative">
            {hasImageCover && (
              <div className="w-full h-[160px] bg-[#1d2125] relative shrink-0 group border-b border-[#a6c5e229]">
                <img
                  src={coverPath}
                  alt="Cover"
                  className="w-full h-full object-cover"
                />
                <button
                  onClick={() =>
                    coverAttachment && handleDeleteAttachment(coverAttachment)
                  }
                  className="absolute bottom-3 right-3 bg-[#22272b]/80 hover:bg-[#22272b] text-[#b6c2cf] px-3 py-1.5 text-xs font-semibold rounded shadow opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  Remove cover
                </button>
              </div>
            )}

            <div className="p-6 pb-12 flex flex-col gap-8">
              {/* ── 1. Title, Actions & Labels ─────────────────────────── */}
              <div className="flex items-start gap-3 sm:gap-4 w-full">
                <div className="w-6 sm:w-8 shrink-0 flex justify-center mt-1.5 text-[#9fadbc]">
                  <Circle size={24} strokeWidth={2} />
                </div>
                <div className="flex-1 min-w-0 flex flex-col">
                  <textarea
                    value={formData.task_name}
                    onChange={(e) =>
                      setFormData((p) => ({
                        ...p,
                        task_name: toCapitalizeWords(e.target.value),
                      }))
                    }
                    onInput={(e) => {
                      e.target.style.height = "auto";
                      e.target.style.height = e.target.scrollHeight + "px";
                    }}
                    rows={1}
                    className="w-full bg-transparent text-[24px] font-bold text-[#b6c2cf] rounded py-1 px-2 -ml-2 focus:bg-[#282e33] focus:text-[#fffdf5] focus:outline-none focus:ring-2 focus:ring-[#579dff] resize-none overflow-hidden transition-all uppercase leading-tight"
                  />
                  <div className="text-[14px] text-[#9fadbc] mt-1 px-1">
                    in list{" "}
                    <span className="underline decoration-transparent hover:decoration-current cursor-pointer">
                      {toTitleCase(
                        task.status === "on_progress"
                          ? "On Progress"
                          : "Completed",
                      )}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 mt-4 ml-1">
                    <Popover open={isAddOpen} onOpenChange={setIsAddOpen}>
                      <PopoverTrigger asChild>
                        <button className="h-8 inline-flex items-center gap-1.5 px-3 bg-[#a6c5e214] hover:bg-[#a6c5e229] rounded-[4px] text-[13px] font-semibold text-[#b6c2cf] transition-colors">
                          <Plus size={14} /> Add
                        </button>
                      </PopoverTrigger>
                      <PopoverContent
                        align="start"
                        sideOffset={8}
                        className="w-[304px] p-0 bg-[#282e33] border-[#384148] shadow-2xl rounded-[4px]"
                      >
                        <div className="relative flex items-center justify-center h-10 px-8">
                          <h2 className="text-[14px] font-semibold text-[#9fadbc]">
                            Add to card
                          </h2>
                          <button
                            onClick={() => setIsAddOpen(false)}
                            className="absolute right-2 text-[#9fadbc] hover:text-[#b6c2cf] p-1"
                          >
                            <X size={16} />
                          </button>
                        </div>
                        <div className="p-3 pt-0 flex flex-col gap-1">
                          {ADD_ITEMS.map((item) => (
                            <button
                              key={item.label}
                              onClick={item.action}
                              className="group flex items-start gap-3 w-full p-2 rounded-[4px] hover:bg-[#a6c5e214] transition-colors text-left"
                            >
                              <div className="mt-0.5 flex items-center justify-center w-8 h-8 rounded-[4px] bg-[#22272b] border border-[#384148] text-[#9fadbc] group-hover:text-[#b6c2cf]">
                                <item.icon size={16} />
                              </div>
                              <div className="flex flex-col">
                                <span className="text-[14px] font-medium text-[#b6c2cf]">
                                  {item.label}
                                </span>
                                <span className="text-[12px] text-[#8c9bab] leading-tight">
                                  {item.desc}
                                </span>
                              </div>
                            </button>
                          ))}
                        </div>
                      </PopoverContent>
                    </Popover>

                    <div className="relative">
                      <DatePicker
                        value={formData.due_date}
                        onChange={(date) => {
                          setFormData((p) => ({ ...p, due_date: date }));
                          saveTodoItem({ due_date: date });
                        }}
                        inputClassName="flex items-center gap-1.5 px-3 pl-8 bg-[#a6c5e214] hover:bg-[#a6c5e229] rounded-[4px] text-[13px] font-semibold text-[#b6c2cf] transition-colors border-none shadow-none h-8 cursor-pointer"
                        placeholder="Dates"
                        disabled={!isAdmin}
                        label=""
                      />
                      <Calendar
                        size={14}
                        className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#b6c2cf] pointer-events-none z-10"
                      />
                    </div>

                    <button
                      onClick={handleCreateChecklist}
                      className="h-8 inline-flex items-center gap-1.5 px-3 bg-[#a6c5e214] hover:bg-[#a6c5e229] rounded-[4px] text-[13px] font-semibold text-[#b6c2cf] transition-colors"
                    >
                      <CheckSquare size={14} /> Checklist
                    </button>

                    <div className="relative" ref={attachRef}>
                      <button
                        onClick={() => setIsAttachOpen((p) => !p)}
                        className="h-8 inline-flex items-center gap-1.5 px-3 bg-[#a6c5e214] hover:bg-[#a6c5e229] rounded-[4px] text-[13px] font-semibold text-[#b6c2cf] transition-colors"
                      >
                        <Paperclip size={14} /> Attachment
                      </button>
                      {isAttachOpen && (
                        <div className="absolute top-full mt-2 -left-full w-[280px] bg-[#282e33] border border-[#363430] rounded-lg shadow-2xl overflow-hidden z-[1000]">
                          <div className="flex items-center justify-between border-b border-[#363430] px-4 py-3">
                            <h4 className="text-[12px] font-bold text-[#b6c2cf] mx-auto">
                              Attach
                            </h4>
                            <button
                              onClick={() => setIsAttachOpen(false)}
                              className="absolute right-3 text-[#9fadbc] hover:text-[#fffdf5]"
                            >
                              <X size={16} />
                            </button>
                          </div>
                          <div className="p-3 flex flex-col gap-3">
                            <label className="flex items-center justify-center w-full bg-[#a6c5e214] hover:bg-[#a6c5e229] border border-dashed border-[#a6c5e229] rounded py-2 cursor-pointer transition-colors text-[13px] font-semibold text-[#b6c2cf]">
                              {isUploadingToCloudflare
                                ? "Uploading..."
                                : "Choose files..."}
                              <input
                                type="file"
                                multiple
                                className="hidden"
                                disabled={
                                  isUploadingToCloudflare || isAttaching
                                }
                                onChange={handleUploadAndSaveFiles}
                              />
                            </label>
                            <div className="h-px w-full bg-[#363430]" />
                            <div className="flex gap-2">
                              <input
                                type="text"
                                placeholder="Paste a link here..."
                                value={attachmentLinkInput}
                                onChange={(e) =>
                                  setAttachmentLinkInput(e.target.value)
                                }
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    e.preventDefault();
                                    handleAddLinkAttachment();
                                  }
                                }}
                                className="flex-1 bg-[#1d2125] border border-[#a6c5e229] rounded px-3 py-2 text-[13px] text-[#b6c2cf] focus:outline-none focus:border-[#579dff]"
                              />
                              <button
                                onClick={handleAddLinkAttachment}
                                disabled={
                                  isAttaching || !attachmentLinkInput.trim()
                                }
                                className="px-3 py-2 rounded bg-[#579dff] hover:bg-[#85b8ff] text-[#1d2125] text-[12px] font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {isAttaching ? "Adding..." : "Add"}
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Labels Section */}
                  <div className="mt-6 flex flex-col gap-2 ml-1">
                    <span className="text-[12px] font-semibold text-[#9fadbc] leading-none">
                      Labels
                    </span>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      {formData.label && selectedLabelObj && (
                        <LabelPicker
                          labels={savedLabels}
                          value={formData.label}
                          onChange={handleToggleLabel}
                          customTrigger={
                            <div
                              className={`h-8 px-3 rounded flex items-center text-[12px] font-bold text-[#1d2125] cursor-pointer hover:opacity-80 transition-opacity ${selectedLabelObj.color}`}
                            >
                              {formData.label.toUpperCase()}
                            </div>
                          }
                        />
                      )}
                      <LabelPicker
                        labels={savedLabels}
                        value={formData.label}
                        onChange={handleToggleLabel}
                        open={isLabelPickerOpen}
                        onOpenChange={setIsLabelPickerOpen}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* ── 2. Description ─────────────────────────────────────── */}
              <div className="flex items-start gap-3 sm:gap-4 w-full mt-4">
                <div className="w-6 sm:w-8 shrink-0 flex justify-center mt-1 text-[#9fadbc]">
                  <AlignLeft size={24} />
                </div>
                <div className="flex-1 min-w-0 flex flex-col gap-3">
                  <h3 className="text-[16px] font-semibold text-[#b6c2cf]">
                    Description
                  </h3>
                  <textarea
                    value={formData.reason}
                    onChange={(e) =>
                      setFormData((p) => ({
                        ...p,
                        reason: toCapitalizeWords(e.target.value),
                      }))
                    }
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.ctrlKey) {
                        e.preventDefault();
                        e.currentTarget.blur();
                      }
                    }}
                    placeholder="Add a more detailed description..."
                    className="w-full bg-[#a6c5e214] hover:bg-[#a6c5e229] border-none rounded-[4px] px-3.5 py-2.5 text-[14px] text-[#b6c2cf] placeholder-[#9fadbc] focus:outline-none focus:bg-[#282e33] focus:ring-2 focus:ring-[#579dff] min-h-[100px] transition-colors resize-y custom-scrollbar"
                  />
                </div>
              </div>

              {/* ── 3. Attachments List ─────────────────────────────────── */}
              {attachments.length > 0 && (
                <div className="flex items-start gap-3 sm:gap-4 w-full mt-4">
                  <div className="w-6 sm:w-8 shrink-0 flex justify-center mt-1 text-[#9fadbc]">
                    <Paperclip size={24} />
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col gap-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-[16px] font-semibold text-[#b6c2cf]">
                        Attachments
                      </h3>
                      <button
                        onClick={() => setIsAttachOpen(true)}
                        className="px-3 py-1.5 bg-[#a6c5e214] hover:bg-[#a6c5e229] rounded-[4px] text-[13px] font-medium text-[#b6c2cf] transition-colors"
                      >
                        Add
                      </button>
                    </div>
                    <div className="flex flex-col gap-2">
                      {attachments.map((attachment) => {
                        const fileName =
                          attachment.original_name ||
                          String(
                            attachment.file_path ||
                              attachment.link_url ||
                              "attachment",
                          )
                            .split("/")
                            .pop();
                        const fileLabel = String(fileName)
                          .split(".")
                          .pop()
                          ?.trim()
                          ?.toUpperCase();
                        const previewSrc =
                          attachment.type === "file" && attachment.file_path
                            ? resolveImageUrl(attachment.file_path)
                            : "";
                        const showImage =
                          attachment.type === "file" && isImageFile(previewSrc);
                        return (
                          <div
                            key={attachment.id}
                            className="flex items-center gap-4 hover:bg-[#a6c5e214] p-2 rounded transition-colors group relative"
                          >
                            {attachment.type === "file" ? (
                              <FileThumbnail
                                src={showImage ? previewSrc : null}
                                label={fileLabel}
                              />
                            ) : (
                              <div className="w-[110px] h-[80px] bg-[#1d2125] rounded border border-[#a6c5e229] flex items-center justify-center text-xs text-[#b6c2cf] font-bold shrink-0">
                                LINK
                              </div>
                            )}
                            <div className="flex flex-col min-w-0 flex-1">
                              {attachment.type === "link" ? (
                                <a
                                  href={attachment.link_url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-[14px] font-bold text-[#b6c2cf] hover:underline flex items-center gap-2 truncate"
                                >
                                  {getDomain(attachment.link_url)}{" "}
                                  <ExternalLink size={12} />
                                </a>
                              ) : (
                                <span className="text-[14px] font-bold text-[#b6c2cf] truncate">
                                  {fileName}
                                </span>
                              )}
                              <span className="text-[13px] text-[#9fadbc] mt-1 truncate">
                                {attachment.type === "link"
                                  ? attachment.link_url
                                  : fileName}
                              </span>
                            </div>
                            <div className="absolute right-4 top-1/2 -translate-y-1/2">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <button className="p-2 bg-[#1d2125] hover:bg-[#2c333a] rounded text-[#b6c2cf] hover:text-white transition-opacity opacity-0 group-hover:opacity-100 data-[state=open]:opacity-100">
                                    <MoreHorizontal size={16} />
                                  </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent
                                  align="end"
                                  className="w-40 bg-[#282e33] border-[#363430] z-[9999]"
                                >
                                  <DropdownMenuItem
                                    onSelect={() =>
                                      handleDownloadAttachment(attachment)
                                    }
                                    className="text-[#b6c2cf] hover:bg-[#a6c5e214] cursor-pointer"
                                  >
                                    <Download size={14} className="mr-2" />{" "}
                                    Download
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onSelect={() =>
                                      openCommentPanelWithMention(
                                        `@${toTitleCase(task.user_name || "team")} cek attachment: ${fileName}`,
                                      )
                                    }
                                    className="text-[#b6c2cf] hover:bg-[#a6c5e214] cursor-pointer"
                                  >
                                    <MessageSquare size={14} className="mr-2" />{" "}
                                    Comment
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onSelect={() =>
                                      handleDeleteAttachment(attachment)
                                    }
                                    className="text-[#f87168] focus:text-[#f87168] hover:bg-[#a6c5e214] cursor-pointer focus:bg-[#f87168]/10"
                                  >
                                    <Trash2 size={14} className="mr-2" /> Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* ── 4. Checklists ──────────────────────────────────────── */}
              {checklists.map((checklist) => (
                <div
                  key={checklist.id}
                  className="flex items-start gap-3 sm:gap-4 w-full mt-2"
                >
                  <div className="w-6 sm:w-8 shrink-0 flex justify-center mt-1 text-[#9fadbc]">
                    <CheckSquare size={24} />
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col gap-3">
                    <div className="flex justify-between items-center">
                      <input
                        value={
                          checklistTitleEdits[checklist.id] ??
                          checklist.title ??
                          ""
                        }
                        onChange={(e) =>
                          setChecklistTitleEdits((p) => ({
                            ...p,
                            [checklist.id]: e.target.value,
                          }))
                        }
                        onBlur={() => handleUpdateChecklistTitle(checklist.id)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleUpdateChecklistTitle(checklist.id);
                          }
                        }}
                        className="flex-1 bg-transparent text-[16px] font-semibold text-[#b6c2cf] uppercase border border-transparent focus:border-[#a6c5e229] focus:bg-[#282e33] focus:outline-none rounded px-2 -ml-2 transition-colors"
                      />
                      <button
                        onClick={() =>
                          removeChecklist(
                            { checklistId: checklist.id },
                            {
                              onSuccess: () =>
                                setChecklists((p) =>
                                  p.filter((c) => c.id !== checklist.id),
                                ),
                            },
                          )
                        }
                        className="px-3 py-1.5 bg-[#a6c5e214] hover:bg-[#a6c5e229] rounded-[4px] text-[13px] font-medium text-[#b6c2cf] transition-colors ml-2 shrink-0"
                      >
                        Delete
                      </button>
                    </div>
                    <ProgressBar percent={checklistProgress(checklist.items)} />
                    <div className="flex flex-col gap-1 mt-1">
                      {checklist.items?.map((item) => {
                        const editKey = `${checklist.id}:${item.id}`;
                        const isEditing = editingChecklistItemKey === editKey;
                        return (
                          <div
                            key={item.id}
                            className="group flex items-start gap-3 p-1.5 rounded hover:bg-[#a6c5e214] transition-colors"
                          >
                            <button
                              onClick={() =>
                                updateChecklistItem(
                                  {
                                    checklistId: checklist.id,
                                    itemId: item.id,
                                    is_done: !item.is_done,
                                  },
                                  {
                                    onSuccess: () =>
                                      setChecklists((p) =>
                                        p.map((c) =>
                                          c.id !== checklist.id
                                            ? c
                                            : {
                                                ...c,
                                                items: c.items.map((it) =>
                                                  it.id === item.id
                                                    ? {
                                                        ...it,
                                                        is_done: !it.is_done,
                                                      }
                                                    : it,
                                                ),
                                              },
                                        ),
                                      ),
                                  },
                                )
                              }
                              className={`w-[18px] h-[18px] mt-0.5 rounded-[3px] border flex items-center justify-center shrink-0 cursor-pointer transition-colors ${item.is_done ? "bg-[#4bce97] border-[#4bce97]" : "border-[#a6c5e229] hover:border-[#579dff] bg-[#fafbfc]"}`}
                            >
                              {item.is_done && (
                                <Check size={13} className="text-[#1d2125]" />
                              )}
                            </button>
                            {isEditing ? (
                              <input
                                autoFocus
                                value={checklistItemEdits[editKey] ?? ""}
                                onChange={(e) =>
                                  setChecklistItemEdits((p) => ({
                                    ...p,
                                    [editKey]: e.target.value,
                                  }))
                                }
                                onBlur={() =>
                                  saveEditChecklistItem(checklist.id, item)
                                }
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    e.preventDefault();
                                    saveEditChecklistItem(checklist.id, item);
                                  }
                                  if (e.key === "Escape") {
                                    e.preventDefault();
                                    cancelEditChecklistItem();
                                  }
                                }}
                                className="flex-1 bg-[#282e33] border border-[#a6c5e229] rounded px-2 py-1 text-[14px] text-[#b6c2cf] focus:outline-none focus:border-[#579dff]"
                              />
                            ) : (
                              <span
                                onClick={() =>
                                  startEditChecklistItem(checklist.id, item)
                                }
                                className={`text-[14px] flex-1 leading-snug cursor-pointer ${item.is_done ? "text-[#9fadbc] line-through" : "text-[#b6c2cf]"}`}
                              >
                                {item.content}
                              </span>
                            )}
                            <button
                              onClick={() =>
                                removeChecklistItem(
                                  {
                                    checklistId: checklist.id,
                                    itemId: item.id,
                                  },
                                  {
                                    onSuccess: () =>
                                      setChecklists((p) =>
                                        p.map((c) =>
                                          c.id !== checklist.id
                                            ? c
                                            : {
                                                ...c,
                                                items: c.items.filter(
                                                  (it) => it.id !== item.id,
                                                ),
                                              },
                                        ),
                                      ),
                                  },
                                )
                              }
                              className="p-1 rounded text-[#9fadbc] opacity-0 group-hover:opacity-100 hover:text-[#f87168] hover:bg-[#a6c5e229] transition-all"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                    {showChecklistComposer[checklist.id] ? (
                      <div className="flex gap-2 mt-2">
                        <input
                          type="text"
                          placeholder="Add an item"
                          value={newItemTexts[checklist.id] || ""}
                          onChange={(e) =>
                            setNewItemTexts((p) => ({
                              ...p,
                              [checklist.id]: e.target.value,
                            }))
                          }
                          onKeyDown={(e) => {
                            if (e.key === "Enter")
                              handleAddChecklistItem(checklist.id);
                          }}
                          className="flex-1 bg-[#a6c5e214] hover:bg-[#a6c5e229] border-none rounded-[4px] px-3.5 py-2 text-[14px] text-[#b6c2cf] placeholder-[#9fadbc] focus:outline-none focus:bg-[#282e33] focus:ring-2 focus:ring-[#579dff] transition-colors"
                        />
                        <button
                          onClick={() => handleAddChecklistItem(checklist.id)}
                          className="px-4 py-2 bg-[#579dff] hover:bg-[#85b8ff] text-[#1d2125] font-bold text-[14px] rounded-[4px] transition-colors shrink-0"
                        >
                          Add
                        </button>
                        <button
                          onClick={() =>
                            setShowChecklistComposer((p) => ({
                              ...p,
                              [checklist.id]: false,
                            }))
                          }
                          className="px-3 py-2 bg-[#a6c5e214] hover:bg-[#a6c5e229] text-[#b6c2cf] font-semibold text-[13px] rounded-[4px]"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() =>
                          setShowChecklistComposer((p) => ({
                            ...p,
                            [checklist.id]: true,
                          }))
                        }
                        className="mt-2 w-fit px-3 py-1.5 bg-[#a6c5e214] hover:bg-[#a6c5e229] rounded-[4px] text-[13px] font-medium text-[#b6c2cf] transition-colors"
                      >
                        + Tambah item
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── RIGHT COLUMN — Comments ───────────────────────────────────── */}
          <div className="w-full md:w-[350px] bg-[#22272b] flex flex-col shrink-0 border-l border-[#a6c5e229]">
            <div className="px-5 py-4 flex items-center justify-between">
              <h3 className="text-[15px] font-semibold text-[#b6c2cf] flex items-center gap-2">
                <MessageSquare size={18} /> Comments and activity
              </h3>
            </div>
            <div className="flex-1 px-5 pb-5 overflow-y-auto custom-scrollbar flex flex-col">
              <div className="flex gap-3 mt-1">
                <UserAvatar src={user?.avatar} name={user?.name} />
                <div className="flex-1">
                  {replyToCommentId && (
                    <div className="mb-2 px-2 py-1 rounded bg-[#a6c5e214] text-[11px] text-[#9fadbc] flex items-center justify-between">
                      Replying to comment #{replyToCommentId}
                      <button
                        onClick={() => setReplyToCommentId(null)}
                        className="text-[#b6c2cf] hover:text-[#fffdf5]"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                  <textarea
                    value={commentInput}
                    onChange={(e) => setCommentInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSendComment();
                      }
                    }}
                    placeholder="Write a comment..."
                    className="w-full bg-[#22272b] rounded-[4px] border border-[#a6c5e229] p-2.5 text-[14px] text-[#b6c2cf] placeholder-[#9fadbc] focus:outline-none focus:ring-2 focus:ring-[#579dff] min-h-[72px] resize-none"
                  />
                  <div className="mt-2 flex justify-end">
                    <button
                      onClick={handleSendComment}
                      disabled={!commentInput.trim() || isSendingComment}
                      className="px-3 py-1.5 bg-[#579dff] hover:bg-[#85b8ff] text-[#1d2125] font-bold text-[12px] rounded-[4px] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {isSendingComment ? "Saving..." : "Save"}
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-3 mt-5">
                {!comments?.length && (
                  <div className="text-[12px] text-[#9fadbc] bg-[#282e33] border border-[#a6c5e229] rounded-[4px] p-3">
                    Belum ada komentar.
                  </div>
                )}
                {topLevelComments.map((comment) => (
                  <div key={comment.id} className="flex gap-3 items-start">
                    <UserAvatar
                      src={comment.created_by_avatar}
                      name={comment.created_by_name}
                      bgColor="#9f8fef"
                      textColor="#fff"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] font-bold text-[#b6c2cf]">
                        {comment.created_by_name || "User"}
                        <span className="text-[11px] font-normal text-[#9fadbc] ml-2">
                          {comment.created_at
                            ? new Date(comment.created_at).toLocaleString(
                                "id-ID",
                              )
                            : "-"}
                          {comment.updated_at &&
                            comment.updated_at !== comment.created_at && (
                              <span className="italic ml-1">
                                (diedit{" "}
                                {new Date(comment.updated_at).toLocaleString(
                                  "id-ID",
                                )}
                                )
                              </span>
                            )}
                        </span>
                      </div>
                      {editingCommentId === comment.id ? (
                        <div className="mt-1.5 flex flex-col gap-2">
                          <textarea
                            autoFocus
                            value={editingCommentText}
                            onChange={(e) =>
                              setEditingCommentText(e.target.value)
                            }
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault();
                                handleSaveEditComment(comment.id);
                              }
                              if (e.key === "Escape") setEditingCommentId(null);
                            }}
                            className="w-full bg-[#1d2125] rounded border border-[#a6c5e229] p-2 text-[13px] text-[#fffdf5] focus:outline-none focus:border-[#579dff] resize-none"
                          />
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleSaveEditComment(comment.id)}
                              className="px-3 py-1 bg-[#579dff] hover:bg-[#85b8ff] text-[#1d2125] font-bold text-[11px] rounded"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setEditingCommentId(null)}
                              className="text-[11px] text-[#9fadbc] hover:text-[#fffdf5]"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-[#282e33] rounded-[4px] border border-[#a6c5e229] p-2.5 text-[13px] text-[#fffdf5] mt-1.5 whitespace-pre-wrap break-words">
                          {renderMessageWithMentions(comment.message)}
                        </div>
                      )}
                      <div className="mt-1 flex items-center gap-3">
                        <button
                          onClick={() => {
                            setReplyToCommentId(comment.id);
                            setCommentInput(
                              `@${comment.created_by_name || "User"} `,
                            );
                          }}
                          className="text-[11px] text-[#9fadbc] hover:text-[#b6c2cf] underline"
                        >
                          Reply
                        </button>
                        {(isAdmin || comment.created_by === user?.id) && (
                          <>
                            <button
                              onClick={() => {
                                setEditingCommentId(comment.id);
                                setEditingCommentText(comment.message);
                              }}
                              className="text-[11px] text-[#9fadbc] hover:text-[#b6c2cf] underline"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteComment(comment.id)}
                              className="text-[11px] text-[#9fadbc] hover:text-[#f87168] underline"
                            >
                              Delete
                            </button>
                          </>
                        )}
                      </div>
                      {(repliesByParentId[comment.id] || []).map((reply) => (
                        <div key={reply.id} className="flex gap-2 mt-2 ml-2">
                          <UserAvatar
                            src={reply.created_by_avatar}
                            name={reply.created_by_name}
                            size={6}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="text-[12px] font-semibold text-[#b6c2cf]">
                              {reply.created_by_name || "User"}
                              <span className="text-[10px] font-normal text-[#9fadbc] ml-2">
                                {reply.created_at
                                  ? new Date(reply.created_at).toLocaleString(
                                      "id-ID",
                                    )
                                  : "-"}
                                {reply.updated_at &&
                                  reply.updated_at !== reply.created_at && (
                                    <span className="italic ml-1">
                                      (diedit{" "}
                                      {new Date(
                                        reply.updated_at,
                                      ).toLocaleString("id-ID")}
                                      )
                                    </span>
                                  )}
                              </span>
                            </div>
                            {editingCommentId === reply.id ? (
                              <div className="mt-1 flex flex-col gap-2">
                                <textarea
                                  autoFocus
                                  value={editingCommentText}
                                  onChange={(e) =>
                                    setEditingCommentText(e.target.value)
                                  }
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter" && !e.shiftKey) {
                                      e.preventDefault();
                                      handleSaveEditComment(reply.id);
                                    }
                                    if (e.key === "Escape")
                                      setEditingCommentId(null);
                                  }}
                                  className="w-full bg-[#1d2125] rounded border border-[#a6c5e229] p-2 text-[12px] text-[#fffdf5] focus:outline-none focus:border-[#579dff] resize-none"
                                />
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() =>
                                      handleSaveEditComment(reply.id)
                                    }
                                    className="px-3 py-1 bg-[#579dff] hover:bg-[#85b8ff] text-[#1d2125] font-bold text-[10px] rounded"
                                  >
                                    Save
                                  </button>
                                  <button
                                    onClick={() => setEditingCommentId(null)}
                                    className="text-[10px] text-[#9fadbc] hover:text-[#fffdf5]"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="bg-[#1d2125] rounded-[4px] border border-[#a6c5e229] p-2 text-[12px] text-[#fffdf5] mt-1 whitespace-pre-wrap break-words">
                                {renderMessageWithMentions(reply.message)}
                              </div>
                            )}
                            {(isAdmin || reply.created_by === user?.id) && (
                              <div className="mt-1 flex items-center gap-3">
                                <button
                                  onClick={() => {
                                    setEditingCommentId(reply.id);
                                    setEditingCommentText(reply.message);
                                  }}
                                  className="text-[10px] text-[#9fadbc] hover:text-[#b6c2cf] underline"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleDeleteComment(reply.id)}
                                  className="text-[10px] text-[#9fadbc] hover:text-[#f87168] underline"
                                >
                                  Delete
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                <div className="flex itemcs-center gap-2 mt-3">
                  <UserAvatar
                    src={task.user_avatar}
                    name={task.user_name}
                    bgColor="#9f8fef"
                    textColor="#fff"
                    size={9}
                  />
                  <div className="grid grid-cols-1 grid-rows-2  -mt-0.5 ">
                    <div className="col-span-1 row-span-1">
                      <span className="text-[13px] font-bold text-accent">
                        {task.user_name || "User"}
                      </span>
                      <span className="text-xs"> add this card</span>
                    </div>
                    <div className="col-span-1 row-span-1 -mt-1 relative group">
                      <span
                        title={formatDate(task.cretime, true) || ""}
                        className="text-xs text-blue-500 underline"
                      >
                        {formatDate(task.cretime, true) || ""}
                      </span>
                      <button
                        type="button"
                        className="absolute -right-3 top-1/2 -translate-y-1/2 opacity-0 translate-x-0 group-hover:opacity-100 group-hover:translate-x-2 transition-all duration-200 text-[#9fadbc] text-xs flex items-center gap-1 hover:text-blue-500 cursor-pointer"
                        onClick={async () => {
                          try {
                            await navigator.clipboard.writeText(
                              formatDate(task.cretime, true),
                            );
                            toast.success("Tanggal berhasil disalin!");
                          } catch (err) {
                            toast.error("Gagal menyalin tanggal.");
                          }
                        }}
                      >
                        <Paperclip className="size-3" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
};
