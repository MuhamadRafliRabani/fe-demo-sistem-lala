import DashboardLayout from "@/components/layouts/dashboard-layout";
import TableScheduleDesign from "./table/table-schedule-design";

const ScheduleDesignPage = () => {
  return (
    <DashboardLayout title="Jadwal Desain" desc="Manage jadwal desain kamu disini.">
      <TableScheduleDesign />
    </DashboardLayout>
  );
};

export default ScheduleDesignPage;
