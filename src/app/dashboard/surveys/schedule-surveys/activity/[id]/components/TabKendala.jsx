import React, { useState, useEffect } from "react";
import {
  MessageSquareWarning,
  ChevronLeft,
  ChevronRight,
  Clock,
  CheckCircle2,
  ArrowRight,
  Plus,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { usePost } from "@/hooks/use-api-mutation";
import { getImageUrl, getTime } from "../utils";
import Image from "next/image";

const ISSUE_TODO_STORAGE_KEY = "survey_issue_todos";

export const TabKendala = ({
  issues = [],
  scheduleId,
  mutateIssues,
  refetchIssues,
}) => {
  const [issueIdx, setIssueIdx] = useState(0);
  const [isAddIssueOpen, setIsAddIssueOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    image: null,
  });
  const [imagePreview, setImagePreview] = useState(null);
  const [issueTodos, setIssueTodos] = useState({});

  useEffect(() => {
    try {
      const saved = localStorage.getItem(ISSUE_TODO_STORAGE_KEY);
      if (!saved) return;
      const parsed = JSON.parse(saved);
      if (!parsed || typeof parsed !== "object") return;
      setIssueTodos(parsed);
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(ISSUE_TODO_STORAGE_KEY, JSON.stringify(issueTodos));
    } catch {}
  }, [issueTodos]);

  const { mutateAsync: addIssue, isPending: isAdding } = usePost(
    `/schedules/${scheduleId}/issues`,
  );

  const nextIssue = () => {
    if (issues.length === 0) return;
    setIssueIdx((prev) => (prev + 1) % issues.length);
  };

  const prevIssue = () => {
    if (issues.length === 0) return;
    setIssueIdx((prev) => (prev - 1 + issues.length) % issues.length);
  };

  const currentIssue =
    issues && issues.length > 0 ? issues[issueIdx] || null : null;
  const currentIssueId = currentIssue?.id;
  const currentTodo = currentIssueId ? issueTodos[currentIssueId] : undefined;
  const currentStatus = currentTodo?.status || "pending";
  const currentProgress =
    typeof currentTodo?.progress === "number" ? currentTodo.progress : 0;

  const updateIssueTodo = (updates) => {
    if (!currentIssueId) return;
    setIssueTodos((prev) => {
      const existing = prev[currentIssueId] || {};
      const baseStatus = existing.status || "pending";
      const baseProgress =
        typeof existing.progress === "number" ? existing.progress : 0;
      const next = {
        status: baseStatus,
        progress: baseProgress,
        ...updates,
      };
      return {
        ...prev,
        [currentIssueId]: next,
      };
    });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({ ...formData, image: file });
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!formData.image) return toast.error("Gambar wajib diupload");
    const form = new FormData();
    form.append("title", formData.title);
    form.append("description", formData.description);
    form.append("image", formData.image);
    try {
      await addIssue(form);
      toast.success("Kendala berhasil ditambahkan");
      setIsAddIssueOpen(false);
      setFormData({ title: "", description: "", image: null });
      setImagePreview(null);
      if (typeof mutateIssues === "function") {
        mutateIssues();
      }
      refetchIssues();
    } catch (error) {
      console.error(error);
      toast.error(
        error?.response?.data?.message || "Gagal menambahkan kendala",
      );
    }
  };

  return (
    <div className="flex flex-col lg:flex-row h-full animate-in fade-in slide-in-from-bottom-8 duration-700 relative">
      {/* Add Issue Button (Floating) */}
      <div className="absolute top-4 right-4 z-50">
        <Dialog open={isAddIssueOpen} onOpenChange={setIsAddIssueOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#fed818] text-[#152733] hover:bg-[#e6c215]">
              <Plus className="w-4 h-4 mr-2" /> Tambah Kendala
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-[#1c2f3d] border-white/10 text-white">
            <DialogHeader>
              <DialogTitle>Tambah Kendala</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Judul</label>
                <Input
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  className="bg-black/20 border-white/10"
                  placeholder="Contoh: Akses Sempit"
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">
                  Deskripsi
                </label>
                <Textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="bg-black/20 border-white/10"
                  placeholder="Jelaskan kendala..."
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Foto</label>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="bg-black/20 border-white/10"
                  required
                />
                {imagePreview && (
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="mt-2 w-full h-40 object-cover rounded-lg"
                  />
                )}
              </div>
              <Button
                type="submit"
                className="w-full bg-cyan-400 text-black hover:bg-cyan-500"
                disabled={isAdding}
              >
                {isAdding ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  "Simpan Kendala"
                )}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {issues.length > 0 ? (
        <>
          <div className="w-full lg:w-1/2 p-8 lg:p-10 border-b lg:border-b-0 lg:border-r border-white/5 flex flex-col space-y-6">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <MessageSquareWarning size={18} className="text-rose-400" />
                <p className="text-[11px] font-black text-rose-400 uppercase tracking-widest">
                  Visual Evidence
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest">
                  {issueIdx + 1} / {issues.length}
                </span>
              </div>
            </div>

            <div className="relative flex-1 min-h-[350px] rounded-2xl overflow-hidden border border-white/10 group/img shadow-2xl">
              {currentIssue?.image_path ? (
                <Image
                  key={issueIdx}
                  src={getImageUrl(currentIssue.image_path)}
                  alt={currentIssue?.title || "Foto kendala"}
                  className="w-full h-full object-cover transition-all duration-1000 group-hover/img:scale-110"
                  width={500}
                  height={250}
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center bg-[#0d1b24]">
                  <MessageSquareWarning
                    size={40}
                    className="text-rose-400 mb-4"
                  />
                  <p className="text-sm text-slate-300">
                    Foto kendala belum tersedia
                  </p>
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />

              {/* Carousel Controls Overlay */}
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-black/40 backdrop-blur-md px-6 py-3 rounded-full border border-white/10 opacity-0 group-hover/img:opacity-100 transition-all duration-500 translate-y-4 group-hover/img:translate-y-0">
                <button
                  onClick={prevIssue}
                  className="p-2 text-white/60 hover:text-rose-400 transition-colors"
                >
                  <ChevronLeft size={24} />
                </button>
                <div className="flex gap-2">
                  {issues.map((_, i) => (
                    <div
                      key={i}
                      className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                        i === issueIdx ? "bg-rose-400 scale-150" : "bg-white/20"
                      }`}
                    />
                  ))}
                </div>
                <button
                  onClick={nextIssue}
                  className="p-2 text-white/60 hover:text-rose-400 transition-colors"
                >
                  <ChevronRight size={24} />
                </button>
              </div>
            </div>
          </div>

          {/* Alasan Kendala (Right Side) */}
          <div className="w-full lg:w-1/2 p-10 lg:p-14 flex flex-col justify-center space-y-10 relative">
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 bg-rose-500/10 text-rose-400 border border-rose-400/20 rounded text-[9px] font-black uppercase tracking-widest">
                  Kategori General
                </span>
                <span className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                  <Clock size={12} /> {getTime(issues[issueIdx]?.cretime)}
                </span>
              </div>

              <div className="space-y-2">
                <p className="text-[10px] font-black text-rose-400/40 uppercase ">
                  Content Kendala
                </p>
                <h2 className="text-4xl lg:text-5xl font-black text-white leading-[0.9] tracking-tighter uppercase">
                  {issues[issueIdx]?.title}
                </h2>
              </div>

              <div className="bg-[#0d1b24]/50 border border-white/5 p-8 rounded-[2rem] relative overflow-hidden group/text shadow-inner">
                <div className="absolute top-0 left-0 w-1 h-full bg-rose-400 shadow-[0_0_10px_rgba(251,113,133,0.5)]" />
                <p className="text-lg lg:text-xl text-slate-300 leading-relaxed font-medium italic">
                  {issues[issueIdx]?.description}
                </p>
              </div>

              {currentIssueId && (
                <div className="bg-[#0d1b24]/60 border border-white/5 p-4 rounded-[1.5rem] flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-semibold text-slate-300 tracking-[0.16em] uppercase">
                      Todo Kendala
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-1 rounded-full ${
                        currentStatus === "done"
                          ? "bg-emerald-500/20 text-emerald-300"
                          : currentStatus === "on_progress"
                            ? "bg-sky-500/20 text-sky-300"
                            : "bg-slate-500/20 text-slate-300"
                      }`}
                    >
                      {currentStatus === "done"
                        ? "Selesai"
                        : currentStatus === "on_progress"
                          ? "Proses"
                          : "Pending"}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <Button
                      type="button"
                      onClick={() => updateIssueTodo({ status: "pending" })}
                      className={`h-8 text-[10px] font-semibold border border-white/10 ${
                        currentStatus === "pending"
                          ? "bg-white text-black"
                          : "bg-black/30 text-slate-200"
                      }`}
                    >
                      Pending
                    </Button>
                    <Button
                      type="button"
                      onClick={() => updateIssueTodo({ status: "on_progress" })}
                      className={`h-8 text-[10px] font-semibold border border-white/10 ${
                        currentStatus === "on_progress"
                          ? "bg-white text-black"
                          : "bg-black/30 text-slate-200"
                      }`}
                    >
                      Proses
                    </Button>
                    <Button
                      type="button"
                      onClick={() => updateIssueTodo({ status: "done" })}
                      className={`h-8 text-[10px] font-semibold border border-white/10 ${
                        currentStatus === "done"
                          ? "bg-white text-black"
                          : "bg-black/30 text-slate-200"
                      }`}
                    >
                      Selesai
                    </Button>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                      <span>Progress</span>
                      <span className="font-mono text-amber-300">
                        {currentProgress}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={currentProgress}
                      onChange={(e) =>
                        updateIssueTodo({
                          progress: Number(e.target.value),
                        })
                      }
                      className="w-full accent-amber-400"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center gap-4 pt-4">
              <button className="flex-1 py-4 bg-rose-500 text-white rounded-xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-rose-500/20 hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-3">
                Validasi Isu <CheckCircle2 size={16} />
              </button>
              <button
                onClick={nextIssue}
                className="p-4 bg-white/5 border border-white/10 rounded-xl text-slate-400 hover:text-white transition-all"
              >
                <ArrowRight size={20} />
              </button>
            </div>
          </div>
        </>
      ) : (
        <div className="flex items-center justify-center w-full min-h-[350px] md:min-h-[400px] text-slate-500 ">
          <div className="text-center">
            <MessageSquareWarning
              size={48}
              className="mx-auto mb-4 opacity-50"
            />
            <p>Belum ada kendala dilaporkan</p>
            <Button
              className="mt-4 bg-[#fed818] text-black"
              onClick={() => setIsAddIssueOpen(true)}
            >
              Lapor Kendala Pertama
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
