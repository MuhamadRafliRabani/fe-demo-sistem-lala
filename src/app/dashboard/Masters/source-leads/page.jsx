import DashboardLayout from "@/components/layouts/dashboard-layout";
import TableSourceLeads from "./table/table-source-leads";

const SourceLeadsPage = () => {
  return (
    <DashboardLayout
      title="Source Leads"
      desc="Manage source leads kamu disini."
    >
      <TableSourceLeads />
    </DashboardLayout>
  );
};

export default SourceLeadsPage;
