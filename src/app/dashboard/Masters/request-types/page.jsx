import DashboardLayout from "@/components/layouts/dashboard-layout";
import TableRequestTypes from "./table/table-request-types";

const RequestTypesPage = () => {
  return (
    <DashboardLayout
      title="Request Types"
      desc="Manage request types kamu disini."
    >
      <TableRequestTypes />
    </DashboardLayout>
  );
};

export default RequestTypesPage;
