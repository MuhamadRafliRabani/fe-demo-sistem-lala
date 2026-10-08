import DashboardLayout from "@/components/layouts/dashboard-layout";
import TableSchedule from "./table/table-schedule";

const SchedulePage = () => {
  return (
    <DashboardLayout
      title="Jadwal Survey"
      desc="Manage aplikasi jadwal survey kamu disini."
    >
      <TableSchedule />
    </DashboardLayout>
  );
};

export default SchedulePage;
