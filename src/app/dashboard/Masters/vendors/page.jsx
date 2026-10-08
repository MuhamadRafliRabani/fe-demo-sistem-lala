import DashboardLayout from "@/components/layouts/dashboard-layout";
import TableVendors from "./table/table-vendors";

const VendorPage = () => {
  return (
    <DashboardLayout
      title="Vendors"
      desc="Manage aplikasi vendor kamu disini."
    >
      <TableVendors />
    </DashboardLayout>
  );
};

export default VendorPage;
