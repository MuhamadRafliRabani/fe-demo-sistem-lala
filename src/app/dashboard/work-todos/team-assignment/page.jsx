"use client";

import { useState, useMemo, memo, useCallback } from "react";
import { useApiFetch } from "@/hooks/use-api-fetch";
import { useAuthStore } from "@/hooks/auth-store";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Loader2,
  Plus,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  User,
  CheckCircle2,
  Circle,
  Briefcase,
  Pencil,
} from "lucide-react";
import { toast } from "sonner";
import {
  format,
  startOfWeek,
  endOfWeek,
  addWeeks,
  subWeeks,
  addDays,
  isSameDay,
  parseISO,
  startOfDay,
  isWithinInterval,
} from "date-fns";
import { id } from "date-fns/locale";
import DashboardLayout from "@/components/layouts/dashboard-layout";
import { usePost, usePut } from "@/hooks/use-api-mutation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// --- HELPER COMPONENTS ---

const UserTaskCard = memo(function UserTaskCard({
  user,
  weekStart,
  weekEnd,
  todos,
  onAddTask,
  onEditTask,
}) {
  // Generate array of days for the week
  const days = useMemo(() => {
    const daysArr = [];
    let current = weekStart;
    while (current <= weekEnd) {
      daysArr.push(current);
      current = addDays(current, 1);
    }
    return daysArr;
  }, [weekStart, weekEnd]);

  // Group todos by date
  const todosByDate = useMemo(() => {
    const grouped = {};
    todos.forEach((todo) => {
      const dateStr = format(parseISO(todo.date), "yyyy-MM-dd");
      if (!grouped[dateStr]) grouped[dateStr] = [];
      grouped[dateStr].push(todo);
    });
    return grouped;
  }, [todos]);

  return (
    <Card className="flex flex-col h-full min-h-[500px] border-l-4 border-l-primary/20 shadow-sm hover:shadow-md transition-shadow">
      <CardHeader className="pb-3 bg-muted/30">
        <div className="flex items-center space-x-3">
          <Avatar className="h-10 w-10 border-2 border-background">
            <AvatarImage
              src={`https://ui-avatars.com/api/?name=${user.name}&background=random`}
            />
            <AvatarFallback>{user.name.substring(0, 2)}</AvatarFallback>
          </Avatar>
          <div>
            <CardTitle className="text-base font-bold text-foreground">
              {user.name}
            </CardTitle>
            <CardDescription className="text-xs truncate max-w-[150px]">
              {user.role?.name || "Staff"}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 p-0 overflow-hidden flex flex-col">
        <ScrollArea className="flex-1 p-3">
          <div className="space-y-4">
            {days.map((day) => {
              const dateKey = format(day, "yyyy-MM-dd");
              const dayTodos = todosByDate[dateKey] || [];
              const isToday = isSameDay(day, new Date());

              return (
                <div key={dateKey} className="space-y-1">
                  <div
                    className={`flex items-center justify-between px-2 py-1 rounded text-xs font-semibold ${
                      isToday
                        ? "bg-primary/10 text-primary"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    <span>{format(day, "EEEE, d MMM", { locale: id })}</span>
                    <Badge variant="outline" className="text-[10px] h-4 px-1">
                      {dayTodos.length}
                    </Badge>
                  </div>

                  {dayTodos.length === 0 ? (
                    <div className="text-[10px] text-muted-foreground italic px-2 py-1">
                      Tidak ada tugas
                    </div>
                  ) : (
                    <div className="space-y-1 pl-1">
                      {dayTodos.map((todo) =>
                        (todo.items || []).map((item) => (
                          <div
                            key={item.id}
                            className="group relative flex flex-col items-start bg-background border rounded p-2 text-xs hover:border-primary/50 transition-colors gap-1"
                          >
                            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onEditTask(user, item);
                                }}
                              >
                                <Pencil className="h-3 w-3" />
                              </Button>
                            </div>
                            <div className="flex items-start space-x-2 w-full">
                              {item.status === "done" ? (
                                <CheckCircle2 className="h-3 w-3 text-green-500 mt-0.5 shrink-0" />
                              ) : (
                                <Circle className="h-3 w-3 text-muted-foreground mt-0.5 shrink-0" />
                              )}
                              <div className="flex-1 min-w-0">
                                <p
                                  className={`font-medium ${
                                    item.status === "done"
                                      ? "line-through text-muted-foreground"
                                      : ""
                                  }`}
                                >
                                  {item.task_name}
                                </p>
                                {item.description && (
                                  <p className="text-[10px] text-muted-foreground line-clamp-2">
                                    {item.description}
                                  </p>
                                )}
                              </div>
                            </div>

                            {/* Task Type Details */}
                            {item.type === "quantity" && (
                              <div className="w-full pl-5">
                                <Badge
                                  variant="outline"
                                  className="text-[10px] h-5 px-1 bg-blue-50 text-blue-700 border-blue-200 w-full justify-between"
                                >
                                  <span>Target: {item.target_amount}</span>
                                  <span>
                                    {item.current_amount} / {item.target_amount}
                                  </span>
                                </Badge>
                              </div>
                            )}

                            {item.type === "progress" && (
                              <div className="w-full pl-5">
                                <Badge
                                  variant="outline"
                                  className="text-[10px] h-5 px-1 bg-purple-50 text-purple-700 border-purple-200 w-full justify-between"
                                >
                                  <span>Progress</span>
                                  <span>{item.progress_percentage}%</span>
                                </Badge>
                                <div className="h-1 w-full bg-gray-100 rounded-full mt-1 overflow-hidden">
                                  <div
                                    className="h-full bg-purple-500 rounded-full transition-all duration-500"
                                    style={{
                                      width: `${item.progress_percentage}%`,
                                    }}
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        )),
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </ScrollArea>
        <div className="p-3 border-t bg-muted/10">
          <Button
            size="sm"
            className="w-full text-xs"
            variant="outline"
            onClick={() => onAddTask(user)}
          >
            <Plus className="mr-2 h-3 w-3" /> Tambah Tugas
          </Button>
        </div>
      </CardContent>
    </Card>
  );
});

export default function TeamAssignmentPage() {
  const { user: authUser } = useAuthStore();
  // Week Navigation
  // Rolling 7 days starting from tomorrow by default
  const [viewStart, setViewStart] = useState(() => addDays(new Date(), 1));
  const viewEnd = useMemo(() => addDays(viewStart, 6), [viewStart]);

  const handlePrevWeek = () => setViewStart((prev) => subWeeks(prev, 1));
  const handleNextWeek = () => setViewStart((prev) => addWeeks(prev, 1));
  const handleToday = () => setViewStart(addDays(new Date(), 1));

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedRole, setSelectedRole] = useState("all");
  const [editingItem, setEditingItem] = useState(null);

  // Data Fetching
  // 1. Fetch Users (Subordinates or All)
  const { data: usersData, isLoading: usersLoading } = useApiFetch(
    ["users"],
    "/users",
  );
  const { data: rolesData } = useApiFetch(["roles"], "/roles");

  // 2. Fetch Todos for the week
  const todosFilter = useMemo(
    () => ({
      filter: {
        start_date: format(viewStart, "yyyy-MM-dd"),
        end_date: format(viewEnd, "yyyy-MM-dd"),
        // include_overdue: true,
      },
      include: "items",
      paginate: 300, // Fetch enough for the week
    }),
    [viewStart, viewEnd],
  );

  const {
    data: todosData,
    isLoading: todosLoading,
    refetch: refetchTodos,
  } = useApiFetch(["team-todos", todosFilter], "/work-todos", todosFilter);

  // Process Data
  const activeUsers = useMemo(() => {
    if (!usersData?.data) return [];
    let users = usersData?.data?.data.filter((u) => u.status !== "inactive");

    if (selectedRole && selectedRole !== "all") {
      users = users.filter((u) => u.role?.id === Number(selectedRole));
    }
    return users;
  }, [usersData, selectedRole]);

  const todosByUser = useMemo(() => {
    if (!todosData?.data) return {};
    const grouped = {};
    todosData.data.forEach((todo) => {
      if (!grouped[todo.user_id]) grouped[todo.user_id] = [];
      grouped[todo.user_id].push(todo);
    });
    return grouped;
  }, [todosData]);

  const [inputMode, setInputMode] = useState("single"); // single | bulk
  const [bulkText, setBulkText] = useState("");

  // Form State
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    priority: "medium",
    type: "checklist",
    target_amount: "",
    progress_percentage: "",
    date: format(new Date(), "yyyy-MM-dd"),
  });

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      priority: "medium",
      type: "checklist",
      target_amount: "",
      progress_percentage: "",
      date: format(new Date(), "yyyy-MM-dd"),
    });
    setBulkText("");
    setInputMode("single");
    setEditingItem(null);
  };

  // Mutation
  const { mutate, isLoading: isSubmitting } = usePost("/work-todos", {
    invalidate: [
      ["team-todos", todosFilter],
      ["todos", todosFilter],
    ],
    onSuccess: () => {
      toast.success("Tugas berhasil diberikan!");
      setIsModalOpen(false);
      resetForm();
    },
    onError: (err) => {
      toast.error(err?.message || "Gagal membuat tugas");
    },
  });

  const { mutate: updateMutate, isLoading: isUpdating } = usePut(
    (data) => `/work-todo-items/${editingItem?.id}`,
    {
      invalidate: [
        ["team-todos", todosFilter],
        ["todos", todosFilter],
      ],
      onSuccess: () => {
        toast.success("Tugas berhasil diperbarui!");
        setIsModalOpen(false);
        resetForm();
      },
      onError: (err) => {
        toast.error(err?.message || "Gagal memperbarui tugas");
      },
    },
  );

  const handleAddTaskClick = (user) => {
    setSelectedUser(user);
    setEditingItem(null);
    // Default date to viewStart (tomorrow by default)
    setFormData((prev) => ({
      ...prev,
      date: format(viewStart, "yyyy-MM-dd"),
    }));
    setIsModalOpen(true);
  };

  const handleEditTaskClick = (user, item) => {
    setSelectedUser(user);
    setEditingItem(item);
    setFormData({
      title: item.task_name,
      description: item.description || "",
      priority: "medium",
      type: item.type,
      target_amount: item.target_amount || "",
      progress_percentage: item.progress_percentage || "",
      date: format(new Date(), "yyyy-MM-dd"), // Not used for item update
    });
    setInputMode("single");
    setIsModalOpen(true);
  };

  const handleSubmit = () => {
    // Validate User Selection
    if (!selectedUser?.id) {
      toast.error(
        "Terjadi kesalahan: User tidak terpilih. Silakan muat ulang halaman.",
      );
      return;
    }

    if (editingItem) {
      // Handle Update
      if (!formData.title.trim()) {
        toast.error("Judul tugas wajib diisi");
        return;
      }

      const payload = {
        task_name: formData.title,
        description: formData.description,
        type: formData.type,
        target_amount: formData.target_amount
          ? Number(formData.target_amount)
          : null,
        progress_percentage: formData.progress_percentage
          ? Number(formData.progress_percentage)
          : 0,
      };

      updateMutate(payload);
      return;
    }

    let items = [];

    if (inputMode === "single") {
      if (!formData.title.trim()) {
        toast.error("Judul tugas wajib diisi");
        return;
      }

      if (formData.type === "quantity" && !formData.target_amount) {
        toast.error("Target jumlah wajib diisi untuk tugas tipe Quantity");
        return;
      }

      items.push({
        task_name: formData.title,
        description: formData.description,
        type: formData.type,
        target_amount: formData.target_amount
          ? Number(formData.target_amount)
          : null,
        current_amount: 0,
        progress_percentage: formData.progress_percentage
          ? Number(formData.progress_percentage)
          : 0,
        status: "pending",
      });
    } else {
      // Bulk Mode
      if (!bulkText.trim()) {
        toast.error("Daftar tugas tidak boleh kosong");
        return;
      }

      const lines = bulkText.split("\n").filter((l) => l.trim());
      if (lines.length === 0) {
        toast.error("Tidak ada tugas yang valid ditemukan");
        return;
      }

      items = lines.map((line) => ({
        task_name: line.trim(),
        description: "", // No description for bulk items to keep it simple
        type: formData.type, // Apply selected type to all
        target_amount: formData.target_amount
          ? Number(formData.target_amount)
          : null,
        current_amount: 0,
        progress_percentage: formData.progress_percentage
          ? Number(formData.progress_percentage)
          : 0,
        status: "pending",
      }));
    }

    const payload = {
      date: formData.date,
      user_id: selectedUser?.id,
      items: items,
    };

    mutate(payload);
  };

  if (usersLoading) {
    return (
      <DashboardLayout>
        <div className="flex h-[50vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title="Delegasi Tugas Tim"
      desc="Kelola dan pantau beban kerja tim dalam satu minggu."
    >
      <div className="space-y-6">
        {/* Header Control */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-background p-4 rounded-lg border shadow-sm sticky top-0 z-10">
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="icon" onClick={handlePrevWeek}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center space-x-2 px-4 py-2 bg-muted rounded-md min-w-[200px] justify-center font-medium">
              <CalendarIcon className="h-4 w-4 mr-2 text-muted-foreground" />
              <span>
                {format(viewStart, "d MMM", { locale: id })} -{" "}
                {format(viewEnd, "d MMM yyyy", { locale: id })}
              </span>
            </div>
            <Button variant="outline" size="icon" onClick={handleNextWeek}>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleToday}
              className="text-xs"
            >
              Reset (Mulai Besok)
            </Button>
          </div>

          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <User className="h-4 w-4" />
            <span>{activeUsers.length} Anggota Tim Aktif</span>
          </div>

          <div className="flex items-center space-x-2">
            <Select value={selectedRole} onValueChange={setSelectedRole}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Role</SelectItem>
                {rolesData?.data.map((role) => (
                  <SelectItem key={role.id} value={String(role.id)}>
                    {role.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Board Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-10">
          {activeUsers.map((user) => (
            <UserTaskCard
              key={user.id}
              user={user}
              weekStart={viewStart}
              weekEnd={viewEnd}
              todos={todosByUser[user.id] || []}
              onAddTask={handleAddTaskClick}
              onEditTask={handleEditTaskClick}
            />
          ))}
        </div>

        {/* Add Task Modal */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="sm:max-w-[500px] h-[85vh] flex flex-col p-0 gap-0">
            <DialogHeader className="p-6 pb-2 shrink-0">
              <DialogTitle>
                {editingItem ? "Edit Tugas" : "Beri Tugas Baru"}
              </DialogTitle>
              <DialogDescription>
                {editingItem ? (
                  "Ubah detail tugas."
                ) : (
                  <>
                    Delegasikan tugas untuk{" "}
                    <strong>{selectedUser?.name}</strong>.
                  </>
                )}
              </DialogDescription>
            </DialogHeader>

            <div className="flex-1 overflow-y-auto px-6 py-2">
              <div className="grid gap-4 py-2">
                {!editingItem && (
                  <div className="grid gap-2">
                    <Label htmlFor="date">Tanggal Pengerjaan</Label>
                    <Input
                      id="date"
                      type="date"
                      value={formData.date}
                      onChange={(e) =>
                        setFormData({ ...formData, date: e.target.value })
                      }
                      // No min/max restriction to allow adding tasks for any date
                    />
                  </div>
                )}

                <Tabs
                  value={inputMode}
                  onValueChange={setInputMode}
                  className="w-full"
                >
                  {!editingItem && (
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="single">Satu Tugas</TabsTrigger>
                      <TabsTrigger value="bulk">
                        Banyak Tugas (Bulk)
                      </TabsTrigger>
                    </TabsList>
                  )}

                  <TabsContent value="single" className="space-y-4 mt-4">
                    <div className="grid gap-2">
                      <Label htmlFor="type">Tipe Tugas</Label>
                      <Select
                        value={formData.type}
                        onValueChange={(val) =>
                          setFormData({ ...formData, type: val })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="checklist">
                            Checklist (Biasa)
                          </SelectItem>
                          <SelectItem value="quantity">
                            Target Jumlah (Quantity)
                          </SelectItem>
                          <SelectItem value="progress">
                            Persentase Progress
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="title">Judul Tugas</Label>
                      <Input
                        id="title"
                        value={formData.title}
                        onChange={(e) =>
                          setFormData({ ...formData, title: e.target.value })
                        }
                        placeholder="Contoh: Buat Laporan Harian"
                      />
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="description">Deskripsi (Opsional)</Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            description: e.target.value,
                          })
                        }
                        placeholder="Tambahkan detail tugas..."
                      />
                    </div>

                    {formData.type === "quantity" && (
                      <div className="grid gap-2">
                        <Label htmlFor="target_amount">Target Jumlah</Label>
                        <Input
                          id="target_amount"
                          type="number"
                          value={formData.target_amount}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              target_amount: e.target.value,
                            })
                          }
                          placeholder="0"
                        />
                      </div>
                    )}

                    {formData.type === "progress" && (
                      <div className="grid gap-2">
                        <Label htmlFor="progress_percentage">
                          Progress Awal (%)
                        </Label>
                        <Input
                          id="progress_percentage"
                          type="number"
                          min="0"
                          max="100"
                          value={formData.progress_percentage}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              progress_percentage: e.target.value,
                            })
                          }
                          placeholder="0"
                        />
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="bulk" className="space-y-4 mt-4">
                    <div className="grid gap-2">
                      <Label htmlFor="bulkText">
                        Daftar Tugas (Satu per baris)
                      </Label>
                      <Textarea
                        id="bulkText"
                        value={bulkText}
                        onChange={(e) => setBulkText(e.target.value)}
                        placeholder={"Tugas 1\nTugas 2\nTugas 3"}
                        className="min-h-[200px]"
                      />
                      <p className="text-xs text-muted-foreground">
                        Setiap baris akan menjadi satu tugas terpisah.
                      </p>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </div>

            <DialogFooter className="p-6 pt-2 shrink-0">
              <Button
                variant="outline"
                onClick={() => setIsModalOpen(false)}
                disabled={isSubmitting || isUpdating}
              >
                Batal
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting || isUpdating}
              >
                {(isSubmitting || isUpdating) && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {editingItem ? "Simpan Perubahan" : "Simpan Tugas"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
