import DashboardLayout from "@/components/layouts/dashboard-layout";
import TableOrders from "./table/table-order";

const OrderPage = () => {
  return (
    <DashboardLayout
      title="Orders"
      desc="Manage your application orders here."
    >
      <TableOrders />
    </DashboardLayout>
  );
};

export default OrderPage;
