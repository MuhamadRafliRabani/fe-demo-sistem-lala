"use client";

import React, { useState, useRef, useEffect } from "react";
import { useAuthStore } from "@/hooks/auth-store";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Webcam from "react-webcam";
import axiosInstance from "@/lib/axios";
import { toast } from "sonner";
import { ClipboardList, Camera } from "lucide-react";

// Helper konversi base64 ke File
const dataUrlToFile = (dataUrl, fileName) => {
  const arr = dataUrl.split(",");
  const mime = arr[0].match(/:(.*?);/)?.[1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new File([u8arr], fileName, { type: mime });
};

const ABSEN_REASONS = [
  "Orang tua sakit",
  "Anak sakit",
  "Suami / istri sakit",
  "Kakek / nenek / saudara meninggal",
  "Motor rusak / harus ke bengkel",
  "Motor dipakai orang lain",
  "Lainnya",
];

export default function AttendanceGate({ children }) {
  const { user, setAuth } = useAuthStore();
  console.log("🚀 ~ AttendanceGate ~ user:", user);

  // Jika user belum login, biarkan lolos (akan ditangkap oleh middleware auth)
  if (!user) return <>{children}</>;

  // Jika sudah absen hari ini, langsung tampilkan konten dashboard
  if (user.has_attended_today) return <>{children}</>;

  // === JIKA BELUM ABSEN, TAMPILKAN UI ABSENSI ===
  return (
    <DailyAttendanceScreen
      user={user}
      onSuccess={() => {
        // Buka gembok dashboard dengan mengupdate state auth
        setAuth({ ...user, has_attended_today: true });
      }}
    />
  );
}

function DailyAttendanceScreen({ user, onSuccess }) {
  const [submitting, setSubmitting] = useState(false);
  const [isAbsenMode, setIsAbsenMode] = useState(false);
  const [absenReason, setAbsenReason] = useState("");
  const [absenNotes, setAbsenNotes] = useState("");
  const [cameraError, setCameraError] = useState("");
  const [cachedLocation, setCachedLocation] = useState(null);

  const webcamRef = useRef(null);

  // Fungsi ambil lokasi dari browser
  const getBrowserLocation = () => {
    return new Promise((resolve, reject) => {
      if (typeof window === "undefined") return reject(new Error("NO_WINDOW"));
      if (!window.isSecureContext) return reject(new Error("INSECURE_CONTEXT"));
      if (!navigator?.geolocation)
        return reject(new Error("GEOLOCATION_UNSUPPORTED"));

      navigator.geolocation.getCurrentPosition(
        (pos) => resolve(pos),
        (err) => reject(err),
        { enableHighAccuracy: false, timeout: 5000, maximumAge: 1000 * 60 * 5 },
      );
    });
  };

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

  // Caching lokasi saat modal terbuka
  useEffect(() => {
    buildLocationPayload().then((loc) => {
      if (loc) setCachedLocation(loc);
    });
  }, []);

  const handleSubmit = async () => {
    if (submitting) return;

    if (isAbsenMode && !absenReason) {
      toast.error("Silakan pilih alasan absen terlebih dahulu");
      return;
    }

    setSubmitting(true);
    try {
      const location = cachedLocation || (await buildLocationPayload());
      const formData = new FormData();

      // Setup Note & Status
      let status = "hadir";
      let note = "Hadir (Auto check-in from gate)";

      if (isAbsenMode) {
        status = "absen";
        const reason = absenReason.trim();
        note = reason
          ? `${reason}${absenNotes.trim() ? ` - ${absenNotes.trim()}` : ""}`
          : "Absen";
      }

      formData.append("status", status);
      formData.append("note", note);
      formData.append("auto", "1");

      // Append Location
      if (location) {
        formData.append("lat", String(location.lat));
        formData.append("lng", String(location.lng));
        if (typeof location.accuracy === "number") {
          formData.append("accuracy", String(location.accuracy));
        }
        formData.append("location_source", location.location_source);
      }

      // Append Selfie (Jika Hadir & Kamera tersedia)
      if (!isAbsenMode) {
        const imageSrc = webcamRef.current?.getScreenshot();
        if (imageSrc) {
          const file = dataUrlToFile(
            imageSrc,
            `selfie-${new Date().toISOString().split("T")[0]}.jpg`,
          );
          formData.append("photo_file", file);
        }
      }

      // Tembak API
      await axiosInstance.post("/attending", formData);

      toast.success(
        isAbsenMode
          ? "Report absensi berhasil dikirim!"
          : "Absensi berhasil dicatat! Selamat Bekerja.",
      );
      onSuccess();
    } catch (error) {
      const apiErrors = error?.response?.data?.errors;
      const alreadyRecorded = apiErrors?.status?.some((m) =>
        String(m).toLowerCase().includes("sudah tercatat"),
      );

      if (alreadyRecorded) {
        toast.success("Absensi hari ini sudah tercatat. Selamat bekerja!");
        onSuccess();
      } else {
        toast.error(error?.response?.data?.message || "Gagal mencatat absensi");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-[#212431]/95 backdrop-blur-sm flex flex-col items-center justify-center p-6 overflow-y-auto">
      <div className="max-w-md w-full bg-[#1c1d25] p-6 rounded-3xl border border-[#3a3f55] shadow-2xl space-y-6 my-auto">
        {/* Header Section */}
        <div className="text-center">
          <p className="text-[#707486] text-[11px] font-bold tracking-[0.15em] uppercase mb-3 flex items-center justify-center gap-2">
            {isAbsenMode ? <ClipboardList size={14} /> : <Camera size={14} />}
            {isAbsenMode ? "ABSENCE REPORT" : "DAILY ATTENDANCE"}
          </p>
          <h2 className="text-3xl font-bold text-white mb-2">
            Hi, {user.name.split(" ")[0]}!
          </h2>
          <p className="text-sm text-[#707486]">
            {isAbsenMode
              ? "Silakan isi detail alasan ketidakhadiran Anda hari ini."
              : "Ambil selfie absensi masuk agar Anda bisa mengakses Dashboard."}
          </p>
        </div>

        {/* Dynamic Content: Webcam OR Form */}
        {!isAbsenMode ? (
          <div className="relative w-full aspect-square md:aspect-video rounded-2xl overflow-hidden border-2 border-[#3a3f55] bg-black shadow-inner">
            <Webcam
              audio={false}
              ref={webcamRef}
              screenshotFormat="image/jpeg"
              mirrored={true}
              videoConstraints={{ facingMode: "user" }}
              className="w-full h-full object-cover"
              onUserMediaError={(error) => {
                console.error(error);
                setCameraError(
                  "Kamera tidak tersedia atau izin ditolak. Anda tetap bisa absen tanpa foto.",
                );
              }}
              onUserMedia={() => setCameraError("")}
            />
            <div className="absolute inset-0 pointer-events-none border-[4px] border-[#2185FE]/30 rounded-2xl"></div>
            {cameraError && (
              <div className="absolute bottom-2 inset-x-2 bg-black/60 p-2 rounded text-yellow-300 text-[11px] text-center backdrop-blur-md">
                {cameraError}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4 animate-in fade-in zoom-in-95 duration-300">
            <div>
              <div className="flex items-center bg-transparent rounded-xl px-4 py-2 h-[64px] border border-[#3a3f55] focus-within:border-[#2185FE] transition-all">
                <div className="flex flex-col flex-1">
                  <Label className="text-[#707486] text-[10px] uppercase tracking-wider mb-0.5 font-semibold">
                    Alasan
                  </Label>
                  <Select value={absenReason} onValueChange={setAbsenReason}>
                    <SelectTrigger className="bg-none! border-none p-0 h-auto text-white text-[15px] outline-none ring-0 focus:ring-0 focus:ring-offset-0 shadow-none w-full">
                      <SelectValue placeholder="Pilih alasan..." />
                    </SelectTrigger>
                    <SelectContent className="w-full bg-[#1c1d25] border-[#3a3f55] text-white rounded-xl">
                      {ABSEN_REASONS.map((reason) => (
                        <SelectItem
                          key={reason}
                          value={reason}
                          className="focus:bg-[#3a3f55] focus:text-white cursor-pointer"
                        >
                          {reason}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div>
              <div className="flex bg-transparent rounded-xl px-4 py-3 min-h-[64px] border border-[#3a3f55] focus-within:border-[#2185FE] transition-all">
                <div className="flex flex-col flex-1">
                  <Label className="text-[#707486] text-[10px] uppercase tracking-wider mb-0.5 font-semibold">
                    Catatan (Opsional)
                  </Label>
                  <textarea
                    value={absenNotes}
                    onChange={(e) => setAbsenNotes(e.target.value)}
                    className="bg-transparent border-none p-0 mt-1 h-20 text-white text-[15px] outline-none ring-0 focus-visible:ring-0 shadow-none resize-none placeholder:text-[#5c6170]"
                    placeholder="Tuliskan keterangan detail di sini..."
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Buttons Action */}
        <div className="flex gap-4 pt-4">
          <Button
            type="button"
            onClick={() => {
              setIsAbsenMode(!isAbsenMode);
              setAbsenReason("");
              setAbsenNotes("");
            }}
            disabled={submitting}
            className="w-[35%] h-[56px] rounded-xl bg-transparent border border-[#3a3f55] hover:bg-[#2b2e3e] text-white font-semibold text-sm transition-all shadow-none"
          >
            {isAbsenMode ? "Kembali" : "Izin/Sakit"}
          </Button>

          <Button
            type="button"
            onClick={handleSubmit}
            disabled={submitting || (isAbsenMode && !absenReason)}
            className={`flex-1 h-[56px] rounded-xl text-white font-semibold text-sm transition-all shadow-none ${
              submitting
                ? "bg-blue-500/50 cursor-not-allowed"
                : "bg-[#2185FE] hover:bg-[#1c71db]"
            }`}
          >
            {submitting
              ? "Processing..."
              : isAbsenMode
                ? "Submit Report"
                : "Absen & Masuk"}
          </Button>
        </div>
      </div>
    </div>
  );
}
