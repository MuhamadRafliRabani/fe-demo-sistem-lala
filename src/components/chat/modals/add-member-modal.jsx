"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useChatRoom } from "@/hooks/use-chat";
import { useApiFetch } from "@/hooks/use-api-fetch";

const schema = z.object({
  user_id: z.string().min(1, "Pilih user"),
});

export default function AddMemberModal({
  open,
  onOpenChange,
  roomId,
  onMemberAdded,
}) {
  const { addMember } = useChatRoom(roomId);
  const { data: usersResponse = {} } = useApiFetch(
    ["users"],
    "/users",
    { paginate: 100 },
    true
  );
  const users = usersResponse?.data?.data || [];

  const { data: roomResponse = {} } = useApiFetch(
    ["chat-room", roomId],
    roomId ? `/chats/${roomId}` : "/chats/0",
    undefined,
    !!roomId
  );
  const room = roomResponse?.data?.room || null;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
  });

  // Filter users yang belum ada di group
  const availableUsers = users?.filter(
    (user) =>
      !room?.members?.some((member) => member.id === user.id)
  );

  const onSubmit = (data) => {
    toast.promise(
      new Promise((resolve, reject) => {
        addMember(
          { user_id: parseInt(data.user_id) },
          {
            onSuccess: () => {
              reset();
              onOpenChange(false);
              onMemberAdded?.();
              resolve();
            },
            onError: (err) => {
              reject(err?.response?.data?.message || "Gagal tambah anggota");
            },
          }
        );
      })
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Tambah Anggota</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="user">Pilih User</Label>
            <select
              id="user"
              {...register("user_id")}
              className="w-full px-3 py-2 border rounded-md bg-background"
            >
              <option value="">-- Pilih User --</option>
              {availableUsers?.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name} ({user.email})
                </option>
              ))}
            </select>
            {errors.user_id && (
              <p className="text-sm text-red-500 mt-1">
                {errors.user_id.message}
              </p>
            )}
          </div>

          <div className="flex gap-2 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Batal
            </Button>
            <Button type="submit">Tambah</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
