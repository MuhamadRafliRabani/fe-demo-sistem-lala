"use client";

import { useState, useMemo } from "react";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { IconPlus } from "@tabler/icons-react";
import { useApiFetch } from "@/hooks/use-api-fetch";
import { usePost, usePut } from "@/hooks/use-api-mutation";
import {
  ArrowDownUp,
  ArrowUpDown,
  Copy,
  DownloadIcon,
  ChevronDown,
  Wallet,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { formatDate } from "@/lib/date-format";
import FilterReportLeads from "../filters/filter-report-leads";
import { useDateRange } from "@/lib/date-range";
import ActionTable from "@/components/action-table";
import { formatDateDb } from "@/lib/date-format-db";
import { formatDailyReportMessage } from "../resume/forma-chat-report";
import axiosInstance from "@/lib/axios";
import { toast } from "sonner";
import { FollowUpTemplateModal } from "@/components/leads/follow-up-template-modal";
import { PaginationBar } from "@/components/pagination-bar";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuthStore } from "@/hooks/auth-store";
import { DataTable } from "@/components/tables/data-table";
import { handleExport, handleExportReport } from "../libs/export-excel";
import {
  buildingTypes,
  normalizeLeadStatusValue,
  requestTypes,
  sourceLeads,
  statusLeads,
} from "@/data/data";
import SearchableSelect from "@/components/searchable-select";
import { Badge } from "@/components/ui/badge";
import { useIsMobile } from "@/hooks/use-mobile";

// IMPORT DATA TABLE KITA

const TableLead = () => {
  const router = useRouter();
  const { start, end } = useDateRange("this_month");
  const [selectedLead, setSelectedLead] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const isMobile = useIsMobile();
  console.log("🚀 ~ TableLead ~ isMobile:", isMobile);

  // State Manual Follow Up
  const [followUpModalLead, setFollowUpModalLead] = useState(null);
  const [isFollowUpModalOpen, setIsFollowUpModalOpen] = useState(false);
  const [followUpValue, setFollowUpValue] = useState(0);
  const [followUpNote, setFollowUpNote] = useState("");

  // Memanggil data user dari auth store
  const { user } = useAuthStore();

  // Konversi role_id ke Number dan simpan di const agar aksesnya aktif
  const canExport = Number(user?.role_id) === 1;

  // -----------------------------
  // STATE API & FILTERING
  // -----------------------------
  const [paginate, setPaginate] = useState(15);
  const [filter, setFilter] = useState({
    page: 1,
    name: "",
    status: [],
    source: [],
    request_type: [],
    whatsapp_number: "",
    building_type: [],
    start_date: formatDateDb(start),
    end_date: formatDateDb(end),
    modtime_start: "",
    modtime_end: "",
    income: [],
    sort: "-date",
  });

  // -----------------------------
  // ADAPTER UNTUK TANSTACK TABLE
  // -----------------------------
  // 1. Adapter Sorting: Mengubah "-date" (API) menjadi format [{ id: 'date', desc: true }] (Tanstack)
  const sortingState = useMemo(() => {
    const isDesc = filter.sort.startsWith("-");
    const id = filter.sort.replace("-", "");
    return [{ id, desc: isDesc }];
  }, [filter.sort]);

  const handleSortingChange = (updaterOrValue) => {
    const newSorting =
      typeof updaterOrValue === "function"
        ? updaterOrValue(sortingState)
        : updaterOrValue;
    if (newSorting.length > 0) {
      const { id, desc } = newSorting[0];
      setFilter({ ...filter, sort: desc ? `-${id}` : id });
    }
  };

  // -----------------------------
  // FETCH API
  // -----------------------------
  const baseFilter = {
    name: filter.name,
    status: filter.status.join(","),
    source: filter.source.join(","),
    request_type: filter.request_type.join(","),
    building_type: filter.building_type.join(","),
    date_between: { start: filter.start_date, end: filter.end_date },
    whatsapp_number: filter.whatsapp_number,
    income: encodeURIComponent(filter.income.join(",")),
  };

  const filterWithModtime =
    filter.modtime_start && filter.modtime_end
      ? {
          ...baseFilter,
          modtime_between: {
            start: filter.modtime_start,
            end: filter.modtime_end,
          },
        }
      : baseFilter;

  const query = {
    fields:
      "id,name,whatsapp_number,request_type,building_type,source,location,date,income,status,client_id,schedule_id,notes,follow_up_count,cretime,creby,modtime,modby",
    include: "client,schedule",
    filter: filterWithModtime,
    sort: filter.sort,
    paginate,
    page: filter.page,
  };

  const { data, isLoading, refetch } = useApiFetch(
    ["leads", query],
    "/leads",
    query,
  );
  const leads = data?.data.data ?? [];
  const lastPage = data?.data?.last_page ?? 1;
  const totalCount = data?.data?.total ?? leads.length;

  const { mutateAsync: updateFollowUpManual, isPending: isSavingFollowUp } =
    usePost("/leads/follow-up/manual");

  // -----------------------------
  // ACTIONS / HANDLERS
  // -----------------------------
  const handleOpenFollowUpModal = useCallback((lead) => {
    const value = (lead.follow_up_count ?? 0) || 0;
    setFollowUpModalLead(lead);
    setFollowUpValue(value);
    setFollowUpNote(lead.notes || "");
    setIsFollowUpModalOpen(true);
  }, []);

  const handleSaveFollowUp = async () => {
    if (!followUpModalLead) return;
    try {
      await updateFollowUpManual({
        lead_id: followUpModalLead.id,
        follow_up_count: followUpValue,
        notes: followUpNote,
      });
      toast.success("Follow-up berhasil diperbarui");
      setIsFollowUpModalOpen(false);
      setFollowUpModalLead(null);
      refetch();
    } catch (error) {
      toast.error("Gagal memperbarui follow-up");
      console.error(error);
    }
  };

  // Export functions (Tidak diubah)
  const today = new Date().toISOString().split("T")[0];
  const queryExport = {
    fields:
      "id,name,whatsapp_number,request_type,building_type,building_area,source,location,notes,date,status,follow_up_count",
    filter: {
      date_between: { start: formatDateDb(today), end: formatDateDb(today) },
    },
    sort: "date",
  };
  const { data: todayLeads, isLoading: isLoadingToday } = useApiFetch(
    "leads",
    "/leads",
    queryExport,
  );

  const handleSendDailyReport = () => {
    if (isLoadingToday) return;
    const message = formatDailyReportMessage(todayLeads?.data);
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, "_blank");
  };

  const { mutate, isPending } = usePost(`/leads/row`, {
    invalidate: [["leads"]],
  });

  const handleFieldChange = useCallback(
    (selected, row, field) => {
      const data = {
        id: row.original.id,
        request_type:
          field === "request_type" ? selected : row.original.request_type,
        building_type:
          field === "building_type" ? selected : row.original.building_type,
        source: field === "source" ? selected : row.original.source,
        status: field === "status" ? selected : row.original.status,
      };

      toast.promise(
        new Promise((resolve, reject) => {
          mutate(data, {
            onSuccess: () => {
              resolve();
            },
            onError: (err) => {
              if (err) reject(err?.response?.data.message);
            },
          });
        }),
        {
          loading: "Mengupdate...",
          success: "Lead berhasil diupdate!",
          error: (msg) => msg ?? "Gagal menyimpan data!",
        },
      );
    },
    [mutate],
  );

  // -----------------------------
  // DEFINISI KOLOM (COLUMN DEF)
  // -----------------------------
  const columns = useMemo(
    () => [
      {
        id: "actions",
        header: "Action",
        enableHiding: false,
        enablePinning: true,
        size: 80,
        cell: ({ row }) => {
          const lead = row.original;
          return (
            <div onClick={(e) => e.stopPropagation()}>
              <ActionTable
                id={lead.id}
                url={`/leads/report-leads/`}
                urlDelete={`/leads/${lead.id}`}
                isEdit
                isDelete
                isSurvey={lead.schedule ? false : true}
                isGenerateSurvey
                lead={lead}
                refetch={refetch}
              />
            </div>
          );
        },
      },
      {
        accessorKey: "date",
        header: ({ column }) => (
          <Button
            variant="ghost"
            className="p-0 hover:bg-transparent flex gap-1 font-semibold"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Tanggal
            {column.getIsSorted() === "desc" ? (
              <ArrowDownUp size={14} />
            ) : (
              <ArrowUpDown size={14} />
            )}
          </Button>
        ),
        cell: ({ row }) => (
          <div className="whitespace-nowrap cursor-pointer">
            {formatDate(row.getValue("date"))}
          </div>
        ),
      },
      {
        accessorKey: "name",
        header: "Client Name",
        cell: ({ row }) => (
          <div className="font-medium cursor-pointer">
            {row.getValue("name")}
          </div>
        ),
      },
      {
        accessorKey: "whatsapp_number",
        header: "Phone",
        cell: ({ row }) => {
          const lead = row.original;

          let rawNumber = lead.whatsapp_number?.toString() || "";
          let cleanedNumber = rawNumber.replace(/\D/g, "");

          if (cleanedNumber.startsWith("62")) {
            cleanedNumber = cleanedNumber.substring(2);
          }
          while (cleanedNumber.startsWith("0")) {
            cleanedNumber = cleanedNumber.substring(1);
          }
          if (cleanedNumber.length > 0) {
            cleanedNumber = "62" + cleanedNumber;
          }

          const rawMessage = `Halo ${lead.name || "Kak"},\n\nKami dari Langit Langit ingin menindaklanjuti pembahasan sebelumnya terkait proyek bangunan Anda.\n\nApakah ada pertanyaan atau hal yang ingin didiskusikan lebih lanjut? Kami siap membantu memberikan solusi terbaik.\n\nTerima kasih!`;
          const encodedMessage = encodeURIComponent(rawMessage);

          const isIOS =
            typeof navigator !== "undefined" &&
            (/iPad|iPhone|iPod/.test(navigator.userAgent) ||
              (navigator.platform === "MacIntel" &&
                navigator.maxTouchPoints > 1));

          const whatsappUrl = isIOS
            ? `https://wa.me/${cleanedNumber}?text=${encodedMessage}`
            : `https://api.whatsapp.com/send?phone=${cleanedNumber}&text=${encodedMessage}`;

          const handleClick = async (e) => {
            if (e.ctrlKey || e.metaKey) {
              e.preventDefault();
              try {
                await navigator.clipboard.writeText(rawNumber);
                toast.success("Nomor disalin");
              } catch {
                toast.error("Gagal menyalin");
              }
              return;
            }

            if (e.shiftKey) {
              e.preventDefault();
              if (isIOS) {
                window.open(whatsappUrl, "_top");
              } else {
                window.open(whatsappUrl, "_blank", "noopener,noreferrer");
              }
              return;
            }

            e.preventDefault();
            setSelectedLead(lead);
            setIsModalOpen(true);
          };

          return (
            <a
              href={whatsappUrl}
              onClick={handleClick}
              className="group inline-flex items-center gap-1 cursor-pointer select-none text-muted-foreground hover:text-foreground underline-offset-4 hover:underline"
            >
              <span className="transition-colors">{rawNumber}</span>
              <Copy
                size={14}
                className="opacity-0 translate-x-1 transition-all duration-150 group-hover:opacity-100 group-hover:translate-x-0"
              />
            </a>
          );
        },
      },
      {
        accessorKey: "request_type",
        header: "Kebutuhan",
        cell: ({ row }) => {
          const val = row.getValue("request_type");
          const item = requestTypes.find((s) => s.value == val) || {
            color: "transparent",
            icon: null,
          };

          return (
            <div className="whitespace-nowrap">
              {/* DESKTOP VIEW: Editable Select */}
              <div className="hidden md:block cursor-pointer">
                <SearchableSelect
                  options={requestTypes}
                  placeholder={val}
                  onChange={(selected) =>
                    handleFieldChange(selected, row, "request_type")
                  }
                  showQuote={false}
                  className="border-none text-[#fffdf5]"
                  backgroundColor={item.color}
                  icon={item.icon ?? null}
                />
              </div>
              {/* MOBILE VIEW: Clean Text with Icon */}
              <div className="md:hidden flex items-center justify-end gap-1.5 text-sm font-medium text-foreground">
                {item.icon && (
                  <span className="text-muted-foreground flex items-center">
                    {item.icon}
                  </span>
                )}
                <span>{val || "-"}</span>
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "building_type",
        header: "Jenis Bangunan",
        cell: ({ row }) => {
          const val = row.getValue("building_type");
          const item = buildingTypes.find((s) => s.value == val) || {
            color: "transparent",
            icon: null,
          };

          return (
            <div className="whitespace-nowrap">
              {/* DESKTOP VIEW: Editable Select */}
              <div className="hidden md:block cursor-pointer">
                <SearchableSelect
                  options={buildingTypes}
                  placeholder={val}
                  onChange={(selected) =>
                    handleFieldChange(selected, row, "building_type")
                  }
                  showQuote={false}
                  className="border-none text-[#fffdf5]"
                  backgroundColor={item.color}
                  icon={item.icon ?? null}
                />
              </div>
              {/* MOBILE VIEW: Clean Text with Icon */}
              <div className="md:hidden flex items-center justify-end gap-1.5 text-sm font-medium text-foreground">
                {item.icon && (
                  <span className="text-muted-foreground flex items-center">
                    {item.icon}
                  </span>
                )}
                <span>{val || "-"}</span>
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
          const val = row.getValue("status");
          const item = statusLeads.find(
            (s) =>
              normalizeLeadStatusValue(s.value) ===
              normalizeLeadStatusValue(val),
          ) || {
            color: "transparent",
            icon: null,
          };

          return (
            <div className="whitespace-nowrap">
              {/* DESKTOP VIEW: Editable Select */}
              <div className="hidden md:block cursor-pointer">
                <SearchableSelect
                  options={statusLeads}
                  placeholder={val}
                  onChange={(selected) =>
                    handleFieldChange(selected, row, "status")
                  }
                  showQuote={false}
                  className="border-none text-[#fffdf5]"
                  backgroundColor={item.color}
                  icon={item.icon}
                />
              </div>
              {/* MOBILE VIEW: Status Dot + Clean Text */}
              <div className="md:hidden flex items-center justify-end gap-2 text-sm font-medium text-foreground">
                {item.color !== "transparent" && (
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                )}
                <span>{val || "-"}</span>
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "source",
        header: "Source",
        cell: ({ row }) => {
          const val = row.getValue("source");
          const item = sourceLeads.find((s) => s.value == val) || {
            color: "transparent",
            icon: null,
          };

          return (
            <div className="whitespace-nowrap">
              {/* DESKTOP VIEW: Editable Select */}
              <div className="hidden md:block cursor-pointer">
                <SearchableSelect
                  options={sourceLeads}
                  placeholder={val}
                  onChange={(selected) =>
                    handleFieldChange(selected, row, "source")
                  }
                  showQuote={false}
                  className="border-none text-[#fffdf5]"
                  icon={item.icon}
                  backgroundColor={item.color}
                />
              </div>
              {/* MOBILE VIEW: Clean Text with Icon */}
              <div className="md:hidden flex items-center justify-end gap-1.5 text-sm font-medium text-foreground">
                {item.icon && (
                  <span className="text-muted-foreground flex items-center">
                    {item.icon}
                  </span>
                )}
                <span>{val || "-"}</span>
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "location",
        header: "Alamat",
        size: 250,
        cell: ({ row }) => (
          <p className="w-full text-wrap cursor-pointer text-sm">
            {row.getValue("location")}
          </p>
        ),
      },
      {
        accessorKey: "notes",
        header: "Notes",
        size: 200,
        cell: ({ row }) => (
          <p className="w-full text-wrap cursor-pointer text-sm text-muted-foreground">
            {row.getValue("notes") || "-"}
          </p>
        ),
      },
      {
        accessorKey: "follow_up_count",
        header: ({ column }) => (
          <Button
            variant="ghost"
            className="p-0 hover:bg-transparent flex gap-1 font-semibold mx-auto"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Follow-up
            {column.getIsSorted() === "desc" ? (
              <ArrowDownUp size={14} />
            ) : (
              <ArrowUpDown size={14} />
            )}
          </Button>
        ),
        cell: ({ row }) => {
          const lead = row.original;
          const count = (lead.follow_up_count ?? 0) || 0;
          return (
            <div
              className="text-center cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                handleOpenFollowUpModal(lead);
              }}
            >
              <span
                className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${
                  count >= 4
                    ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
                    : count != 2
                      ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
                      : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                }`}
              >
                {count}/4
              </span>
            </div>
          );
        },
      },
      {
        id: "survey",
        header: "Survey",
        cell: ({ row }) => (
          <div className="text-center whitespace-nowrap cursor-pointer text-sm">
            {row.original.schedule
              ? formatDate(row.original.schedule.date, true)
              : "-"}
          </div>
        ),
      },
      {
        accessorKey: "cretime",
        header: "Created At",
        cell: ({ row }) => (
          <div className="whitespace-nowrap cursor-pointer text-sm">
            {formatDate(row.getValue("cretime"), true)}
          </div>
        ),
      },
      {
        accessorKey: "creby_name",
        header: "Created By",
        cell: ({ row }) => (
          <div className="whitespace-nowrap cursor-pointer text-sm text-muted-foreground">
            {row.getValue("creby_name") ?? "-"}
          </div>
        ),
      },
      {
        accessorKey: "modtime",
        header: "Modified At",
        cell: ({ row }) => (
          <div className="whitespace-nowrap cursor-pointer text-sm">
            {formatDate(row.getValue("modtime"), true)}
          </div>
        ),
      },
      {
        accessorKey: "modby_name",
        header: "Modified By",
        cell: ({ row }) => (
          <div className="whitespace-nowrap cursor-pointer text-sm text-muted-foreground">
            {row.getValue("modby_name") ?? "-"}
          </div>
        ),
      },
    ],
    // Tetap pertahankan array dependency ini sesuai dengan kebutuhan React Compiler
    [
      refetch,
      handleFieldChange,
      handleOpenFollowUpModal,
      setSelectedLead,
      setIsModalOpen,
    ],
  );

  // -----------------------------
  // RENDER UTAMA
  // -----------------------------
  return (
    <Tabs defaultValue="Report_leads" className="mt-6 space-y-6 w-full">
      <div className="overflow-x-auto overflow-y-hidden md:pe-8">
        <TabsContent value="Report_leads" className="mt-6 space-y-6">
          <FilterReportLeads filter={filter} setFilter={setFilter} />

          <div className="flex flex-wrap items-center gap-4">
            <div className="ml-auto flex flex-wrap items-center gap-2 md:gap-4">
              {/* === PROTEKSI ROLE === */}
              {/* Hanya tampilkan tombol Export jika role user adalah 1 */}
              {canExport && (
                <>
                  <Button
                    variant="outline"
                    onClick={() => handleExportReport(filter)}
                  >
                    <DownloadIcon className="size-4 mr-2" /> Export Data
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleExport(filter)}
                  >
                    <DownloadIcon className="size-4 mr-2" /> Export Excel
                  </Button>
                </>
              )}
              {/* === END PROTEKSI ROLE === */}

              <Button variant="outline" onClick={handleSendDailyReport}>
                <DownloadIcon className="size-4 mr-2" /> Daily Report
              </Button>
              <Button
                className="flex gap-2"
                onClick={() =>
                  router.push("/dashboard/leads/report-leads/create")
                }
              >
                <IconPlus size={16} /> Add Lead
              </Button>
            </div>
          </div>

          {/* PEMANGGILAN KOMPONEN DATA TABLE (Re-usable) */}
          <DataTable
            columns={columns}
            data={leads}
            isLoading={isLoading}
            // --- Opsi Fitur Terbaik untuk Leads ---
            enableColumnVisibility={true}
            enableSorting={true}
            enablePinning={true} // Action menempel di sebelah kiri
            enableColumnResizing={true} // Kolom alamat/catatan bisa diperlebar
            // --- Server-side Management ---
            manualSorting={true}
            sorting={sortingState}
            onSortingChange={handleSortingChange}
            enablePagination={false} // Dimatikan karena kita pakai PaginationBar eksternal (di bawah)
          />

          <PaginationBar
            total={totalCount}
            page={filter.page}
            perPage={paginate}
            totalPages={lastPage}
            onPageChange={(nextPage) =>
              setFilter({ ...filter, page: nextPage })
            }
            onPerPageChange={(nextPerPage) => {
              setPaginate(nextPerPage);
              setFilter({ ...filter, page: 1 });
            }}
            currentData={leads.length}
            label="Total leads"
          />
        </TabsContent>
      </div>

      {/* MODAL FOLLOW UP MANUAL */}
      <Dialog
        open={isFollowUpModalOpen}
        onOpenChange={(open) => {
          setIsFollowUpModalOpen(open);
          if (!open) setFollowUpModalLead(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Atur Follow-up</DialogTitle>
            <DialogDescription>
              {followUpModalLead ? `Lead: ${followUpModalLead.name}` : ""}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm font-medium">Jumlah Follow-up</p>
              <Input
                type="number"
                min={0}
                max={4}
                value={followUpValue}
                onChange={(e) => {
                  const raw = parseInt(e.target.value, 10);
                  if (Number.isNaN(raw)) {
                    setFollowUpValue(0);
                    return;
                  }
                  const clamped = Math.max(0, Math.min(4, raw));
                  setFollowUpValue(clamped);
                }}
              />
              <p className="text-xs text-muted-foreground">
                Nilai antara 0 sampai 4.
              </p>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">Catatan Follow-up</p>
              <Textarea
                rows={4}
                value={followUpNote}
                onChange={(e) => setFollowUpNote(e.target.value)}
                placeholder="Tulis catatan singkat untuk follow-up ini"
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setIsFollowUpModalOpen(false);
                  setFollowUpModalLead(null);
                }}
              >
                Batal
              </Button>
              <Button
                onClick={handleSaveFollowUp}
                disabled={isSavingFollowUp || !followUpModalLead}
              >
                Simpan
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* MODAL FOLLOW UP TEMPLATE WA */}
      <FollowUpTemplateModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        lead={selectedLead}
        onFollowUp={async (leadId) => {
          try {
            await axiosInstance.post(`/leads/${leadId}/follow-up`);
            refetch();
            toast.success("Follow-up berhasil dicatat");
          } catch (error) {
            toast.error("Gagal mencatat follow-up");
            console.error(error);
          }
        }}
      />
    </Tabs>
  );
};

export default TableLead;
