import DashboardLayout from "@/components/layouts/dashboard-layout";
import TablePayments from "./table/table-payment";

const PaymentPage = () => {
  return (
    <DashboardLayout
      title="Payments"
      desc="Manage your application payments here."
    >
      <TablePayments />
    </DashboardLayout>
  );
};

export default PaymentPage;
