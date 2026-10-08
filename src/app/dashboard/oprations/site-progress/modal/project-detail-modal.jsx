import { DatePicker } from "@/components/date-picker";
import SearchableSelect from "@/components/searchable-select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { statusJenisPembangunan } from "@/data/data";
import { usePost, usePut, useRemove } from "@/hooks/use-api-mutation";
import { useApiFetch } from "@/hooks/use-api-fetch";
import { formatDateDb } from "@/lib/date-format-db";
import { formatDate } from "@/lib/date-format";
import { useAuthStore } from "@/hooks/auth-store";
import { useChatMessages, useChatRoom } from "@/hooks/use-chat";
import {
  X,
  ActivitySquare,
  Save,
  MessageSquarePlus,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Paperclip,
  Send,
  Download,
} from "lucide-react";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { resolveImageUrl } from "@/lib/resolve-image-url";
import MoneyInput from "@/components/MoneyInput";

export default function ProjectDetailModal({
  project,
  isOpen,
  onClose,
  userOptions,
}) {
  if (!isOpen || !project) return null;

  const { user } = useAuthStore();
  const currentUserId = user?.id ?? null;
  const chatTopic = useMemo(() => `SITE_PROGRESS:${project.id}`, [project.id]);

  // ==========================================
  // 1. STATE: PROJECT INFO
  const formatDateTimeDb = (date) => {
    const d = date instanceof Date ? date : new Date(date);
    const pad = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  };

  const parseIdrToDigits = (value) => {
    return String(value || "").replace(/[^\d]/g, "");
  };
  // ==========================================
  const [projectData, setProjectData] = useState({});
  const [isProjectPending, setIsProjectPending] = useState(false);
  const { mutate: updateProject } = usePut(`/site-progress/${project.id}`, {
    invalidate: [["site-progress"], ["dashboard"]],
  });

  // ==========================================
  // 2. STATE: PROGRESS UPDATE
  // ==========================================
  const [progressData, setProgressData] = useState({
    progress: 0,
    budget_actual: "",
  });
  const [isProgressPending, setIsProgressPending] = useState(false);
  const { mutate: postProgress } = usePut(
    `/site-progress/${project.id}/progress`,
    { invalidate: [["site-progress"], ["dashboard"]] },
  );

  // ==========================================
  // 3. STATE: COMPLAINT (ADD & EDIT)
  // ==========================================
  const [complaintText, setComplaintText] = useState("");
  const [complaintFiles, setComplaintFiles] = useState([]);
  const [editingComplaintId, setEditingComplaintId] = useState(null);
  const [isComplaintPending, setIsComplaintPending] = useState(false);
  const [localComplaints, setLocalComplaints] = useState([]);

  const { mutate: addComplaint } = usePost("/site-progress/complaints", {
    invalidate: [["site-progress"]],
  });
  const { mutate: editComplaint } = usePut(
    (payload) => `/site-progress/complaints/${payload.id}`,
    { invalidate: [["site-progress"]] },
  );
  const uploadTargetIdRef = useRef(null);
  const { mutate: uploadAttachments } = usePost(
    () =>
      uploadTargetIdRef.current
        ? `/site-progress/complaints/${uploadTargetIdRef.current}/attachments`
        : "/site-progress/complaints/0/attachments",
    { invalidate: [["site-progress"]] },
  );
  const { mutate: deleteComplaint } = useRemove(
    (payload) => `/site-progress/complaints/${payload.id}`,
    { invalidate: [["site-progress"]] },
  );

  const { data: chatRoomsResponse } = useApiFetch(
    ["chats"],
    "/chats",
    undefined,
    isOpen,
  );
  const chatRooms = chatRoomsResponse?.data || [];

  const { mutate: createChatRoom } = usePost("/chats/group", {
    invalidate: [["chats"]],
  });
  const [chatRoomId, setChatRoomId] = useState(null);
  const createChatRef = useRef({ topic: null });

  const { room: chatRoom } = useChatRoom(chatRoomId);
  const { messages, sendMessage } = useChatMessages(chatRoomId);
  const [discussionInput, setDiscussionInput] = useState("");
  const [pendingDiscussionMessages, setPendingDiscussionMessages] = useState(
    [],
  );

  const [deleteComplaintTargetId, setDeleteComplaintTargetId] = useState(null);

  const [preview, setPreview] = useState({
    open: false,
    attachments: [],
    selectedIndex: 0,
  });

  // INIT DATA
  useEffect(() => {
    if (isOpen && project) {
      const matchedLeader = userOptions?.find(
        (u) => String(u.label) === String(project.site_leader ?? ""),
      );
      setProjectData({
        project_name: project.project_name ?? "",
        building_type: project.building_type ?? "",
        site_leader_id: matchedLeader ? Number(matchedLeader.value) : null,
        target: project.target ?? "",
        budget_rap: parseIdrToDigits(project.budget_rap ?? ""),
        overdue_date: project.overdue_date ?? null,
      });

      setProgressData({
        progress:
          project?.kpi_dts?.[project?.kpi_dts?.length - 1]?.progress || 0,
        budget_actual: parseIdrToDigits(
          project?.kpi_dts?.[project?.kpi_dts?.length - 1]?.budget_actual || 0,
        ),
      });

      setComplaintText("");
      setComplaintFiles([]);
      setEditingComplaintId(null);
      setDeleteComplaintTargetId(null);
      setLocalComplaints(
        Array.isArray(project.complaints) ? project.complaints : [],
      );
      setPendingDiscussionMessages([]);
    }
  }, [project, isOpen, userOptions]);

  useEffect(() => {
    if (!isOpen || !project?.id) return;

    const existing =
      chatRooms.find((r) => String(r.topic || "") === String(chatTopic)) ||
      null;
    if (existing?.id) {
      setChatRoomId(existing.id);
      createChatRef.current = { topic: chatTopic };
      return;
    }

    if (!currentUserId) return;
    if (createChatRef.current?.topic === chatTopic) return;

    createChatRef.current = { topic: chatTopic };
    createChatRoom(
      {
        topic: chatTopic,
        description: project.project_name || null,
        member_ids: [Number(currentUserId)],
      },
      {
        onSuccess: (res) => {
          const createdId = res?.data?.id ?? res?.id ?? null;
          if (createdId) setChatRoomId(createdId);
        },
        onError: () => {
          createChatRef.current = { topic: null };
        },
      },
    );
  }, [
    isOpen,
    project?.id,
    project?.project_name,
    chatRooms,
    chatTopic,
    createChatRoom,
    currentUserId,
  ]);

  // ==========================================
  // HANDLERS
  // ==========================================
  const handleSaveProject = (e) => {
    e.preventDefault();
    setIsProjectPending(true);
    const selectedLeader = userOptions?.find(
      (u) => String(u.value) === String(projectData.site_leader_id),
    );

    const payload = {
      ...projectData,
      site_leader: selectedLeader?.label ?? null,
      overdue_date: projectData.overdue_date
        ? formatDateDb(projectData.overdue_date)
        : null,
      budget_rap: parseIdrToDigits(projectData.budget_rap) || 0,
    };
    delete payload.site_leader_id;

    toast.promise(
      new Promise((resolve, reject) =>
        updateProject(payload, { onSuccess: resolve, onError: reject }),
      ),
      {
        loading: "Menyimpan info proyek...",
        success: "Info proyek terupdate!",
        error: "Gagal menyimpan info",
      },
    );
    setIsProjectPending(false);
  };

  const handleSaveProgress = (e) => {
    e.preventDefault();
    setIsProgressPending(true);
    toast.promise(
      new Promise((resolve, reject) =>
        postProgress(
          {
            ll_op_kpi_site_id: project.id,
            progress: progressData.progress,
            budget_actual: parseIdrToDigits(progressData.budget_actual) || 0,
          },
          { onSuccess: resolve, onError: reject },
        ),
      ),
      {
        loading: "Update progress...",
        success: "Progress fisik tercatat!",
        error: "Gagal update progress",
      },
    );
    setIsProgressPending(false);
  };

  const handleSubmitComplaint = (e) => {
    e.preventDefault();
    const text = String(complaintText || "").trim();
    if (!text) return toast.error("Keluhan tidak boleh kosong!");

    const latestDtId =
      project?.kpi_dts?.[project?.kpi_dts?.length - 1]?.id ?? null;
    if (!latestDtId) {
      toast.error(
        "Belum ada log progress. Buat progress dulu sebelum catat keluhan.",
      );
      return;
    }

    setIsComplaintPending(true);

    if (editingComplaintId) {
      const previous = localComplaints;
      const next = localComplaints.map((c) =>
        String(c.id) === String(editingComplaintId)
          ? { ...c, complaint: text }
          : c,
      );
      setLocalComplaints(next);

      editComplaint(
        {
          id: editingComplaintId,
          status:
            Number(
              previous.find((c) => String(c.id) === String(editingComplaintId))
                ?.status || 0,
            ) === 1,
          complaint: text,
          complaint_at: formatDateTimeDb(new Date()),
        },
        {
          onSuccess: (res) => {
            if (complaintFiles.length > 0) {
              handleUploadFiles(editingComplaintId, complaintFiles);
            }
            resetComplaintForm();
            const updated = res?.data ?? null;
            if (updated?.id) {
              setLocalComplaints((curr) =>
                curr.map((c) => {
                  if (String(c.id) !== String(updated.id)) return c;
                  const nextAttachments =
                    Array.isArray(updated.attachments) &&
                    updated.attachments.length > 0
                      ? updated.attachments
                      : Array.isArray(c.attachments)
                        ? c.attachments
                        : [];
                  return { ...c, ...updated, attachments: nextAttachments };
                }),
              );
            }
            toast.success("Keluhan diperbarui!");
          },
          onError: () => {
            setLocalComplaints(previous);
            toast.error("Gagal update keluhan");
          },
          onSettled: () => setIsComplaintPending(false),
        },
      );
      return;
    }

    const tempId = `tmp-${Date.now()}`;
    const optimistic = {
      id: tempId,
      status: 0,
      complaint: text,
      complaint_at: formatDateTimeDb(new Date()),
      complaint_date: formatDateDb(new Date()),
      attachments: [],
    };
    setLocalComplaints((curr) => [optimistic, ...curr]);

    const fd = new FormData();
    fd.append("ll_op_kpi_site_id", String(project.id));
    fd.append("ll_op_kpi_site_dt_id", String(latestDtId));
    fd.append("complaints[0][text]", text);
    fd.append("complaints[0][date]", formatDateTimeDb(new Date()));
    complaintFiles.forEach((f) => fd.append("complaints[0][files][]", f));

    addComplaint(fd, {
      onSuccess: (res) => {
        const created = Array.isArray(res?.data) ? res.data[0] : null;
        if (created?.id) {
          setLocalComplaints((curr) =>
            curr.map((c) => (String(c.id) === String(tempId) ? created : c)),
          );
        } else {
          setLocalComplaints((curr) =>
            curr.filter((c) => String(c.id) !== String(tempId)),
          );
        }
        resetComplaintForm();
        toast.success("Keluhan tercatat!");
      },
      onError: () => {
        setLocalComplaints((curr) =>
          curr.filter((c) => String(c.id) !== String(tempId)),
        );
        toast.error("Gagal mencatat keluhan");
      },
      onSettled: () => setIsComplaintPending(false),
    });
  };

  const handleUploadFiles = (complaintId, files) => {
    if (!complaintId) return;
    const selectedFiles = Array.isArray(files) ? files : [];
    if (selectedFiles.length === 0) return;
    const fd = new FormData();
    selectedFiles.forEach((f) => fd.append("files[]", f));

    uploadTargetIdRef.current = complaintId;
    uploadAttachments(fd, {
      onSuccess: (res) => {
        const updated = res?.data ?? null;
        if (updated?.id) {
          setLocalComplaints((curr) =>
            curr.map((c) => {
              if (String(c.id) !== String(updated.id)) return c;
              const nextAttachments =
                Array.isArray(updated.attachments) &&
                updated.attachments.length > 0
                  ? updated.attachments
                  : Array.isArray(c.attachments)
                    ? c.attachments
                    : [];
              return { ...c, ...updated, attachments: nextAttachments };
            }),
          );
        }
        toast.success("Attachment terupload");
      },
      onError: () => toast.error("Gagal upload attachment"),
    });
  };

  const toggleComplaintStatus = (complaint) => {
    if (!complaint?.id) return;
    if (String(complaint.id).startsWith("tmp-")) return;

    const prev = localComplaints;
    const nextStatus = Number(complaint.status) === 1 ? 0 : 1;
    const solveAt = nextStatus === 1 ? formatDateTimeDb(new Date()) : null;
    const solveDate = nextStatus === 1 ? formatDateDb(new Date()) : null;
    const next = prev.map((c) =>
      String(c.id) === String(complaint.id)
        ? {
            ...c,
            status: nextStatus,
            solve_at: solveAt,
            solve_date: solveDate,
          }
        : c,
    );
    setLocalComplaints(next);

    editComplaint(
      {
        id: complaint.id,
        status: nextStatus,
        complaint: complaint.complaint,
        complaint_at:
          complaint.complaint_at ||
          complaint.complaint_date ||
          formatDateTimeDb(new Date()),
        solve_at: solveAt,
        solve_date: solveDate,
      },
      {
        onSuccess: (res) => {
          const updated = res?.data ?? null;
          if (updated?.id) {
            setLocalComplaints((curr) =>
              curr.map((c) => {
                if (String(c.id) !== String(updated.id)) return c;
                const nextAttachments =
                  Array.isArray(updated.attachments) &&
                  updated.attachments.length > 0
                    ? updated.attachments
                    : Array.isArray(c.attachments)
                      ? c.attachments
                      : [];
                return { ...c, ...updated, attachments: nextAttachments };
              }),
            );
          }
        },
        onError: () => {
          setLocalComplaints(prev);
          toast.error("Gagal update status");
        },
      },
    );
  };

  const handleDeleteComplaint = (id) => {
    setDeleteComplaintTargetId(id);
  };

  const resetComplaintForm = () => {
    setComplaintText("");
    setComplaintFiles([]);
    setEditingComplaintId(null);
  };

  const handleSendDiscussion = () => {
    const value = String(discussionInput || "").trim();
    if (!value) return;
    if (!chatRoomId) return;

    const tempId = `tmp-msg-${Date.now()}`;
    const optimistic = {
      id: tempId,
      user_id: currentUserId,
      sender: { id: currentUserId, name: user?.name || "Saya" },
      message: value,
      sent_at: new Date().toISOString(),
    };
    setPendingDiscussionMessages((curr) => [...curr, optimistic]);
    setDiscussionInput("");

    toast.promise(
      new Promise((resolve, reject) => {
        sendMessage(
          { message: value, type: "text" },
          {
            onSuccess: (res) => {
              const created = res?.data ?? null;
              if (created?.id) {
                setPendingDiscussionMessages((curr) =>
                  curr.map((m) =>
                    String(m.id) === String(tempId) ? created : m,
                  ),
                );
              } else {
                setPendingDiscussionMessages((curr) =>
                  curr.filter((m) => String(m.id) !== String(tempId)),
                );
              }
              resolve();
            },
            onError: (err) => reject(err?.response?.data?.message),
          },
        );
      }),
      {
        loading: "Mengirim...",
        success: "Terkirim",
        error: (msg) => msg ?? "Gagal mengirim",
      },
    );
  };

  const discussionMessages = useMemo(() => {
    const base = Array.isArray(messages) ? messages : [];
    const pending = Array.isArray(pendingDiscussionMessages)
      ? pendingDiscussionMessages
      : [];
    const merged = [...base, ...pending];
    const unique = new Map();
    merged.forEach((m) => {
      if (!m?.id) return;
      unique.set(m.id, m);
    });
    return [...unique.values()].sort(
      (a, b) => new Date(a.sent_at).getTime() - new Date(b.sent_at).getTime(),
    );
  }, [messages, pendingDiscussionMessages]);

  const selectedAttachment =
    preview.attachments?.[preview.selectedIndex] ?? null;
  const selectedAttachmentUrl = selectedAttachment
    ? resolveImageUrl(selectedAttachment.file_path)
    : null;
  const selectedAttachmentIsImage = selectedAttachment
    ? String(selectedAttachment.mime_type || "").startsWith("image/")
    : false;
  const buildingTypeLabel =
    statusJenisPembangunan.find(
      (opt) =>
        String(opt.value) ===
        String(projectData.building_type ?? project.building_type ?? ""),
    )?.label ??
    projectData.building_type ??
    project.building_type ??
    "-";

  // ==========================================
  // RENDER
  // ==========================================
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 md:p-6 bg-background/80 backdrop-blur-sm">
      <div className="bg-[#152733] text-[#b6c2cf] border border-[#a6c5e229] md:rounded-sm shadow-2xl w-full h-full md:h-auto md:max-h-[90vh] md:max-w-6xl flex flex-col animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
        {/* HEADER: Trello Style */}
        <div className="flex items-start justify-between px-6 py-4 border-b border-[#a6c5e229] bg-[#0f1f2a] shrink-0">
          <div className="min-w-0 flex-1 pr-4">
            <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-[#9fadbc] mb-2">
              <span>ID.{project.id.toString().padStart(4, "0")}</span>
              <span className="w-4 h-[1px] bg-[#a6c5e229]" />
              <span>PROJECT DETAIL</span>
              <span className="w-4 h-[1px] bg-[#a6c5e229]" />
              <span className="text-[#fed818]">{buildingTypeLabel}</span>
            </div>
            <textarea
              value={projectData.project_name ?? project.project_name}
              onChange={(event) =>
                setProjectData((prev) => ({
                  ...prev,
                  project_name: event.target.value,
                }))
              }
              className="w-full bg-transparent text-[24px] font-bold text-[#b6c2cf] rounded py-1 px-2 -ml-2 focus:bg-[#282e33] focus:text-[#fffdf5] focus:outline-none focus:ring-2 focus:ring-[#135a86] resize-none overflow-hidden transition-all uppercase leading-tight"
              rows={1}
              onInput={(e) => {
                e.target.style.height = "auto";
                e.target.style.height = e.target.scrollHeight + "px";
              }}
            />
          </div>
          <button
            onClick={onClose}
            className="p-2 -mr-2 text-[#9fadbc] hover:text-[#fffdf5] hover:bg-[#1d2b36] transition-colors rounded-sm outline-none"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* BODY: 2 Columns Grid */}
        <div className="flex flex-col lg:flex-row lg:flex-row-reverse flex-grow overflow-hidden">
          <div className="w-full lg:w-[420px] lg:border-l border-[#a6c5e229] min-h-0 flex flex-col bg-[#0f1f2a]">
            <div className="px-6 py-4 border-b border-[#a6c5e229] bg-[#0f1f2a] shrink-0">
              <div className="flex items-center justify-between gap-3">
                <div className="text-[11px] uppercase tracking-widest font-bold text-[#fffdf5] flex items-center gap-2">
                  <MessageSquarePlus className="w-4 h-4 text-[#fed818]" />
                  Comments and activity
                </div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-[#9fadbc]">
                  {chatRoomId ? `ROOM:${chatRoomId}` : "LOADING"}
                </div>
              </div>
              <div className="text-[11px] text-[#9fadbc] mt-1 truncate">
                {chatRoom
                  ? chatRoom.topic || chatRoom.name
                  : "Membuat ruang diskusi..."}
              </div>
            </div>

            <div className="flex-1 min-h-0 flex flex-col">
              <ScrollArea className="flex-1 min-h-0 p-6">
                {Array.isArray(discussionMessages) &&
                discussionMessages.length > 0 ? (
                  <div className="space-y-3">
                    {discussionMessages.map((m) => {
                      const isOwn = String(m.user_id) === String(currentUserId);
                      const name = m?.sender?.name || (isOwn ? "Saya" : "User");
                      const initials = String(name || "?")
                        .trim()
                        .split(" ")
                        .slice(0, 2)
                        .map((p) => p.substring(0, 1).toUpperCase())
                        .join("");
                      return (
                        <div key={m.id} className="flex gap-3">
                          <div
                            className={`w-9 h-9 rounded-full flex items-center justify-center text-[11px] font-bold ${
                              isOwn
                                ? "bg-[#135a86] text-[#fffdf5]"
                                : "bg-[#152733] text-[#fed818] border border-[#a6c5e229]"
                            }`}
                          >
                            {initials || "U"}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <div className="text-[12px] font-bold text-[#fffdf5] truncate">
                                {name}
                              </div>
                              <div className="text-[10px] font-mono text-[#9fadbc]">
                                {m.sent_at ? formatDate(m.sent_at, true) : ""}
                              </div>
                            </div>
                            <div className="mt-1 bg-[#152733] border border-[#a6c5e229] rounded-lg px-3 py-2">
                              <div className="text-[13px] leading-relaxed whitespace-pre-wrap break-words text-[#b6c2cf]">
                                {m.message}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="h-full flex items-center justify-center text-[#9fadbc] text-sm">
                    Mulai diskusi untuk project ini
                  </div>
                )}
              </ScrollArea>

              <div className="border-t border-[#a6c5e229] bg-[#0f1f2a] p-4 shrink-0">
                <div className="flex items-end gap-2">
                  <textarea
                    value={discussionInput}
                    onChange={(e) => setDiscussionInput(e.target.value)}
                    placeholder="Write a comment..."
                    className="flex-1 bg-transparent text-[14px] font-medium text-[#b6c2cf] rounded py-2 px-3 border border-[#a6c5e229] focus:bg-[#282e33] focus:text-[#fffdf5] focus:outline-none focus:ring-2 focus:ring-[#135a86] resize-none overflow-y-auto max-h-[140px] transition-all leading-tight"
                    rows={1}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSendDiscussion();
                      }
                    }}
                    onInput={(e) => {
                      e.target.style.height = "auto";
                      e.target.style.height = `${e.target.scrollHeight}px`;
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleSendDiscussion}
                    disabled={
                      !String(discussionInput || "").trim() || !chatRoomId
                    }
                    className="shrink-0 w-11 h-11 rounded-full bg-[#135a86] hover:bg-[#135a86]/90 disabled:opacity-60 disabled:hover:bg-[#135a86] text-[#fffdf5] flex items-center justify-center transition-colors"
                    title="Kirim"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="w-full lg:flex-1 lg:border-r border-[#a6c5e229] bg-[#152733] flex flex-col min-h-0">
            <ScrollArea className="flex-1 min-h-0">
              <div className="p-5 space-y-6">
                <form
                  id="project-form"
                  onSubmit={handleSaveProject}
                  className="space-y-4 bg-[#152733] border border-[#a6c5e229] rounded-[10px] p-4"
                >
                  <div className="flex items-center justify-between">
                    <div className="text-[11px] uppercase tracking-widest font-bold text-[#fffdf5] flex items-center gap-2">
                      <Edit2 className="w-4 h-4 text-[#fed818]" /> Data Proyek
                    </div>
                    <button
                      type="submit"
                      disabled={isProjectPending}
                      className="text-[10px] uppercase tracking-widest font-bold bg-[#135a86] text-[#fffdf5] px-3 py-1.5 rounded hover:bg-[#135a86]/90 transition-colors flex items-center gap-1 disabled:opacity-60"
                    >
                      <Save className="w-3.5 h-3.5" /> Simpan
                    </button>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-[#9fadbc] uppercase tracking-widest">
                      Site Leader
                    </label>
                    <SearchableSelect
                      options={userOptions}
                      value={
                        projectData.site_leader_id !== null
                          ? String(projectData.site_leader_id)
                          : null
                      }
                      onChange={(value) =>
                        setProjectData({
                          ...projectData,
                          site_leader_id: value ? Number(value) : null,
                        })
                      }
                      placeholder="Pilih Leader..."
                      className="rounded-sm"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-[#9fadbc] uppercase tracking-widest">
                      Tipe Bangunan
                    </label>
                    <Select
                      value={projectData.building_type || ""}
                      onValueChange={(value) =>
                        setProjectData({ ...projectData, building_type: value })
                      }
                    >
                      <SelectTrigger className="rounded-sm border-[#a6c5e229] bg-[#0f1f2a] h-9 text-[#fffdf5] w-full">
                        <SelectValue placeholder="Pilih tipe..." />
                      </SelectTrigger>
                      <SelectContent className="rounded-sm">
                        {statusJenisPembangunan.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-[#9fadbc] uppercase tracking-widest">
                        Target (%)
                      </label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        required
                        value={projectData.target}
                        onChange={(e) =>
                          setProjectData({
                            ...projectData,
                            target: e.target.value,
                          })
                        }
                        className="rounded-sm border-[#a6c5e229] bg-[#0f1f2a] font-mono h-9 text-[#fffdf5]"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-[#9fadbc] uppercase tracking-widest">
                        RAP (Rp)
                      </label>
                      <MoneyInput
                        required
                        // showPrefix={false} // Buka komentar ini jika Anda TIDAK ingin ada tulisan "Rp" di depannya
                        value={projectData.budget_rap}
                        onChange={(num) =>
                          setProjectData({
                            ...projectData,
                            budget_rap: num, // Langsung menerima angka murni
                          })
                        }
                        // Styling untuk kotak luar (background, border, height, radius)
                        className="rounded-sm border-[#a6c5e229] bg-[#0f1f2a] h-9"
                        // Styling untuk teks di dalamnya (font, warna teks)
                        inputClassName="font-mono text-[#fffdf5]"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-[#9fadbc] uppercase tracking-widest">
                      Tenggat
                    </label>
                    <DatePicker
                      value={projectData.overdue_date}
                      onChange={(d) =>
                        setProjectData({ ...projectData, overdue_date: d })
                      }
                      label={null}
                      required
                    />
                  </div>
                </form>

                <form
                  id="progress-form"
                  onSubmit={handleSaveProgress}
                  className="space-y-4 bg-[#152733] border border-[#a6c5e229] rounded-[10px] p-4"
                >
                  <div className="flex items-center justify-between">
                    <div className="text-[11px] uppercase tracking-widest font-bold text-[#fffdf5] flex items-center gap-2">
                      <ActivitySquare className="w-4 h-4 text-[#fed818]" />
                      Update Progress
                    </div>
                    <button
                      type="submit"
                      disabled={isProgressPending}
                      className="text-[10px] uppercase tracking-widest font-bold bg-[#fed818] text-[#1d2125] px-3 py-1.5 rounded hover:bg-[#fed818]/90 transition-colors disabled:opacity-60"
                    >
                      Post
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-[#9fadbc] uppercase tracking-widest">
                        Progress (%)
                      </label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
                        required
                        value={progressData.progress}
                        onChange={(e) =>
                          setProgressData({
                            ...progressData,
                            progress: e.target.value,
                          })
                        }
                        className="rounded-sm border-[#a6c5e229] bg-[#0f1f2a] font-mono h-9 text-[#fffdf5]"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-[#9fadbc] uppercase tracking-widest">
                        Terpakai (Rp)
                      </label>
                      <MoneyInput
                        required
                        // showPrefix={false} // Buka komentar ini jika Anda TIDAK ingin ada tulisan "Rp" di depannya
                        value={progressData.budget_actual}
                        onChange={(num) =>
                          setProgressData({
                            ...progressData,
                            budget_actual: num, // Langsung menerima angka murni
                          })
                        }
                        // Styling untuk kotak luar (background, border, height, radius)
                        className="rounded-sm border-[#a6c5e229] bg-[#0f1f2a] h-9"
                        // Styling untuk teks di dalamnya (font, warna teks)
                        inputClassName="font-mono text-[#fffdf5]"
                      />
                    </div>
                  </div>
                </form>

                <div className="bg-[#152733] border border-[#a6c5e229] rounded-[10px] overflow-hidden">
                  <div className="p-4 border-b border-[#a6c5e229]">
                    <div className="text-[11px] uppercase tracking-widest font-bold text-[#fffdf5] flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[#fed818]" />{" "}
                      Keluhan
                    </div>
                    <div className="text-[11px] text-[#9fadbc] mt-1">
                      Catat dan kelola issue seperti checklist
                    </div>
                  </div>

                  <div className="p-4 border-b border-[#a6c5e229] bg-[#0f1f2a]">
                    <form
                      onSubmit={handleSubmitComplaint}
                      className="space-y-3"
                    >
                      <Textarea
                        placeholder="Tulis keluhan / issue..."
                        value={complaintText}
                        onChange={(e) => setComplaintText(e.target.value)}
                        className="bg-[#152733] border border-[#a6c5e229] text-[#fffdf5] placeholder:text-[#9fadbc] min-h-[70px] resize-none focus-visible:ring-2 focus-visible:ring-[#135a86]"
                      />
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <label className="cursor-pointer text-[#9fadbc] hover:text-[#fffdf5] transition-colors px-2 py-1.5 rounded hover:bg-[#1d2b36] flex items-center gap-2 text-[10px] uppercase font-bold tracking-widest border border-[#a6c5e229]">
                            <Paperclip className="w-4 h-4" /> Attachment
                            <input
                              type="file"
                              multiple
                              accept="image/*,.pdf"
                              className="hidden"
                              onChange={(e) =>
                                setComplaintFiles(
                                  Array.from(e.target.files || []),
                                )
                              }
                            />
                          </label>
                          {complaintFiles.length > 0 && (
                            <span className="text-[10px] font-mono text-[#fed818]">
                              {complaintFiles.length} file
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {editingComplaintId && (
                            <button
                              type="button"
                              onClick={resetComplaintForm}
                              className="text-[10px] uppercase tracking-widest font-bold px-3 py-2 rounded bg-transparent border border-[#a6c5e229] text-[#9fadbc] hover:text-[#fffdf5] hover:bg-[#1d2b36] transition-colors"
                            >
                              Batal
                            </button>
                          )}
                          <button
                            type="submit"
                            disabled={isComplaintPending}
                            className="text-[10px] uppercase tracking-widest font-bold bg-[#135a86] text-[#fffdf5] px-4 py-2 rounded hover:bg-[#135a86]/90 transition-colors disabled:opacity-60"
                          >
                            {editingComplaintId ? "Simpan" : "Tambah"}
                          </button>
                        </div>
                      </div>
                    </form>
                  </div>

                  <div className="max-h-[360px] overflow-hidden">
                    <ScrollArea className="h-[360px]">
                      <div className="divide-y divide-[#a6c5e229]">
                        {localComplaints?.map((complaint) => {
                          const isSolved = Number(complaint.status) === 1;
                          const isEditingThis =
                            editingComplaintId === complaint.id;
                          const complaintDate =
                            complaint.complaint_at ||
                            complaint.complaint_date ||
                            complaint.cretime;
                          const attachments = Array.isArray(
                            complaint.attachments,
                          )
                            ? complaint.attachments
                            : [];

                          return (
                            <div
                              key={complaint.id}
                              className={`p-4 transition-colors ${isEditingThis ? "bg-[#135a86]/15" : "hover:bg-[#1d2b36]"}`}
                            >
                              <div
                                className="flex items-start gap-3 cursor-pointer"
                                onClick={() => toggleComplaintStatus(complaint)}
                              >
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleComplaintStatus(complaint);
                                  }}
                                  title={
                                    isSolved
                                      ? "Tandai belum selesai"
                                      : "Tandai selesai"
                                  }
                                  className={`mt-1 w-5 h-5 rounded flex items-center justify-center border ${
                                    isSolved
                                      ? "bg-[#4bce97]/15 border-[#4bce97] text-[#4bce97]"
                                      : "bg-transparent border-[#a6c5e229] text-transparent hover:text-[#fed818] hover:border-[#fed818]"
                                  }`}
                                >
                                  <CheckCircle2 className="w-4 h-4" />
                                </button>

                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between gap-2">
                                    <div className="text-[10px] font-mono uppercase text-[#9fadbc]">
                                      {complaintDate
                                        ? formatDate(complaintDate, true)
                                        : "-"}
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setEditingComplaintId(complaint.id);
                                          setComplaintText(complaint.complaint);
                                        }}
                                        className="p-1 text-[#9fadbc] hover:text-[#fffdf5]"
                                      >
                                        <Edit2 className="w-4 h-4" />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleDeleteComplaint(complaint.id);
                                        }}
                                        className="p-1 text-[#9fadbc] hover:text-[#f87168]"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    </div>
                                  </div>

                                  <div
                                    className={`text-[13px] leading-relaxed mt-1 whitespace-pre-wrap break-words ${
                                      isSolved
                                        ? "text-[#9fadbc] line-through"
                                        : "text-[#fffdf5]"
                                    }`}
                                  >
                                    {complaint.complaint}
                                  </div>

                                  {attachments.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mt-3">
                                      {attachments
                                        .slice(0, 6)
                                        .map((att, idx) => {
                                          const url = resolveImageUrl(
                                            att.file_path,
                                          );
                                          const isImage = String(
                                            att.mime_type || "",
                                          ).startsWith("image/");
                                          return (
                                            <button
                                              key={att.id || idx}
                                              type="button"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                setPreview({
                                                  open: true,
                                                  attachments,
                                                  selectedIndex: idx,
                                                });
                                              }}
                                              className="w-12 h-12 border border-[#a6c5e229] rounded overflow-hidden hover:border-[#fed818] transition-colors"
                                              title={
                                                att.original_name ||
                                                "attachment"
                                              }
                                            >
                                              {isImage ? (
                                                <img
                                                  src={url}
                                                  alt={
                                                    att.original_name ||
                                                    "attachment"
                                                  }
                                                  className="w-full h-full object-cover"
                                                />
                                              ) : (
                                                <div className="w-full h-full flex items-center justify-center bg-[#0f1f2a] text-[9px] font-bold text-[#9fadbc]">
                                                  PDF
                                                </div>
                                              )}
                                            </button>
                                          );
                                        })}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}

                        {(!localComplaints || localComplaints.length === 0) && (
                          <div className="p-8 text-center">
                            <AlertCircle className="w-8 h-8 text-[#9fadbc]/30 mx-auto mb-3" />
                            <p className="text-[11px] font-mono text-[#9fadbc] uppercase tracking-widest">
                              Belum ada keluhan
                            </p>
                          </div>
                        )}
                      </div>
                    </ScrollArea>
                  </div>
                </div>
              </div>
            </ScrollArea>
          </div>
        </div>
      </div>

      <AlertDialog
        open={!!deleteComplaintTargetId}
        onOpenChange={(open) => {
          if (!open) setDeleteComplaintTargetId(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus keluhan?</AlertDialogTitle>
            <AlertDialogDescription>
              Keluhan akan terhapus permanen. Proses ini tidak bisa dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteComplaintTargetId(null)}>
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                const id = deleteComplaintTargetId;
                setDeleteComplaintTargetId(null);
                if (!id) return;
                const prev = localComplaints;
                setLocalComplaints((curr) =>
                  curr.filter((c) => String(c.id) !== String(id)),
                );
                deleteComplaint(
                  { id },
                  {
                    onSuccess: () => toast.success("Keluhan dihapus"),
                    onError: () => {
                      setLocalComplaints(prev);
                      toast.error("Gagal menghapus keluhan");
                    },
                  },
                );
              }}
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog
        open={preview.open}
        onOpenChange={(open) => {
          if (!open) {
            setPreview({ open: false, attachments: [], selectedIndex: 0 });
          }
        }}
      >
        <DialogContent className="bg-background border-border max-w-5xl p-0 overflow-hidden">
          <DialogHeader className="px-6 pt-5 pb-4 border-b border-border/40">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <DialogTitle className="text-base font-semibold truncate">
                  {selectedAttachment?.original_name || "Attachment"}
                </DialogTitle>
                <div className="text-xs text-muted-foreground mt-1">
                  Uploaded:{" "}
                  <span className="font-mono text-foreground/90">
                    {selectedAttachment?.cretime
                      ? formatDate(selectedAttachment.cretime, true)
                      : "-"}
                  </span>
                </div>
              </div>
              {selectedAttachmentUrl && (
                <a
                  href={selectedAttachmentUrl}
                  download={selectedAttachment?.original_name || "attachment"}
                  target="_blank"
                  rel="noreferrer"
                  className="shrink-0 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest bg-primary text-primary-foreground px-3 py-2 rounded-sm hover:bg-primary/90 transition-colors"
                >
                  <Download className="w-4 h-4" /> Download
                </a>
              )}
            </div>
          </DialogHeader>

          <div className="p-6 bg-muted/5">
            {selectedAttachmentUrl ? (
              selectedAttachmentIsImage ? (
                <div className="w-full flex items-center justify-center">
                  <img
                    src={selectedAttachmentUrl}
                    alt={selectedAttachment?.original_name || "attachment"}
                    className="max-h-[70vh] w-auto max-w-full object-contain rounded-md border border-border/60 bg-background"
                  />
                </div>
              ) : (
                <div className="w-full h-[70vh] rounded-md border border-border/60 overflow-hidden bg-background">
                  <iframe
                    title={selectedAttachment?.original_name || "attachment"}
                    src={selectedAttachmentUrl}
                    className="w-full h-full"
                  />
                </div>
              )
            ) : (
              <div className="text-sm text-muted-foreground">No preview</div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
