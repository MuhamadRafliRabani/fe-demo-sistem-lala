"use client";
import React, { useState } from "react";
import {
  ArrowLeft,
  Edit,
  Trash2,
  ExternalLink,
  Clock,
  User,
  FileDown,
  Sheet,
  RefreshCw,
} from "lucide-react";
import DashboardLayout from "@/components/layouts/dashboard-layout";
import { useApiFetch } from "@/hooks/use-api-fetch";
import { useParams, useRouter } from "next/navigation";
import { formatDate } from "@/lib/date-format";
import { downloadFile } from "@/lib/download-file";
import { formatCurrency } from "@/lib/construction-estimator-utils";
import InlineKeyValue from "@/components/detail-inline-key-value";
import LeadDetailSkeleton from "@/components/detail-skeleton-loader";
import { useRemove } from "@/hooks/use-api-mutation";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

// === HELPER COMPONENTS ===

// Badge Status
const NeutralBadge = ({ status }) => {
  if (!status) return "-";
  return (
    <span className="inline-flex items-center px-2.5 py-1 text-[11px] font-bold text-slate-900 bg-slate-50 rounded-md whitespace-nowrap shadow-sm">
      {status}
    </span>
  );
};

// Desain Unix Clean untuk History/Audit (Cre & Mod)
const AuditTimelineItem = ({ label, user, time, isLast }) => (
  <div className={`relative ${isLast ? "" : "pb-7"}`}>
    {!isLast && (
      <div className="absolute left-[13px] top-8 bottom-0 w-px bg-white/10" />
    )}
    <div className="flex items-start gap-4">
      <div className="relative z-10 w-7 h-7 rounded-full bg-slate-800/80 border border-white/10 flex items-center justify-center shrink-0 mt-0.5">
        <User className="w-3.5 h-3.5 text-slate-400" />
      </div>
      <div>
        <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
          {label}
        </p>
        <p className="text-[13.5px] font-semibold text-slate-100">{user}</p>
        <p className="text-[12px] text-slate-400 mt-1 flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5" /> {time}
        </p>
      </div>
    </div>
  </div>
);

// === SKELETON LOADER COMPONENT ===
export default function App() {
  const id = useParams().id;
  const { push: navigate } = useRouter();
  const [action, setAction] = useState({
    edit: false,
    delete: false,
  });

  const query = {
    fields:
      "id,lead_code,schedule_id,client_id,date,name,whatsapp_number,location,request_type,building_type,notes,follow_up_count,status,source,income,cretime,creby,modtime,modby",
    include: "client,schedule,schedule.region,crebyUser,modbyUser",
  };

  const { data: lead, isLoading: isLoadingLead } = useApiFetch(
    ["lead", id],
    `/lead/${id}`,
    query,
  );

  const handleDownloadPdf = async () => {
    await downloadFile(`/leads/${id}/pdf`, `Lead_${data.lead_code}.pdf`);
  };

  const data = lead?.data || null;

  if (!data && !isLoadingLead) {
    navigate("/dashboard/leads/report-leads/");
    return null;
  }

  const { mutate: removeLead } = useRemove((id) => `/leads/${id}`, {
    invalidate: [["lead"]],
  });

  const handleRemoveLead = async () => {
    toast.promise(
      new Promise((resolve, reject) => {
        removeLead(id, {
          onSuccess: () => {
            resolve();
            navigate("/dashboard/leads/report-leads/");
          },
          onError: (err) => {
            if (err) reject(err?.response?.data.message);
          },
        });
      }),
      {
        loading: "Menghapus...",
        success: "Lead berhasil dihapus",
        error: (msg) => msg ?? "Gagal menghapus data!",
      },
    );
  };

  return (
    <DashboardLayout dashboard={true}>
      {/* KONDISIONAL RENDER BERDASARKAN LOADING STATE */}
      {isLoadingLead ? (
        <LeadDetailSkeleton />
      ) : (
        <div className="flex flex-col w-full h-full">
          {/* HEADER NAVBAR - Sticky, Full Width, Translucent Blend */}
          <header className="sticky top-0 z-40 bg-[#0f172a]/85 backdrop-blur-md border-b border-white/10 w-full transition-all ">
            <div className="w-full px-4 sm:px-6 lg:px-8 py-4 sm:py-5">
              {/* Header Actions Area - Diperbaiki agar tidak wrap acak-acakan */}
              <div className="flex flex-wrap items-center gap-2 md:gap-3 justify-between">
                {/* TOMBOL BACK DAN REFRESH */}
                <div className="flex items-center gap-2 md:mr-auto">
                  <button
                    onClick={() => window.history.back()}
                    className="p-2 -ml-2 text-slate-400 hover:text-slate-100 hover:bg-slate-800/80 rounded-lg transition-all shrink-0"
                    title="Kembali"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => window.location.reload()}
                    className="flex items-center justify-center gap-2 px-2.5 sm:px-3 py-2 text-[13px] font-medium text-orange-400 bg-orange-500/10 border border-orange-500/20 rounded-lg hover:bg-orange-500/20 hover:text-orange-300 transition-all shadow-sm"
                    title="Refresh"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleDownloadPdf}
                    title="download pdf"
                    className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 text-[13px] font-medium text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-lg hover:bg-rose-500/20 hover:text-rose-300 transition-all shadow-sm"
                  >
                    <FileDown className="w-4 h-4" />
                  </button>
                  <button
                    title="download excel"
                    className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 text-[13px] font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-lg hover:bg-emerald-500/20 hover:text-emerald-300 transition-all shadow-sm"
                  >
                    <Sheet className="w-4 h-4" />
                  </button>
                </div>

                {/* Garis Pemisah (Sembunyi di HP) */}
                <div className="hidden sm:block w-px h-6 bg-white/10 mx-1"></div>

                {/* Grup Aksi (Edit & Delete) */}
                <div className="flex items-center gap-2">
                  <button
                    title="Edit"
                    onClick={() =>
                      navigate(`/dashboard/leads/report-leads/edit/${id}`)
                    }
                    className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 text-[13px] font-medium text-slate-300 bg-slate-800/50 border border-slate-700 rounded-lg hover:bg-slate-700 hover:text-white transition-all shadow-sm"
                  >
                    <Edit className="w-4 h-4" />
                    <span className="hidden sm:inline">Edit</span>
                  </button>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive">Delete</Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>
                          Are you sure to delete this lead?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. This will permanently
                          delete this lead from our servers.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel className="bg-slate-800 text-white hover:bg-white/10 hover:text-white">
                          Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                          variant="destructive"
                          className="bg-red-600 text-white hover:bg-red-700"
                          onClick={handleRemoveLead}
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                  {/* <button
                    onClick={handleRemoveLead}
                    title="Delete"
                    className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 text-[13px] font-medium text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg hover:bg-red-500/20 hover:text-red-300 transition-all shadow-sm"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span className="hidden sm:inline">Delete</span>
                  </button> */}
                </div>
              </div>
            </div>
          </header>

          {/* MAIN CONTENT - Memenuhi lebar penuh layout */}
          <main className="w-full py-4 sm:py-6 lg:py-8 flex-1">
            {/* Layout Grid Utama: Kiri (Data) 3 Kolom & Kanan (Audit) 1 Kolom */}
            <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 lg:gap-8 items-start w-full">
              {/* ======================================================== */}
              {/* KIRI (KOLOM DATA UTAMA)                                  */}
              {/* ======================================================== */}
              <div className="xl:col-span-3 flex flex-col gap-6 lg:gap-8">
                {/* --- INNER BOX 1: LEAD INFORMATION --- */}
                <div className="bg-[#1e293b]/40 border border-white/10 rounded-2xl p-5 sm:p-7 shadow-sm">
                  <h2 className="text-[12px] font-bold text-yellow-400 uppercase tracking-widest mb-5 sm:mb-6">
                    Lead Information
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 lg:gap-x-10 gap-y-1 sm:gap-y-4">
                    <InlineKeyValue label="Code" value={data.lead_code} />

                    <InlineKeyValue
                      label="Request Type"
                      value={data.request_type}
                    />

                    <InlineKeyValue
                      label="Lead Status"
                      value={<NeutralBadge status={data.status} />}
                    />

                    <InlineKeyValue label="Client Name" value={data.name} />

                    <InlineKeyValue
                      label="Building Type"
                      value={data.building_type}
                    />

                    <InlineKeyValue
                      label="Income Est."
                      value={"RP " + (data.income ?? 0)}
                    />

                    <InlineKeyValue
                      label="WhatsApp"
                      value={data.whatsapp_number}
                    />

                    <InlineKeyValue label="Lead Source" value={data.source} />
                    <InlineKeyValue
                      label="Follow Up"
                      value={`${data.follow_up_count} Times`}
                    />
                  </div>
                </div>

                {/* --- INNER BOX 2: SURVEY & SCHEDULE --- */}
                <div className="bg-[#1e293b]/40 border border-white/10 rounded-2xl p-5 sm:p-7 shadow-sm">
                  <h2 className="text-[12px] font-bold text-yellow-400 uppercase tracking-widest mb-5 sm:mb-6">
                    Survey & Schedule
                  </h2>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 lg:gap-x-10 gap-y-1 sm:gap-y-4">
                    <InlineKeyValue
                      label="Schedule Date"
                      value={formatDate(data.schedule?.date)}
                    />
                    <InlineKeyValue
                      label="Region"
                      value={data.schedule?.region?.name}
                    />
                    <InlineKeyValue
                      label="Survey Status"
                      value={<NeutralBadge status={data.schedule?.status} />}
                    />

                    {/* Bagian Alamat: Membentang penuh dengan border atas pembatas */}
                    <div className="md:col-span-2 lg:col-span-3 mt-4 pt-5 border-t border-white/5">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 lg:gap-x-10 gap-y-1 sm:gap-y-4">
                        <InlineKeyValue
                          label="Lead Location"
                          value={data.location}
                        />
                        <InlineKeyValue
                          label="Survey Address"
                          value={data.schedule?.address}
                        />
                        <InlineKeyValue
                          label="Map Link"
                          value={
                            data.schedule?.link_address ? (
                              <a
                                href={data.schedule.link_address}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1.5 text-blue-400 hover:text-blue-300 font-medium transition-colors"
                              >
                                Open in Maps{" "}
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            ) : null
                          }
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* ======================================================== */}
              {/* KANAN (INNER BOX 3: AUDIT TRAIL)                         */}
              {/* ======================================================== */}
              <div className="xl:col-span-1">
                {/* xl:sticky membuat kotak ini melayang hanya di layar lebar */}
                <div className="bg-[#1e293b]/40 border border-white/10 rounded-2xl p-5 sm:p-7 min-h-[250px] xl:sticky xl:top-[100px] shadow-sm">
                  <h2 className="text-[12px] font-bold text-yellow-400 uppercase tracking-widest mb-6 pb-4 border-b border-white/10">
                    Audit Trail
                  </h2>

                  {/* Desain Timeline Vertikal */}
                  <div className="pt-2">
                    <AuditTimelineItem
                      label="Created By"
                      user={data.creby_user?.name || data.creby}
                      time={formatDate(data.cretime, true)}
                    />

                    {data.modby_user && (
                      <AuditTimelineItem
                        label="Last Modified By"
                        user={data.modby_user?.name || data.modby}
                        time={formatDate(data.modtime, true)}
                        isLast={true}
                      />
                    )}
                  </div>
                </div>
              </div>
            </div>
          </main>
        </div>
      )}
    </DashboardLayout>
  );
}
