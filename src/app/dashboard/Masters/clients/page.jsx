import DashboardLayout from "@/components/layouts/dashboard-layout";
import TableClients from "./table/table-clients";

const ClientPage = () => {
  return (
    <DashboardLayout
      title="Clients"
      desc="Manage aplikasi clients kamu disini."
    >
      <TableClients />
    </DashboardLayout>
  );
};

export default ClientPage;
