"use client";

import { useEffect, useRef, useState } from "react";
import { Bell, MessageSquare, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { resolveImageUrl } from "@/lib/resolve-image-url";
import { useAuthStore } from "@/hooks/auth-store";

export default function RealtimeBell() {
  const [open, setOpen] = useState(false);
  const [events, setEvents] = useState([]);
  const autoClose = useRef(null);
  const { user: me } = useAuthStore();

  useEffect(() => {
    const handler = (e) => {
      const ev = e?.detail;
      if (!ev) return;
      setEvents((prev) => {
        const next = [ev, ...prev].slice(0, 10);
        return next;
      });
      setOpen(true);
      if (autoClose.current) clearTimeout(autoClose.current);
      autoClose.current = setTimeout(() => setOpen(false), 4000);
    };
    window.addEventListener("realtimeNotification", handler);
    return () => {
      window.removeEventListener("realtimeNotification", handler);
      if (autoClose.current) clearTimeout(autoClose.current);
    };
  }, []);

  const unread = events.length;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" className="relative">
          <Bell className="h-5 w-5" />
          {unread > 0 ? (
            <span className="absolute -top-1 -right-1 bg-[#06b6d4] text-[#0f1a22] rounded-full px-1 text-[9px] font-bold">
              {unread}
            </span>
          ) : null}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[360px] p-0 bg-[#0b1620] border-[#1f2a38]" align="end">
        <div className="px-4 py-3 border-b border-[#1f2a38] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-[#f8fafc]">Realtime</span>
            {unread > 0 ? (
              <span className="bg-[#06b6d4]/20 text-[#06b6d4] text-[10px] font-bold rounded-full px-2 py-[2px]">
                {unread}
              </span>
            ) : null}
          </div>
          <button
            onClick={() => setEvents([])}
            className="text-[11px] text-[#94a3b8] hover:text-[#e2e8f0]"
            title="Clear"
          >
            Clear
          </button>
        </div>
        <ScrollArea className="h-64">
          {events.length === 0 ? (
            <div className="text-center text-sm text-[#94a3b8] py-8">No realtime notifications</div>
          ) : (
            events.map((ev, idx) => {
              const title = ev?.title || "Notification";
              const msg = ev?.message || "-";
              const fromName = ev?.created_by_name || "User";
              const avatar = resolveImageUrl(ev?.created_by_avatar) || resolveImageUrl(me?.avatar);
              const itemId = ev?.data?.todo_item_id;
              const itemTitle = ev?.data?.todo_item_title;
              const isComment = ev?.type === "todo_comment";

              return (
                <div key={idx} className="px-4 py-3 border-b border-[#1f2a38]">
                  <div className="flex items-start gap-3">
                    <Avatar className="h-8 w-8 mt-0.5">
                      <AvatarImage src={avatar} />
                      <AvatarFallback>
                        {(fromName || "?").substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[#e2e8f0] font-semibold">{fromName}</span>
                        <span className="text-xs text-[#94a3b8]">→ {me?.name || "You"}</span>
                      </div>
                      <div className="text-xs text-[#94a3b8] mt-0.5">{title}</div>
                      <div className="text-xs text-[#94a3b8] mt-1">
                        {msg}
                        {itemId ? (
                          <div className="mt-1">
                            <span className="text-[#cbd5e1]">Todo #{itemId}</span>
                            {itemTitle ? <span className="text-[#94a3b8]"> — {itemTitle}</span> : null}
                          </div>
                        ) : null}
                      </div>
                    </div>
                    {isComment ? (
                      <button
                        onClick={() => {
                          try {
                            window.dispatchEvent(
                              new CustomEvent("openTodoComment", { detail: { itemId } }),
                            );
                          } catch {}
                        }}
                        title="View"
                        className="ml-2 text-[11px] bg-[#152733] border border-[#1f2a38] text-[#e2e8f0] px-2 py-1 rounded-md hover:bg-[#1e2732] h-7"
                      >
                        View
                      </button>
                    ) : (
                      <span className="text-[10px] text-[#94a3b8]">New</span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}

