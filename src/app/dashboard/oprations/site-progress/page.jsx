"use client";
import React, { useEffect, useState } from "react";
import { BarChart3, Clock, Plus, LayoutDashboard } from "lucide-react";
import DashboardLayout from "@/components/layouts/dashboard-layout";
import { usePost, usePut, useRemove } from "@/hooks/use-api-mutation";
import { useApiFetch } from "@/hooks/use-api-fetch";
import ProjectCardSkeleton from "./components/card-progress-skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import CreateProjectModal from "./modal/create-project-modal";
import ProjectCard from "./components/project-card";
import ProjectDetailModal from "./modal/project-detail-modal";

export default function KpiPage() {
  const [activeTab, setActiveTab] = useState("overview");

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedProjectForDetail, setSelectedProjectForDetail] =
    useState(null);
  const [deleteProjectTarget, setDeleteProjectTarget] = useState(null);

  const { mutate: deleteProject } = useRemove(
    (payload) => `/site-progress/${payload.id}`,
    { invalidate: [["site-progress"], ["dashboard"]] },
  );

  const { mutate: quickUpdateProject } = usePut(
    (payload) => `/site-progress/${payload.id}`,
    { invalidate: [["site-progress"], ["dashboard"]] },
  );

  const { mutate: quickUpdateProgress } = usePut(
    (payload) => `/site-progress/${payload.ll_op_kpi_site_id}/progress`,
    { invalidate: [["site-progress"], ["dashboard"]] },
  );

  const { mutate: quickUpdateComplaint } = usePut(
    (payload) => `/site-progress/complaints/${payload.id}`,
    { invalidate: [["site-progress"], ["dashboard"]] },
  );

  const { mutate: addComplaint } = usePost("/site-progress/complaints", {
    invalidate: [["site-progress"], ["dashboard"]],
  });

  const { data: siteProgressData, isLoading: siteProgressLoading } =
    useApiFetch(["site-progress"], "/site-progress");
  const siteProgress = siteProgressData?.data || [];

  useEffect(() => {
    const selectedId = selectedProjectForDetail?.id ?? null;
    if (!selectedId) return;
    const updated = siteProgress.find(
      (p) => String(p?.id) === String(selectedId),
    );
    if (updated && updated !== selectedProjectForDetail) {
      setSelectedProjectForDetail(updated);
    }
  }, [siteProgress, selectedProjectForDetail]);

  const { data: usersData } = useApiFetch(
    [["users-site-leader"]],
    "/users",
    {
      paginate: 100,
      filter: { status: "active", role_id: [10] },
      fields: "id,name",
    },
    true,
  );
  const userOptions =
    usersData?.data?.data?.map((u) => ({
      label: u.name,
      value: String(u.id),
    })) ?? [];

  const tabs = [
    { id: "overview", label: "Overview", icon: LayoutDashboard },
    { id: "analitic", label: "Analytic", icon: BarChart3 },
    { id: "log", label: "History Log", icon: Clock },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-8 pb-8">
        {/* Modern Page Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-card p-6 rounded-2xl border border-border shadow-sm">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Project Monitoring
            </h1>
            <p className="text-sm text-muted-foreground mt-1.5">
              Pantau progress fisik, alokasi budget, dan keluhan secara
              real-time.
            </p>
          </div>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-5 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-sm whitespace-nowrap active:scale-95"
          >
            <Plus className="w-4 h-4" /> Project Baru
          </button>
        </div>

        {/* Modern Segmented Navigation Tabs */}
        <div className="flex w-full overflow-x-auto pb-2 scrollbar-hide">
          <nav
            className="flex space-x-1 bg-muted/50 p-1 rounded-xl border border-border/50"
            aria-label="Tabs"
          >
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 py-2.5 px-5 rounded-lg font-medium text-sm whitespace-nowrap transition-all duration-200 ${
                  activeTab === tab.id
                    ? "bg-background text-foreground shadow-sm ring-1 ring-border/50"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                <tab.icon
                  className={`w-4 h-4 ${activeTab === tab.id ? "text-primary" : "text-muted-foreground"}`}
                />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content Area */}
        {siteProgressLoading ? (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map((index) => (
              <ProjectCardSkeleton key={index} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {siteProgress.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                activeTab={activeTab}
                onOpenEditProject={setSelectedProjectForDetail}
                onDeleteProject={setDeleteProjectTarget}
                onQuickUpdateProject={quickUpdateProject}
                onQuickUpdateProgress={quickUpdateProgress}
                onQuickUpdateComplaint={quickUpdateComplaint}
                onAddComplaint={addComplaint}
              />
            ))}
          </div>
        )}
      </div>

      {/* --- ALL MODALS REMAIN THE SAME --- */}
      <CreateProjectModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        userOptions={userOptions}
      />

      <ProjectDetailModal
        project={selectedProjectForDetail}
        isOpen={!!selectedProjectForDetail}
        onClose={() => setSelectedProjectForDetail(null)}
        userOptions={userOptions}
      />

      <AlertDialog
        open={!!deleteProjectTarget}
        onOpenChange={(val) => {
          if (!val) setDeleteProjectTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Site Progress?</AlertDialogTitle>
            <AlertDialogDescription>
              Data site progress akan terhapus secara permanen. Pastikan Anda
              yakin.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteProjectTarget(null)}>
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                const id = deleteProjectTarget?.id;
                setDeleteProjectTarget(null);
                if (id) deleteProject({ id });
              }}
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
