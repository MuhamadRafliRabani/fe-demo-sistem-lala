import DashboardLayout from "@/components/layouts/dashboard-layout";
import TableRegions from "./table/table-regions";

const RegionsPage = () => {
  return (
    <DashboardLayout
      title="Master Regions"
      desc="Kelola radius jangkauan dan estimasi SLA waktu survey."
    >
      <TableRegions />
    </DashboardLayout>
  );
};

export default RegionsPage;
