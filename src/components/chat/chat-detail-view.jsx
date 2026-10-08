"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useChatMessages, useChatRoom } from "@/hooks/use-chat";
import { useAuthStore } from "@/hooks/auth-store";
import { isAudioUnlocked } from "@/lib/unlock-audio";
import { Send, Archive, MoreVertical, Users, Plus } from "lucide-react";
import { toast } from "sonner";
import AddMemberModal from "./modals/add-member-modal";

export default function ChatDetailView({ roomId, onBack }) {
  const { user } = useAuthStore();
  const currentUserId = user?.id ? String(user.id) : null;

  const playNotificationSound = () => {
    if (typeof window === "undefined") return;
    if (!isAudioUnlocked()) return;

    const audio = new Audio("/asset/sounds/lala-backsound.mpeg");
    audio.volume = 0.2;
    audio.play().catch(() => {});
  };

  const handleIncomingMessage = useCallback((message) => {
    if (String(message.user_id) === String(currentUserId)) return;

    toast(`${message.sender?.name ?? "Teman"}: ${message.message}`, {
      description: "Pesan baru masuk",
      icon: "🔔",
    });
    playNotificationSound();
  }, [currentUserId]);

  const { room, refetch: refetchRoom } = useChatRoom(roomId);
  const { messages, sendMessage, deleteMessage, refetch: refetchMessages, resetUnreadCount } =
    useChatMessages(roomId, { onNewMessage: handleIncomingMessage });
  const [messageInput, setMessageInput] = useState("");
  const [showAddMember, setShowAddMember] = useState(false);
  const scrollRef = useRef(null);

  // Reset unread count when room changes
  useEffect(() => {
    if (roomId && resetUnreadCount) {
      resetUnreadCount();
    }
  }, [roomId, resetUnreadCount]);

  // Auto scroll ke bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleSendMessage = () => {
    if (!messageInput.trim()) return;

    toast.promise(
      new Promise((resolve, reject) => {
        sendMessage(
          {
            message: messageInput,
            type: "text",
          },
          {
            onSuccess: () => {
              setMessageInput("");
              resolve();
            },
            onError: (err) => {
              reject(err?.response?.data?.message || "Gagal mengirim pesan");
            },
          }
        );
      })
    );
  };

  if (!room) {
    return (
      <div className="w-full h-full flex items-center justify-center text-muted-foreground">
        Loading room...
      </div>
    );
  }

  return (
    <div className="w-full h-full min-h-0 flex flex-col bg-background">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div>
          <h2 className="font-semibold">{room.topic || room.name}</h2>
          <p className="text-sm text-muted-foreground">
            {room.type === "group" ? `${room.member_count} anggota` : room.name}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {room.type === "group" && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowAddMember(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Tambah
            </Button>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="ghost" className="rounded-full w-8 h-8 p-0">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <Users className="w-4 h-4 mr-2" />
                Anggota ({room.member_count})
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Archive className="w-4 h-4 mr-2" />
                Arsipkan
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 min-h-0 p-4 space-y-4">
        {messages?.length === 0 ? (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            Mulai percakapan
          </div>
        ) : (
          <div className="space-y-3">
            {messages?.map((message) => (
              <MessageBubble
                key={message.id}
                message={message}
                currentUserId={currentUserId}
                onDelete={() =>
                  deleteMessage({ id: message.id }, {
                    onSuccess: refetchMessages,
                    onError: () =>
                      toast.error("Gagal menghapus pesan"),
                  })
                }
              />
            ))}
            <div ref={scrollRef} />
          </div>
        )}
      </ScrollArea>

      {/* Input - Auto-expanding textarea */}
      <div className="p-4 border-t">
        <div className="flex gap-2 items-end">
          <textarea
            placeholder="Ketik pesan..."
            value={messageInput}
            onChange={(e) => {
              setMessageInput(e.target.value);
              // Auto-expand height
              e.target.style.height = "auto";
              e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
            }}
            onKeyPress={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            className="flex-1 px-3 py-2 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground resize-none max-h-[120px] overflow-y-auto focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            rows={1}
          />
          <Button
            onClick={handleSendMessage}
            disabled={!messageInput.trim()}
            className="rounded-full w-10 h-10 p-0 shrink-0"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Add Member Modal */}
      <AddMemberModal
        open={showAddMember}
        onOpenChange={setShowAddMember}
        roomId={roomId}
        onMemberAdded={refetchRoom}
      />
    </div>
  );
}

/**
 * Message bubble component
 */
function MessageBubble({ message, currentUserId, onDelete }) {
  const isOwnMessage = String(message.user_id) === String(currentUserId);

  return (
    <div
      className={`flex w-full gap-3 ${
        isOwnMessage ? "justify-end items-end" : "justify-start items-start"
      }`}
    >
      {!isOwnMessage && (
        <Avatar className="w-8 h-8">
          <AvatarImage src={message.sender?.avatar} />
          <AvatarFallback>
            {(message.sender?.name || "?").substring(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
      )}

      <div className={`max-w-xs ${isOwnMessage ? "flex-row-reverse" : ""}`}>
        {!isOwnMessage && (
          <p className="text-xs font-medium mb-1">
            {message.sender?.name || "Teman"}
          </p>
        )}
        <div
          className={`px-3 py-2 rounded-lg ${
            isOwnMessage
              ? "bg-primary text-primary-foreground text-right"
              : "bg-muted text-foreground text-left"
          }`}
        >
          <p className="text-sm break-words">{message.message}</p>
          <p className="text-xs opacity-70 mt-1">
            {new Date(message.sent_at).toLocaleTimeString("id-ID", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>
      </div>
    </div>
  );
}
