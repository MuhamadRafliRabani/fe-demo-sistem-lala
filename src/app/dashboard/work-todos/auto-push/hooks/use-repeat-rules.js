"use client";

import { useApiFetch } from "@/hooks/use-api-fetch";
import { usePost, usePut, useRemove } from "@/hooks/use-api-mutation";
import { useAuthStore } from "@/hooks/auth-store";

export const useRepeatRules = () => {
  const { user } = useAuthStore();
  const isAdmin = Number(user?.role_id) === 1;
  const userId = user?.id ? Number(user.id) : null;

  const { data: repeatRulesRes, refetch: refetchRepeatRules } = useApiFetch(
    ["work-todo-repeat-rules", isAdmin ? "admin" : `user-${userId || "none"}`],
    "/work-todo-repeat-rules",
    isAdmin ? {} : { target_user_id: userId },
    true,
  );
  const { data: usersRes } = useApiFetch(
    [["users-repeat", "admin"]],
    "/users",
    { paginate: 200, filter: { status: "active" } },
    isAdmin,
  );

  const { mutate: createRepeatRule, isPending: isCreatingRepeatRule } = usePost(
    "/work-todo-repeat-rules",
    { invalidate: [["work-todo-repeat-rules"]] },
  );
  const { mutate: updateRepeatRule, isPending: isUpdatingRepeatRule } = usePut(
    (payload) => `/work-todo-repeat-rules/${payload.id}`,
    { invalidate: [["work-todo-repeat-rules"]] },
  );
  const { mutate: deleteRepeatRule, isPending: isDeletingRepeatRule } =
    useRemove((payload) => `/work-todo-repeat-rules/${payload.id}`, {
      invalidate: [["work-todo-repeat-rules"]],
    });

  return {
    repeatRules: repeatRulesRes?.data || [],
    repeatUsers: isAdmin
      ? usersRes?.data?.data || []
      : user?.id
        ? [{ id: user.id, name: user.name }]
        : [],
    refetchRepeatRules,
    createRepeatRule,
    updateRepeatRule,
    deleteRepeatRule,
    isCreatingRepeatRule,
    isUpdatingRepeatRule,
    isDeletingRepeatRule,
  };
};
