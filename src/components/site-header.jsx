import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import Breadcrumb from "@/components/bread-crumb";
import NotificationBell from "./NotificationBell";
import {
  MessageSquare,
  VolumeX,
  List,
  CheckCircle2,
  XCircle,
  LogOut,
  ClipboardList,
} from "lucide-react";
import { usePost } from "@/hooks/use-api-mutation";
import { toast } from "sonner";
import { useApiFetch } from "@/hooks/use-api-fetch";
import { useDateRange } from "@/lib/date-range";
import { useAuthStore } from "@/hooks/auth-store";
import { useEffect, useState } from "react";
import { formatDateDb } from "@/lib/date-format-db";
import { useSidebar } from "./app-sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

export default function SiteHeader({ handleStopSound, isSoundPlaying }) {
  const { isPinned, setIsPinned, setIsMobileOpen } = useSidebar();

  const { mutate: postAttendance } = usePost("/attending", {
    invalidate: [["attending"]],
  });
  const { start: today } = useDateRange("today");
  const [filter, setFilter] = useState({
    date: formatDateDb(today),
    ll_st_user_id: null,
  });
  const { user } = useAuthStore();

  useEffect(() => {
    setFilter((f) => ({ ...f, ll_st_user_id: user?.id }));
  }, [user?.id]);

  const { data } = useApiFetch(["attending", filter], "/attending", {
    filter: { ...filter },
  });

  const attending = data?.data?.data || [];
  const todayAttendance = attending?.[0] || null;
  const todayAttendanceStatus = String(
    todayAttendance?.status || "",
  ).toLowerCase();
  const hasPulang = Boolean(todayAttendance?.pulang_at);
  const hasAttendance = Boolean(todayAttendance);
  const isAbsen = todayAttendanceStatus === "absen";

  // Label pendek untuk mobile, label lengkap untuk desktop
  const todayAttendanceLabelFull = hasPulang
    ? "Pulang"
    : isAbsen
      ? "Absen"
      : hasAttendance
        ? "Hadir"
        : "Attendance";

  const [attendanceDialogOpen, setAttendanceDialogOpen] = useState(false);
  const [attendanceReason, setAttendanceReason] = useState("");
  const [attendanceNote, setAttendanceNote] = useState("");
  const [attendanceSubmitting, setAttendanceSubmitting] = useState(false);

  const ABSEN_REASONS = [
    "Orang tua sakit",
    "Anak sakit",
    "Suami / istri sakit",
    "Kakek / nenek / saudara meninggal",
    "Motor rusak / harus ke bengkel",
    "Motor dipakai orang lain",
    "Lainnya",
  ];

  const isBefore0730 = () => {
    const now = new Date();
    const h = now.getHours();
    const m = now.getMinutes();
    return h < 7 || (h === 7 && m < 30);
  };

  const isBefore1700 = () => new Date().getHours() < 17;

  const canHadir = !hasAttendance && !isBefore0730();
  const canAbsen = !hasAttendance;
  const canPulang = hasAttendance && !isAbsen && !hasPulang && !isBefore1700();

  const getShortAddress = (value) => {
    const text = String(value || "").trim();
    if (!text) return "";
    return text.split(",").slice(0, 2).join(",").trim();
  };

  const getBrowserLocation = () =>
    new Promise((resolve, reject) => {
      if (typeof window === "undefined") return reject(new Error("NO_WINDOW"));
      if (!window.isSecureContext) return reject(new Error("INSECURE_CONTEXT"));
      if (!navigator?.geolocation)
        return reject(new Error("GEOLOCATION_UNSUPPORTED"));
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve(pos),
        (err) => reject(err),
        { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 },
      );
    });

  const buildLocationPayload = async () => {
    try {
      const pos = await getBrowserLocation();
      const lat = pos?.coords?.latitude;
      const lng = pos?.coords?.longitude;
      if (typeof lat !== "number" || typeof lng !== "number") return null;
      const accuracy = pos?.coords?.accuracy;
      return {
        lat,
        lng,
        accuracy: typeof accuracy === "number" ? accuracy : undefined,
        location_source: "browser",
      };
    } catch {
      return null;
    }
  };

  const submitAttendance = async (payload) => {
    if (attendanceSubmitting) return;
    setAttendanceSubmitting(true);
    const location = await buildLocationPayload();
    const finalPayload = location ? { ...payload, ...location } : payload;
    const promise = new Promise((resolve, reject) => {
      postAttendance(finalPayload, {
        onSuccess: resolve,
        onError: (err) => {
          const msg =
            err?.response?.data?.message || "Gagal mencatat attendance";
          reject(msg);
        },
        onSettled: () => setAttendanceSubmitting(false),
      });
    });
    toast.promise(promise, {
      loading: "Mencatat attendance...",
      success: "Attendance berhasil dicatat!",
      error: (msg) => msg,
    });
  };

  const openAttendanceDialog = () => {
    setAttendanceReason("");
    setAttendanceNote("");
    setAttendanceDialogOpen(true);
  };

  const handlePickAttendance = (action) => {
    if (action === "hadir") {
      if (!canHadir) return;
      submitAttendance({ status: "hadir" });
      return;
    }
    if (action === "pulang") {
      if (!canPulang) return;
      submitAttendance({ status: "pulang" });
      return;
    }
    if (!canAbsen) return;
    openAttendanceDialog();
  };

  const handleConfirmAttendance = () => {
    if (!attendanceReason) {
      toast.error("Pilih alasan tidak hadir terlebih dahulu");
      return;
    }
    const noteText = String(attendanceNote || "").trim();
    if (attendanceReason === "Lainnya" && !noteText) {
      toast.error("Keterangan tambahan wajib diisi jika memilih Lainnya");
      return;
    }
    const finalNote =
      attendanceReason === "Lainnya"
        ? noteText
        : noteText
          ? `${attendanceReason} - ${noteText}`
          : attendanceReason;
    submitAttendance({ status: "absen", note: finalNote });
    setAttendanceDialogOpen(false);
  };

  const getAttendanceTimeText = () => {
    const source = hasPulang
      ? todayAttendance?.pulang_at
      : todayAttendance?.date;
    if (!source) return "";
    const d = new Date(source);
    if (Number.isNaN(d.getTime())) return "";
    return d.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  };

  const todayLocationAddress = hasPulang
    ? todayAttendance?.checkout_address
    : todayAttendance?.checkin_address;
  const todayLocationLat = hasPulang
    ? todayAttendance?.checkout_lat
    : todayAttendance?.checkin_lat;
  const todayLocationLng = hasPulang
    ? todayAttendance?.checkout_lng
    : todayAttendance?.checkin_lng;

  const attendanceTime = getAttendanceTimeText();

  return (
    <header className="flex h-14 sm:h-16 shrink-0 items-center gap-2 border-b bg-background transition-[width,height] ease-linear">
      <div className="flex w-full items-center gap-1 px-3 sm:px-4 lg:px-6 min-w-0">
        {/* Sidebar toggle */}
        <button
          onClick={() => {
            if (window.innerWidth < 768) setIsMobileOpen(true);
            else setIsPinned(!isPinned);
          }}
          className="-ml-1 p-2 rounded-md hover:bg-accent text-muted-foreground transition-colors outline-none shrink-0"
          title="Toggle Sidebar"
        >
          <List className="size-5" />
        </button>

        <Separator
          orientation="vertical"
          className="mx-1.5 sm:mx-2 h-5 sm:h-6 shrink-0"
        />

        {/* Breadcrumb — min-w-0 + overflow hidden agar tidak push item kanan */}
        <div className="flex flex-col gap-1 min-w-0 flex-1 overflow-hidden">
          <Breadcrumb />
        </div>

        {/* RIGHT SIDE ACTIONS — shrink-0 agar tidak tercompress, gap kecil di mobile */}
        <div className="ml-2 flex items-center gap-1 sm:gap-2 shrink-0">
          {/* ✅ ATTENDANCE BUTTON — RESPONSIVE
              - Mobile: hanya icon + status dot / label singkat
              - Desktop: teks lengkap dengan waktu
          */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              {/* 
                Mobile: tampil sebagai icon button dengan badge status kecil
                Desktop: tampil teks lengkap seperti semula
              */}
              <Button
                variant={todayAttendance ? "outline" : "default"}
                size="sm"
                title={`Attendance • ${todayAttendanceLabelFull}${attendanceTime ? ` • ${attendanceTime}` : ""}`}
                disabled={attendanceSubmitting}
                className="h-8 sm:h-9 px-2 sm:px-3 gap-1.5"
              >
                {/* Icon selalu tampil */}
                <ClipboardList className="size-4 shrink-0" />

                {/* Label + waktu: sembunyikan di mobile (< sm) */}
                <span className="hidden sm:inline text-sm">
                  {todayAttendanceLabelFull}
                  {attendanceTime ? ` • ${attendanceTime}` : ""}
                </span>

                {/* Di mobile, tampilkan dot berwarna sebagai status indicator */}
                <span className="sm:hidden">
                  {todayAttendance ? (
                    <span
                      className={`inline-block h-2 w-2 rounded-full ${
                        hasPulang
                          ? "bg-blue-400"
                          : isAbsen
                            ? "bg-red-400"
                            : "bg-green-400"
                      }`}
                    />
                  ) : null}
                </span>
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="min-w-[200px]">
              {/* Info waktu di dropdown untuk mobile */}
              {todayAttendance && (
                <div className="px-3 py-2 border-b border-border/60">
                  <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    Status Hari Ini
                  </div>
                  <div className="text-xs text-foreground mt-0.5 font-medium">
                    {todayAttendanceLabelFull}
                    {attendanceTime ? ` • ${attendanceTime}` : ""}
                  </div>
                  {/* Lokasi */}
                  <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-2">
                    Lokasi
                  </div>
                  <div className="text-xs text-foreground mt-0.5 max-w-[260px]">
                    {todayLocationAddress
                      ? getShortAddress(todayLocationAddress)
                      : todayLocationLat && todayLocationLng
                        ? `${Number(todayLocationLat).toFixed(5)}, ${Number(todayLocationLng).toFixed(5)}`
                        : "-"}
                  </div>
                </div>
              )}

              <DropdownMenuItem
                onClick={() => handlePickAttendance("hadir")}
                disabled={!canHadir || attendanceSubmitting}
              >
                <CheckCircle2 className="h-4 w-4" />
                Hadir
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handlePickAttendance("pulang")}
                disabled={!canPulang || attendanceSubmitting}
              >
                <LogOut className="h-4 w-4" />
                Pulang
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handlePickAttendance("absen")}
                disabled={!canAbsen || attendanceSubmitting}
              >
                <XCircle className="h-4 w-4" />
                Absen
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Stop sound button */}
          {isSoundPlaying === true && (
            <button
              onClick={() => handleStopSound()}
              className="p-2 text-muted-foreground hover:bg-accent rounded-md transition-colors shrink-0"
              title="Matikan pengingat"
            >
              <VolumeX className="size-4 sm:size-5" />
            </button>
          )}

          <NotificationBell />
        </div>
      </div>

      {/* DIALOG ABSEN */}
      <Dialog
        open={attendanceDialogOpen}
        onOpenChange={setAttendanceDialogOpen}
      >
        {/* max-w-lg tapi di mobile full-width dengan margin */}
        <DialogContent className="w-[calc(100vw-32px)] sm:max-w-lg mx-auto">
          <DialogHeader>
            <DialogTitle>Keterangan Absen</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>
                Alasan Tidak Hadir <span className="text-red-500">*</span>
              </Label>
              <Select
                value={attendanceReason}
                onValueChange={setAttendanceReason}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Pilih alasan..." />
                </SelectTrigger>
                <SelectContent>
                  {ABSEN_REASONS.map((reason) => (
                    <SelectItem key={reason} value={reason}>
                      {reason}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>
                Keterangan Tambahan{" "}
                {attendanceReason === "Lainnya" && (
                  <span className="text-red-500">*</span>
                )}
              </Label>
              <Textarea
                value={attendanceNote}
                onChange={(e) => setAttendanceNote(e.target.value)}
                placeholder={
                  attendanceReason === "Lainnya"
                    ? "Wajib diisi..."
                    : "Opsional..."
                }
                rows={4}
              />
            </div>
          </div>
          <DialogFooter className="flex-col-reverse sm:flex-row gap-2">
            <Button
              variant="outline"
              type="button"
              onClick={() => setAttendanceDialogOpen(false)}
              disabled={attendanceSubmitting}
              className="w-full sm:w-auto"
            >
              Batal
            </Button>
            <Button
              type="button"
              onClick={handleConfirmAttendance}
              disabled={attendanceSubmitting}
              className="w-full sm:w-auto"
            >
              Simpan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </header>
  );
}
