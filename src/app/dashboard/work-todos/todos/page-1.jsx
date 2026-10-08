"use client";
import React, { useState, useEffect, useRef } from "react";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
  defaultDropAnimationSideEffects,
  useDroppable,
  useDraggable,
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import {
  MoreVertical,
  Plus,
  Table as TableIcon,
  List as ListIcon,
  Layout,
  Calendar,
  Download,
} from "lucide-react";
import { useDateRange } from "@/lib/date-range";
import { formatDateDb } from "@/lib/date-format-db";
import { useApiFetch } from "@/hooks/use-api-fetch";
import { usePost, usePut } from "@/hooks/use-api-mutation";
import { useUnreadCounts, useChatRooms } from "@/hooks/use-chat";
import { toast } from "sonner";
import DashboardLayout from "@/components/layouts/dashboard-layout";
import { EditTaskModal } from "../modal/modal-update-item-todo";
import { CreateTaskModal } from "../modal/modal-create-item-todo";
import { OverviewTab } from "../components/overview";
import Loader from "@/components/ui/loader";
import { DatePicker } from "@/components/date-picker";
import { useAuthStore } from "@/hooks/auth-store";
import { TaskCardUI } from "../components/task-card";
import { useCommentCounts } from "@/hooks/use-todo-comments";
import { UserSelection } from "@/components/user-selection";
import { columnsConfig } from "@/data/collum-task-status-config";
import { InlineCreateTask } from "../components/create-taks";
import { downloadFile } from "@/lib/download-file";
import { formatDate } from "@/lib/date-format";

const SortableTask = ({
  task,
  onEdit,
  onChat,
  unreadCount = 0,
  commentCount = 0,
  isAdmin = false,
}) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: task.id,
      data: task,
      disabled: false,
    });

  const style = {
    transform: transform
      ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
      : "none",
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="mb-4 touch-none select-none"
    >
      <TaskCardUI
        task={task}
        isDragging={isDragging}
        onEdit={onEdit}
        onChat={onChat}
        isAdmin={isAdmin}
        unreadCount={unreadCount}
        commentCount={commentCount}
        onOpenComments={onChat}
      />
    </div>
  );
};

const Column = ({
  col,
  tasks,
  onEditTask,
  onAddTask,
  onChatTask,
  registerColumnRef,
  chatRooms = [],
  unreadCountsData = {},
  commentCountsData = {},
  columnId,
  onSuccess,
  selectedUsers,
  isAdmin = false,
}) => {
  const { setNodeRef } = useDroppable({ id: col.id });
  const [isCreating, setIsCreating] = useState(false);

  const getTaskUnreadCount = (task) => {
    const idStr = String(task?.id ?? "").toLowerCase();
    const nameStr = String(task?.task_name ?? "").toLowerCase();
    const patterns = [
      `todo #${idStr}`,
      `#${idStr}`,
      `todo:${idStr}`,
      nameStr,
    ].filter(Boolean);

    let total = 0;
    chatRooms.forEach((room) => {
      const topic = String(room?.topic ?? "").toLowerCase();
      const name = String(room?.name ?? "").toLowerCase();
      const desc = String(room?.description ?? "").toLowerCase();
      const hay = `${topic} ${name} ${desc}`;
      const matchedByText = patterns.some((p) => p && hay.includes(p));
      let matchedByLocal = false;
      try {
        const m = localStorage.getItem(`room_todo_${room.id}`);
        matchedByLocal = m && String(m) === String(task?.id);
      } catch {}
      const matched = matchedByText || matchedByLocal;
      if (matched) {
        total += Number(unreadCountsData?.[room.id] || 0);
      }
    });
    return total;
  };

  return (
    <div
      ref={setNodeRef}
      className="flex w-[340px] flex-shrink-0 flex-col bg-[#152733]/40 border border-[#363430] rounded-2xl p-4 overflow-hidden"
    >
      {/* Column Header */}
      <div className="mb-4 flex items-center justify-between pb-3 border-b border-[#363430]">
        <div className="flex items-center gap-2.5">
          <div
            className={`h-3 w-3 rounded-full ${col.dotColor} shadow-[0_0_8px_${col.dotColor}]`}
          />
          <h3 className="font-bold text-[#fffdf5] text-[15px] tracking-wide">
            {col.title}
          </h3>
          <span
            className={`ml-1 flex h-6 w-6 items-center justify-center rounded-full ${col.bgColor} border ${col.borderColor} text-[11px] font-bold text-[#fffdf5]`}
          >
            {tasks.length}
          </span>
        </div>
        <button className="text-[#cfc9bd] hover:text-[#fffdf5] hover:bg-[#1e2732] p-1.5 rounded-lg transition-colors">
          <MoreVertical size={16} />
        </button>
      </div>

      <button
        // onClick={() => onAddTask(col.id)}
        onClick={() => setIsCreating(true)}
        className="mb-4 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-[#363430] bg-transparent py-2.5 text-[13px] font-bold text-[#cfc9bd] hover:bg-[#1e2732] hover:text-[#fed818] hover:border-[#fed818]/50 transition-all duration-300 shrink-0"
      >
        <Plus size={16} /> Tambah Tugas
      </button>

      {/* Column Body */}
      <div
        ref={(el) => registerColumnRef && registerColumnRef(col.id, el)}
        className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar rounded-xl pr-1"
      >
        {isCreating && (
          <InlineCreateTask
            columnId={col.id}
            onClose={() => setIsCreating(false)}
            onSuccess={onSuccess}
            selectedUsers={selectedUsers}
          />
        )}

        {tasks.map((task, index) => {
          const showDateHeader =
            index === 0 || task.parent_date !== tasks[index - 1].parent_date;
          return (
            <React.Fragment key={task.id}>
              {showDateHeader && (
                <div className="mb-4 flex items-center gap-2 sticky top-0 z-10 backdrop-blur-md py-1.5">
                  <Calendar size={12} className="text-[#cfc9bd]" />
                  <span className="text-[10px] font-extrabold text-[#fed818] uppercase tracking-widest">
                    {formatDate(task.parent_date)}
                  </span>
                </div>
              )}
              <SortableTask
                task={task}
                onEdit={onEditTask}
                onChat={onChatTask}
                isAdmin={isAdmin}
                unreadCount={task.unread_comments_count || 0}
                commentCount={task.comments_count || 0}
              />
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

export default function KanbanApp() {
  const [activeTab, setActiveTab] = useState("Tasks");
  const [activeView, setActiveView] = useState("Board");
  const [tasks, setTasks] = useState({
    pending: [],
    on_progress: [],
    done: [],
  });
  const [activeTask, setActiveTask] = useState(null);
  const { user } = useAuthStore();
  const [selectedUsers, setSelectedUsers] = useState([]);

  const { start, end } = useDateRange("this_month");
  const { start: todayStart, end: todayEnd } = useDateRange("today");

  const [selectedItem, setSelectedItem] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createColumnId, setCreateColumnId] = useState(null);

  const [filter, setFilter] = useState({
    page: 1,
    paginate: 15,
    sort: "-date",
    include: "user",
    filter: {
      start_date: formatDateDb(start),
      end_date: formatDateDb(todayStart),
      user_id: null,
    },
  });

  useEffect(() => {
    if (user?.id) {
      setFilter((prev) => ({
        ...prev,
        filter: {
          ...prev.filter,
          user_id: ![1, 11].includes(Number(user.role_id))
            ? Number(user.id)
            : selectedUsers.length > 0
              ? selectedUsers
              : null,
        },
      }));
    }
  }, [user, selectedUsers]);

  const {
    data: apiDataResponse,
    isLoading: isApiLoading,
    refetch,
  } = useApiFetch(["work-todos", filter], "/work-todos", filter, true);

  const { mutate: mutateUpdate, isPending: isUpdating } = usePut(
    `/work-todo-items/${selectedItem}`,
    { invalidate: [["work-todos"]] },
  );
  const { mutate: pullYesterdayItems, isPending: isPullingYesterdayItems } =
    usePost("/work-todos/pull-yesterday-items", {
      invalidate: [["work-todos"]],
    });
  const [discussionRoomId, setDiscussionRoomId] = useState(null);
  const { rooms: chatRooms } = useChatRooms(discussionRoomId);
  const unreadCounts = useUnreadCounts();
  const commentCounts = useCommentCounts();

  const [isDiscussionOpen, setIsDiscussionOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [isCommentOpen, setIsCommentOpen] = useState(false);
  const [commentTask, setCommentTask] = useState(null);

  const handleOpenComments = (task) => {
    setSelectedTask(task);
    setIsDiscussionOpen(true);
  };

  useEffect(() => {
    if (apiDataResponse?.data) {
      const allItems = apiDataResponse.data.flatMap((todo) => {
        return (todo.items || []).map((item) => ({
          ...item,
          description: item.description || "",
          parent_date: todo.date,
          user_name: todo.user?.name,
          user_avatar: todo.user?.avatar,
          parent_todo_id: todo.id,
          approve_status: item.approve_status,
          due_date: item.due_date,
          evidence: item.evidence,
          note: item.note,
          parent_user_id: todo.user?.id,
          user_id: todo.user?.id,
          // PASTIKAN DATA KOMENTAR DITAMPUNG
          comments_count: item.comments_count || 0,
          unread_comments_count: item.unread_comments_count || 0,
        }));
      });

      setTasks({
        pending: allItems.filter((i) => i.status === "pending"),
        on_progress: allItems.filter(
          (i) => i.status === "on_progress" || i.status === "progress",
        ),
        done: allItems.filter((i) => i.status === "done"),
      });
    }
  }, [apiDataResponse]);

  const handleOpenEdit = (task) => {
    setSelectedItem(task.id);
    setEditingTask(task);
    setIsEditModalOpen(true);
  };

  const handleOpenCreate = (columnId) => {
    setCreateColumnId(columnId);
    setIsCreateModalOpen(true);
  };

  const updateLocalTask = (updatedTask) => {
    setTasks((prev) => {
      const newTasks = { ...prev };
      for (const colId in newTasks) {
        const index = newTasks[colId].findIndex((t) => t.id === updatedTask.id);
        if (index !== -1) {
          newTasks[colId][index] = {
            ...newTasks[colId][index],
            ...updatedTask,
          };
          break;
        }
      }
      return newTasks;
    });
  };

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 3 } }),
  );
  const boardRef = useRef(null);
  const blockedDragRef = useRef(null);
  const columnRefs = useRef({});
  const registerColumnRef = (id, el) => {
    if (el) columnRefs.current[id] = el;
  };

  const findContainerOfTask = (id) => {
    return (
      Object.keys(tasks).find((key) =>
        tasks[key].find((task) => task.id === id),
      ) || (id in tasks ? id : null)
    );
  };

  const handleDragStart = (event) => {
    const containerId = findContainerOfTask(event.active.id);
    const task = tasks[containerId]?.find((t) => t.id === event.active.id);
    const isApproved =
      String(task?.approve_status || "").toLowerCase() === "approved";
    const isPending = String(task?.status || "").toLowerCase() === "pending";

    if (!isApproved) {
      toast.error("Task belum di-approve, tidak bisa dipindahkan!");
      blockedDragRef.current = event.active.id;
      setActiveTask(null);
      return;
    }

    blockedDragRef.current = null;
    setActiveTask(task || null);
  };

  const handleDragOver = (event) => {
    const { active } = event;
    setSelectedItem(active.id);
  };

  const handleDragMove = (event) => {
    const e = event.activatorEvent;
    const x = e && "clientX" in e ? e.clientX : null;
    const y = e && "clientY" in e ? e.clientY : null;
    if (boardRef.current && x !== null) {
      const rect = boardRef.current.getBoundingClientRect();
      const t = 80;
      if (x - rect.left < t) boardRef.current.scrollLeft -= 20;
      else if (rect.right - x < t) boardRef.current.scrollLeft += 20;
    }
    const over = event.over;
    if (over && y !== null) {
      const overContainer = findContainerOfTask(over.id);
      const el = columnRefs.current[overContainer];
      if (el) {
        const r = el.getBoundingClientRect();
        const t = 60;
        if (y - r.top < t) el.scrollTop -= 16;
        else if (r.bottom - y < t) el.scrollTop += 16;
      }
    }
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (
      blockedDragRef.current &&
      String(blockedDragRef.current) === String(active.id)
    ) {
      blockedDragRef.current = null;
      setActiveTask(null);
      return;
    }

    const fromContainer = findContainerOfTask(active.id);
    const toContainer = over ? findContainerOfTask(over.id) : null;

    if (!over || !fromContainer) {
      setActiveTask(null);
      return;
    }

    const activeIndex = tasks[fromContainer].findIndex(
      (t) => t.id === active.id,
    );
    const overIndex = toContainer
      ? tasks[toContainer].findIndex((t) => t.id === over.id)
      : -1;

    // Jika di kolom yang sama, hanya reorder vertikal
    if (fromContainer === toContainer) {
      if (activeIndex !== overIndex && overIndex !== -1) {
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

    // Jika pindah kolom (cross-column)
    if (toContainer && toContainer in tasks) {
      const previousTasks = { ...tasks };
      const movedItem = tasks[fromContainer][activeIndex];
      const newIndex = overIndex >= 0 ? overIndex : tasks[toContainer].length;

      setTasks((prev) => ({
        ...prev,
        [fromContainer]: prev[fromContainer].filter(
          (item) => item.id !== active.id,
        ),
        [toContainer]: [
          ...prev[toContainer].slice(0, newIndex),
          { ...movedItem, status: toContainer },
          ...prev[toContainer].slice(newIndex),
        ],
      }));

      const originalStatus = activeTask?.status;
      const newStatus = toContainer;

      if (originalStatus && originalStatus !== newStatus) {
        const updatePayload = { ...movedItem, status: newStatus };

        // When task is moved to done, require approval again (pending_approval flow)
        if (newStatus === "done") {
          updatePayload.approve_status = "pending";
        }

        toast.promise(
          new Promise((resolve, reject) => {
            mutateUpdate(updatePayload, {
              onSuccess: () => resolve(),
              onError: (err) => {
                const errorMessage =
                  err?.response?.data?.errors?.time?.[0] ||
                  err?.response?.data?.message ||
                  "Gagal untuk menyimpan!";
                setTasks(previousTasks);
                reject(errorMessage);
              },
            });
          }),
          {
            loading: "Menyimpan...",
            success: "Status berhasil diupdate!",
            error: (msg) => (msg ? msg : "Gagal untuk menyimpan!"),
          },
        );
      }
    }

    setActiveTask(null);
  };

  if (isApiLoading && !apiDataResponse?.data) {
    return <Loader />;
  }

  const handlePullYesterdayItems = () => {
    const payload = {
      date: formatDateDb(new Date()),
      users: [1, 11].includes(Number(user?.role_id))
        ? selectedUsers?.length
          ? selectedUsers
          : undefined
        : user?.id
          ? [Number(user.id)]
          : undefined,
    };

    toast.promise(
      new Promise((resolve, reject) => {
        pullYesterdayItems(payload, {
          onSuccess: (response) => resolve(response),
          onError: (error) =>
            reject(
              error?.response?.data?.message || "Gagal menarik tugas kemarin",
            ),
        });
      }),
      {
        loading: "Menarik tugas kemarin...",
        success: "Tugas kemarin berhasil ditarik",
        error: (message) => message || "Gagal menarik tugas kemarin",
      },
    );
  };

  const handleDownloadAnalyticsExcel = async () => {
    try {
      const userIdFilter = filter?.filter?.user_id;
      const userIdParam = Array.isArray(userIdFilter)
        ? userIdFilter.filter(Boolean).join(",")
        : userIdFilter
          ? String(userIdFilter)
          : "";

      const params = new URLSearchParams({
        start_date: String(filter.filter.start_date || ""),
        end_date: String(filter.filter.end_date || ""),
      });
      if (userIdParam) params.set("user_id", userIdParam);

      await downloadFile(
        `/work-todos-analytics/export?${params.toString()}`,
        "todo_Analytics.xlsx",
      );
      toast.success("Export analytics berhasil diunduh");
    } catch (error) {
      toast.error("Gagal export analytics");
    }
  };

  return (
    <DashboardLayout>
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 z-10 relative mb-4">
        <div className="flex items-center gap-5">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#06b6d4]/10 border border-[#06b6d4]/30 text-[#06b6d4] shadow-inner">
            <Layout size={22} />
          </div>
          <div>
            <h1 className="text-[24px] font-bold text-[#fffdf5] tracking-tight leading-none mb-2">
              Canban Board Tasks
            </h1>
            <p
              title="description"
              className="text-[13.5px] w-2/3 text-[#fffdf5] "
            >
              board ini memudahkan Anda untuk mengatur dan mengelola tugas Anda
              dengan efisien.
            </p>
          </div>
        </div>
      </header>

      {/* SUB-HEADER: CONTROL BAR */}
      <div className="flex flex-col md:flex-row items-center justify-between border-b  border-[#363430] md:px-8 z-0 relative gap-4 md:py-2 w-full">
        <div className="flex gap-8 overflow-x-auto overflow-y-hidden hide-scrollbar ">
          {["Overview", "Tasks"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-4 text-[13px] font-bold whitespace-nowrap transition-colors relative tracking-wide uppercase ${
                activeTab === tab
                  ? "text-[#fed818]"
                  : "text-[#cfc9bd] hover:text-[#fffdf5]"
              }`}
            >
              {tab}
              {activeTab === tab && (
                <span className="absolute bottom-[-1px] left-0 w-full h-[3px] bg-[#fed818] rounded-t-full shadow-[0_-2px_8px_rgba(254,216,24,0.5)]" />
              )}
            </button>
          ))}
        </div>

        <div className="flex items-center max-md:flex-wrap md:justify-center max-md:w-full gap-4 justify-center mb-3 md:mb-0">
          <div className="max-md:grid grid-cols-2 md:flex max-md:w-full gap-4 mb-3 md:mb-0">
            {[1, 11].includes(Number(user?.role_id)) && (
              <button
                onClick={handleDownloadAnalyticsExcel}
                className="flex items-center gap-2 max-md:col-span-1 rounded-xl border border-[#135a86] bg-[#135a86]/15 justify-center md:px-3 md:py-2 text-[12px] font-bold text-[#fffdf5] hover:bg-[#135a86]/25 transition-colors"
              >
                <Download size={14} className="text-[#fed818]" />
                Export <span className="hidden md:inline">Analytics Excel</span>
              </button>
            )}
            <button
              onClick={handlePullYesterdayItems}
              disabled={isPullingYesterdayItems}
              className="flex items-center gap-2 rounded-xl max-md:col-span-1 border border-[#135a86] bg-[#135a86]/15 px-3 py-2 text-[12px] font-bold text-[#fffdf5] hover:bg-[#135a86]/25 disabled:opacity-60 transition-colors"
            >
              <Download size={14} className="text-[#fed818]" />
              {isPullingYesterdayItems ? "Menarik..." : "Tarik Tugas Kemarin"}
            </button>
          </div>

          <UserSelection
            placeholder="Pilih Users..."
            value={selectedUsers}
            onChange={setSelectedUsers}
          />
          <div className="flex items-center gap-5 ">
            <DatePicker
              value={filter.filter.start_date}
              onChange={(date) =>
                setFilter({
                  ...filter,
                  filter: { ...filter.filter, start_date: formatDateDb(date) },
                })
              }
              label=""
              placeholder="Start Date"
              className="w-full sm:w-[150px] bg-transparent border-none text-xs"
            />
            <span className="text-[#363430] hidden sm:inline font-bold">/</span>
            <DatePicker
              value={filter.filter.end_date}
              onChange={(date) =>
                setFilter({
                  ...filter,
                  filter: { ...filter.filter, end_date: formatDateDb(date) },
                })
              }
              label=""
              placeholder="End Date"
              className="w-full sm:w-[150px] bg-transparent border-none text-xs"
            />
          </div>
        </div>
      </div>

      {/* KONTEN UTAMA */}
      <div className="flex-1 overflow-hidden  relative flex flex-col bg-[#0f1a22]">
        {activeTab === "Overview" && <OverviewTab tasksData={tasks} />}

        {activeTab === "Tasks" && activeView === "Board" && (
          <div className="md:pt-8 h-full">
            <div className="flex h-full gap-6">
              <div
                ref={boardRef}
                className={`flex-1 overflow-x-auto overflow-y-hidden custom-scrollbar ${isDiscussionOpen ? "min-w-[calc(100%-420px)]" : "w-full"}`}
              >
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCorners}
                  onDragStart={handleDragStart}
                  onDragOver={handleDragOver}
                  onDragMove={handleDragMove}
                  onDragEnd={handleDragEnd}
                >
                  <div className="flex gap-6 w-max h-full pb-4">
                    {columnsConfig.map((col) => (
                      <Column
                        key={col.id}
                        col={col}
                        tasks={tasks[col.id] || []}
                        isAdmin={[1, 11].includes(Number(user?.role_id))}
                        onEditTask={handleOpenEdit}
                        onAddTask={handleOpenCreate}
                        onChatTask={handleOpenComments}
                        registerColumnRef={registerColumnRef}
                        chatRooms={chatRooms}
                        unreadCountsData={unreadCounts}
                        commentCountsData={commentCounts}
                        columnId={createColumnId}
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
                      <div className="opacity-95 shadow-2xl cursor-grabbing">
                        <TaskCardUI task={activeTask} />
                      </div>
                    ) : null}
                  </DragOverlay>
                </DndContext>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* MODALS */}
      <EditTaskModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        task={editingTask}
        mutate={mutateUpdate}
        isPending={isUpdating}
        updateLocalTask={updateLocalTask}
      />
    </DashboardLayout>
  );
}
