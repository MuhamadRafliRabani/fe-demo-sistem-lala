"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import DashboardLayout from "@/components/layouts/dashboard-layout";
import { usePost } from "@/hooks/use-api-mutation";
import FaqForm from "../components/faq-form";

export default function CreateFaqPage() {
  const router = useRouter();
  const { mutate, isPending } = usePost("/master/faqs");

  const handleSubmit = (formData) => {
    toast.promise(
      new Promise((resolve, reject) => {
        mutate(formData, {
          onSuccess: () => {
            router.push("/dashboard/Masters/faqs");
            resolve();
          },
          onError: (error) => {
            reject(error?.response?.data?.message || "Gagal membuat FAQ");
          },
        });
      }),
      {
        loading: "Menyimpan FAQ...",
        success: "FAQ berhasil ditambahkan",
        error: (message) => message,
      },
    );
  };

  return (
    <DashboardLayout title="Create FAQ" desc="Tambah FAQ baru di sini.">
      <FaqForm
        onSubmit={handleSubmit}
        isPending={isPending}
        submitLabel="Create"
      />
    </DashboardLayout>
  );
}
