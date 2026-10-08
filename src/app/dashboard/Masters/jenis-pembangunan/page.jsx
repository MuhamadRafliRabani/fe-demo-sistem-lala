import DashboardLayout from "@/components/layouts/dashboard-layout";
import TableJenisPembangunan from "./table/table-jenis-pembangunan";

const JenisPembangunanPage = () => {
  return (
    <DashboardLayout
      title="Jenis Pembangunan"
      desc="Manage jenis pembangunan kamu disini."
    >
      <TableJenisPembangunan />
    </DashboardLayout>
  );
};

export default JenisPembangunanPage;
