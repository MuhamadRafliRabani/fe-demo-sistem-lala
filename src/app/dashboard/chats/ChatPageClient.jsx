"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import ChatRoomList from "@/components/chat/chat-room-list";
import ChatDetailView from "@/components/chat/chat-detail-view";
import { MessageSquare } from "lucide-react";

export default function ChatPageClient() {
  const searchParams = useSearchParams();
  const [selectedRoomId, setSelectedRoomId] = useState(() =>
    searchParams.get("roomId"),
  );

  return (
    <div className="w-full h-[calc(100vh-180px)] flex gap-0 rounded-lg border bg-card overflow-hidden">
      <div className="w-80 border-r bg-background min-h-0">
        <ChatRoomList
          selectedRoomId={selectedRoomId}
          onSelectRoom={setSelectedRoomId}
        />
      </div>
      <div className="flex-1 min-h-0">
        {selectedRoomId ? (
          <ChatDetailView roomId={selectedRoomId} />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground gap-3">
            <MessageSquare className="w-12 h-12 opacity-50" />
            <p className="text-lg font-medium">Pilih chat untuk memulai</p>
            <p className="text-sm">
              Buat percakapan baru atau pilih dari daftar chat Anda
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
