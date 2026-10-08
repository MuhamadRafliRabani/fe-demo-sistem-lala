"use client";

import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import DashboardLayout from "@/components/layouts/dashboard-layout";
import { useApiFetch } from "@/hooks/use-api-fetch";
import { usePut } from "@/hooks/use-api-mutation";
import FaqForm from "../../components/faq-form";

export default function EditFaqPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id;

  const { data, isLoading: isLoadingData } = useApiFetch(
    `faq-${id}`,
    `/master/faqs/${id}`,
  );

  const { mutate, isPending } = usePut(`/master/faqs/${id}`);

  const handleSubmit = (formData) => {
    toast.promise(
      new Promise((resolve, reject) => {
        mutate(formData, {
          onSuccess: () => {
            router.push("/dashboard/Masters/faqs");
            resolve();
          },
          onError: (error) => {
            reject(error?.response?.data?.message || "Gagal mengupdate FAQ");
          },
        });
      }),
      {
        loading: "Menyimpan perubahan FAQ...",
        success: "FAQ berhasil diupdate",
        error: (message) => message,
      },
    );
  };

  return (
    <DashboardLayout title="Edit FAQ" desc="Ubah data FAQ di sini.">
      {isLoadingData ? (
        <div className="mt-6 text-sm text-muted-foreground">
          Memuat data FAQ...
        </div>
      ) : (
        <FaqForm
          defaultValues={data?.data}
          onSubmit={handleSubmit}
          isPending={isPending}
          submitLabel="Update"
        />
      )}
    </DashboardLayout>
  );
}
