"use client";

import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  ArrowRightFromLine,
  Delete,
  Eye,
  MessageCircle,
  MessageCircleCodeIcon,
  MoreHorizontal,
  MoreVertical,
  Pencil,
  PlaneTakeoff,
  Plus,
  Trash,
  Trash2,
  UploadIcon,
  ArrowUpDown,
  CreditCard,
  DownloadCloud,
  Clock,
} from "lucide-react";
import { useRemove, usePut, usePost } from "@/hooks/use-api-mutation";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { SurveyModal } from "./SurveyModal";
import { SubmitModal } from "./SubmitModal";
import { RevisiModal } from "./RevisiModal";
import { ChangeStageModal } from "./ChangeStageModal";
import { PriorityModal } from "./PriorityModal";
import { GenerateSurveyModal } from "./leads/generate-survey-modal";

export default function ActionTable({
  id,
  isEdit = false,
  isView = false,
  isDelete = false,
  isSurvey = false,
  isGenerateSurvey = false,
  isShowInvoice = null,
  isTaskSubmit = false,
  isTaskRevisi = false,
  isTaskPending = false,
  isNextStage = false,
  schedule = "",
  lead = null,
  refetch,
  url,
  urlDelete = "",
  onEdit,
  isPriority = false,
  currentPriority = null,
  useTasksInvalidation = false,
  invalidateKeys,
  updatePayment,
  order_id,
}) {
  const deleteOptions = useTasksInvalidation
    ? { invalidate: [["tasks-v2"], ["designer-tasks-dashboard"], ["tasks"]] }
    : Array.isArray(invalidateKeys)
      ? { invalidate: invalidateKeys }
      : undefined;

  const { mutate } = useRemove(urlDelete, deleteOptions);
  const { mutate: mutatePending, isPending: isPendingMutation } = usePut(
    `/tasks/${id}`,
    deleteOptions,
  );
  const { mutate: mutateUpdatePayment, isPending: isUpdatePaymentMutation } =
    usePut((payload) => `/orders/update-order/${payload.id}`, deleteOptions);

  const router = useRouter();
  const [open, setOpen] = useState({
    view: false,
    delete: false,
    survey: false,
    generateSurvey: false,
    submit: false,
    revisi: false,
    pending: false,
    nextStage: false,
    priority: false,
    updatePayment: false,
  });

  const closeAllModal = () =>
    setOpen({
      view: false,
      delete: false,
      survey: false,
      generateSurvey: false,
      submit: false,
      revisi: false,
      pending: false,
      nextStage: false,
      priority: false,
      updatePayment: false,
    });

  const openModal = (key) =>
    setOpen((prev) => ({
      ...prev,
      [key]: true,
    }));

  const handlePending = () => {
    toast.promise(
      new Promise((resolve, reject) => {
        mutatePending(
          { action: "pending" },
          {
            onSuccess: () => {
              if (refetch) refetch();
              closeAllModal();
              resolve();
            },
            onError: (err) => {
              reject(err?.response?.data?.message || "Gagal mengubah status!");
            },
          },
        );
      }),
      {
        loading: "Mengubah status...",
        success: "Status berhasil diubah ke Pending!",
        error: (err) => err,
      },
    );
  };

  const handleDelete = () => {
    toast.promise(
      new Promise((resolve, reject) => {
        mutate(
          {},
          {
            onSuccess: () => {
              if (!useTasksInvalidation) {
                refetch();
              }
              resolve();
            },
            onError: (err) => {
              if (err) reject(err?.response?.data.message);
            },
          },
        );
      }),
      {
        loading: "Menghapus...",
        success: "Record berhasil dihapus!",
        error: (err) => err ?? "Gagal menyimpan data!",
      },
    );
  };

  const handleUpdatePayment = () => {
    if (!order_id) {
      toast.error("Order ID tidak ditemukan!");
      return;
    }
    toast.promise(
      new Promise((resolve, reject) => {
        mutateUpdatePayment(
          {
            id: order_id,
            status: "paid",
            payment_status: "paid",
            payment_type: "bank_transfer",
            transaction_status: "settlement",
          },
          {
            onSuccess: () => {
              if (!useTasksInvalidation) {
                refetch();
              }
              resolve();
            },
            onError: (err) => {
              if (err) reject(err?.response?.data.message);
            },
          },
        );
      }),
      {
        loading: "Mengupdate payment...",
        success: "Payment berhasil diupdate!",
        error: (err) => err ?? "Gagal menyimpan data!",
      },
    );
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="h-8 w-8 p-0"
            onClick={(e) => e.stopPropagation()}
          >
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-36">
          {isView && (
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                router.push(`/dashboard${url}/view/${id}`);
              }}
              className="cursor-pointer"
            >
              <Eye className="size-3" /> View
            </DropdownMenuItem>
          )}

          {isEdit && (
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                if (onEdit) {
                  onEdit();
                } else {
                  router.push(`/dashboard${url}/edit/${id}`);
                }
              }}
              className="cursor-pointer"
            >
              <Pencil className="size-3" /> Edit
            </DropdownMenuItem>
          )}

          {isTaskSubmit && (
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                openModal("submit");
              }}
              className="cursor-pointer"
              id={id}
            >
              <UploadIcon className="size-3" /> Submit
            </DropdownMenuItem>
          )}

          {isShowInvoice && (
            <DropdownMenuItem
              onClick={(e) => {
                router.push(isShowInvoice);
              }}
              className="cursor-pointer"
              id={id}
            >
              <DownloadCloud className="size-3" /> Show Invoice
            </DropdownMenuItem>
          )}

          {isTaskRevisi && (
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                openModal("revisi");
              }}
              className="cursor-pointer"
              id={id}
            >
              <MessageCircleCodeIcon className="size-3" /> Revisi
            </DropdownMenuItem>
          )}

          {isNextStage && (
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                openModal("nextStage");
              }}
              className="cursor-pointer"
              id={id}
            >
              <ArrowRightFromLine className="size-3" /> Stage
            </DropdownMenuItem>
          )}

          {isPriority && (
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                openModal("priority");
              }}
              className="cursor-pointer"
              id={id}
            >
              <ArrowUpDown className="size-3" /> Priority
            </DropdownMenuItem>
          )}

          {isTaskPending && (
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                openModal("pending");
              }}
              className="cursor-pointer"
              id={id}
            >
              <Clock className="size-3" /> Pending
            </DropdownMenuItem>
          )}

          {isSurvey && (
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                openModal("survey");
              }}
              className="cursor-pointer"
              id={id}
            >
              <Plus className="size-3" /> Survey
            </DropdownMenuItem>
          )}

          {isGenerateSurvey && (
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                openModal("generateSurvey");
              }}
              className="cursor-pointer"
              id={id}
            >
              <CreditCard className="size-3" /> Generate Survey
            </DropdownMenuItem>
          )}

          {updatePayment && (
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                openModal("updatePayment");
              }}
              className="cursor-pointer"
              id={id}
            >
              <CreditCard className="size-3" /> Update Payment
            </DropdownMenuItem>
          )}

          {isDelete && (
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                openModal("delete");
              }}
              className="cursor-pointer text-red-600"
            >
              <Trash2 className="size-3" /> Delete
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Modal Pending */}
      <AlertDialog
        open={open.pending}
        onOpenChange={(val) => setOpen((prev) => ({ ...prev, pending: val }))}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ubah status ke Pending?</AlertDialogTitle>
            <AlertDialogDescription>
              Tugas ini akan ditandai sebagai pending.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handlePending}
              disabled={isPendingMutation}
              className="bg-amber-500 text-white hover:bg-amber-600"
            >
              Ya, Pending
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Modal Delete */}
      <AlertDialog
        open={open.delete}
        onOpenChange={(val) => setOpen((prev) => ({ ...prev, delete: val }))}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus data ini?</AlertDialogTitle>
            <AlertDialogDescription>
              Proses ini tidak bisa dibatalkan. Pastikan Anda yakin.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => {
                closeAllModal();
                handleDelete();
              }}
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Modal Delete */}
      <AlertDialog
        open={open.updatePayment}
        onOpenChange={(val) =>
          setOpen((prev) => ({ ...prev, updatePayment: val }))
        }
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Update Payment ini?</AlertDialogTitle>
            <AlertDialogDescription>
              Proses ini tidak bisa dibatalkan. Pastikan Anda yakin.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              className="bg-green-600 hover:bg-green-700"
              onClick={() => {
                closeAllModal();
                handleUpdatePayment();
              }}
            >
              Update Payment
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* SURVEY MODAL */}
      {isSurvey && (
        <SurveyModal
          open={open.survey}
          setOpen={(value) => setOpen((prev) => ({ ...prev, survey: value }))}
          id={id}
          refetch={refetch}
        />
      )}

      {isGenerateSurvey && (
        <GenerateSurveyModal
          open={open.generateSurvey}
          onOpenChange={(value) =>
            setOpen((prev) => ({ ...prev, generateSurvey: value }))
          }
          lead={lead}
          refetch={refetch}
        />
      )}

      {isTaskRevisi && (
        <RevisiModal
          open={open.revisi}
          setOpen={(value) => setOpen((prev) => ({ ...prev, revisi: value }))}
          id={id}
          refetch={refetch}
        />
      )}

      {/* SUBMIT MODAL */}
      {isTaskSubmit && (
        <SubmitModal
          open={open.submit}
          setOpen={(value) => setOpen((prev) => ({ ...prev, submit: value }))}
          id={id}
          refetch={refetch}
        />
      )}

      {/* REVISI MODAL */}
      {isNextStage && (
        <ChangeStageModal
          open={open.nextStage}
          setOpen={(value) =>
            setOpen((prev) => ({ ...prev, nextStage: value }))
          }
          id={id}
          refetch={refetch}
          schedule={schedule}
        />
      )}

      {isPriority && (
        <PriorityModal
          open={open.priority}
          setOpen={(value) => setOpen((prev) => ({ ...prev, priority: value }))}
          id={id}
          currentPriority={currentPriority}
          refetch={refetch}
        />
      )}
    </>
  );
}
