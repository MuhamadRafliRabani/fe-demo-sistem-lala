"use client";
import React, {
  useState,
  useRef,
  useMemo,
  useCallback,
  useEffect,
} from "react";
import axios from "axios";
import {
  DndContext,
  DragOverlay,
  MouseSensor, // ✅ FIX: Mouse only → touch events free for scroll
  useSensor,
  useSensors,
  closestCorners,
  defaultDropAnimationSideEffects,
  useDroppable,
  useDraggable,
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import {
  MoreVertical,
  Plus,
  Layout,
  Search,
  ChevronDown,
  Filter,
  X,
  Tag,
  Clock,
  ArrowUpDown,
  RotateCcw,
  Loader2,
  Download, // ✅ TAMBAHAN: Import icon Download
} from "lucide-react";
import { useDateRange } from "@/lib/date-range";
import { formatDateDb } from "@/lib/date-format-db";
import { useApiFetch } from "@/hooks/use-api-fetch";
import { usePut } from "@/hooks/use-api-mutation";
import { useChatRooms } from "@/hooks/use-chat";
import { toast } from "sonner";
import DashboardLayout from "@/components/layouts/dashboard-layout";
import { OverviewTab } from "../components/overview";
import Loader from "@/components/ui/loader";
import { DatePicker } from "@/components/date-picker";
import { useAuthStore } from "@/hooks/auth-store";
import { UserSelection } from "@/components/user-selection";
import { columnsConfig } from "@/data/collum-task-status-config";
import { InlineCreateTask } from "../components/create-taks";
import { TaskCalendarSidebar } from "../components/task-calendar-sidebar";
import { TaskCardUI } from "../components/task-card";
import { EditTaskModal } from "../modal/modal-update-item-todo-v2";
import { downloadFile } from "@/lib/download-file";

// ─────────────────────────────────────────────────────────────────────────────
// Compact filter pill — select with icon overlay
// ─────────────────────────────────────────────────────────────────────────────
const FilterPill = ({ icon, value, defaultValue, options, onChange }) => {
  const isActive = value !== defaultValue;
  return (
    <label
      className={`relative flex items-center gap-1.5 h-8 pl-2.5 pr-6 rounded-lg border cursor-pointer transition-all select-none ${
        isActive
          ? "border-primary/60 bg-primary/10 text-primary"
          : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground"
      }`}
    >
      <span className="shrink-0">{icon}</span>
      <span className="text-[11.5px] font-semibold whitespace-nowrap">
        {options.find((o) => o.value === value)?.label ?? "—"}
      </span>
      {/* Invisible native select for interaction */}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="absolute inset-0 opacity-0 w-full cursor-pointer"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <ChevronDown
        size={11}
        className="absolute right-1.5 shrink-0 opacity-50"
      />
    </label>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// SortableTask — drag wrapper
// ─────────────────────────────────────────────────────────────────────────────
const SortableTask = ({ task, onEdit, onChat, isAdmin = false }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({ id: task.id, data: task });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: transform
          ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
          : undefined,
        // ✅ touch-action: pan-y lets vertical touch scroll pass through
        touchAction: "pan-y",
      }}
      {...attributes}
      {...listeners}
      className="mb-2.5 sm:mb-3 select-none"
    >
      <TaskCardUI
        task={task}
        isDragging={isDragging}
        onEdit={onEdit}
        onChat={onChat}
        isAdmin={isAdmin}
        unreadCount={task.unread_comments_count || 0}
        commentCount={task.comments_count || 0}
        onOpenComments={onChat}
      />
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Column — droppable
// ─────────────────────────────────────────────────────────────────────────────
const Column = ({
  col,
  tasks,
  onEditTask,
  onChatTask,
  registerColumnRef,
  onSuccess,
  selectedUsers,
  isAdmin = false,
}) => {
  const { setNodeRef } = useDroppable({ id: col.id });
  const [isCreating, setIsCreating] = useState(false);

  return (
    <div
      ref={setNodeRef}
      className="flex w-[260px] xs:w-[280px] sm:w-[300px] md:w-[310px] lg:w-[320px] shrink-0 flex-col bg-card/80 border border-border rounded-2xl overflow-hidden"
      style={{ maxHeight: "calc(100vh - 220px)" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 sm:px-4 pt-3 sm:pt-4 pb-3 border-b border-border shrink-0">
        <div className="flex items-center gap-2">
          <div className={`h-2.5 w-2.5 rounded-full ${col.dotColor}`} />
          <h3 className="font-bold text-foreground text-[13px] sm:text-[14px] tracking-wide">
            {col.title}
          </h3>
          <span
            className={`flex h-5 min-w-[20px] px-1 items-center justify-center rounded-full ${col.bgColor} border ${col.borderColor} text-[10px] font-bold text-foreground`}
          >
            {tasks.length}
          </span>
        </div>
        <button className="text-muted-foreground hover:text-foreground hover:bg-secondary p-1.5 rounded-lg transition-colors">
          <MoreVertical size={14} />
        </button>
      </div>

      {/* Add task */}
      <div className="px-3 sm:px-4 pt-3 shrink-0">
        <button
          onClick={() => setIsCreating(true)}
          className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-border bg-transparent py-2 text-[12px] sm:text-[13px] font-semibold text-muted-foreground hover:bg-secondary hover:text-primary hover:border-primary/50 transition-all duration-200"
        >
          <Plus size={14} /> Tambah
        </button>
      </div>

      {/* Scrollable list */}
      <div
        ref={(el) => registerColumnRef?.(col.id, el)}
        className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden custom-scrollbar px-3 sm:px-4 pt-2.5 pb-3"
      >
        {isCreating && (
          <InlineCreateTask
            columnId={col.id}
            onClose={() => setIsCreating(false)}
            onSuccess={onSuccess}
            selectedUsers={selectedUsers}
          />
        )}

        {tasks.length === 0 && !isCreating && (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <div className="w-8 h-8 rounded-full border-2 border-dashed border-border mb-2.5 flex items-center justify-center">
              <Plus size={14} className="text-muted-foreground" />
            </div>
            <p className="text-[11px] text-muted-foreground">Belum ada task</p>
          </div>
        )}

        {tasks.map((task) => (
          <SortableTask
            key={task.id}
            task={task}
            onEdit={onEditTask}
            onChat={onChatTask}
            isAdmin={isAdmin}
          />
        ))}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Filter option constants
// ─────────────────────────────────────────────────────────────────────────────
const DUE_OPTIONS = [
  { value: "all", label: "Semua Due" },
  { value: "today", label: "Hari ini" },
  { value: "tomorrow", label: "Besok" },
  { value: "this_week", label: "Minggu ini" },
  { value: "overdue", label: "Terlambat" },
  { value: "no_due", label: "Tanpa Due" },
];

const SORT_OPTIONS = [
  { value: "due_asc", label: "Due ↑" },
  { value: "due_desc", label: "Due ↓" },
  { value: "name_asc", label: "Nama A-Z" },
  { value: "name_desc", label: "Nama Z-A" },
  { value: "newest", label: "Terbaru" },
  { value: "oldest", label: "Terlama" },
];

// ─────────────────────────────────────────────────────────────────────────────
// Pure helpers (defined outside component — no closure over state)
// ─────────────────────────────────────────────────────────────────────────────
const normalizeDueDate = (value) => {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
};

const getDueDateRange = (key) => {
  const now = new Date();
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const weekStart = new Date(today);
  weekStart.setDate(weekStart.getDate() - today.getDay());
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);
  if (key === "today")
    return { start: today, end: new Date(today.getTime() + 86400000 - 1) };
  if (key === "tomorrow")
    return {
      start: tomorrow,
      end: new Date(tomorrow.getTime() + 86400000 - 1),
    };
  if (key === "this_week") return { start: weekStart, end: weekEnd };
  return null;
};

// ─────────────────────────────────────────────────────────────────────────────
// KanbanApp
// ─────────────────────────────────────────────────────────────────────────────
export default function KanbanApp() {
  const [activeTab, setActiveTab] = useState("Tasks");
  const [tasks, setTasks] = useState({
    pending: [],
    on_progress: [],
    done: [],
  });
  const [activeTask, setActiveTask] = useState(null);
  const { user } = useAuthStore();

  // filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [labelFilter, setLabelFilter] = useState("all");
  const [dueDateFilter, setDueDateFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState([]);

  const { start } = useDateRange("this_month");
  const { start: todayStart } = useDateRange("today");
  const [filter, setFilter] = useState({
    page: 1,
    include: "user",
    start_date: formatDateDb(start),
    end_date: formatDateDb(todayStart),
  });

  const PAGE_SIZE = 20;
  const STEP = 15;
  const [limit, setLimit] = useState(PAGE_SIZE);

  const [selectedItem, setSelectedItem] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);

  // ── discussion ──
  const [, setDiscussionRoomId] = useState(null);
  const [, setIsDiscussionOpen] = useState(false);
  const [, setSelectedTask] = useState(null);

  // ─────────────────────────────────────────────────────────────────────────
  // Query
  // ─────────────────────────────────────────────────────────────────────────
  const queryFilter = useMemo(() => {
    const isAdminUser = user && [1, 11].includes(Number(user.role_id));
    const hasSelectedUsers = isAdminUser && selectedUsers.length > 0;

    return {
      ...filter,
      paginate: hasSelectedUsers ? 0 : limit,
      user_id: hasSelectedUsers ? selectedUsers : undefined,
    };
  }, [filter, limit, user, selectedUsers]);

  const {
    data: apiDataResponse,
    isLoading: isApiLoading,
    isFetching,
    refetch,
  } = useApiFetch(
    ["work-tasks", queryFilter],
    "/work-tasks",
    queryFilter,
    // ✅ FIX: wait for Zustand to hydrate before firing — prevents 401 on refresh
    !!user?.id,
  );

  // ✅ FIX: useEffect instead of onSuccess (React Query v5 removed onSuccess)
  useEffect(() => {
    if (!apiDataResponse) return;

    const rawItems = Array.isArray(apiDataResponse?.data)
      ? apiDataResponse.data
      : (apiDataResponse?.data?.data ?? []);

    const mapped = rawItems.map((item) => ({
      ...item,
      description: item.reason ?? "",
      user_name: item.user?.name ?? "",
      user_avatar: item.user?.avatar ?? "",
      comments_count: item.comments_count ?? 0,
      unread_comments_count: item.unread_comments_count ?? 0,
    }));

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTasks({
      pending: mapped.filter((i) => i.status === "pending"),
      on_progress: mapped.filter(
        (i) => i.status === "on_progress" || i.status === "progress",
      ),
      done: mapped.filter((i) => i.status === "done"),
    });
  }, [apiDataResponse]);

  // ─────────────────────────────────────────────────────────────────────────
  // ✅ FIX: Keep tasks in a ref so drag handlers always read fresh data
  //    (avoids stale closure inside onDragStart/End)
  // ─────────────────────────────────────────────────────────────────────────
  const tasksRef = useRef(tasks);
  useEffect(() => {
    tasksRef.current = tasks;
  }, [tasks]);

  // ─────────────────────────────────────────────────────────────────────────
  // Derived values
  // ─────────────────────────────────────────────────────────────────────────
  const allLoadedTasks = useMemo(() => Object.values(tasks).flat(), [tasks]);

  const totalCount = useMemo(
    () =>
      apiDataResponse?.data?.total ?? apiDataResponse?.data?.data?.total ?? 0,
    [apiDataResponse],
  );

  const currentPageItems = useMemo(
    () =>
      Array.isArray(apiDataResponse?.data?.data)
        ? apiDataResponse.data.data.length
        : Array.isArray(apiDataResponse?.data)
          ? apiDataResponse.data.length
          : 0,
    [apiDataResponse],
  );

  const hasMore =
    totalCount > 0
      ? allLoadedTasks.length < totalCount
      : currentPageItems >= limit;

  // ─────────────────────────────────────────────────────────────────────────
  // Filter & sort
  // ─────────────────────────────────────────────────────────────────────────
  const taskLabels = useMemo(() => {
    const labels = allLoadedTasks
      .map((t) => String(t.label ?? "").trim())
      .filter(Boolean);
    return ["all", ...new Set(labels.sort((a, b) => a.localeCompare(b)))];
  }, [allLoadedTasks]);

  const labelOptions = useMemo(
    () =>
      taskLabels.map((l) => ({
        value: l,
        label: l === "all" ? "Semua Label" : l,
      })),
    [taskLabels],
  );

  const compareTasks = useCallback(
    (a, b) => {
      const aName = String(a.task_name ?? "").toLowerCase();
      const bName = String(b.task_name ?? "").toLowerCase();
      if (sortBy === "name_asc") return aName.localeCompare(bName);
      if (sortBy === "name_desc") return bName.localeCompare(aName);
      if (sortBy === "newest")
        return new Date(b.cretime ?? 0) - new Date(a.cretime ?? 0);
      if (sortBy === "oldest")
        return new Date(a.cretime ?? 0) - new Date(b.cretime ?? 0);
      const aDue = normalizeDueDate(a.due_date);
      const bDue = normalizeDueDate(b.due_date);
      if (sortBy === "due_desc") {
        if (!aDue && !bDue) return aName.localeCompare(bName);
        if (!aDue) return 1;
        if (!bDue) return -1;
        return bDue - aDue;
      }
      if (!aDue && !bDue) return aName.localeCompare(bName);
      if (!aDue) return 1;
      if (!bDue) return -1;
      return aDue - bDue;
    },
    [sortBy],
  );

  const displayTasks = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const dueRange = getDueDateRange(dueDateFilter);

    return Object.fromEntries(
      Object.entries(tasks).map(([status, items]) => [
        status,
        items
          .filter((task) => {
            const matchesSearch =
              !q ||
              String(task.task_name ?? "")
                .toLowerCase()
                .includes(q);
            const matchesLabel =
              labelFilter === "all" ||
              String(task.label ?? "").toLowerCase() ===
                labelFilter.toLowerCase();
            const dueDate = normalizeDueDate(task.due_date);
            let matchesDue = true;
            if (dueDateFilter === "overdue") {
              matchesDue = Boolean(dueDate && dueDate < new Date());
            } else if (dueDateFilter === "no_due") {
              matchesDue = !dueDate;
            } else if (dueRange) {
              matchesDue = Boolean(
                dueDate && dueDate >= dueRange.start && dueDate <= dueRange.end,
              );
            }
            return matchesSearch && matchesLabel && matchesDue;
          })
          .sort(compareTasks),
      ]),
    );
  }, [tasks, searchQuery, labelFilter, dueDateFilter, compareTasks]);

  const advancedActiveCount = useMemo(() => {
    let n = 0;
    if (selectedUsers.length > 0) n++;
    if (filter.start_date) n++;
    if (filter.end_date) n++;
    return n;
  }, [selectedUsers, filter]);

  const hasAnyFilter =
    searchQuery.trim() !== "" ||
    labelFilter !== "all" ||
    dueDateFilter !== "all" ||
    sortBy !== "due_asc" ||
    advancedActiveCount > 0;

  const handleResetFilters = () => {
    setSearchQuery("");
    setLabelFilter("all");
    setDueDateFilter("all");
    setSortBy("newest");
    setSelectedUsers([]);
    setFilter({
      page: 1,
      include: "user",
      start_date: formatDateDb(start),
      end_date: formatDateDb(todayStart),
    });
    setShowAdvanced(false);
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Export Analytics (Excel) - Fungsi Baru ✨
  // ─────────────────────────────────────────────────────────────────────────
  const handleExportExcel = async () => {
    const params = new URLSearchParams();

    if (filter.start_date) params.append("start_date", filter.start_date);
    if (filter.end_date) params.append("end_date", filter.end_date);
    if (selectedUsers.length > 0) {
      params.append("user_id", selectedUsers.join(","));
    }

    const timestamp = new Date().toISOString().replace(/[:.-]/g, "_");
    const filename = `Laporan_Aktivitas_${timestamp}.xlsx`;

    const promise = downloadFile(
      `/work-todos-analytics/export?${params.toString()}`,
      filename,
    );

    toast.promise(promise, {
      loading: "Menyiapkan file Excel Laporan Aktivitas...",
      success: "Laporan berhasil diunduh!",
      error: (error) =>
        error?.message ||
        "Gagal mendownload laporan, pastikan akses Anda valid.",
    });

    await promise;
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Mutation
  // ─────────────────────────────────────────────────────────────────────────
  const { mutate: mutateUpdate, isPending: isUpdating } = usePut(
    `/work-tasks/${selectedItem}`,
    { invalidate: [["work-tasks"]] },
  );

  const handleOpenComments = (task) => {
    setSelectedTask(task);
    setIsDiscussionOpen(true);
  };

  const handleOpenEdit = (task) => {
    setSelectedItem(task.id);
    setEditingTask(task);
    setIsEditModalOpen(true);
  };

  const updateLocalTask = (updatedTask) => {
    setTasks((prev) => {
      const next = { ...prev };
      for (const col in next) {
        const idx = next[col].findIndex((t) => t.id === updatedTask.id);
        if (idx !== -1) {
          next[col] = [...next[col]];
          next[col][idx] = { ...next[col][idx], ...updatedTask };
          break;
        }
      }
      return next;
    });
  };

  // ─────────────────────────────────────────────────────────────────────────
  // DnD — MouseSensor only so touch is free for scroll
  // ─────────────────────────────────────────────────────────────────────────
  const sensors = useSensors(
    useSensor(MouseSensor, {
      // Require 8px movement before drag starts — prevents accidental drag on click
      activationConstraint: { distance: 8 },
    }),
  );

  const boardRef = useRef(null);
  const blockedDragRef = useRef(null);
  const columnRefs = useRef({});
  const registerColumnRef = (id, el) => {
    if (el) columnRefs.current[id] = el;
  };

  // ✅ FIX: use tasksRef.current so handlers always see latest tasks
  const findContainer = useCallback((id) => {
    const t = tasksRef.current;
    return (
      Object.keys(t).find((key) => t[key].some((task) => task.id === id)) ??
      (id in t ? id : null)
    );
  }, []); // stable ref, no deps needed

  const handleDragStart = useCallback(
    (event) => {
      const containerId = findContainer(event.active.id);
      const task = tasksRef.current[containerId]?.find(
        (t) => t.id === event.active.id,
      );
      const isApproved =
        String(task?.approve_status ?? "").toLowerCase() === "approved";
      if (!isApproved) {
        toast.error("Task belum di-approve, tidak bisa dipindahkan!");
        blockedDragRef.current = event.active.id;
        setActiveTask(null);
        return;
      }
      blockedDragRef.current = null;
      setActiveTask(task ?? null);
    },
    [findContainer],
  );

  const handleDragOver = useCallback((event) => {
    setSelectedItem(event.active.id);
  }, []);

  const handleDragMove = useCallback(
    (event) => {
      const e = event.activatorEvent;
      const x = e && "clientX" in e ? e.clientX : null;
      const y = e && "clientY" in e ? e.clientY : null;
      if (boardRef.current && x !== null) {
        const rect = boardRef.current.getBoundingClientRect();
        if (x - rect.left < 80) boardRef.current.scrollLeft -= 20;
        else if (rect.right - x < 80) boardRef.current.scrollLeft += 20;
      }
      if (event.over && y !== null) {
        const el = columnRefs.current[findContainer(event.over.id)];
        if (el) {
          const r = el.getBoundingClientRect();
          if (y - r.top < 60) el.scrollTop -= 16;
          else if (r.bottom - y < 60) el.scrollTop += 16;
        }
      }
    },
    [findContainer],
  );

  const handleDragEnd = useCallback(
    (event) => {
      const { active, over } = event;

      if (
        blockedDragRef.current &&
        String(blockedDragRef.current) === String(active.id)
      ) {
        blockedDragRef.current = null;
        setActiveTask(null);
        return;
      }

      const fromContainer = findContainer(active.id);
      const toContainer = over ? findContainer(over.id) : null;

      if (!over || !fromContainer) {
        setActiveTask(null);
        return;
      }

      const currentTasks = tasksRef.current;
      const activeIndex = currentTasks[fromContainer]?.findIndex(
        (t) => t.id === active.id,
      );
      const overIndex = toContainer
        ? currentTasks[toContainer]?.findIndex((t) => t.id === over.id)
        : -1;

      // Reorder within same column
      if (fromContainer === toContainer) {
        if (
          activeIndex !== -1 &&
          overIndex !== -1 &&
          activeIndex !== overIndex
        ) {
          setTasks((prev) => ({
            ...prev,
            [fromContainer]: arrayMove(
              prev[fromContainer],
              activeIndex,
              overIndex,
            ),
          }));
        }
        setActiveTask(null);
        return;
      }

      // Move to different column
      if (toContainer && toContainer in currentTasks) {
        const movedItem = currentTasks[fromContainer]?.[activeIndex];
        if (!movedItem) {
          setActiveTask(null);
          return;
        }

        // Optimistic update
        setTasks((prev) => ({
          ...prev,
          [fromContainer]: prev[fromContainer].filter(
            (i) => i.id !== active.id,
          ),
          [toContainer]: [
            { ...movedItem, status: toContainer },
            ...prev[toContainer],
          ],
        }));

        if (movedItem.status !== toContainer) {
          const token = useAuthStore.getState().token;
          const previousTasks = { ...currentTasks };

          toast.promise(
            axios.put(
              `${process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api"}/work-tasks/${movedItem.id}`,
              { status: toContainer },
              { headers: { Authorization: `Bearer ${token}` } },
            ),
            {
              loading: "Menyimpan status...",
              success: "Status berhasil diupdate!",
              error: (err) => {
                setTasks(previousTasks); // rollback
                return (
                  err?.response?.data?.message ?? "Gagal memindahkan tugas!"
                );
              },
            },
          );
        }
      }

      setActiveTask(null);
    },
    [findContainer],
  );

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────
  if (isApiLoading && allLoadedTasks.length === 0) return <Loader />;

  return (
    <DashboardLayout>
      {/* Page header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 z-10 relative mb-4">
        <div className="flex items-center gap-3 sm:gap-5">
          <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-2xl bg-primary/10 border border-primary/30 text-primary shrink-0">
            <Layout size={20} />
          </div>
          <div>
            <h1 className="text-[20px] sm:text-[24px] font-bold text-foreground tracking-tight leading-none mb-1">
              Kanban Tasks
            </h1>
            <p className="text-[12px] sm:text-[13.5px] text-muted-foreground">
              Kelola tugas dengan drag &amp; drop.
            </p>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="border-b border-border z-0 relative w-full">
        <div className="flex gap-6">
          {["Overview", "Tasks"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-3 sm:py-4 text-[12px] sm:text-[13px] font-bold whitespace-nowrap transition-colors relative tracking-wide uppercase ${
                activeTab === tab
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab}
              {activeTab === tab && (
                <span className="absolute -bottom-px left-0 w-full h-[3px] bg-primary rounded-t-full" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Filter bar — Tasks tab only */}
      {activeTab === "Tasks" && (
        <div className="pt-3 pb-1 space-y-2">
          {/* Quick filters */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Search */}
            <div className="relative flex-1 min-w-[150px] max-w-[220px]">
              <Search
                size={12}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari task..."
                className="w-full h-8 pl-7 pr-7 rounded-lg border border-border bg-card text-[12px] text-foreground outline-none placeholder:text-muted-foreground focus:border-primary/50 transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X size={11} />
                </button>
              )}
            </div>

            <FilterPill
              icon={<Tag size={11} />}
              value={labelFilter}
              defaultValue="all"
              options={labelOptions}
              onChange={setLabelFilter}
            />

            <FilterPill
              icon={<Clock size={11} />}
              value={dueDateFilter}
              defaultValue="all"
              options={DUE_OPTIONS}
              onChange={setDueDateFilter}
            />

            <FilterPill
              icon={<ArrowUpDown size={11} />}
              value={sortBy}
              defaultValue="newest"
              options={SORT_OPTIONS}
              onChange={setSortBy}
            />

            {/* Advanced toggle */}
            <button
              onClick={() => setShowAdvanced((v) => !v)}
              className={`relative flex items-center gap-1.5 h-8 px-2.5 rounded-lg border text-[11.5px] font-semibold transition-all ${
                showAdvanced || advancedActiveCount > 0
                  ? "border-primary/60 bg-primary/10 text-primary"
                  : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground"
              }`}
            >
              <Filter size={11} />
              <span>Lanjutan</span>
              <ChevronDown
                size={11}
                className={`opacity-50 transition-transform ${showAdvanced ? "rotate-180" : ""}`}
              />
            </button>

            {/* Reset */}
            {hasAnyFilter && (
              <button
                onClick={handleResetFilters}
                className="flex items-center gap-1 h-8 px-2.5 rounded-lg text-[11px] font-semibold text-destructive hover:bg-destructive/10 border border-transparent hover:border-destructive/20 transition-all"
              >
                <RotateCcw size={11} />
                <span className="hidden sm:inline">Reset</span>
              </button>
            )}

            {/* Fetching spinner */}
            {isFetching && (
              <Loader2
                size={13}
                className="animate-spin text-muted-foreground shrink-0"
              />
            )}

            {/* ✅ EXPORT EXCEL BUTTON (Admin Only) */}
            {[1, 11].includes(Number(user?.role_id)) && (
              <button
                onClick={handleExportExcel}
                className="flex items-center gap-1.5 h-8 px-3 ml-auto rounded-lg border border-border bg-card text-muted-foreground text-[11.5px] font-semibold hover:border-primary/50 hover:text-primary hover:bg-secondary transition-all shadow-sm"
                title="Export Laporan Excel"
              >
                <Download size={12} />
                <span className="hidden sm:inline">Export Excel</span>
              </button>
            )}
          </div>

          {/* Advanced panel */}
          {showAdvanced && (
            <div className="flex flex-wrap items-start gap-3 p-3 rounded-xl border border-border bg-card/80">
              {[1, 11].includes(Number(user?.role_id)) && (
                <div className="min-w-[180px] flex-1">
                  <UserSelection
                    placeholder="Filter by User..."
                    value={selectedUsers}
                    onChange={setSelectedUsers}
                  />
                </div>
              )}
              <div className="flex items-center gap-2 flex-wrap">
                <DatePicker
                  value={filter.start_date}
                  onChange={(date) =>
                    setFilter((f) => ({ ...f, start_date: formatDateDb(date) }))
                  }
                  label=""
                  placeholder="Dari Tanggal"
                  className="max-sm:w-full h-full w-[148px] bg-card border border-border rounded-lg text-xs"
                />
                <span className="text-muted-foreground text-xs max-sm:hidden">
                  —
                </span>
                <DatePicker
                  value={filter.end_date}
                  onChange={(date) =>
                    setFilter((f) => ({ ...f, end_date: formatDateDb(date) }))
                  }
                  label=""
                  placeholder="Sampai Tanggal"
                  className="max-sm:w-full h-full w-[148px] bg-card border border-border rounded-lg text-xs"
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-hidden relative flex flex-col">
        {activeTab === "Overview" && <OverviewTab tasksData={tasks} />}

        {activeTab === "Tasks" && (
          <div className="pt-3 h-full flex flex-col">
            {/* Board + sidebar */}
            <div className="relative flex flex-1 gap-4 sm:gap-6 overflow-hidden min-h-0">
              <div
                ref={boardRef}
                className="flex-1 overflow-x-auto overflow-y-hidden custom-scrollbar pb-1"
              >
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCorners}
                  onDragStart={handleDragStart}
                  onDragOver={handleDragOver}
                  onDragMove={handleDragMove}
                  onDragEnd={handleDragEnd}
                >
                  <div className="flex gap-3 sm:gap-4 md:gap-5 w-max h-full pb-4">
                    {columnsConfig.map((col) => (
                      <Column
                        key={col.id}
                        col={col}
                        tasks={displayTasks[col.id] ?? []}
                        isAdmin={[1, 11].includes(Number(user?.role_id))}
                        onEditTask={handleOpenEdit}
                        onChatTask={handleOpenComments}
                        registerColumnRef={registerColumnRef}
                        onSuccess={refetch}
                        selectedUsers={selectedUsers}
                      />
                    ))}
                  </div>

                  <DragOverlay
                    dropAnimation={{
                      sideEffects: defaultDropAnimationSideEffects({
                        styles: { active: { opacity: "0.4" } },
                      }),
                    }}
                  >
                    {activeTask ? (
                      <div className="opacity-95 shadow-2xl cursor-grabbing scale-[0.97]">
                        <TaskCardUI task={activeTask} />
                      </div>
                    ) : null}
                  </DragOverlay>
                </DndContext>
              </div>

              <TaskCalendarSidebar
                selectedUsers={selectedUsers}
                onEditTask={handleOpenEdit}
              />
            </div>

            {/* Load more bar — board-level, single source of truth */}
            {(hasMore || isFetching) && (
              <div className="shrink-0 flex items-center gap-3 py-2.5 border-t border-border mt-1">
                <button
                  onClick={() => setLimit((p) => p + STEP)}
                  disabled={isFetching}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-primary/30 bg-primary/10 text-primary text-[12px] font-semibold hover:bg-primary/15 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  {isFetching ? (
                    <Loader2 size={12} className="animate-spin" />
                  ) : (
                    <ChevronDown size={12} />
                  )}
                  {isFetching
                    ? "Memuat..."
                    : totalCount > 0
                      ? `Muat ${Math.min(STEP, totalCount - allLoadedTasks.length)} lagi`
                      : "Muat lebih banyak"}
                </button>

                {/* Progress bar */}
                {totalCount > 0 && (
                  <div className="flex items-center gap-2 flex-1 max-w-[160px]">
                    <div className="flex-1 h-1 rounded-full bg-secondary overflow-hidden">
                      <div
                        className="h-full rounded-full bg-primary/60 transition-all duration-500"
                        style={{
                          width: `${Math.min(100, (allLoadedTasks.length / totalCount) * 100)}%`,
                        }}
                      />
                    </div>
                    <span className="text-[10px] text-muted-foreground tabular-nums whitespace-nowrap">
                      {allLoadedTasks.length}/{totalCount}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <EditTaskModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        task={editingTask}
        mutate={mutateUpdate}
        isPending={isUpdating}
        updateLocalTask={updateLocalTask}
        refreshKanban={refetch}
      />
    </DashboardLayout>
  );
}
