import DashboardLayout from "@/components/layouts/dashboard-layout";
import TableRoles from "./table/table-role";

const RolesPage = () => {
  return (
    <DashboardLayout title="Roles" desc="Manage role disini.">
      <TableRoles />
    </DashboardLayout>
  );
};

export default RolesPage;
