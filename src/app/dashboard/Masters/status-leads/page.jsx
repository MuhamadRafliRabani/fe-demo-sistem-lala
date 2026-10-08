import DashboardLayout from "@/components/layouts/dashboard-layout";
import TableStatusLeads from "./table/table-status-leads";

const StatusLeadsPage = () => {
  return (
    <DashboardLayout
      title="Status Leads"
      desc="Manage status leads kamu disini."
    >
      <TableStatusLeads />
    </DashboardLayout>
  );
};

export default StatusLeadsPage;
