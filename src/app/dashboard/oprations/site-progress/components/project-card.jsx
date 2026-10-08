import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  MoreVertical,
  Trash2,
  Edit,
  FoldersIcon,
  CheckSquare,
  Proportions,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import ProjectKpiView from "./project-kpi-view";
import { formatDate } from "@/lib/date-format";
import { toast } from "sonner";
import { statusJenisPembangunan } from "@/data/data";
import ProjectComplaintsPreview from "./project-complaints-preview";
import { formatRupiah, parseIdrToDigits } from "@/lib/format-rupiah";
import { useRouter } from "next/navigation";
import MoneyInput from "@/components/MoneyInput";
import { useAuthStore } from "@/hooks/auth-store";

const ProjectCard = ({
  project,
  activeTab,
  onOpenEditProject,
  onDeleteProject,
  onQuickUpdateProject,
  onQuickUpdateProgress,
  onQuickUpdateComplaint,
  onAddComplaint,
}) => {
  const formatInputDigits = (value) => parseIdrToDigits(value) || "0";
  const { push } = useRouter();
  const { isAdmin } = useAuthStore();

  // LOGIKA STATUS TENGGAT WAKTU (DUE DATE)
  const today = new Date();
  const dueDate = new Date(project.overdue_date);

  // Reset jam agar kalkulasi hari akurat
  today.setHours(0, 0, 0, 0);
  dueDate.setHours(0, 0, 0, 0);

  const diffTime = dueDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  const isOverdue = diffDays < 0;
  const isNearDue = diffDays >= 0 && diffDays <= 7;
  const isOnTrack = diffDays > 7;

  const valid = project.kpi_dts && project.kpi_dts.length > 0;
  const currentProgress = valid
    ? project.kpi_dts[project.kpi_dts.length - 1].progress
    : 0;
  const currentActualBudget = valid
    ? project.kpi_dts[project.kpi_dts.length - 1].budget_actual
    : 0;

  const serverDerived = {
    project_name: project.project_name ?? "",
    budget_rap: parseIdrToDigits(project.budget_rap ?? 0),
    progress: currentProgress ?? 0,
    budget_actual: parseIdrToDigits(currentActualBudget ?? 0),
  };

  const isSameServerData = (a, b) => {
    if (!a || !b) return false;
    return (
      String(a.project_name ?? "") === String(b.project_name ?? "") &&
      Number(parseIdrToDigits(a.budget_rap) || 0) ===
        Number(parseIdrToDigits(b.budget_rap) || 0) &&
      Number(a.progress ?? 0) === Number(b.progress ?? 0) &&
      Number(parseIdrToDigits(a.budget_actual) || 0) ===
        Number(parseIdrToDigits(b.budget_actual) || 0)
    );
  };

  const serverSnapshotRef = useRef({ id: project?.id, data: serverDerived });

  const [viewData, setViewData] = useState(serverDerived);
  const [editingField, setEditingField] = useState(null);
  const [savingField, setSavingField] = useState(null);
  const [draft, setDraft] = useState(serverDerived);

  const startEdit = (field) => {
    if (field === "budget_actual" || field === "budget_rap") {
      setDraft({
        ...viewData,
        [field]: parseIdrToDigits(viewData[field]),
      });
      setEditingField(field);
      return;
    }
    setDraft(viewData);
    setEditingField(field);
  };

  const cancelEdit = () => {
    setDraft(viewData);
    setEditingField(null);
  };

  // PERBAIKAN: Fungsi commit menerima payload spesifik agar tidak terhalang state asinkron
  const commitProject = (draftToSave, rollbackViewData) => {
    if (!project?.id || !onQuickUpdateProject) return;

    const serverData = serverSnapshotRef.current?.data || serverDerived;
    const shouldUpdate =
      String(draftToSave.project_name || "") !==
        String(serverData.project_name || "") ||
      Number(parseIdrToDigits(draftToSave.budget_rap) || 0) !==
        Number(parseIdrToDigits(serverData.budget_rap) || 0);

    if (!shouldUpdate) return;

    setSavingField("project");
    toast
      .promise(
        new Promise((resolve, reject) => {
          onQuickUpdateProject(
            {
              id: project.id,
              project_name: draftToSave.project_name,
              budget_rap: parseIdrToDigits(draftToSave.budget_rap) || 0,
            },
            {
              onSuccess: resolve,
              onError: (err) => {
                setViewData(rollbackViewData);
                setDraft(rollbackViewData);
                reject(err?.response?.data?.message);
              },
            },
          );
        }),
        {
          loading: "Menyimpan...",
          success: "Berhasil disimpan",
          error: (msg) => msg ?? "Gagal menyimpan",
        },
      )
      .finally(() => {
        setSavingField(null);
      });
  };

  const commitProgress = (draftToSave, rollbackViewData) => {
    if (!project?.id || !onQuickUpdateProgress) return;

    const serverData = serverSnapshotRef.current?.data || serverDerived;
    const shouldUpdate =
      Number(draftToSave.progress || 0) !== Number(serverData.progress || 0) ||
      Number(parseIdrToDigits(draftToSave.budget_actual) || 0) !==
        Number(parseIdrToDigits(serverData.budget_actual) || 0);

    if (!shouldUpdate) return;

    setSavingField("progress");
    toast
      .promise(
        new Promise((resolve, reject) => {
          onQuickUpdateProgress(
            {
              ll_op_kpi_site_id: project.id,
              progress: draftToSave.progress,
              budget_actual: parseIdrToDigits(draftToSave.budget_actual) || 0,
            },
            {
              onSuccess: resolve,
              onError: (err) => {
                setViewData(rollbackViewData);
                setDraft(rollbackViewData);
                reject(err?.response?.data?.message);
              },
            },
          );
        }),
        {
          loading: "Update progress...",
          success: "Progress tersimpan",
          error: (msg) => msg ?? "Gagal update progress",
        },
      )
      .finally(() => {
        setSavingField(null);
      });
  };

  // PERBAIKAN: Langsung menutup mode edit (null) SAAT ITU JUGA, dan melempar proses save ke background.
  // Ini yang membuat feelnya "Trello Banget" dan Anda bisa langsung klik field lain.
  const commitCurrentField = () => {
    const currentField = editingField;
    const currentDraft = { ...draft };
    const rollbackViewData = { ...viewData };
    const nextViewData = { ...viewData };

    if (currentField === "project_name" || currentField === "budget_rap") {
      nextViewData.project_name = currentDraft.project_name;
      nextViewData.budget_rap =
        parseIdrToDigits(currentDraft.budget_rap) || "0";
    } else if (
      currentField === "progress" ||
      currentField === "budget_actual"
    ) {
      nextViewData.progress = currentDraft.progress;
      nextViewData.budget_actual =
        parseIdrToDigits(currentDraft.budget_actual) || "0";
    }

    setViewData(nextViewData);
    setDraft(nextViewData);

    setEditingField(null);

    if (currentField === "project_name" || currentField === "budget_rap") {
      commitProject(currentDraft, rollbackViewData);
    } else if (
      currentField === "progress" ||
      currentField === "budget_actual"
    ) {
      commitProgress(currentDraft, rollbackViewData);
    }
  };

  const onInlineKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      e.currentTarget.blur();
      return;
    }
    if (e.key === "Escape") {
      e.preventDefault();
      cancelEdit();
    }
  };

  const shownProgress =
    editingField === "progress" ? draft.progress : viewData.progress;
  const shownActualBudget =
    editingField === "budget_actual"
      ? draft.budget_actual
      : viewData.budget_actual;
  const shownRapBudget =
    editingField === "budget_rap" ? draft.budget_rap : viewData.budget_rap;

  const progressPercentage = Math.min(
    (Number(shownProgress || 0) * 100) / (project.target || 1),
    100,
  );

  useEffect(() => {
    const prev = serverSnapshotRef.current;
    const next = { id: project?.id, data: serverDerived };
    const isSameProject = String(prev?.id) === String(next.id);
    const isSameData = isSameProject && isSameServerData(prev?.data, next.data);

    if (!isSameProject || !isSameData) {
      serverSnapshotRef.current = next;
      if (!editingField) {
        setViewData(next.data);
        setDraft(next.data);
      }
    }
  }, [project?.id, serverDerived, editingField]);

  const buildingTypeLabel =
    statusJenisPembangunan.find(
      (opt) => String(opt.value) === String(project.building_type || ""),
    )?.label ??
    project.building_type ??
    "PROJECT";

  return (
    <>
      <div className="bg-background text-foreground border border-border/80 shadow-sm hover:shadow-lg transition-all duration-500 rounded-sm flex flex-col group/card overflow-hidden relative">
        {/* 1. TOP BAR: Editorial Meta Data */}
        <div className="flex justify-between items-center px-6 py-3 border-b border-border/40 bg-muted/5 mt-1">
          <div className="flex items-center gap-3 text-[9px] uppercase tracking-[0.2em] font-bold text-muted-foreground">
            <span className="font-mono text-foreground">
              ID.{project.id.toString().padStart(4, "0")}
            </span>
            <span className="w-1 h-1 bg-border rounded-none" />
            <span className="text-foreground/80">{buildingTypeLabel}</span>

            <span className="w-1 h-1 bg-border rounded-none" />
            {isOverdue ? (
              <span className="text-destructive">OVERDUE</span>
            ) : isNearDue ? (
              <span className="text-amber-500">DUE SOON</span>
            ) : (
              <span className="text-emerald-500">ON TRACK</span>
            )}
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger className="text-muted-foreground hover:text-foreground transition-colors outline-none">
              <MoreVertical className="w-4 h-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-56 rounded-sm border-border/60 shadow-lg"
            >
              <DropdownMenuItem
                onClick={() =>
                  push(
                    `/dashboard/oprations/site-progress/detail/${project.id}`,
                  )
                }
                className="cursor-pointer  py-2.5 rounded"
              >
                <FoldersIcon className="w-4 h-4 mr-2 text-muted-foreground" />{" "}
                Detail
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onOpenEditProject(project)}
                className="cursor-pointer  py-2.5 rounded"
              >
                <Edit className="w-4 h-4 mr-2 text-muted-foreground" /> Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-border/40" />
              {isAdmin ? (
                <DropdownMenuItem
                  onClick={() =>
                    push(
                      `/dashboard/oprations/site-progress/detail/${project.id}/report-laporan-harian`,
                    )
                  }
                  className="cursor-pointer  py-2.5 rounded"
                >
                  <Proportions className="w-4 h-4 mr-2 text-muted-foreground" />{" "}
                  Report Laporan Harian
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem
                  onClick={() =>
                    push(
                      `/dashboard/oprations/site-progress/detail/${project.id}/laporan-harian`,
                    )
                  }
                  className="cursor-pointer  py-2.5 rounded"
                >
                  <CheckSquare className="w-4 h-4 mr-2 text-muted-foreground" />{" "}
                  Laporan Harian
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator className="bg-border/40" />
              <DropdownMenuItem
                onClick={() => onDeleteProject(project)}
                className="cursor-pointer  text-destructive focus:text-destructive py-2.5 rounded"
                variant="destructive"
              >
                <Trash2 className="w-4 h-4 mr-2" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* 2. HEADER: Typography & Site Leader Fix */}
        <div className="px-6 pt-7 pb-6">
          {editingField === "project_name" ? (
            <textarea
              autoFocus
              value={draft.project_name}
              onChange={(e) =>
                setDraft((prev) => ({ ...prev, project_name: e.target.value }))
              }
              onKeyDown={onInlineKeyDown}
              onBlur={commitCurrentField}
              onFocus={(e) => e.target.select()}
              rows={1}
              onInput={(e) => {
                e.target.style.height = "auto";
                e.target.style.height = `${e.target.scrollHeight}px`;
              }}
              className="w-full bg-transparent text-2xl font-bold tracking-tighter text-foreground leading-none sm:text-3xl rounded-sm px-2 py-1 -ml-2 focus:bg-muted/30 focus:outline-none focus:ring-2 focus:ring-primary/60 resize-none overflow-hidden transition-all"
            />
          ) : (
            <h2
              onClick={() => startEdit("project_name")}
              className="w-full block text-2xl font-bold tracking-tighter text-foreground leading-none sm:text-3xl cursor-pointer hover:bg-muted/40 rounded-sm px-2 py-1 -ml-2 transition-colors truncate"
              title="Klik untuk edit nama"
            >
              {viewData.project_name}
            </h2>
          )}
          <div className="flex items-center gap-2 mt-4 text-xs font-bold uppercase tracking-widest px-0">
            <span className="text-muted-foreground">SITE LEADER</span>
            <span className="text-foreground">
              {project.site_leader || "UNASSIGNED"}
            </span>
          </div>
        </div>

        {/* 3. MAIN DATA: Asymmetric Grid */}
        <div className="flex-grow flex flex-col border-t border-border/40">
          {activeTab === "overview" && (
            <div className="grid grid-cols-1 md:grid-cols-5 divide-y md:divide-y-0 md:divide-x divide-border/40">
              <div className="md:col-span-3 p-6 flex flex-col justify-between bg-muted/5 relative overflow-hidden group/progress">
                <div className="text-[10px] uppercase tracking-[0.15em] font-bold text-muted-foreground mb-4">
                  Penyelesaian Fisik
                </div>
                {editingField === "progress" ? (
                  <div className="flex items-baseline gap-2 mt-auto">
                    <textarea
                      autoFocus
                      value={draft.progress}
                      onChange={(e) =>
                        setDraft((prev) => ({
                          ...prev,
                          progress: e.target.value,
                        }))
                      }
                      onKeyDown={onInlineKeyDown}
                      onBlur={commitCurrentField}
                      onFocus={(e) => e.target.select()}
                      rows={1}
                      onInput={(e) => {
                        e.target.style.height = "auto";
                        e.target.style.height = `${e.target.scrollHeight}px`;
                      }}
                      className="flex-1 w-full bg-transparent text-6xl sm:text-7xl font-light font-mono tracking-tighter text-foreground leading-none rounded-sm px-2 py-1 -ml-2 focus:bg-muted/30 focus:outline-none focus:ring-2 focus:ring-primary/60 resize-none overflow-hidden transition-all"
                    />
                    <span className="text-2xl font-light text-muted-foreground">
                      %
                    </span>
                  </div>
                ) : (
                  <div
                    className="flex items-baseline gap-2 mt-auto cursor-pointer hover:bg-muted/40 rounded-sm w-full transition-colors px-2 py-1 -ml-2"
                    onClick={() => startEdit("progress")}
                    title="Klik untuk edit progress"
                  >
                    <span className="text-6xl sm:text-7xl font-light font-mono tracking-tighter text-foreground leading-none">
                      {Number(shownProgress || 0)}
                    </span>
                    <span className="text-2xl font-light text-muted-foreground">
                      %
                    </span>
                  </div>
                )}
                <div className="text-xs font-mono text-muted-foreground mt-2">
                  TARGET: {project.target}%
                </div>

                <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-border/40">
                  <div
                    className="h-full bg-foreground transition-all duration-1000 ease-in-out"
                    style={{ width: `${progressPercentage}%` }}
                  />
                </div>
              </div>

              <div className="md:col-span-2 grid grid-rows-2 divide-y divide-border/40">
                <div className="p-6 flex flex-col justify-center hover:bg-muted/10 transition-colors">
                  <div className="text-[10px] uppercase tracking-[0.15em] font-bold text-muted-foreground mb-2">
                    Alokasi Finansial
                  </div>

                  {/* --- BAGIAN BUDGET ACTUAL --- */}
                  {editingField === "budget_actual" ? (
                    <MoneyInput
                      autoFocus
                      showPrefix={false} // Dimatikan agar bentuknya murni angka inline seperti desain awal Anda
                      value={draft.budget_actual}
                      onChange={(num) =>
                        setDraft((prev) => ({
                          ...prev,
                          budget_actual: num, // Langsung set number berkat MoneyInput
                        }))
                      }
                      onKeyDown={onInlineKeyDown}
                      onBlur={commitCurrentField}
                      onFocus={(e) => e.target.select()}
                      // Class wrapper disetel untuk menghilangkan border & shadow bawaan Shadcn
                      // agar menyatu mulus (inline edit)
                      className="h-auto border-none shadow-none bg-transparent px-2 py-1 -ml-2 focus-within:bg-muted/30 focus-within:ring-2 focus-within:ring-primary/60 rounded-sm w-full transition-all"
                      // Class font disisipkan langsung ke tag input di dalam MoneyInput
                      inputClassName="text-lg font-mono font-medium text-foreground tracking-tight"
                    />
                  ) : (
                    <div
                      className="w-full text-lg font-mono font-medium text-foreground tracking-tight cursor-pointer hover:bg-muted/40 rounded-sm px-2 py-1 -ml-2 transition-colors"
                      onClick={() => startEdit("budget_actual")}
                      title="Klik untuk edit budget terpakai"
                    >
                      {formatRupiah(shownActualBudget)}
                    </div>
                  )}

                  <div className="text-[11px] font-mono text-muted-foreground mt-2 flex items-center gap-2 w-full">
                    <span className="shrink-0">RAP</span>

                    {/* --- BAGIAN BUDGET RAP --- */}
                    {editingField === "budget_rap" ? (
                      <MoneyInput
                        autoFocus
                        showPrefix={false}
                        value={draft.budget_rap}
                        onChange={(num) =>
                          setDraft((prev) => ({
                            ...prev,
                            budget_rap: num, // Langsung set number berkat MoneyInput
                          }))
                        }
                        onKeyDown={onInlineKeyDown}
                        onBlur={commitCurrentField}
                        onFocus={(e) => e.target.select()}
                        className="h-auto border-none shadow-none bg-transparent px-2 py-1 focus-within:bg-muted/30 focus-within:ring-2 focus-within:ring-primary/60 rounded-sm flex-1 w-full transition-all"
                        inputClassName="text-[11px] font-mono text-foreground"
                      />
                    ) : (
                      <span
                        className="flex-1 w-full text-foreground/90 cursor-pointer hover:bg-muted/40 px-2 py-1 rounded-sm transition-colors truncate"
                        onClick={() => startEdit("budget_rap")}
                        title="Klik untuk edit budget RAP"
                      >
                        {formatRupiah(shownRapBudget)}
                      </span>
                    )}
                  </div>
                </div>

                <div className="p-6 flex flex-col justify-center hover:bg-muted/10 transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <div className="text-[10px] uppercase tracking-[0.15em] font-bold text-muted-foreground">
                      Tenggat Waktu
                    </div>
                    {isNearDue && (
                      <span
                        className="animate-pulse w-2 h-2 rounded-none bg-amber-500"
                        title="Due Soon"
                      />
                    )}
                  </div>
                  <div
                    className={`text-base font-semibold ${
                      isOverdue
                        ? "text-destructive"
                        : isNearDue
                          ? "text-amber-500"
                          : "text-emerald-500"
                    }`}
                  >
                    {formatDate(project.overdue_date)}
                  </div>
                  <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mt-1">
                    {isOverdue
                      ? `DELAYED (${Math.abs(diffDays)} DAYS)`
                      : isNearDue
                        ? `${diffDays} DAYS LEFT`
                        : "ON TRACK"}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "analitic" && (
            <div className="p-6">
              <ProjectKpiView project={project} />
            </div>
          )}

          {activeTab === "log" && (
            <div className="p-6 bg-muted/5 font-mono text-xs">
              {project?.kpi_dts?.length > 0 ? (
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between text-[9px] uppercase tracking-widest text-muted-foreground border-b border-border/40 pb-2 mb-2">
                    <span className="w-1/3">TIMESTAMP</span>
                    <span className="w-1/3 text-center">PRG</span>
                    <span className="w-1/3 text-right">ACTUAL_IDR</span>
                  </div>
                  {project.kpi_dts.map((log, index) => (
                    <div
                      key={log.id || index}
                      className="flex justify-between items-center py-1 hover:bg-muted/20 px-2 -mx-2 rounded-sm transition-colors"
                    >
                      <span className="w-1/3 text-muted-foreground">
                        {formatDate(log.cretime, true)}
                      </span>
                      <span className="w-1/3 text-center text-foreground font-semibold">
                        {log.progress}%
                      </span>
                      <span className="w-1/3 text-right text-muted-foreground">
                        {formatRupiah(log.budget_actual)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-muted-foreground opacity-50 uppercase tracking-widest">
                  _NO_LOGS_FOUND
                </div>
              )}
            </div>
          )}
        </div>

        <ProjectComplaintsPreview
          complaints={project?.complaints}
          projectId={project?.id}
          latestDtId={
            project?.kpi_dts?.[project?.kpi_dts?.length - 1]?.id ?? null
          }
          onQuickUpdateComplaint={onQuickUpdateComplaint}
          onAddComplaint={onAddComplaint}
        />
      </div>
    </>
  );
};

export default ProjectCard;
