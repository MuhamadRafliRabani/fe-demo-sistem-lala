"use client";

import { useEffect, useRef, useState } from "react";
import { Bell, Check, CheckCheck, Clock, BellOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useNotificationsStore } from "@/hooks/use-notifications";
import { useApiFetch } from "@/hooks/use-api-fetch";
import { useAuthStore } from "@/hooks/auth-store";
import { resolveImageUrl } from "@/lib/resolve-image-url";

function timeAgo(dateString) {
  if (!dateString) return "Baru saja";
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);
  if (diffInSeconds < 60) return "Baru saja";
  const rtf = new Intl.RelativeTimeFormat("id", { numeric: "auto" });
  if (diffInSeconds < 3600)
    return rtf.format(-Math.floor(diffInSeconds / 60), "minute");
  if (diffInSeconds < 86400)
    return rtf.format(-Math.floor(diffInSeconds / 3600), "hour");
  return rtf.format(-Math.floor(diffInSeconds / 86400), "day");
}

export default function NotificationBell() {
  const {
    notifications = [],
    markAsRead,
    markAllAsRead,
  } = useNotificationsStore();
  const [open, setOpen] = useState(false);
  const closeTimer = useRef(null);

  const { user: me } = useAuthStore();
  const { data: usersData } = useApiFetch(
    ["users-for-notif"],
    "/users",
    { paginate: 500 },
    open,
  );

  const users = usersData?.data?.data || [];
  const usersMap = Object.fromEntries(
    users.map((u) => [String(u.id), { name: u.name, avatar: u.avatar }]),
  );

  const unreadCount = notifications.filter((n) => !n.read_at).length;

  useEffect(() => {
    const handler = () => {
      try {
        setOpen(true);
        if (closeTimer.current) clearTimeout(closeTimer.current);
        closeTimer.current = setTimeout(() => setOpen(false), 4000);
      } catch {}
    };
    window.addEventListener("openNotificationBell", handler);
    return () => {
      window.removeEventListener("openNotificationBell", handler);
      if (closeTimer.current) clearTimeout(closeTimer.current);
    };
  }, []);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative text-muted-foreground hover:text-primary hover:bg-secondary transition-colors rounded-full h-9 w-9"
        >
          <Bell className="h-[18px] w-[18px]" />
          {unreadCount > 0 && (
            <span className="absolute top-0 right-0 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground ring-2 ring-background">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent
        className="w-[calc(100vw-16px)] max-w-[400px] p-0 bg-popover border-border shadow-lg rounded-xl overflow-hidden font-sans"
        align="end"
        sideOffset={8}
        // Cegah popover "tumpah" ke kiri di layar kecil
        collisionPadding={8}
      >
        {/* HEADER */}
        <div className="px-3 sm:px-4 py-3 border-b border-border flex items-center justify-between bg-card">
          <div className="flex items-center gap-2">
            <h3 className="text-[13px] sm:text-[14px] font-semibold text-foreground tracking-wide">
              Notifikasi
            </h3>
            {unreadCount > 0 && (
              <span className="bg-primary/10 text-primary border border-primary/20 text-[10px] font-bold rounded-md px-1.5 py-0.5">
                {unreadCount} Baru
              </span>
            )}
          </div>

          {unreadCount > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (markAllAsRead) markAllAsRead();
              }}
              className="group flex items-center gap-1 text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors bg-secondary hover:bg-muted px-2 py-1.5 rounded-md"
              title="Tandai semua sudah dibaca"
            >
              <CheckCheck
                size={13}
                className="text-muted-foreground group-hover:text-primary transition-colors shrink-0"
              />
              {/* Teks dipendekkan di mobile */}
              <span className="hidden xs:inline">Tandai semua</span>
              <span className="xs:hidden">Semua</span>
            </button>
          )}
        </div>

        {/* FEED AREA — tinggi disesuaikan: lebih pendek di HP */}
        <ScrollArea className="h-[min(420px,60vh)] bg-popover custom-scrollbar">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-14 text-center px-4">
              <div className="h-11 w-11 rounded-full bg-secondary flex items-center justify-center mb-3">
                <BellOff size={18} className="text-muted-foreground" />
              </div>
              <p className="text-[13px] font-medium text-foreground">
                Belum ada notifikasi
              </p>
              <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
                Saat Anda mendapatkan pemberitahuan,
                <br />
                akan muncul di sini.
              </p>
            </div>
          ) : (
            <div className="flex flex-col">
              {notifications.map((n) => {
                const isUnread = !n.read_at;
                const authorName =
                  n.notification?.created_by_name ||
                  usersMap[String(n.notification?.created_by)]?.name ||
                  "Sistem";
                const authorAvatar =
                  n.notification?.created_by_avatar ||
                  usersMap[String(n.notification?.created_by)]?.avatar;

                return (
                  <div
                    key={n.id}
                    className={`group relative px-3 sm:px-4 py-3 border-b border-border/60 hover:bg-muted/40 transition-all duration-200 ${
                      isUnread ? "bg-secondary/40" : ""
                    }`}
                  >
                    {/* Unread Indicator */}
                    {isUnread && (
                      <div className="absolute left-0 top-0 bottom-0 w-0.5 sm:w-1 bg-primary shadow-[0_0_8px_rgba(0,0,0,0.12)]" />
                    )}

                    <div className="flex gap-3">
                      {/* AVATAR — sedikit lebih kecil di mobile */}
                      <Avatar className="h-8 w-8 sm:h-9 sm:w-9 shrink-0 ring-2 ring-border">
                        <AvatarImage
                          src={
                            resolveImageUrl(authorAvatar) ||
                            resolveImageUrl(me?.avatar)
                          }
                        />
                        <AvatarFallback className="bg-muted text-muted-foreground text-[10px] font-bold border border-border">
                          {authorName.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>

                      {/* CONTENT */}
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start gap-1.5">
                          <p className="text-[12px] sm:text-[13px] font-semibold text-foreground truncate leading-tight">
                            {n.notification?.title ?? "Pemberitahuan Baru"}
                          </p>
                          {/* Timestamp — selalu tampil tapi ringkas */}
                          <span className="shrink-0 flex items-center gap-0.5 text-[10px] font-medium text-muted-foreground mt-0.5">
                            <Clock size={9} />
                            {timeAgo(
                              n.created_at || n.notification?.created_at,
                            )}
                          </span>
                        </div>

                        <p className="text-[11px] sm:text-[12px] text-muted-foreground mt-0.5 leading-relaxed line-clamp-2">
                          <span className="font-medium text-foreground">
                            {authorName}
                          </span>{" "}
                          {n.notification?.message ??
                            "mengirimkan pembaruan untuk Anda."}
                        </p>

                        {/* ATTACHMENT / TODO ITEM */}
                        {n.notification?.data?.todo_item_id && (
                          <div className="mt-2 bg-secondary border border-border rounded-lg p-2 flex items-start gap-2">
                            <div className="bg-muted rounded text-primary px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider shrink-0 mt-0.5">
                              #{n.notification.data.todo_item_id}
                            </div>
                            <p className="text-[11px] text-muted-foreground line-clamp-1">
                              {n.notification?.data?.todo_item_title ||
                                "Lihat detail tugas"}
                            </p>
                          </div>
                        )}

                        {/* MARK AS READ — selalu tampil di mobile (bukan hanya hover) */}
                        {isUnread && (
                          <div className="mt-2">
                            <button
                              onClick={() => markAsRead(n.id)}
                              className="flex items-center gap-1.5 text-[11px] font-medium bg-secondary hover:bg-muted active:bg-muted text-foreground px-2.5 py-1.5 rounded-md transition-colors border border-border"
                            >
                              <Check size={11} className="text-primary" />
                              Tandai dibaca
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
