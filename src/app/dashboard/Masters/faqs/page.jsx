import DashboardLayout from "@/components/layouts/dashboard-layout";
import TableFaqs from "./table/table-faqs";

export default function FaqPage() {
  return (
    <DashboardLayout title="FAQ" desc="Kelola daftar pertanyaan dan jawaban di sini.">
      <TableFaqs />
    </DashboardLayout>
  );
}
