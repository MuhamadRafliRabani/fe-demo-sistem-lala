import DashboardLayout from "@/components/layouts/dashboard-layout";
import TableUsers from "./table/table-user";

const UserPage = () => {
  return (
    <DashboardLayout title="Users" desc="Manage users disini.">
      <TableUsers />
    </DashboardLayout>
  );
};

export default UserPage;
