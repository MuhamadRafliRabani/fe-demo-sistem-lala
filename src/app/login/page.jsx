"use client";

import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema } from "@/schema/Login-schema";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { usePost } from "@/hooks/use-api-mutation";
import { useAuthStore } from "@/hooks/auth-store";
import { useQueryClient } from "@tanstack/react-query";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Webcam from "react-webcam";
import axiosInstance from "@/lib/axios";
import { unlockAudio } from "@/lib/unlock-audio";
import { IconEye, IconEyeOff, IconIdBadge2 } from "@tabler/icons-react";
import { Rocket, ClipboardList } from "lucide-react"; // Tambahan icon untuk mode absen

// Import Shadcn Select & Textarea
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const ABSEN_REASONS = [
  "Orang tua sakit",
  "Anak sakit",
  "Suami / istri sakit",
  "Kakek / nenek / saudara meninggal",
  "Motor rusak / harus ke bengkel",
  "Motor dipakai orang lain",
  "Lainnya",
];

export default function LoginPage() {
  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: "", password: "" },
    mode: "onTouched",
  });

  const { mutate, isPending } = usePost("/login");
  const queryClient = useQueryClient();
  const { setAuth, user, isHydrated, loadFromStorage } = useAuthStore();
  const router = useRouter();

  const [showPassword, setShowPassword] = useState(false);
  const [loginSubmitting, setLoginSubmitting] = useState(false);

  const [showSelfie, setShowSelfie] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState(null);
  const [loginDataCache, setLoginDataCache] = useState(null);
  const [cameraError, setCameraError] = useState("");
  const webcamRef = React.useRef(null);
  const setWebcamRef = React.useCallback((node) => {
    webcamRef.current = node;
  }, []);
  const cameraStreamRef = React.useRef(null);
  const cameraReadyRef = React.useRef(false);
  const locationCacheRef = React.useRef(null);
  const locationFetchRef = React.useRef(null);
  const locationWarningShown = React.useRef(false);
  const cameraWarningShown = React.useRef(false);

  const warmUpCamera = async () => {
    if (showSelfie || cameraStreamRef.current) return;
    if (
      typeof navigator === "undefined" ||
      !navigator.mediaDevices?.getUserMedia
    )
      return;

    try {
      const stream = await Promise.race([
        navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 640 },
            height: { ideal: 480 },
            facingMode: { ideal: "user" },
          },
          audio: false,
        }),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("timeout")), 8000),
        ),
      ]);
      cameraStreamRef.current = stream;
      cameraReadyRef.current = true;
    } catch {
      cameraReadyRef.current = false;
      cameraStreamRef.current = null;
    }
  };

  const stopCameraStream = () => {
    if (!cameraStreamRef.current) return;
    cameraStreamRef.current.getTracks().forEach((track) => track.stop());
    cameraStreamRef.current = null;
    cameraReadyRef.current = false;
  };

  const handleFormFocus = () => {
    warmUpCamera();
  };

  // === STATE BARU UNTUK TOGGLE MODE ABSEN ===
  const [isAbsenMode, setIsAbsenMode] = useState(false);
  const [absenReason, setAbsenReason] = useState("");
  const [absenNotes, setAbsenNotes] = useState("");

  const notifyLocationPermissionIssue = () => {
    if (locationWarningShown.current) return;
    locationWarningShown.current = true;
    toast.info(
      "Lokasi tidak dapat dibagikan. Anda tetap bisa melanjutkan, tetapi absensi akan dicatat tanpa koordinat.",
    );
  };

  const notifyCameraPermissionIssue = () => {
    if (cameraWarningShown.current) return;
    cameraWarningShown.current = true;
    toast.warning(
      "Izin kamera tidak diberikan. Anda tetap bisa melanjutkan tanpa foto.",
    );
  };

  const getBrowserLocation = () => {
    return new Promise((resolve, reject) => {
      if (typeof window === "undefined") {
        return reject(new Error("NO_WINDOW"));
      }
      if (!window.isSecureContext) {
        return reject(new Error("INSECURE_CONTEXT"));
      }
      if (!navigator?.geolocation) {
        return reject(new Error("GEOLOCATION_UNSUPPORTED"));
      }

      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 1000 * 60 * 2,
      });
    });
  };

  const parseLocationPosition = (pos) => {
    const lat = pos?.coords?.latitude;
    const lng = pos?.coords?.longitude;
    if (typeof lat !== "number" || typeof lng !== "number") return null;
    return {
      lat,
      lng,
      accuracy:
        typeof pos.coords.accuracy === "number"
          ? pos.coords.accuracy
          : undefined,
      location_source: "browser",
    };
  };

  const buildLocationPayload = async ({ useCache = true } = {}) => {
    if (useCache && locationCacheRef.current) {
      return locationCacheRef.current;
    }

    if (locationFetchRef.current) {
      return locationFetchRef.current;
    }

    locationFetchRef.current = (async () => {
      try {
        const pos = await getBrowserLocation();
        const payload = parseLocationPosition(pos);
        if (payload) {
          locationCacheRef.current = payload;
          return payload;
        }
      } catch (err) {
        const code = err?.code;
        if (code === 1 || code === 2 || code === 3) {
          notifyLocationPermissionIssue();
        }
      }

      try {
        const pos = await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: false,
            timeout: 8000,
            maximumAge: 1000 * 60 * 5,
          });
        });
        const payload = parseLocationPosition(pos);
        if (payload) {
          locationCacheRef.current = payload;
          return payload;
        }
      } catch (err) {
        const code = err?.code;
        if (code === 1 || code === 2 || code === 3) {
          notifyLocationPermissionIssue();
        }
      }

      return null;
    })();

    try {
      return await locationFetchRef.current;
    } finally {
      locationFetchRef.current = null;
    }
  };

  const hasCameraInput = async () => {
    if (
      typeof navigator === "undefined" ||
      !navigator.mediaDevices?.getUserMedia
    ) {
      return false;
    }

    if (navigator.mediaDevices.enumerateDevices) {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        return devices.some((device) => device.kind === "videoinput");
      } catch {
        return true;
      }
    }

    return true;
  };

  const dataUrlToFile = (dataUrl, fileName) => {
    const arr = dataUrl.split(",");
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], fileName, { type: mime });
  };

  const recordAttendance = async ({
    status = "hadir",
    note = "Hadir",
    photo,
    auto = true,
    userData,
    token,
    location,
  }) => {
    const attendPayload = new FormData();
    attendPayload.append("status", status);
    attendPayload.append("note", note);
    attendPayload.append("auto", auto ? "1" : "0");
    if (location) {
      attendPayload.append("lat", String(location.lat));
      attendPayload.append("lng", String(location.lng));
      if (typeof location.accuracy === "number") {
        attendPayload.append("accuracy", String(location.accuracy));
      }
      attendPayload.append("location_source", location.location_source);
    }
    if (photo) {
      const file = dataUrlToFile(
        photo,
        `selfie-${new Date().toISOString().split("T")[0]}.jpg`,
      );
      attendPayload.append("photo_file", file);
    }

    return axiosInstance.post("/attending", attendPayload, {
      headers: { Authorization: `Bearer ${token}` },
    });
  };

  const createAttendanceOnly = async ({ userData, token, location }) => {
    try {
      await recordAttendance({
        status: "hadir",
        note: "Hadir",
        auto: true,
        userData,
        token,
        location,
      });
    } catch (err) {
      const statusCode = err?.response?.status;
      const apiErrors = err?.response?.data?.errors;
      const alreadyRecorded =
        statusCode === 422 &&
        Array.isArray(apiErrors?.status) &&
        apiErrors.status.some((m) =>
          String(m).toLowerCase().includes("sudah tercatat"),
        );

      if (!alreadyRecorded) {
        throw err;
      }
    }
  };

  const submitAttendance = async ({
    status,
    note,
    photo,
    auto,
    userData,
    token,
    location,
  }) => {
    let shouldRedirect = false;

    try {
      await recordAttendance({
        status,
        note,
        photo,
        auto,
        userData,
        token,
        location,
      });
      setAuth(userData, token);
      unlockAudio();
      shouldRedirect = true;
      if (status === "absen") {
        toast.success("Laporan absen berhasil disimpan.");
      } else {
        toast.success("Selamat datang! Absensi Anda sudah selesai.");
      }
    } catch (err) {
      const statusCode = err?.response?.status;
      const apiErrors = err?.response?.data?.errors;
      const alreadyRecorded =
        statusCode === 422 &&
        Array.isArray(apiErrors?.status) &&
        apiErrors.status.some((m) =>
          String(m).toLowerCase().includes("sudah tercatat"),
        );

      if (alreadyRecorded) {
        setAuth(userData, token);
        unlockAudio();
        shouldRedirect = true;
        toast.success("Absensi hari ini sudah tercatat.");
      } else {
        const firstField = apiErrors ? Object.keys(apiErrors)[0] : null;
        const firstMsg =
          firstField && Array.isArray(apiErrors[firstField])
            ? apiErrors[firstField][0]
            : null;
        toast.error(
          firstMsg ||
            err?.response?.data?.message ||
            "Tidak dapat menyimpan absensi saat ini. Silakan coba lagi.",
        );
      }
    } finally {
      setLoginSubmitting(false);
      setShowSelfie(false);
      setLoginDataCache(null);
      setCapturedPhoto(null);
      if (shouldRedirect) {
        router.push("/dashboard");
      }
    }
  };

  const handleLoginSuccess = async (
    userData,
    token,
    location,
    hasAttendedToday,
  ) => {
    if (isAbsenMode) {
      const reason = absenReason.trim();
      const note = reason
        ? `${reason}${absenNotes.trim() ? ` - ${absenNotes.trim()}` : ""}`
        : "Absen";
      const resolvedLocation =
        location || (await buildLocationPayload({ useCache: true }));
      await submitAttendance({
        status: "absen",
        note,
        auto: true,
        userData,
        token,
        location: resolvedLocation,
      });
      return;
    }
    const resolvedLocation =
      location || (await buildLocationPayload({ useCache: true }));

    if (hasAttendedToday) {
      // ✅ Langsung ke dashboard, tidak perlu selfie → setAuth di sini aman
      setAuth(userData, token);
      unlockAudio();
      queryClient.invalidateQueries({ queryKey: ["attending"], exact: false });
      toast.success("Absensi hari ini sudah tercatat. Selamat datang kembali!");
      setLoginSubmitting(false);
      router.push("/dashboard");
      return;
    }

    try {
      await createAttendanceOnly({
        userData,
        token,
        location: resolvedLocation,
      });
    } catch (err) {
      console.warn("Create attendance error:", err);
    }

    if (cameraStreamRef.current && cameraReadyRef.current) {
      setLoginDataCache({ userData, token, location: resolvedLocation });
      setShowSelfie(true); // ✅ setAuth belum dipanggil → useEffect tidak trigger redirect
      setLoginSubmitting(false);
      toast.success("Login berhasil. Ambil selfie absensi Anda.");
      return;
    }

    // Tidak ada kamera → setAuth di sini aman (tidak ada selfie)
    setAuth(userData, token);
    unlockAudio();
    queryClient.invalidateQueries({ queryKey: ["attending"], exact: false });
    toast.success("Login berhasil. Mengalihkan ke dashboard...");
    setLoginSubmitting(false);
    router.push("/dashboard");
  };

  const onSubmit = async (data) => {
    if (loginSubmitting || isPending) return;
    if (isAbsenMode && !absenReason) {
      toast.error("Silakan pilih alasan absen terlebih dahulu");
      return;
    }

    setLoginSubmitting(true);
    const { username: name, password } = data;
    const location = await buildLocationPayload({ useCache: true });
    const payload = location
      ? { name, password, ...location }
      : { name, password };

    mutate(payload, {
      onSuccess: async (res) => {
        const responsePayload = res?.data ?? res;
        const userData =
          responsePayload?.user?.data ??
          responsePayload?.data?.user?.data ??
          responsePayload?.data?.user ??
          responsePayload?.user;
        const token = responsePayload?.token ?? responsePayload?.data?.token;

        if (userData && token) {
          const hasAttendedToday = responsePayload?.has_attended_today ?? false;
          const serverLocation = responsePayload?.location ?? location;

          await handleLoginSuccess(
            userData,
            token,
            serverLocation,
            hasAttendedToday,
          );
        } else {
          setLoginSubmitting(false);
          toast.error("Login tidak dapat diproses. Silakan coba lagi.");
        }
      },
      onError: (err) => {
        toast.error(
          err?.response?.data?.message ||
            "Login gagal. Periksa username dan password lalu coba lagi.",
        );
        setLoginSubmitting(false);
      },
    });
  };

  const submitHandler = (event) => {
    event.preventDefault();
    void handleSubmit(onSubmit)(event);
  };

  const handleCaptureSelfie = async () => {
    if (!loginDataCache || !webcamRef.current) return;
    const imageSrc = webcamRef.current.getScreenshot();
    if (!imageSrc) {
      toast.error(
        "Foto tidak dapat diambil. Anda bisa melewati selfie atau mencoba lagi.",
      );
      return;
    }

    setLoginSubmitting(true);
    const cachedData = loginDataCache;
    setCapturedPhoto(imageSrc);

    try {
      await recordAttendance({
        status: "hadir",
        note: "Hadir",
        photo: imageSrc,
        auto: true,
        userData: cachedData.userData,
        token: cachedData.token,
        location: cachedData.location,
      });
      toast.success("Selfie berhasil disimpan.");
    } catch (err) {
      console.warn("Upload selfie error:", err);
      toast.warning(
        "Foto selfie tidak tersimpan, tapi akses ke dashboard tetap berhasil.",
      );
    } finally {
      setShowSelfie(false);
      setLoginDataCache(null);
      setCapturedPhoto(null);
      stopCameraStream();
      setLoginSubmitting(false);
      // ✅ setAuth dipanggil SETELAH selfie selesai
      setAuth(cachedData.userData, cachedData.token);
      unlockAudio();
      queryClient.invalidateQueries({ queryKey: ["attending"], exact: false });
      router.push("/dashboard");
    }
  };

  const handleSkipSelfie = async () => {
    if (!loginDataCache) {
      router.push("/dashboard");
      return;
    }

    const { userData, token } = loginDataCache; // ✅ ambil dulu sebelum di-null
    setShowSelfie(false);
    setLoginDataCache(null);
    setLoginSubmitting(false);
    stopCameraStream();
    // ✅ setAuth dipanggil SETELAH selfie di-skip
    setAuth(userData, token);
    unlockAudio();
    queryClient.invalidateQueries({ queryKey: ["attending"], exact: false });
    router.push("/dashboard");
  };

  useEffect(() => {
    loadFromStorage();
    warmUpCamera();
    buildLocationPayload({ useCache: true }).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once on mount
  }, [loadFromStorage]);

  useEffect(() => {
    if (showSelfie) {
      stopCameraStream();
    }
  }, [showSelfie]);

  useEffect(() => {
    const expired = localStorage.getItem("auth_error");
    const validasi_error = localStorage.getItem("validasi_error");

    if (validasi_error) {
      localStorage.removeItem("validasi_error");
      toast.error(validasi_error);
    }

    if (expired) {
      localStorage.removeItem("auth_error");
      toast.error("Sesi Anda telah habis. Silakan login ulang.");
    }
  }, []);

  useEffect(() => {
    if (isHydrated && user && !showSelfie) {
      router.replace("/dashboard");
    }
  }, [isHydrated, user, router, showSelfie]);

  return (
    // CONTAINER UTAMA (FULL SCREEN 100%)
    <div className="min-h-screen w-full flex bg-background font-sans overflow-hidden">
      {/* ================= LEFT: IMAGE PANEL (45%) ================= */}
      <div className="hidden lg:block w-[45%] relative min-h-screen bg-secondary">
        <Image
          src="/assets/images/TR3.jpeg"
          alt="Background"
          fill
          className="object-cover"
          priority
        />

        {/* EFEK BLUR & SEAMLESS BLEND: Memudar ke warna form system ke arah kanan */}
        <div className="absolute inset-0 bg-background/40 mix-blend-multiply z-10"></div>
        <div className="absolute inset-y-0 right-0 w-[60%] bg-gradient-to-r from-transparent via-background/80 to-background z-10"></div>

        {/* Tekstur Kasar/Noise Halus */}
        <div className="absolute inset-0 z-10 opacity-15 mix-blend-overlay pointer-events-none">
          <svg width="100%" height="100%">
            <filter id="noise">
              <feTurbulence
                type="fractalNoise"
                baseFrequency="0.8"
                numOctaves="4"
                stitchTiles="stitch"
              />
            </filter>
            <rect width="100%" height="100%" filter="url(#noise)" />
          </svg>
        </div>

        {/* SVG PEMBATAS KULAK-KELOK (Winding Dashed Line) */}
        <div className="absolute top-0 right-[-1px] h-full w-[250px] z-20 pointer-events-none text-background">
          <svg
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            className="w-full h-full"
          >
            <path
              d="M100,0 L60,0 C90,20 10,40 50,60 C85,75 30,90 50,100 L100,100 Z"
              fill="currentColor"
            />
            <path
              d="M60,0 C90,20 10,40 50,60 C85,75 30,90 50,100"
              fill="none"
              stroke="#404353"
              strokeWidth="0.4"
              strokeDasharray="1.5 2"
            />
          </svg>
        </div>
      </div>

      {/* ================= RIGHT: FORM PANEL (55%) ================= */}
      <div className="w-full lg:w-[55%] relative flex flex-col justify-center px-6 sm:px-12 lg:px-24 min-h-[100dvh] bg-background z-30">
        {/* HEADER NAV (Absolute di atas) */}
        <div className="absolute top-8 left-6 sm:left-12 lg:left-24 right-6 sm:right-12 lg:right-24 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative w-7 h-7 rounded-full overflow-hidden">
              <Image
                src="/apple-touch-icon.png"
                alt="App Logo"
                fill
                className="object-cover"
              />
            </div>
            <span className="text-foreground font-semibold text-base tracking-wide">
              ERP INTERNAL.
            </span>
          </div>
          <div className="hidden md:flex gap-8 text-muted-foreground text-[13px] font-medium">
            <span className="hover:text-foreground transition cursor-pointer">
              Home
            </span>
            <span className="hover:text-foreground transition cursor-pointer">
              Join
            </span>
          </div>
        </div>

        {/* FORM AREA (Ditengah vertikal) */}
        <div className="w-full max-w-[420px] mx-auto max-sm:mt-12 lg:mt-0">
          {/* HEADER DYNAMIC TOGGLE */}
          <p className="text-muted-foreground text-[11px] font-bold tracking-[0.15em] uppercase mb-4 flex items-center gap-2">
            {isAbsenMode ? <ClipboardList size={14} /> : <Rocket size={14} />}
            {isAbsenMode ? "ABSENCE REPORT" : "WELCOME BACK"}
          </p>

          <h1 className="text-foreground text-4xl lg:text-[2.7rem] lg:text-nowrap leading-tight font-bold mb-3">
            {isAbsenMode ? "Report absence" : "Let’s get started"}
            <span className="text-primary">{isAbsenMode ? "📋." : "✨."}</span>
          </h1>

          <p className="text-muted-foreground text-sm font-medium mb-10">
            {isAbsenMode
              ? "Please select a reason and provide necessary details."
              : "Log in and continue building amazing things."}
          </p>

          {/* FORM ELEMENT */}
          {!showSelfie ? (
            <form onSubmit={submitHandler} className="space-y-5">
              {/* USERNAME INPUT */}
              <div>
                <div
                  className={`flex items-center bg-transparent rounded-xl px-4 py-2 h-[64px] border transition-all ${
                    errors.username
                      ? "border-destructive/50"
                      : "border-border focus-within:border-ring"
                  }`}
                >
                  <div className="flex flex-col flex-1">
                    <Label className="text-muted-foreground text-[10px] uppercase tracking-wider mb-0.5 font-semibold cursor-text">
                      Username
                    </Label>
                    <input
                      type="text"
                      {...register("username")}
                      onFocus={handleFormFocus}
                      disabled={isPending || loginSubmitting}
                      className="bg-transparent border-none p-0 h-auto text-foreground text-[15px] outline-none ring-0 focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground/80 shadow-none"
                      placeholder="Enter your username"
                    />
                  </div>
                  <IconIdBadge2
                    size={20}
                    className="text-muted-foreground mr-1"
                  />
                </div>
                {errors.username && (
                  <p className="text-destructive text-xs mt-1.5 ml-1">
                    {errors.username.message}
                  </p>
                )}
              </div>

              {/* PASSWORD INPUT */}
              <div>
                <div
                  className={`flex items-center bg-transparent rounded-xl px-4 py-2 h-[64px] border transition-all ${
                    errors.password
                      ? "border-destructive/50"
                      : "border-border focus-within:border-ring"
                  }`}
                >
                  <div className="flex flex-col flex-1">
                    <Label className="text-primary text-[10px] uppercase tracking-wider mb-0.5 font-semibold cursor-text">
                      Password
                    </Label>
                    <input
                      type={showPassword ? "text" : "password"}
                      {...register("password")}
                      onFocus={handleFormFocus}
                      disabled={isPending || loginSubmitting}
                      className="bg-transparent border-none p-0 h-auto text-foreground text-[15px] outline-none ring-0 focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 tracking-widest placeholder:tracking-normal placeholder:text-muted-foreground/80 shadow-none"
                      placeholder="••••••••"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    disabled={isPending || loginSubmitting}
                    className="text-muted-foreground hover:text-foreground transition-colors mr-1"
                  >
                    {showPassword ? (
                      <IconEyeOff size={20} />
                    ) : (
                      <IconEye size={20} />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-destructive text-xs mt-1.5 ml-1">
                    {errors.password.message}
                  </p>
                )}
              </div>

              {isAbsenMode && (
                <>
                  <div>
                    <div className="flex items-center bg-transparent rounded-xl px-4 py-2 h-[64px] border border-border focus-within:border-ring transition-all">
                      <div className="flex flex-col flex-1">
                        <Label className="text-muted-foreground text-[10px] uppercase tracking-wider mb-0.5 font-semibold cursor-text">
                          Reason
                        </Label>
                        <Select
                          value={absenReason}
                          onValueChange={setAbsenReason}
                        >
                          <SelectTrigger className="bg-none! border-none p-0 h-auto text-foreground text-[15px] outline-none ring-0 focus:ring-0 focus:ring-offset-0 shadow-none w-full ps-2">
                            <SelectValue placeholder="Select a reason" />
                          </SelectTrigger>
                          <SelectContent className="w-full bg-popover text-foreground rounded-xl">
                            {ABSEN_REASONS.map((reason) => (
                              <SelectItem
                                key={reason}
                                value={reason}
                                className="focus:bg-accent focus:text-accent-foreground cursor-pointer"
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
                    <div className="flex bg-transparent rounded-xl px-4 py-3 min-h-[64px] border border-border focus-within:border-ring transition-all">
                      <div className="flex flex-col flex-1">
                        <Label className="text-muted-foreground text-[10px] uppercase tracking-wider mb-0.5 font-semibold cursor-text">
                          Notes (Optional)
                        </Label>
                        <textarea
                          value={absenNotes}
                          onChange={(e) => setAbsenNotes(e.target.value)}
                          className="bg-transparent border-none p-0 mt-1 h-16 text-foreground text-[15px] outline-none ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none resize-none placeholder:text-muted-foreground/80"
                          placeholder="Enter additional details..."
                        />
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* BUTTONS DYNAMIC TOGGLE */}
              <div className="flex gap-4 pt-6">
                {/* <Button
                  type="button"
                  onClick={() => {
                    setIsAbsenMode((current) => !current);
                    setAbsenReason("");
                    setAbsenNotes("");
                  }}
                  className="w-[35%] h-[56px] rounded-xl bg-transparent border border-[#3a3f55] hover:bg-[#2b2e3e] text-white font-semibold text-sm transition-all shadow-none"
                >
                  {isAbsenMode ? "Sign in" : "Absen"}
                </Button> */}

                <Button
                  type="submit"
                  disabled={
                    (!isDirty && !isAbsenMode) || isPending || loginSubmitting
                  }
                  className={`flex-1 h-[56px] rounded-xl text-primary-foreground font-semibold text-sm transition-all shadow-none ${
                    isPending || loginSubmitting
                      ? "bg-primary/50 cursor-not-allowed"
                      : "bg-primary hover:bg-primary/90"
                  }`}
                >
                  {isPending || loginSubmitting
                    ? "Memproses..."
                    : isAbsenMode
                      ? "Kirim laporan"
                      : "Masuk"}
                </Button>
              </div>
            </form>
          ) : (
            <div className="flex flex-col items-center justify-center space-y-6 w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="relative w-full aspect-square md:aspect-video rounded-2xl overflow-hidden border-2 border-border bg-background shadow-lg">
                {!capturedPhoto ? (
                  <Webcam
                    audio={false}
                    ref={setWebcamRef}
                    screenshotFormat="image/jpeg"
                    screenshotQuality={0.85}
                    mirrored={true}
                    forceScreenshotSourceSize={false}
                    videoConstraints={{
                      facingMode: { ideal: "user" },
                      width: { ideal: 640 },
                      height: { ideal: 480 },
                    }}
                    className="w-full h-full object-cover"
                    onUserMediaError={() => {
                      setCameraError(
                        "Kamera tidak tersedia atau izin ditolak. Anda tetap bisa melanjutkan tanpa foto.",
                      );
                      notifyCameraPermissionIssue();
                    }}
                    onUserMedia={() => {
                      setCameraError("");
                      cameraWarningShown.current = false;
                    }}
                  />
                ) : (
                  <Image
                    src={capturedPhoto}
                    alt="Captured"
                    fill
                    className="object-cover"
                  />
                )}

                {/* Overlay guides */}
                <div className="absolute inset-0 pointer-events-none">
                  <div className="w-full h-full border-[4px] border-primary/30 rounded-2xl"></div>
                </div>
              </div>
              {cameraError ? (
                <p className="text-warning text-xs mt-3">{cameraError}</p>
              ) : (
                <p className="text-muted-foreground text-xs mt-3">
                  Kamera terdeteksi. Selfie adalah bukti identitas Anda
                </p>
              )}

              <div className="flex gap-4 w-full">
                {/* <Button
                  type="button"
                  onClick={handleSkipSelfie}
                  disabled={loginSubmitting}
                  className="w-[35%] h-[56px] rounded-xl bg-transparent border border-[#3a3f55] hover:bg-[#2b2e3e] text-white font-semibold text-sm transition-all shadow-none"
                >
                  Lewati
                </Button> */}

                <Button
                  type="button"
                  onClick={handleCaptureSelfie}
                  disabled={loginSubmitting}
                  className={`flex-1 h-[56px] rounded-xl text-primary-foreground font-semibold text-sm transition-all shadow-none ${
                    loginSubmitting
                      ? "bg-primary/50 cursor-not-allowed"
                      : "bg-primary hover:bg-primary/90"
                  }`}
                >
                  {loginSubmitting ? "Processing..." : "Ambil Foto"}
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* LOGO .AW Kanan Bawah (Absolute) */}
        {!showSelfie ? (
          <div className="absolute bottom-14 right-6 sm:right-12 lg:right-24 flex items-baseline">
            <span className="text-foreground font-extrabold text-[2rem] tracking-tighter">
              LL . ID
            </span>
          </div>
        ) : null}
      </div>
    </div>
  );
}
