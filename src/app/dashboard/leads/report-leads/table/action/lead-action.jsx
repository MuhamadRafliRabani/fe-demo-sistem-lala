"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  CalendarPlus,
  ClipboardList,
  MoreVertical,
  Pencil,
  Trash2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { useRemove } from "@/hooks/use-api-mutation";
import { SurveyModal } from "@/components/SurveyModal";
import { GenerateSurveyModal } from "@/components/leads/generate-survey-modal";
import { useIsMobile } from "@/hooks/use-mobile";

/**
 * Menu aksi untuk 1 baris lead.
 *
 * Props:
 * - lead    : object lead (wajib, minimal punya id, name, schedule)
 * - onEdit  : (lead) => void  (opsional, kalau kosong menu Edit disembunyikan)
 * - refetch : () => void      (dipanggil setelah survey dibuat / lead dihapus)
 */
export default function LeadActions({ lead, onEdit, refetch }) {
  // Satu state untuk semua modal: null | "survey" | "generateSurvey" | "delete"
  const [modal, setModal] = useState(null);
  const isMobile = useIsMobile();
  const { mutateAsync: removeLead } = useRemove(`/leads/${lead.id}`);

  const closeModal = () => setModal(null);
  const handleOpenChange = (open) => {
    if (!open) closeModal();
  };

  const hasSurvey = Boolean(lead.schedule);

  const handleDelete = () => {
    toast.promise(
      removeLead({}).then(() => refetch?.()),
      {
        loading: "Menghapus...",
        success: "Lead berhasil dihapus!",
        error: (err) => err?.response?.data?.message ?? "Gagal menghapus lead!",
      },
    );
  };

  return (
    // stopPropagation di sini supaya klik menu/modal tidak ikut men-trigger klik baris tabel
    <div onClick={(e) => e.stopPropagation()}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            aria-label="Aksi lead"
          >
            <MoreVertical className="size-4" />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align={isMobile ? "end" : "right"}
          className="w-44"
        >
          {onEdit && (
            <DropdownMenuItem
              className="cursor-pointer"
              onSelect={() => onEdit(lead)}
            >
              <Pencil className="size-4" /> Edit
            </DropdownMenuItem>
          )}

          {/* {!hasSurvey && (
            <DropdownMenuItem
              className="cursor-pointer"
              onSelect={() => setModal("survey")}
            >
              <CalendarPlus className="size-4" /> Survey
            </DropdownMenuItem>
          )} */}

          {!hasSurvey && (
            <DropdownMenuItem
              className="cursor-pointer"
              onSelect={() => setModal("generateSurvey")}
            >
              <ClipboardList className="size-4" /> Generate Survey
            </DropdownMenuItem>
          )}

          <DropdownMenuSeparator />

          <DropdownMenuItem
            className="cursor-pointer text-red-600 focus:text-red-600"
            onSelect={() => setModal("delete")}
          >
            <Trash2 className="size-4" /> Hapus
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Modal berat: baru dipasang saat dibuka, bukan di setiap baris */}
      {modal === "survey" && (
        <SurveyModal
          open
          setOpen={handleOpenChange}
          id={lead.id}
          refetch={refetch}
        />
      )}

      {modal === "generateSurvey" && (
        <GenerateSurveyModal
          open
          onOpenChange={handleOpenChange}
          lead={lead}
          refetch={refetch}
        />
      )}

      {/* Konfirmasi hapus */}
      <AlertDialog open={modal === "delete"} onOpenChange={handleOpenChange}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Hapus lead{lead.name ? ` "${lead.name}"` : ""}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Data lead ini akan dihapus permanen dan tidak bisa dikembalikan.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 text-white hover:bg-red-700"
              onClick={handleDelete}
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
