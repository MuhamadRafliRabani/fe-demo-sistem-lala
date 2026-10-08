"use client";

import { useState } from "react";
import Image from "next/image";
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
import { MessageCircle, Search, Plus, MoreVertical, Archive } from "lucide-react";
import { useChatRooms, useUnreadCounts } from "@/hooks/use-chat";
import CreateChatModal from "./modals/create-chat-modal";

export default function ChatRoomList({ selectedRoomId, onSelectRoom }) {
  const { rooms, isLoading } = useChatRooms(selectedRoomId);
  const unreadCounts = useUnreadCounts();
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Filter rooms berdasarkan search
  const filteredRooms = rooms?.filter((room) =>
    [room.name, room.topic]
      .filter(Boolean)
      .some((value) =>
        value.toLowerCase().includes(searchQuery.toLowerCase())
      )
  );

  return (
    <div className="w-full h-full min-h-0 flex flex-col bg-background border-r">
      {/* Header - Sticky */}
      <div className="sticky top-0 z-10 p-4 border-b space-y-4 bg-background">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Chat</h2>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setShowCreateModal(true)}
            className="rounded-full w-8 h-8 p-0"
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Cari chat..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 rounded-lg"
          />
        </div>
      </div>

      {/* Rooms List */}
      <ScrollArea className="flex-1">
        <div className="divide-y">
          {isLoading ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              Memuat chat...
            </div>
          ) : filteredRooms?.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              Tidak ada chat
            </div>
          ) : (
            filteredRooms?.map((room) => (
              <ChatRoomItem
                key={room.id}
                room={room}
                isSelected={selectedRoomId === room.id}
                onSelect={() => onSelectRoom(room.id)}
                unreadCount={unreadCounts[room.id] || 0}
              />
            ))
          )}
        </div>
      </ScrollArea>

      {/* Modal Create Chat */}
      <CreateChatModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
      />
    </div>
  );
}

/**
 * Individual chat room item
 */
function ChatRoomItem({ room, isSelected, onSelect, unreadCount }) {
  return (
    <button
      onClick={onSelect}
      className={`w-full p-3 hover:bg-accent transition-colors text-left ${
        isSelected ? "bg-accent" : ""
      }`}
    >
      <div className="flex items-center gap-3">
        {/* Avatar */}
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
          {(room.topic || room.name)?.substring(0, 2).toUpperCase()}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <div className="truncate">
              <h3 className="font-medium truncate">{room.topic || room.name}</h3>
              <p className="text-xs text-muted-foreground truncate">
                {room.name && room.topic ? room.name : ""}
              </p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground truncate mt-1">
            {room.last_message?.message || "Tidak ada pesan"}
          </p>
        </div>

        {/* Unread badge */}
        {unreadCount > 0 && (
          <Badge variant="default" className="bg-red-500 rounded-full">
            {unreadCount}
          </Badge>
        )}
      </div>

      {/* Member info untuk group */}
      {room.type === "group" && room.member_count && (
        <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
          <MessageCircle className="w-3 h-3" />
          {room.member_count} anggota
        </div>
      )}
    </button>
  );
}
