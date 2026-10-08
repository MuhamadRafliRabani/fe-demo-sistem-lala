"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  User,
  Users,
  AlertTriangle,
  Camera,
  Trash2,
  Plus,
  CheckSquare,
  Save,
  Briefcase,
  FileText,
  Loader2,
} from "lucide-react";
import DashboardLayout from "@/components/layouts/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import RichTextEditor from "@/components/rich-text-editor";
import { DatePicker } from "@/components/date-picker";
import { useParams } from "next/navigation";
import { useApiFetch } from "@/hooks/use-api-fetch";
import { toast } from "sonner";
import { resolveImageUrl } from "@/lib/resolve-image-url";
import { generateDailyReportPdf } from "@/lib/generate-daily-report-pdf";
import axiosInstance from "@/lib/axios";
import {
  clearDailyReportDraft,
  createDailyReportDraftKey,
  deletePendingPhotoDraft,
  getPendingPhotoDraft,
  listPendingPhotoDrafts,
  loadDailyReportDraft,
  patchPendingPhotoDraft,
  putPendingPhotoDraft,
  saveDailyReportDraft,
} from "@/lib/daily-report-draft-store";
import PreviewPdfDailyReport from "../../../components/preview-pdf-daily-report";

const TODAY = new Date().toISOString().split("T")[0];
const AUTOSAVE_DELAY_MS = 600;
const CAPTION_SAVE_DELAY_MS = 700;
const UPLOAD_CONCURRENCY = 2;
const MAX_UPLOAD_RETRIES = 6;
const createDefaultIssues = () => [
  { id: "issue-0", problem: "", solution: "" },
];
const createDefaultPlans = () => [{ id: "plan-0", task: "" }];
const createTempPhotoId = () =>
  `tmp-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
const isServerPhoto = (photo) => Number.isInteger(photo?.id);
const normalizeText = (v) =>
  String(v || "")
    .replace(/[ \t]+/g, " ")
    .trim();

// FUNGSI HELPER: Proxy Google Drive Images
const getProxiedUrl = (url) => {
  if (!url) return "";
  if (url.startsWith("data:") || url.startsWith("blob:")) return url;
  if (
    url.includes("drive.google.com") ||
    url.includes("googleusercontent.com")
  ) {
    return `/api/proxy-image?url=${encodeURIComponent(url)}`;
  }
  return url;
};
const createLocalPhotoKey = ({
  name = "",
  size = 0,
  lastModified = 0,
  type = "",
}) => `${name}__${size}__${lastModified}__${type}`;
const getPhotoIdentity = (photo) => {
  if (photo?.driveFileId) return `drive:${photo.driveFileId}`;
  if (photo?.localFileKey) return `local:${photo.localFileKey}`;
  if (Number.isInteger(photo?.id)) return `server:${photo.id}`;
  if (photo?.tempId) return `temp:${photo.tempId}`;
  return null;
};
const dedupePhotos = (photos = []) => {
  const picked = new Map();
  photos.forEach((photo) => {
    const key = getPhotoIdentity(photo);
    if (!key) {
      picked.set(`fallback:${picked.size}`, photo);
      return;
    }

    const existing = picked.get(key);
    if (!existing) {
      picked.set(key, photo);
      return;
    }

    const existingScore =
      (isServerPhoto(existing) ? 100 : 0) +
      (existing?.isCommitted ? 10 : 0) +
      (existing?.driveFileId ? 5 : 0);
    const nextScore =
      (isServerPhoto(photo) ? 100 : 0) +
      (photo?.isCommitted ? 10 : 0) +
      (photo?.driveFileId ? 5 : 0);

    if (nextScore >= existingScore) {
      picked.set(key, photo);
    }
  });
  return Array.from(picked.values());
};
const toTimestamp = (value) => {
  const ms = value ? new Date(value).getTime() : NaN;
  return Number.isFinite(ms) ? ms : 0;
};
const hasMeaningfulDraftChanges = (draft = {}) => {
  const formData = draft?.formData ?? {};
  const hasText =
    normalizeText(formData.location) !== "" ||
    normalizeText(formData.progress) !== "" ||
    normalizeText(formData.workers) !== "";
  const hasIssues = Array.isArray(draft?.issues)
    ? draft.issues.some(
        (issue) =>
          normalizeText(issue?.problem) !== "" ||
          normalizeText(issue?.solution) !== "",
      )
    : false;
  const hasPlans = Array.isArray(draft?.plans)
    ? draft.plans.some((plan) => normalizeText(plan?.task) !== "")
    : false;
  const hasPhotos =
    Array.isArray(draft?.pendingPhotos) && draft.pendingPhotos.length > 0;

  return hasText || hasIssues || hasPlans || hasPhotos;
};
const shouldPreferLocalDraft = (draft, serverUpdatedAt) => {
  if (!draft || !hasMeaningfulDraftChanges(draft)) return false;

  const draftUpdatedAt = toTimestamp(draft?.updatedAt);
  const draftLastSyncedAt = toTimestamp(draft?.lastSyncedAt);
  const serverTs = toTimestamp(serverUpdatedAt);

  if (!serverTs) return true;
  if (draftLastSyncedAt && draftLastSyncedAt >= draftUpdatedAt) return false;
  return draftUpdatedAt > serverTs;
};

const normalizeServerPhoto = (photo, idx = 0) => ({
  id: photo?.id ?? `photo-server-${idx}`,
  url: photo?.url ?? "",
  file: null,
  caption: photo?.caption ?? "",
  isUploading: false,
  uploadQueued: false,
  uploadError: false,
  uploadAttempts: 0,
  isCommitted: true,
  driveFileId:
    photo?.storage_type === "gdrive" ? photo?.file_path || null : null,
  filename: photo?.original_name ?? photo?.filename ?? "photo.jpg",
  size: photo?.size,
  mime_type: photo?.mime_type,
  storage_type: photo?.storage_type ?? "gdrive",
  localPreviewUrl: null,
  remoteUrl: photo?.url ?? "",
});

const getDraftPhotosSnapshot = (photos = []) =>
  photos
    .filter((photo) => !isServerPhoto(photo))
    .map((photo) => ({
      tempId: String(photo?.tempId || photo?.id),
      caption: photo?.caption ?? "",
      driveFileId: photo?.driveFileId ?? null,
      remoteUrl: photo?.remoteUrl ?? photo?.url ?? "",
      filename: photo?.filename ?? "photo.jpg",
      size: photo?.size ?? null,
      mime_type: photo?.mime_type ?? "image/jpeg",
      storage_type: photo?.storage_type ?? "gdrive",
      uploadQueued: Boolean(photo?.uploadQueued),
      uploadError: Boolean(photo?.uploadError),
      uploadAttempts: Number(photo?.uploadAttempts || 0),
      localFileKey: photo?.localFileKey ?? null,
    }));

const DailyReportForm = ({ siteId, initialData, initialReportId }) => {
  // ==========================================
  // STATE MANAGEMENT
  // ==========================================
  const [formData, setFormData] = useState(() => ({
    customer: initialData?.customer ?? "",
    supervisor: initialData?.supervisor ?? "",
    location: initialData?.location ?? "",
    date: TODAY,
    progress: initialData?.progress ?? "",
    workers: initialData?.workers ?? "",
  }));

  const [issues, setIssues] = useState(() =>
    Array.isArray(initialData?.issues) && initialData.issues.length > 0
      ? initialData.issues
      : createDefaultIssues(),
  );
  const [photos, setPhotos] = useState(() =>
    Array.isArray(initialData?.photos)
      ? initialData.photos.map((photo, idx) => normalizeServerPhoto(photo, idx))
      : [],
  );
  const [plans, setPlans] = useState(() =>
    Array.isArray(initialData?.plans) && initialData.plans.length > 0
      ? initialData.plans
      : createDefaultPlans(),
  );
  const [reportId, setReportId] = useState(() => initialReportId ?? null);
  const [isPdfGenerating, setIsPdfGenerating] = useState(false);
  const [pdfType, setPdfType] = useState("management");
  const [saveState, setSaveState] = useState("idle");
  const [saveError, setSaveError] = useState("");
  const [lastSavedAt, setLastSavedAt] = useState(null);
  const previewRef = useRef(null);
  const autoSaveTimerRef = useRef(null);
  const autoSaveInFlightRef = useRef(false);
  const autoSaveQueuedRef = useRef(false);
  const inFlightPhotoAttachDriveIdsRef = useRef(new Set());
  const uploadWorkerCountRef = useRef(0);
  const inFlightUploadTempIdsRef = useRef(new Set());
  const captionTimersRef = useRef({});
  const hydratedRef = useRef(false);
  const skipNextAutosaveRef = useRef(true);
  const objectUrlsRef = useRef(new Set());
  const cancelledPhotoIdsRef = useRef(new Set());
  const autosaveNoticeShownRef = useRef(false);
  const serverUpdatedAtRef = useRef(initialData?.serverUpdatedAt ?? null);
  const saveStateRef = useRef("idle");
  const stateRef = useRef({
    formData,
    issues,
    plans,
    photos,
  });

  useEffect(() => {
    stateRef.current = { formData, issues, plans, photos };
  }, [formData, issues, plans, photos]);

  const draftKey = useMemo(
    () => createDailyReportDraftKey(siteId, formData.date || TODAY),
    [siteId, formData.date],
  );

  useEffect(() => {
    serverUpdatedAtRef.current = initialData?.serverUpdatedAt ?? null;
  }, [initialData?.serverUpdatedAt]);

  useEffect(() => {
    inFlightPhotoAttachDriveIdsRef.current = new Set();
    inFlightUploadTempIdsRef.current = new Set();
  }, [draftKey]);

  useEffect(() => {
    saveStateRef.current = saveState;
  }, [saveState]);

  const isAnyUploading = photos.some((p) => p?.isUploading);
  const hasPendingPhotoQueue = photos.some(
    (photo) =>
      !isServerPhoto(photo) && (photo?.uploadQueued || photo?.isUploading),
  );
  const hasUploadFailures = photos.some((photo) => photo?.uploadError);
  const hasUnsyncedUploadedPhotos = photos.some(
    (photo) =>
      !isServerPhoto(photo) &&
      !photo?.isUploading &&
      !photo?.uploadQueued &&
      !photo?.uploadError &&
      photo?.driveFileId &&
      !photo?.isCommitted,
  );
  const totalPhotoCount = photos.length;
  const uploadedPhotoCount = photos.filter(
    (photo) =>
      isServerPhoto(photo) ||
      (!photo?.isUploading && !photo?.uploadQueued && !photo?.uploadError),
  ).length;
  const failedPhotoCount = photos.filter((photo) => photo?.uploadError).length;
  const activeUploadCount = photos.filter(
    (photo) => photo?.isUploading || photo?.uploadQueued,
  ).length;
  const photoSyncPercent =
    totalPhotoCount > 0
      ? Math.round((uploadedPhotoCount / totalPhotoCount) * 100)
      : 100;

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const queueAutosaveNow = () => {
    if (!hydratedRef.current || !siteId) return;
    scheduleAutosave(250);
  };

  const addIssue = () =>
    setIssues([...issues, { id: Date.now(), problem: "", solution: "" }]);
  const removeIssue = (id) =>
    setIssues(issues.filter((issue) => issue.id !== id));
  const updateIssue = (id, field, value) => {
    setIssues(
      issues.map((issue) =>
        issue.id === id ? { ...issue, [field]: value } : issue,
      ),
    );
  };

  const addPlan = () => setPlans([...plans, { id: Date.now(), task: "" }]);
  const removePlan = (id) => setPlans(plans.filter((plan) => plan.id !== id));
  const updatePlan = (id, value) => {
    setPlans((prev) =>
      prev.map((plan) => (plan.id === id ? { ...plan, task: value } : plan)),
    );
  };

  const compressImageFile = async (file) => {
    try {
      const type = String(file?.type || "");
      if (!type.startsWith("image/")) return file;

      const shouldCompress = file.size > 200 * 1024;
      if (!shouldCompress) return file;

      const url = URL.createObjectURL(file);
      const img = new Image();
      img.decoding = "async";
      img.src = url;
      await img.decode();

      const maxSize = 1600;
      const w = img.naturalWidth || img.width;
      const h = img.naturalHeight || img.height;
      const scale = Math.min(
        maxSize / Math.max(1, w),
        maxSize / Math.max(1, h),
        1,
      );
      const tw = Math.max(1, Math.round(w * scale));
      const th = Math.max(1, Math.round(h * scale));

      const canvas = document.createElement("canvas");
      canvas.width = tw;
      canvas.height = th;
      const ctx = canvas.getContext("2d", { alpha: false });
      if (!ctx) {
        URL.revokeObjectURL(url);
        return file;
      }
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(0, 0, tw, th);
      ctx.drawImage(img, 0, 0, tw, th);
      URL.revokeObjectURL(url);

      const blob = await new Promise((resolve) =>
        canvas.toBlob(resolve, "image/jpeg", 0.72),
      );
      if (!blob) return file;

      const nameBase = String(file.name || "photo").replace(/\.[^.]+$/, "");
      const newName = `${nameBase}.jpg`;
      return new File([blob], newName, { type: "image/jpeg" });
    } catch {
      return file;
    }
  };

  const buildSaveFormData = ({ snapshot, photosToAttach }) => {
    const fd = new FormData();
    fd.append("report_date", snapshot.formData.date);
    fd.append("location", normalizeText(snapshot.formData.location));
    fd.append("progress_html", snapshot.formData.progress || "");
    fd.append("workers", normalizeText(snapshot.formData.workers));
    fd.append("supervisor_name", normalizeText(snapshot.formData.supervisor));

    const normalizedIssues = (snapshot.issues || []).map((i) => ({
      ...i,
      problem: normalizeText(i?.problem),
      solution: normalizeText(i?.solution),
    }));
    const normalizedPlans = (snapshot.plans || []).map((p) => ({
      ...p,
      task: normalizeText(p?.task),
    }));
    fd.append("issues_json", JSON.stringify(normalizedIssues));
    fd.append("plans_json", JSON.stringify(normalizedPlans));

    const uploadedPhotos = (photosToAttach || [])
      .filter((p) => p?.driveFileId)
      .map((p) => ({
        storage_type: "gdrive",
        file_id: p.driveFileId,
        filename: p.filename || "photo.jpg",
        size: Number(p.size) || 0,
        mime_type: p.mime_type || "image/jpeg",
        caption: normalizeText(p.caption),
      }));

    if (uploadedPhotos.length > 0) {
      fd.append("cloudflare_photos_json", JSON.stringify(uploadedPhotos));
    }

    return fd;
  };

  const revokeObjectUrl = (url) => {
    if (!url || !objectUrlsRef.current.has(url)) return;

    try {
      URL.revokeObjectURL(url);
    } catch {}
    objectUrlsRef.current.delete(url);
  };

  const persistDraftSnapshot = (snapshot) => {
    if (!siteId || !draftKey) return;

    saveDailyReportDraft(draftKey, {
      formData: {
        location: snapshot.formData.location,
        progress: snapshot.formData.progress,
        workers: snapshot.formData.workers,
        supervisor: snapshot.formData.supervisor,
      },
      issues: snapshot.issues,
      plans: snapshot.plans,
      pendingPhotos: getDraftPhotosSnapshot(snapshot.photos),
      reportId,
      serverUpdatedAt: serverUpdatedAtRef.current ?? null,
      lastSyncedAt:
        saveStateRef.current === "saved"
          ? (serverUpdatedAtRef.current ?? new Date().toISOString())
          : null,
    });
  };

  const clearSyncedDraftData = async () => {
    if (!draftKey) return;

    clearDailyReportDraft(draftKey);
    try {
      const pendingRows = await listPendingPhotoDrafts(draftKey);
      await Promise.all(
        pendingRows.map((row) => deletePendingPhotoDraft(String(row?.tempId))),
      );
    } catch {}
  };

  function getAttachablePhotos(photosList = []) {
    return photosList.filter(
      (photo) =>
        !isServerPhoto(photo) &&
        !photo?.isUploading &&
        !photo?.uploadQueued &&
        !photo?.uploadError &&
        photo?.driveFileId &&
        !inFlightPhotoAttachDriveIdsRef.current.has(photo.driveFileId) &&
        !photo?.isCommitted,
    );
  }

  const refreshReportFromServer = async () => {
    if (!siteId) return;

    try {
      const refreshed = await axiosInstance.get(
        `/site-progress/${siteId}/daily-reports`,
        { params: { date: stateRef.current.formData.date } },
      );
      const report = refreshed?.data?.data ?? null;
      if (!report) return;

      if (report?.id) {
        setReportId(report.id);
      }
      serverUpdatedAtRef.current = report?.updated_at ?? null;

      const serverPhotos = Array.isArray(report?.photos)
        ? report.photos.map((photo, idx) => normalizeServerPhoto(photo, idx))
        : [];
      const serverDriveIds = new Set(
        serverPhotos.map((photo) => photo?.driveFileId).filter(Boolean),
      );
      inFlightPhotoAttachDriveIdsRef.current = new Set(serverDriveIds);

      setPhotos((prev) => {
        const pendingPhotos = prev.filter((photo) => {
          if (isServerPhoto(photo)) return false;

          const matched =
            photo?.driveFileId && serverDriveIds.has(photo.driveFileId);
          if (matched && photo?.localPreviewUrl) {
            revokeObjectUrl(photo.localPreviewUrl);
          }
          return !matched;
        });

        return dedupePhotos([...serverPhotos, ...pendingPhotos]);
      });
    } catch {}
  };

  async function flushAutosave({ silentError = false } = {}) {
    if (!siteId) return;

    clearTimeout(autoSaveTimerRef.current);

    if (autoSaveInFlightRef.current) {
      autoSaveQueuedRef.current = true;
      return;
    }

    autoSaveInFlightRef.current = true;
    setSaveState("saving");
    setSaveError("");

    let attachingDriveIds = [];

    try {
      const snapshot = stateRef.current;
      const photosToAttach = getAttachablePhotos(snapshot.photos);
      const committedDriveIds = photosToAttach
        .map((photo) => photo?.driveFileId)
        .filter(Boolean);

      attachingDriveIds = committedDriveIds;
      committedDriveIds.forEach((id) =>
        inFlightPhotoAttachDriveIdsRef.current.add(id),
      );
      const fd = buildSaveFormData({
        snapshot,
        photosToAttach,
      });

      const res = await axiosInstance.post(
        `/site-progress/${siteId}/daily-reports`,
        fd,
      );
      const saved = res?.data?.data ?? null;

      if (saved?.id) {
        setReportId(saved.id);
      }
      if (saved?.updated_at) {
        serverUpdatedAtRef.current = saved.updated_at;
      }

      if (committedDriveIds.length > 0) {
        setPhotos((prev) =>
          prev.map((photo) =>
            photo?.driveFileId && committedDriveIds.includes(photo.driveFileId)
              ? { ...photo, isCommitted: true }
              : photo,
          ),
        );
      }

      await refreshReportFromServer();
      setLastSavedAt(new Date());
      setSaveState("saved");
      setSaveError("");
    } catch (err) {
      attachingDriveIds.forEach((id) =>
        inFlightPhotoAttachDriveIdsRef.current.delete(id),
      );
      setSaveState("error");
      setSaveError(err?.response?.data?.message || "Gagal menyimpan laporan.");
      if (!silentError) {
        toast.error(err?.response?.data?.message || "Gagal menyimpan laporan");
      }
    } finally {
      autoSaveInFlightRef.current = false;
      if (autoSaveQueuedRef.current) {
        autoSaveQueuedRef.current = false;
        setTimeout(() => {
          flushAutosave({ silentError: true });
        }, 0);
      }
    }
  }

  function scheduleAutosave(delay = AUTOSAVE_DELAY_MS) {
    if (!hydratedRef.current || !siteId) return;

    clearTimeout(autoSaveTimerRef.current);
    if (saveState !== "saving") {
      setSaveState("pending");
    }

    autoSaveTimerRef.current = setTimeout(() => {
      flushAutosave({ silentError: true });
    }, delay);
  }

  const flushAutosaveSoon = () => {
    if (!hydratedRef.current) return;
    flushAutosave({ silentError: true });
  };

  const flushPendingDraftOnExit = () => {
    if (!siteId || !hydratedRef.current) return;
    if (saveStateRef.current !== "pending") return;

    const snapshot = stateRef.current;
    const photosToAttach = getAttachablePhotos(snapshot.photos);
    const fd = buildSaveFormData({
      snapshot,
      photosToAttach,
    });
    const apiBaseUrl =
      process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api";
    const token =
      typeof window !== "undefined"
        ? window.localStorage.getItem("token")
        : null;

    clearTimeout(autoSaveTimerRef.current);

    try {
      fetch(`${apiBaseUrl}/site-progress/${siteId}/daily-reports`, {
        method: "POST",
        body: fd,
        keepalive: true,
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
    } catch {}
  };

  const uploadPhotoToDrive = async (
    file,
    filename,
    mimeType,
    clientUploadKey,
  ) => {
    const effectiveFile =
      file instanceof File
        ? file
        : new File([file], filename || "photo.jpg", {
            type: mimeType || file?.type || "image/jpeg",
          });
    const compressed = await compressImageFile(effectiveFile);

    const fd = new FormData();
    fd.append("photo", compressed);
    fd.append("report_date", formData.date);
    if (clientUploadKey) {
      fd.append("client_upload_key", clientUploadKey);
    }

    const res = await axiosInstance.post(
      `/site-progress/${siteId}/daily-reports/photos/gdrive`,
      fd,
      { headers: { "Content-Type": "multipart/form-data" } },
    );

    const data = res?.data?.data;
    return {
      file_id: data?.file_id,
      thumbnail_url: data?.thumbnail_url,
      filename: data?.filename,
      size: data?.size,
      mime_type: data?.mime_type,
    };
  };

  const processUploadQueue = async () => {
    if (!siteId) return;

    const availableSlots = Math.max(
      0,
      UPLOAD_CONCURRENCY - uploadWorkerCountRef.current,
    );
    if (availableSlots === 0) return;

    const queuedPhotos = stateRef.current.photos.filter(
      (photo) =>
        !isServerPhoto(photo) &&
        photo?.uploadQueued &&
        !photo?.isUploading &&
        !photo?.driveFileId &&
        !photo?.uploadError,
    );

    queuedPhotos.slice(0, availableSlots).forEach(async (photo) => {
      const tempId = String(photo?.tempId || photo?.id);
      if (inFlightUploadTempIdsRef.current.has(tempId)) {
        return;
      }
      inFlightUploadTempIdsRef.current.add(tempId);
      const draftPhoto = await getPendingPhotoDraft(tempId);

      setPhotos((prev) =>
        prev.map((item) =>
          String(item?.tempId || item?.id) === tempId
            ? { ...item, uploadQueued: false, isUploading: true }
            : item,
        ),
      );

      if (!draftPhoto?.blob) {
        inFlightUploadTempIdsRef.current.delete(tempId);
        setPhotos((prev) =>
          prev.map((item) =>
            String(item?.tempId || item?.id) === tempId
              ? {
                  ...item,
                  isUploading: false,
                  uploadQueued: false,
                  uploadError: true,
                }
              : item,
          ),
        );
        return;
      }

      uploadWorkerCountRef.current += 1;

      try {
        const meta = await uploadPhotoToDrive(
          draftPhoto.blob,
          draftPhoto.filename,
          draftPhoto.mime_type,
          draftPhoto.localFileKey,
        );
        const wasCancelled = cancelledPhotoIdsRef.current.has(tempId);

        await deletePendingPhotoDraft(tempId);

        if (wasCancelled) {
          cancelledPhotoIdsRef.current.delete(tempId);
          if (meta?.file_id) {
            try {
              await axiosInstance.delete(
                `/site-progress/${siteId}/daily-reports/photos/gdrive`,
                { params: { file_id: meta.file_id } },
              );
            } catch {}
          }
          return;
        }

        setPhotos((prev) =>
          dedupePhotos(
            prev.map((item) =>
              String(item?.tempId || item?.id) === tempId
                ? {
                    ...item,
                    isUploading: false,
                    uploadQueued: false,
                    uploadError: false,
                    driveFileId: meta.file_id,
                    remoteUrl: meta.thumbnail_url,
                    filename: meta.filename,
                    size: meta.size,
                    mime_type: meta.mime_type,
                    storage_type: "gdrive",
                    url: meta.thumbnail_url || item.url,
                  }
                : item,
            ),
          ),
        );

        scheduleAutosave(250);
      } catch {
        const nextAttempt = Number(photo?.uploadAttempts || 0) + 1;
        const shouldRetry = nextAttempt < MAX_UPLOAD_RETRIES;
        const retryDelay = Math.min(30000, nextAttempt * 2500);

        setPhotos((prev) =>
          prev.map((item) =>
            String(item?.tempId || item?.id) === tempId
              ? {
                  ...item,
                  isUploading: false,
                  uploadQueued: shouldRetry,
                  uploadError: !shouldRetry,
                  uploadAttempts: nextAttempt,
                }
              : item,
          ),
        );

        if (shouldRetry) {
          setTimeout(() => {
            processUploadQueue();
          }, retryDelay);
        }
      } finally {
        inFlightUploadTempIdsRef.current.delete(tempId);
        uploadWorkerCountRef.current = Math.max(
          0,
          uploadWorkerCountRef.current - 1,
        );
        setTimeout(() => {
          processUploadQueue();
        }, 0);
      }
    });
  };

  useEffect(() => {
    let cancelled = false;

    const hydrateDraft = async () => {
      if (!siteId) return;

      hydratedRef.current = false;
      skipNextAutosaveRef.current = true;

      const draft = loadDailyReportDraft(draftKey);
      const pendingDraftPhotos = await listPendingPhotoDrafts(draftKey);
      if (cancelled) return;
      const preferLocalDraft = shouldPreferLocalDraft(
        draft,
        initialData?.serverUpdatedAt,
      );

      const nextFormData = {
        customer: initialData?.customer ?? "",
        supervisor: preferLocalDraft
          ? (draft?.formData?.supervisor ?? initialData?.supervisor ?? "")
          : (initialData?.supervisor ?? draft?.formData?.supervisor ?? ""),
        location: preferLocalDraft
          ? (draft?.formData?.location ?? initialData?.location ?? "")
          : (initialData?.location ?? draft?.formData?.location ?? ""),
        date: TODAY,
        progress: preferLocalDraft
          ? (draft?.formData?.progress ?? initialData?.progress ?? "")
          : (initialData?.progress ?? draft?.formData?.progress ?? ""),
        workers: preferLocalDraft
          ? (draft?.formData?.workers ?? initialData?.workers ?? "")
          : (initialData?.workers ?? draft?.formData?.workers ?? ""),
      };
      const nextIssues =
        preferLocalDraft &&
        Array.isArray(draft?.issues) &&
        draft.issues.length > 0
          ? draft.issues
          : Array.isArray(initialData?.issues) && initialData.issues.length > 0
            ? initialData.issues
            : Array.isArray(draft?.issues) && draft.issues.length > 0
              ? draft.issues
              : createDefaultIssues();
      const nextPlans =
        preferLocalDraft &&
        Array.isArray(draft?.plans) &&
        draft.plans.length > 0
          ? draft.plans
          : Array.isArray(initialData?.plans) && initialData.plans.length > 0
            ? initialData.plans
            : Array.isArray(draft?.plans) && draft.plans.length > 0
              ? draft.plans
              : createDefaultPlans();
      const serverPhotos = Array.isArray(initialData?.photos)
        ? initialData.photos.map((photo, idx) =>
            normalizeServerPhoto(photo, idx),
          )
        : [];
      const serverDriveIds = new Set(
        serverPhotos.map((photo) => photo?.driveFileId).filter(Boolean),
      );
      const draftPhotoMeta = Array.isArray(draft?.pendingPhotos)
        ? draft.pendingPhotos
        : [];
      const pendingPhotoMap = new Map(
        pendingDraftPhotos.map((photo) => [String(photo?.tempId), photo]),
      );
      const restoredDraftPhotos = draftPhotoMeta
        .map((photo) => {
          const tempId = String(photo?.tempId || createTempPhotoId());
          const blobRecord = pendingPhotoMap.get(tempId);
          let localPreviewUrl = null;
          if (blobRecord?.blob) {
            localPreviewUrl = URL.createObjectURL(blobRecord.blob);
            objectUrlsRef.current.add(localPreviewUrl);
          }

          return {
            id: tempId,
            tempId,
            url: photo?.remoteUrl || localPreviewUrl || "",
            remoteUrl: photo?.remoteUrl || "",
            localPreviewUrl,
            caption: photo?.caption ?? "",
            isUploading: false,
            uploadQueued: Boolean(!photo?.driveFileId && blobRecord?.blob),
            uploadError: Boolean(photo?.uploadError),
            uploadAttempts: Number(photo?.uploadAttempts || 0),
            isCommitted: false,
            driveFileId: photo?.driveFileId ?? null,
            filename: photo?.filename ?? "photo.jpg",
            size: photo?.size,
            mime_type: photo?.mime_type ?? "image/jpeg",
            storage_type: photo?.storage_type ?? "gdrive",
            localFileKey: photo?.localFileKey ?? null,
          };
        })
        .filter(
          (photo) =>
            !(photo?.driveFileId && serverDriveIds.has(photo.driveFileId)),
        );

      if (cancelled) return;

      setFormData(nextFormData);
      setIssues(nextIssues);
      setPlans(nextPlans);
      setPhotos(dedupePhotos([...serverPhotos, ...restoredDraftPhotos]));
      setReportId(initialReportId ?? null);
      serverUpdatedAtRef.current = initialData?.serverUpdatedAt ?? null;
      stateRef.current = {
        formData: nextFormData,
        issues: nextIssues,
        plans: nextPlans,
        photos: dedupePhotos([...serverPhotos, ...restoredDraftPhotos]),
      };
      hydratedRef.current = true;
      setSaveState("idle");
      setSaveError("");

      if (
        restoredDraftPhotos.some(
          (photo) =>
            photo?.driveFileId &&
            !photo?.isCommitted &&
            !photo?.uploadQueued &&
            !photo?.isUploading,
        )
      ) {
        scheduleAutosave(300);
      }
    };

    hydrateDraft();

    return () => {
      cancelled = true;
    };
  }, [draftKey, initialData, initialReportId, siteId]);

  useEffect(() => {
    if (!hydratedRef.current) return;
    persistDraftSnapshot(stateRef.current);
  }, [draftKey, formData, issues, plans, photos, siteId]);

  useEffect(() => {
    if (!hydratedRef.current) return;
    if (skipNextAutosaveRef.current) {
      skipNextAutosaveRef.current = false;
      return;
    }
    scheduleAutosave();
  }, [
    formData.location,
    formData.progress,
    formData.workers,
    formData.supervisor,
    issues,
    plans,
  ]);

  useEffect(() => {
    if (!hydratedRef.current || autosaveNoticeShownRef.current) return;

    autosaveNoticeShownRef.current = true;
    toast.info("Laporan ini disimpan otomatis saat Anda mengisi data.", {
      description:
        "Anda cukup melanjutkan input. Sistem akan menyimpan perubahan dan memproses lampiran di background.",
      duration: 5000,
    });
  }, [siteId]);

  useEffect(() => {
    if (!hydratedRef.current || !hasPendingPhotoQueue) return;
    processUploadQueue();
  }, [hasPendingPhotoQueue]);

  useEffect(() => {
    const handlePageHide = () => {
      flushPendingDraftOnExit();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        flushPendingDraftOnExit();
      }
    };

    window.addEventListener("pagehide", handlePageHide);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("pagehide", handlePageHide);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [siteId]);

  useEffect(() => {
    if (!hydratedRef.current) return;
    if (saveState !== "saved") return;
    if (
      hasPendingPhotoQueue ||
      hasUploadFailures ||
      hasUnsyncedUploadedPhotos
    ) {
      return;
    }

    clearSyncedDraftData();
  }, [
    draftKey,
    hasPendingPhotoQueue,
    hasUnsyncedUploadedPhotos,
    hasUploadFailures,
    saveState,
  ]);

  useEffect(
    () => () => {
      clearTimeout(autoSaveTimerRef.current);
      Object.values(captionTimersRef.current).forEach((timerId) =>
        clearTimeout(timerId),
      );
      objectUrlsRef.current.forEach((url) => {
        try {
          URL.revokeObjectURL(url);
        } catch {}
      });
      objectUrlsRef.current.clear();
    },
    [],
  );

  const handlePhotoUpload = async (e) => {
    const files = Array.from(e.target.files || []);

    if (!files.length) {
      e.target.value = "";
      return;
    }

    const existingKeys = new Set(
      stateRef.current.photos
        .map((photo) => photo?.localFileKey)
        .filter(Boolean),
    );
    const seenInSelection = new Set();
    const uniqueFiles = files.filter((file) => {
      const localFileKey = createLocalPhotoKey({
        name: file.name,
        size: file.size,
        lastModified: file.lastModified,
        type: file.type || "image/jpeg",
      });

      if (existingKeys.has(localFileKey) || seenInSelection.has(localFileKey)) {
        return false;
      }

      seenInSelection.add(localFileKey);
      return true;
    });

    if (!uniqueFiles.length) {
      e.target.value = "";
      return;
    }

    const nextPhotos = await Promise.all(
      uniqueFiles.map(async (file) => {
        const tempId = createTempPhotoId();
        const previewUrl = URL.createObjectURL(file);
        const localFileKey = createLocalPhotoKey({
          name: file.name,
          size: file.size,
          lastModified: file.lastModified,
          type: file.type || "image/jpeg",
        });
        objectUrlsRef.current.add(previewUrl);

        await putPendingPhotoDraft({
          draftKey,
          tempId,
          blob: file,
          caption: "",
          filename: file.name,
          size: file.size,
          mime_type: file.type || "image/jpeg",
          createdAt: new Date().toISOString(),
          localFileKey,
        });

        return {
          id: tempId,
          tempId,
          url: previewUrl,
          localPreviewUrl: previewUrl,
          remoteUrl: "",
          caption: "",
          isUploading: false,
          uploadQueued: true,
          uploadError: false,
          uploadAttempts: 0,
          driveFileId: null,
          filename: file.name,
          size: file.size,
          mime_type: file.type || "image/jpeg",
          storage_type: "gdrive",
          isCommitted: false,
          localFileKey,
        };
      }),
    );

    setPhotos((prev) => dedupePhotos([...prev, ...nextPhotos]));
    e.target.value = "";
    queueAutosaveNow();
    setTimeout(() => {
      processUploadQueue();
    }, 0);
  };

  const removePhoto = async (id) => {
    const photo = photos.find((p) => p.id === id);
    if (!photo) return;

    try {
      if (Number.isInteger(photo.id)) {
        await axiosInstance.delete(`/daily-reports/photos/${photo.id}`);
      } else if (photo.driveFileId) {
        if (photo.isCommitted && siteId) {
          let deleted = false;
          try {
            const refreshed = await axiosInstance.get(
              `/site-progress/${siteId}/daily-reports`,
              { params: { date: formData.date } },
            );
            const report = refreshed?.data?.data ?? null;
            const matched = Array.isArray(report?.photos)
              ? report.photos.find(
                  (p) =>
                    p?.storage_type === "gdrive" &&
                    p?.file_path === photo.driveFileId,
                )
              : null;

            if (matched?.id) {
              await axiosInstance.delete(`/daily-reports/photos/${matched.id}`);
              deleted = true;
            }
          } catch {}

          if (!deleted) {
            await axiosInstance.delete(
              `/site-progress/${siteId}/daily-reports/photos/gdrive`,
              { params: { file_id: photo.driveFileId } },
            );
          }
        } else {
          await axiosInstance.delete(
            `/site-progress/${siteId}/daily-reports/photos/gdrive`,
            { params: { file_id: photo.driveFileId } },
          );
        }
      } else {
        const tempId = String(photo?.tempId || photo?.id);
        cancelledPhotoIdsRef.current.add(tempId);
        await deletePendingPhotoDraft(tempId);
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || "Gagal hapus foto");
      return;
    }

    if (photo.localPreviewUrl) {
      revokeObjectUrl(photo.localPreviewUrl);
    }
    if (photo.driveFileId) {
      inFlightPhotoAttachDriveIdsRef.current.delete(photo.driveFileId);
    }
    setPhotos((prev) => prev.filter((p) => p.id !== id));
  };

  const updatePhotoCaption = (id, value) => {
    setPhotos((prev) =>
      prev.map((photo) =>
        photo.id === id ? { ...photo, caption: value } : photo,
      ),
    );

    if (!isServerPhoto({ id })) {
      patchPendingPhotoDraft(String(id), { caption: value }).catch(() => {});
      scheduleAutosave(400);
      return;
    }

    clearTimeout(captionTimersRef.current[id]);
    captionTimersRef.current[id] = setTimeout(async () => {
      try {
        await axiosInstance.patch(`/daily-reports/photos/${id}`, {
          caption: normalizeText(value),
        });
        setLastSavedAt(new Date());
        if (saveState !== "saving") {
          setSaveState("saved");
        }
      } catch {
        setSaveState("error");
        setSaveError("Gagal menyimpan caption foto.");
      }
    }, CAPTION_SAVE_DELAY_MS);
  };

  const handleSaveToDB = () => {
    if (!siteId) {
      toast.error("ID site progress tidak ditemukan");
      return;
    }
    flushAutosave();
  };

  const downloadPdfBlob = (blob, filename) => {
    const objectUrl = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = objectUrl;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(() => {
      URL.revokeObjectURL(objectUrl);
    }, 1000);
  };

  const queuePdfAttachmentUpload = async ({ blob, filename, audience }) => {
    if (!siteId || !blob) return;

    const fd = new FormData();
    fd.append("report_date", formData.date);
    fd.append("audience", audience);
    fd.append("pdf", blob, filename);

    await axiosInstance.post(
      `/site-progress/${siteId}/daily-reports/pdfs/queue-upload`,
      fd,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      },
    );
  };

  const handleDownloadPdf = async (audience) => {
    const toastId = `daily-report-pdf-${Date.now()}`;
    setPdfType(audience);
    setIsPdfGenerating(true);
    toast.loading("Menyiapkan PDF...", {
      id: toastId,
      description: "Mengumpulkan data laporan terbaru.",
    });

    try {
      const { blob, filename } = await generateDailyReportPdf({
        formData,
        photos,
        issues,
        plans,
        formattedDate,
        audience,
        onProgress: ({ progress, message }) => {
          toast.loading(message, {
            id: toastId,
            description: `Progress ${progress}%`,
          });
        },
      });

      downloadPdfBlob(blob, filename);

      toast.loading("File PDF diunduh. Mengirim attachment ke queue...", {
        id: toastId,
        description: "Attachment todo diproses di background.",
      });

      queuePdfAttachmentUpload({
        blob,
        filename,
        audience,
      }).catch((err) => {
        toast.error("PDF terunduh, tapi upload attachment gagal", {
          id: `${toastId}-upload-error`,
          description:
            err?.response?.data?.message ||
            "Queue attachment belum berhasil dipasang ke server.",
        });
      });

      toast.success("PDF berhasil diunduh", {
        id: toastId,
        description:
          audience === "customer"
            ? "Versi customer selesai dibuat dan attachment dikirim ke queue."
            : "Versi management selesai dibuat dan attachment dikirim ke queue.",
      });
    } catch (err) {
      toast.error("Gagal membuat PDF", {
        id: toastId,
        description:
          err?.message || "Terjadi kendala saat menyiapkan file PDF.",
      });
    } finally {
      setIsPdfGenerating(false);
    }
  };

  const formattedDate = new Date(formData.date).toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const saveStatusText =
    saveState === "saving"
      ? "Menyimpan perubahan..."
      : saveState === "pending"
        ? "Perubahan terdeteksi, menunggu autosave..."
        : saveState === "error"
          ? saveError || "Perubahan belum tersinkron."
          : lastSavedAt
            ? `Tersimpan otomatis ${lastSavedAt.toLocaleTimeString("id-ID", {
                hour: "2-digit",
                minute: "2-digit",
              })}`
            : "Perubahan akan disimpan otomatis.";

  return (
    <DashboardLayout>
      <div className="flex flex-col lg:flex-row flex-1 overflow-hidden min-h-[calc(100vh-100px)] bg-background">
        {/* ================================================================ */}
        {/* PANEL KIRI — FORM EDITOR (Mendukung Dark Mode)                   */}
        {/* ================================================================ */}
        <aside className="w-full lg:w-[35%] overflow-y-auto lg:p-6 pb-20 md:border-r border-border custom-scrollbar">
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-foreground">
                Editor Laporan Harian
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Anda cukup isi laporan. Perubahan akan disimpan otomatis, foto
                tetap tampil dari preview lokal, dan upload berjalan di
                background.
              </p>
            </div>
            <div className="rounded-xl border border-border bg-muted/30 px-4 py-3">
              <p className="text-sm font-medium text-foreground">
                {saveStatusText}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {hasPendingPhotoQueue
                  ? "Foto masih diproses di background dan tidak mengganggu input Anda."
                  : "Draft lokal dipakai untuk recovery saat halaman tertutup atau refresh."}
              </p>
              <div className="mt-3 space-y-2">
                <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                  <span>
                    Sinkronisasi foto {uploadedPhotoCount}/
                    {totalPhotoCount || 0}
                  </span>
                  <span>{photoSyncPercent}%</span>
                </div>
                <div className="h-2 rounded-full bg-background overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all"
                    style={{ width: `${photoSyncPercent}%` }}
                  />
                </div>
                <p className="text-[11px] text-muted-foreground">
                  {activeUploadCount > 0
                    ? `${activeUploadCount} foto masih diproses di background.`
                    : totalPhotoCount > 0
                      ? "Semua foto sudah tersinkron ke laporan."
                      : "Belum ada foto yang dipilih."}
                </p>
              </div>
            </div>

            {/* Section 1: Informasi Dasar */}
            <Card className="rounded-xl shadow-sm border-border">
              <CardHeader className="pb-3 border-b border-border">
                <CardTitle className="text-sm uppercase tracking-wide font-bold flex items-center gap-2">
                  <User size={16} className="text-primary" /> Informasi Dasar
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-4">
                <div className="space-y-1.5">
                  <Label htmlFor="customer">Nama Project</Label>
                  <Input
                    id="customer"
                    value={formData.customer}
                    onChange={(e) =>
                      handleInputChange("customer", e.target.value)
                    }
                    placeholder="Masukkan nama project"
                    disabled={true}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="supervisor">Nama Pengawas</Label>
                  <Input
                    id="supervisor"
                    value={formData.supervisor}
                    onChange={(e) =>
                      handleInputChange("supervisor", e.target.value)
                    }
                    placeholder="Masukkan nama pengawas"
                    // disabled={true}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="date">Tanggal Laporan</Label>
                  <DatePicker
                    id="date"
                    label=""
                    value={formData.date}
                    onChange={(date) => handleInputChange("date", date)}
                    disabled={true}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Section 2: Progress & Tenaga Kerja */}
            <Card className="rounded-xl shadow-sm border-border">
              <CardHeader className="pb-3 border-b border-border">
                <CardTitle className="text-sm uppercase tracking-wide font-bold flex items-center gap-2">
                  <Briefcase size={16} className="text-primary" /> Progress &
                  SDM
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-4">
                <div className="space-y-1.5">
                  <Label>Progress Pekerjaan Hari Ini</Label>
                  <RichTextEditor
                    mode="form"
                    value={formData.progress}
                    onChange={(html) => handleInputChange("progress", html)}
                    onBlur={flushAutosaveSoon}
                    placeholder="Deskripsi progress pekerjaan..."
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="workers" className="flex items-center gap-1">
                    <Users size={14} /> Jumlah Tenaga Kerja
                  </Label>
                  <Input
                    id="workers"
                    value={formData.workers}
                    onChange={(e) =>
                      handleInputChange("workers", e.target.value)
                    }
                    onBlur={flushAutosaveSoon}
                    placeholder="Misal: 5 Orang Tukang, 1 Mandor"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Section 3: Kendala & Solusi */}
            <Card className="rounded-xl shadow-sm border-border">
              <CardHeader className="pb-3 border-b border-border">
                <CardTitle className="text-sm uppercase tracking-wide font-bold flex items-center gap-2 text-orange-500">
                  <AlertTriangle size={16} /> Kendala & Solusi
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-4">
                {issues.map((issue, index) => (
                  <div
                    key={issue.id}
                    className="p-3 border rounded-lg bg-muted/40 space-y-3"
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs font-bold text-muted-foreground">
                        Kendala #{index + 1}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive hover:bg-destructive/10"
                        onClick={() => removeIssue(issue.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Masalah</Label>
                      <Input
                        value={issue.problem}
                        onChange={(e) =>
                          updateIssue(issue.id, "problem", e.target.value)
                        }
                        onBlur={flushAutosaveSoon}
                        placeholder="Deskripsi masalah..."
                        className="h-8 text-sm"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Solusi</Label>
                      <Input
                        value={issue.solution}
                        onChange={(e) =>
                          updateIssue(issue.id, "solution", e.target.value)
                        }
                        onBlur={flushAutosaveSoon}
                        placeholder="Tindakan solusi..."
                        className="h-8 text-sm"
                      />
                    </div>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addIssue}
                  className="w-full border-dashed"
                >
                  <Plus className="h-4 w-4 mr-2" /> Tambah Kendala
                </Button>
              </CardContent>
            </Card>

            {/* Section 4: Dokumentasi */}
            <Card className="rounded-xl shadow-sm border-border">
              <CardHeader className="pb-3 border-b border-border">
                <CardTitle className="text-sm uppercase tracking-wide font-bold flex items-center gap-2 text-green-500">
                  <Camera size={16} /> Dokumentasi Lapangan
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-4">
                <Label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-border rounded-lg cursor-pointer hover:bg-muted/50 transition bg-muted/20">
                  <Camera className="w-6 h-6 mb-2 text-muted-foreground" />
                  <p className="text-sm font-medium text-muted-foreground">
                    Upload Foto
                  </p>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    className="hidden"
                    onChange={handlePhotoUpload}
                  />
                </Label>
                {photos.length > 0 && (
                  <div className="grid grid-cols-2 gap-3 mt-4">
                    {photos.map((photo) => {
                      const rawPreviewSrc = resolveImageUrl(
                        photo.localPreviewUrl || photo.url,
                      );
                      const previewSrc = rawPreviewSrc;
                      const proxyFallbackSrc = getProxiedUrl(rawPreviewSrc);
                      return (
                        <div
                          key={photo.id}
                          className="relative group border border-border rounded-lg p-1.5 bg-muted/20 flex flex-col items-center"
                        >
                          <div className="relative w-full aspect-video bg-background border border-border mb-2 flex items-center justify-center overflow-hidden rounded-md">
                            {previewSrc ? (
                              <img
                                src={previewSrc}
                                alt="Dokumentasi"
                                loading="lazy"
                                decoding="async"
                                // Diubah ke object-contain agar sesuai aslinya tanpa kepotong
                                className="max-w-full max-h-full object-contain"
                                onError={(e) => {
                                  const target = e.currentTarget;
                                  if (
                                    proxyFallbackSrc &&
                                    target.src !== proxyFallbackSrc
                                  ) {
                                    target.src = proxyFallbackSrc;
                                  }
                                }}
                              />
                            ) : (
                              <div className="flex items-center justify-center w-full h-full">
                                <Camera className="w-5 h-5 text-muted-foreground" />
                              </div>
                            )}
                          </div>
                          <Input
                            value={photo.caption}
                            onChange={(e) =>
                              updatePhotoCaption(photo.id, e.target.value)
                            }
                            placeholder="Caption..."
                            className="h-7 text-xs bg-background border-border"
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
                            onClick={() => removePhoto(photo.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Section 5: Rencana Besok */}
            <Card className="rounded-xl shadow-sm border-border">
              <CardHeader className="pb-3 border-b border-border">
                <CardTitle className="text-sm uppercase tracking-wide font-bold flex items-center gap-2 text-purple-500">
                  <CheckSquare size={16} /> Rencana Besok
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 pt-4">
                {plans.map((plan, index) => (
                  <div key={plan.id} className="flex items-center gap-2">
                    <div className="h-8 w-8 shrink-0 flex items-center justify-center bg-muted rounded-md text-xs font-bold text-muted-foreground">
                      {index + 1}
                    </div>
                    <Input
                      value={plan.task}
                      onChange={(e) => updatePlan(plan.id, e.target.value)}
                      onBlur={flushAutosaveSoon}
                      placeholder="Rencana kerja..."
                      className="h-9"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 text-destructive hover:bg-destructive/10 shrink-0"
                      onClick={() => removePlan(plan.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addPlan}
                  className="w-full border-dashed mt-2"
                >
                  <Plus className="h-4 w-4 mr-2" /> Tambah Rencana
                </Button>
              </CardContent>
            </Card>

            <div className="pt-2 pb-10">
              <div className="space-y-2">
                <Button
                  onClick={handleSaveToDB}
                  className="w-full font-semibold rounded-lg h-10 shadow-sm"
                  disabled={true}
                >
                  {saveState === "saving" ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Menyimpan...
                    </>
                  ) : saveState === "pending" ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Autosave Aktif
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Tersimpan Otomatis
                    </>
                  )}
                </Button>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full font-semibold rounded-lg h-10 shadow-sm"
                    onClick={() => handleDownloadPdf("management")}
                    disabled={isPdfGenerating}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    {isPdfGenerating && pdfType === "management"
                      ? "Membuat PDF..."
                      : "PDF Management"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full font-semibold rounded-lg h-10 shadow-sm"
                    onClick={() => handleDownloadPdf("customer")}
                    disabled={isPdfGenerating}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    {isPdfGenerating && pdfType === "customer"
                      ? "Membuat PDF..."
                      : "PDF Customer"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </aside>

        <PreviewPdfDailyReport
          formattedDate={formattedDate}
          previewRef={previewRef}
          formData={formData}
          issues={issues}
          plans={plans}
          photos={photos}
          getProxiedUrl={getProxiedUrl}
        />
      </div>

      <style
        dangerouslySetInnerHTML={{
          __html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: hsl(var(--border));
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background-color: hsl(var(--muted-foreground) / 0.5);
        }
      `,
        }}
      />
    </DashboardLayout>
  );
};

const DailyReportGenerator = () => {
  const params = useParams();
  const siteId = params?.id ? String(params.id) : null;

  const siteProgressUrl = useMemo(() => {
    if (!siteId) return null;
    return `/site-progress/${siteId}`;
  }, [siteId]);

  const { data: siteProgressResponse } = useApiFetch(
    ["site-progress-detail", siteId],
    siteProgressUrl,
    undefined,
    !!siteId,
  );
  const siteProgress = siteProgressResponse?.data ?? null;

  const { data: todayReportResponse } = useApiFetch(
    ["daily-report-today", siteId, TODAY],
    siteId ? `/site-progress/${siteId}/daily-reports` : null,
    siteId ? { date: TODAY } : undefined,
    !!siteId,
  );
  const todayReport = todayReportResponse?.data ?? null;

  const initialData = useMemo(() => {
    const customer =
      siteProgress?.project_name ?? todayReport?.project_name ?? "";
    const supervisor =
      todayReport?.supervisor_name ?? siteProgress?.site_leader ?? "";

    const issuesRaw = Array.isArray(todayReport?.issues)
      ? todayReport.issues
      : [];
    const plansRaw = Array.isArray(todayReport?.plans) ? todayReport.plans : [];
    const photosRaw = Array.isArray(todayReport?.photos)
      ? todayReport.photos
      : [];

    const issues =
      issuesRaw.length > 0
        ? issuesRaw.map((i, idx) => ({
            id: `issue-${todayReport?.id ?? "today"}-${idx}`,
            problem: i?.problem ?? "",
            solution: i?.solution ?? "",
          }))
        : [{ id: "issue-0", problem: "", solution: "" }];

    const plans =
      plansRaw.length > 0
        ? plansRaw.map((p, idx) => ({
            id: `plan-${todayReport?.id ?? "today"}-${idx}`,
            task: p?.task ?? "",
          }))
        : [{ id: "plan-0", task: "" }];

    const photos = photosRaw.map((p, idx) => ({
      id: p?.id ?? `photo-${todayReport?.id ?? "today"}-${idx}`,
      url: p?.url ?? "",
      file: null,
      caption: p?.caption ?? "",
      storage_type: p?.storage_type ?? null,
      file_path: p?.file_path ?? null,
      original_name: p?.original_name ?? null,
      mime_type: p?.mime_type ?? null,
      size: p?.size ?? null,
    }));

    return {
      customer,
      supervisor,
      location: todayReport?.location ?? "",
      progress: todayReport?.progress_html ?? "",
      workers: todayReport?.workers ?? "",
      issues,
      plans,
      photos,
      serverUpdatedAt: todayReport?.updated_at ?? null,
    };
  }, [siteProgress, todayReport]);

  const formKey = useMemo(() => {
    return [
      siteId ?? "no-site",
      todayReport?.id ?? "new",
      todayReport?.updated_at ?? "",
      siteProgress?.project_name ?? "",
      siteProgress?.site_leader ?? "",
    ].join("|");
  }, [
    siteId,
    todayReport?.id,
    todayReport?.updated_at,
    siteProgress?.project_name,
    siteProgress?.site_leader,
  ]);

  return (
    <DailyReportForm
      key={formKey}
      siteId={siteId}
      initialData={initialData}
      initialReportId={todayReport?.id ?? null}
    />
  );
};

export default DailyReportGenerator;
