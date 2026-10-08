import DashboardLayout from "@/components/layouts/dashboard-layout";
import TableBuildingTypes from "./table/table-building-types";

const BuildingTypesPage = () => {
  return (
    <DashboardLayout
      title="Building Types"
      desc="Manage building types kamu disini."
    >
      <TableBuildingTypes />
    </DashboardLayout>
  );
};

export default BuildingTypesPage;
