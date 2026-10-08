import DashboardLayout from "@/components/layouts/dashboard-layout";
import TableLead from "./table/table-lead";

const LeadPage = () => {
  return (
    <DashboardLayout
      title="Laporan Leads"
      desc="Manage Laporan Lead kamu disini."
    >
      <TableLead />
    </DashboardLayout>
  );
};

export default LeadPage;
