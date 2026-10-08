"use client"

import DashboardLayout from "@/components/layouts/dashboard-layout";
import TableTodo from "./table/table-todo";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useAuthStore } from "@/hooks/auth-store";
import { Repeat, Users } from "lucide-react";

const TodoPage = () => {
  const { user } = useAuthStore();
  // Role 1 (Admin) or 7 (Manager/Marketing) can assign tasks
  const isManager = Number(user?.role_id) === 1 || Number(user?.role_id) === 7;

  return (
    <DashboardLayout
      title="Todo List Kerjaan"
      desc="Kelola todo list kerjaan historikal kamu disini."
    >
      <div className="mb-4 flex justify-end gap-2">
        <Link href="/dashboard/work-todos/auto-push">
          <Button variant="outline">
            <Repeat className="mr-2 h-4 w-4" />
            Auto Push
          </Button>
        </Link>
        {isManager && (
          <Link href="/dashboard/work-todos/team-assignment">
            <Button>
              <Users className="mr-2 h-4 w-4" />
              Delegasi Tugas Tim
            </Button>
          </Link>
        )}
      </div>
      <TableTodo />
    </DashboardLayout>
  );
};

export default TodoPage;
