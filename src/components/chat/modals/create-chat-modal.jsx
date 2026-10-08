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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useChatRooms } from "@/hooks/use-chat";
import { useApiFetch } from "@/hooks/use-api-fetch";

const schema = z.object({
  topic: z.string().min(1, "Topik chat wajib diisi"),
  description: z.string().optional(),
  member_ids: z.array(z.string()).min(1, "Pilih minimal 1 user"),
});

export default function CreateChatModal({ open, onOpenChange }) {
  const { createIndividual, createGroup } = useChatRooms();
  const { data: usersResponse = {} } = useApiFetch(
    ["users"],
    "/users",
    { paginate: 100 },
    true
  );
  const users = usersResponse?.data?.data || [];

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      topic: "",
      description: "",
      member_ids: [],
    },
  });

  const selectedMembers = watch("member_ids") || [];
  const selectedUserProfiles = users.filter((user) =>
    selectedMembers.includes(String(user.id))
  );
  const chatModeText = selectedMembers.length === 1 ? "1:1 chat" : "grup chat";

  const onSubmit = (data) => {
    const memberIds = data.member_ids.map((id) => parseInt(id));

    if (memberIds.length === 1) {
      toast.promise(
        new Promise((resolve, reject) => {
          createIndividual(
            {
              user_id: memberIds[0],
              topic: data.topic,
              description: data.description || null,
            },
            {
              onSuccess: () => {
                reset();
                onOpenChange(false);
                resolve();
              },
              onError: (err) => {
                reject(err?.response?.data?.message || "Gagal membuat chat");
              },
            }
          );
        })
      );
      return;
    }

    toast.promise(
      new Promise((resolve, reject) => {
        createGroup(
          {
            topic: data.topic,
            description: data.description || null,
            member_ids: memberIds,
          },
          {
            onSuccess: () => {
              reset();
              onOpenChange(false);
              resolve();
            },
            onError: (err) => {
              reject(err?.response?.data?.message || "Gagal membuat grup chat");
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
          <DialogTitle>Mulai Chat</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="topic">Topik Chat</Label>
            <Input
              id="topic"
              placeholder="Apa topik bahasan ini?"
              {...register("topic")}
              className="mt-1"
            />
            {errors.topic && (
              <p className="text-sm text-red-500">
                {errors.topic.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Deskripsi (opsional)</Label>
            <Input
              id="description"
              placeholder="Tambahkan keterangan singkat"
              {...register("description")}
              className="mt-1"
            />
          </div>

          <div className="space-y-2">
            <Label>Pilih Anggota</Label>
            <div className="grid gap-2 max-h-72 overflow-y-auto border rounded-2xl p-2 bg-surface">
              {users?.map((user) => {
                const isSelected = selectedMembers.includes(String(user.id));
                return (
                  <label
                    key={user.id}
                    className={`flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                      isSelected ? "border-blue-400 bg-blue-50" : "border-transparent hover:border-slate-300"
                    }`}
                  >
                    <input
                      type="checkbox"
                      value={user.id}
                      {...register("member_ids")}
                      className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <div className="w-10 h-10 rounded-full bg-yellow-400 text-slate-700 flex items-center justify-center text-sm font-semibold">
                      {user.name?.substring(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="font-medium text-sm text-yellow-400">{user.name}</div>
                      <div className="text-xs text-slate-500">{user.email}</div>
                    </div>
                  </label>
                );
              })}
            </div>
            {errors.member_ids && (
              <p className="text-sm text-red-500">
                {errors.member_ids.message}
              </p>
            )}
          </div>

          {selectedUserProfiles.length > 0 && (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
              <div className="text-sm font-medium text-slate-900 mb-2">
                Anggota terpilih
              </div>
              <div className="flex flex-wrap gap-2">
                {selectedUserProfiles.map((user) => (
                  <div key={user.id} className="flex items-center gap-2 rounded-xl bg-white border px-3 py-2">
                    <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-xs font-semibold">
                      {user.name?.substring(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-slate-900 truncate">
                        {user.name}
                      </div>
                      <div className="text-xs text-slate-500 truncate">
                        {user.email}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="text-sm text-slate-600">
            {selectedMembers.length} user dipilih · {chatModeText} akan dibuat
          </div>

          <div className="flex gap-2 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                reset();
                onOpenChange(false);
              }}
            >
              Batal
            </Button>
            <Button type="submit" disabled={selectedMembers.length === 0}>
              {selectedMembers.length === 1 ? "Mulai Chat 1:1" : "Buat Grup"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
