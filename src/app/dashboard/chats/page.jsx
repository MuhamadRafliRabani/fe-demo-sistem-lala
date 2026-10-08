import { Suspense } from "react";
import DashboardLayout from "@/components/layouts/dashboard-layout";
import ChatPageClient from "./ChatPageClient";

export default function ChatPage() {
  return (
    <DashboardLayout title="Chat" description="Kirim pesan ke tim Anda">
      <Suspense
        fallback={
          <div className="w-full h-[calc(100vh-180px)] flex items-center justify-center rounded-lg border bg-card">
            <div className="text-sm text-muted-foreground">Memuat chat…</div>
          </div>
        }
      >
        <ChatPageClient />
      </Suspense>
    </DashboardLayout>
  );
}
