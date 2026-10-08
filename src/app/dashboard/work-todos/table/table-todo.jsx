"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableHead,
  TableRow,
  TableHeader,
  TableCell,
  TableBody,
} from "@/components/ui/table";
import {
  IconPlus,
  IconChevronDown,
  IconChevronRight,
  IconListCheck,
  IconHash,
  IconChartBar,
  IconPencil,
} from "@tabler/icons-react";
import {
  canCreateTodo,
  getCreateTimeValidationMessage,
} from "@/lib/todo-time-validation";
import { toast } from "sonner";
import { useApiFetch } from "@/hooks/use-api-fetch";
import { useRouter } from "next/navigation";
import { formatDate } from "@/lib/date-format";
import { formatDateDb } from "@/lib/date-format-db";
import { useDateRange } from "@/lib/date-range";
import { DatePicker } from "@/components/date-picker";
import { Badge } from "@/components/ui/badge";
import ActionTable from "@/components/action-table";
import { useQueryClient } from "@tanstack/react-query";
import EditTodoSheet from "../components/edit-todo-sheet";
import EditTodoItemSheet from "../components/edit-todo-item-sheet";
import { TableSkeleton } from "@/components/skeletn-item-table";
import { PaginationBar } from "@/components/pagination-bar";
import { useAuthStore } from "@/hooks/auth-store";

const TableTodo = () => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { start, end } = useDateRange("this_month");
  const { user } = useAuthStore();
  const [paginate, setPaginate] = useState(15);
  const [filter, setFilter] = useState({
    page: 1,
    paginate: 15,
    sort: "-date",
    filter: {
      start_date: formatDateDb(start),
      end_date: formatDateDb(end),
      user_id: null,
    },
  });

  useEffect(() => {
    if (user?.id) {
      setFilter((prev) => ({
        ...prev,
        filter: {
          ...prev.filter,
          user_id: Number(user.role_id) !== 1 ? Number(user.id) : null,
        },
      }));
    }
  }, [user]);

  const { data, isLoading, refetch } = useApiFetch(
    [["work-todos"], filter], // Dibuat seperti ini agar lebih rapi
    "/work-todos",
    filter,
    !!user?.id,
  );

  const todos = data?.data || [];
  const lastPage = data?.data?.last_page ?? 1;
  const totalCount = data?.data?.total ?? todos.length;

  // State for Edit Sheet
  const [editSheetOpen, setEditSheetOpen] = useState(false);
  const [editingTodoId, setEditingTodoId] = useState(null);

  // State for Edit Item Sheet
  const [editItemSheetOpen, setEditItemSheetOpen] = useState(false);
  const [editingItemId, setEditingItemId] = useState(null);
  const [editingTodoIdForItem, setEditingTodoIdForItem] = useState(null);

  // State for expanded rows
  const [expandedRows, setExpandedRows] = useState(new Set());

  const toggleRowExpansion = (todoId, e) => {
    // Prevent expansion when clicking on action buttons
    if (
      e.target.closest(".action-table-container") ||
      e.target.closest("button")
    ) {
      return;
    }

    setExpandedRows((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(todoId)) {
        newSet.delete(todoId);
      } else {
        newSet.add(todoId);
      }
      return newSet;
    });
  };

  const handleEditTodo = (todoId) => {
    setEditingTodoId(todoId);
    setEditSheetOpen(true);
  };

  const handleEditItem = (todoId, itemId) => {
    setEditingTodoIdForItem(todoId);
    setEditingItemId(itemId);
    setEditItemSheetOpen(true);
  };

  const handleSheetSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ["work-todos"] });
    setEditSheetOpen(false);
    setEditItemSheetOpen(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <DatePicker
            value={filter.start_date}
            onChange={(date) =>
              setFilter({ ...filter, start_date: formatDateDb(date) })
            }
            label="Dari Tanggal"
          />
          <DatePicker
            value={filter.end_date}
            onChange={(date) =>
              setFilter({ ...filter, end_date: formatDateDb(date) })
            }
            label="Sampai Tanggal"
          />
        </div>
        <Button
          onClick={() => {
            if (!canCreateTodo()) {
              toast.error(getCreateTimeValidationMessage());
              return;
            }
            router.push("/dashboard/work-todos/create");
          }}
        >
          <IconPlus className="mr-2 h-4 w-4" />
          Tambah Todo
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="sticky left-0 bg-background z-10 whitespace-nowrap w-12">
                {/* Empty for expand icon */}
              </TableHead>
              <TableHead className="sticky left-12 bg-background z-10 whitespace-nowrap">
                Aksi
              </TableHead>
              <TableHead className="whitespace-nowrap">Tanggal</TableHead>
              <TableHead className="whitespace-nowrap">User</TableHead>
              <TableHead className="whitespace-nowrap">Total Tasks</TableHead>
              <TableHead className="whitespace-nowrap">Done</TableHead>
              <TableHead className="whitespace-nowrap">On Progress</TableHead>
              <TableHead className="whitespace-nowrap">Pending</TableHead>
              <TableHead className="whitespace-nowrap">% Selesai</TableHead>
            </TableRow>
          </TableHeader>
          {isLoading ? (
            <TableSkeleton
              rows={paginate}
              columns={[
                { key: "expand", label: "" },
                { key: "action", label: "Aksi" },
                { key: "date", label: "Tanggal" },
                { key: "user", label: "User" },
                { key: "tasks", label: "Total Tasks" },
                { key: "done", label: "Done" },
                { key: "on_progress", label: "On Progress" },
                { key: "pending", label: "Pending" },
                { key: "completion", label: "% Selesai" },
              ]}
              includeAction={true}
            />
          ) : (
            <TableBody>
              {todos.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8">
                    Tidak ada data
                  </TableCell>
                </TableRow>
              ) : (
                todos.map((todo) => {
                  const totalItems = todo.items?.length || 0;
                  const doneItems =
                    todo.items?.filter((i) => i.status === "done").length || 0;
                  const onProgressItems =
                    todo.items?.filter((i) => i.status === "on_progress")
                      .length || 0;
                  const pendingItems =
                    todo.items?.filter((i) => i.status === "pending").length ||
                    0;
                  const completionRate =
                    totalItems > 0
                      ? Math.round((doneItems / totalItems) * 100)
                      : 0;
                  const isExpanded = expandedRows.has(todo.id);
                  const hasItems = totalItems > 0;

                  return (
                    <>
                      <TableRow
                        key={todo.id}
                        className={`cursor-pointer hover:bg-muted/50 ${isExpanded ? "bg-muted/30" : ""}`}
                        onClick={(e) =>
                          hasItems && toggleRowExpansion(todo.id, e)
                        }
                      >
                        <TableCell className="sticky left-0 bg-background z-10 whitespace-nowrap w-12">
                          {hasItems ? (
                            <div className="flex items-center justify-center w-6 h-6">
                              {isExpanded ? (
                                <IconChevronDown className="h-4 w-4 text-muted-foreground" />
                              ) : (
                                <IconChevronRight className="h-4 w-4 text-muted-foreground" />
                              )}
                            </div>
                          ) : (
                            <div className="w-6 h-6" />
                          )}
                        </TableCell>
                        <TableCell className="sticky left-12 bg-background z-10 whitespace-nowrap">
                          <div
                            className="action-table-container"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <ActionTable
                              id={todo.id}
                              url="/work-todos"
                              urlDelete={`/work-todos/${todo.id}`}
                              isEdit={true}
                              isDelete={true}
                              refetch={refetch}
                              onEdit={() => handleEditTodo(todo.id)}
                            />
                          </div>
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          {formatDate(todo.date)}
                        </TableCell>
                        <TableCell className="whitespace-nowrap font-medium">
                          {todo.user?.name || "-"}
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          <span className="font-medium">{totalItems}</span>
                          {hasItems && (
                            <span className="text-xs text-muted-foreground ml-1">
                              task{totalItems > 1 ? "s" : ""}
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          <Badge
                            variant="default"
                            className="bg-green-600 hover:bg-green-700"
                          >
                            {doneItems}
                          </Badge>
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          <Badge
                            variant="default"
                            className="bg-blue-600 hover:bg-blue-700"
                          >
                            {onProgressItems}
                          </Badge>
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          <Badge variant="secondary">{pendingItems}</Badge>
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div
                                className={`h-full transition-all ${
                                  completionRate === 100
                                    ? "bg-green-600"
                                    : completionRate >= 50
                                      ? "bg-blue-600"
                                      : "bg-orange-500"
                                }`}
                                style={{ width: `${completionRate}%` }}
                              />
                            </div>
                            <span className="text-sm font-medium">
                              {completionRate}%
                            </span>
                          </div>
                        </TableCell>
                      </TableRow>
                      {isExpanded && hasItems && (
                        <TableRow
                          key={`${todo.id}-detail`}
                          className="bg-muted/20"
                        >
                          <TableCell colSpan={9} className="p-0">
                            <div className="p-4 bg-background border-t">
                              <div className="space-y-3">
                                <div className="flex items-center justify-between mb-3">
                                  <h4 className="text-sm font-semibold text-foreground">
                                    Detail Tasks
                                  </h4>
                                  <Badge variant="outline" className="text-xs">
                                    {totalItems} total
                                  </Badge>
                                </div>
                                <div className="grid gap-3">
                                  {todo.items?.map((item, idx) => (
                                    <div
                                      key={item.id}
                                      className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors group relative"
                                    >
                                      <div className="shrink-0 w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs font-medium text-muted-foreground mt-0.5">
                                        {idx + 1}
                                      </div>
                                      <div className="flex-1 min-w-0 space-y-1">
                                        <div className="flex items-start justify-between gap-2">
                                          <div className="flex items-center gap-2">
                                            {item.type === "checklist" && (
                                              <IconListCheck className="h-4 w-4 text-muted-foreground shrink-0" />
                                            )}
                                            {item.type === "quantity" && (
                                              <IconHash className="h-4 w-4 text-muted-foreground shrink-0" />
                                            )}
                                            {item.type === "progress" && (
                                              <IconChartBar className="h-4 w-4 text-muted-foreground shrink-0" />
                                            )}
                                            <p className="text-sm font-medium text-foreground">
                                              {item.task_name}
                                            </p>
                                          </div>
                                          <div className="flex items-center gap-2">
                                            <Badge
                                              variant={
                                                item.status === "done" ||
                                                item.status === "on_progress"
                                                  ? "default"
                                                  : "secondary"
                                              }
                                              className={`text-xs shrink-0 ${
                                                item.status === "done"
                                                  ? "bg-green-600 hover:bg-green-700"
                                                  : item.status ===
                                                      "on_progress"
                                                    ? "bg-blue-600 hover:bg-blue-700"
                                                    : ""
                                              }`}
                                            >
                                              {item.status === "done"
                                                ? "Done"
                                                : item.status === "on_progress"
                                                  ? "On Progress"
                                                  : "Pending"}
                                            </Badge>
                                          </div>
                                        </div>

                                        {/* Task Type Details */}
                                        {item.type === "quantity" && (
                                          <div className="mt-2">
                                            <Badge
                                              variant="outline"
                                              className="text-[10px] h-5 px-2 bg-blue-50 text-blue-600 border-blue-200 w-fit gap-3"
                                            >
                                              <span>
                                                Target: {item.target_amount}
                                              </span>
                                              <span className="font-bold">
                                                {item.current_amount} /{" "}
                                                {item.target_amount}
                                              </span>
                                            </Badge>
                                          </div>
                                        )}

                                        {item.type === "progress" && (
                                          <div className="mt-2 max-w-[200px]">
                                            <Badge
                                              variant="outline"
                                              className="text-[10px] h-5 px-2 bg-purple-50 text-purple-600 border-purple-200 w-full justify-between mb-1"
                                            >
                                              <span>Progress</span>
                                              <span className="font-bold">
                                                {item.progress_percentage}%
                                              </span>
                                            </Badge>
                                            <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden border border-gray-200">
                                              <div
                                                className="h-full bg-purple-500 rounded-full transition-all duration-500"
                                                style={{
                                                  width: `${item.progress_percentage}%`,
                                                }}
                                              />
                                            </div>
                                          </div>
                                        )}

                                        {item.reason && (
                                          <p className="text-xs text-muted-foreground mt-1">
                                            {item.reason}
                                          </p>
                                        )}
                                      </div>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="absolute top-2 right-12 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground hover:bg-background/80"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleEditItem(todo.id, item.id);
                                        }}
                                      >
                                        <IconPencil className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </>
                  );
                })
              )}
            </TableBody>
          )}
        </Table>
      </div>

      <PaginationBar
        total={totalCount}
        page={filter.page}
        perPage={paginate}
        totalPages={lastPage}
        currentData={todos.length}
        onPageChange={(nextPage) => setFilter({ ...filter, page: nextPage })}
        onPerPageChange={(nextPerPage) => {
          setPaginate(nextPerPage);
          setFilter({ ...filter, page: 1 });
        }}
        label="Total Work Todo"
      />

      {/* Edit Todo Sheet */}
      <EditTodoSheet
        open={editSheetOpen}
        onOpenChange={setEditSheetOpen}
        todoId={editingTodoId}
        onSuccess={handleSheetSuccess}
      />

      {/* Edit Todo Item Sheet */}
      <EditTodoItemSheet
        open={editItemSheetOpen}
        onOpenChange={setEditItemSheetOpen}
        todoId={editingTodoIdForItem}
        itemId={editingItemId}
        onSuccess={handleSheetSuccess}
      />
    </div>
  );
};

export default TableTodo;
