"use client";
import { FormRow } from "@/components/form-row";
import MultiSelect from "@/components/MultiSelect";
import { Input } from "@/components/ui/input";
import { statusUser } from "@/data/data";
const FilterUsers = ({ filter, setFilter, roles }) => {
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-1 grid-rows-3 gap-4">
        <FormRow label="Client Name:">
          <Input
            placeholder="Filter name..."
            className="w-1/2"
            value={filter.name}
            onChange={(e) => {
              setFilter({ ...filter, name: e.target.value, page: 1 });
            }}
          />
        </FormRow>

        <FormRow label="Status:">
          <MultiSelect
            name="User Status"
            placeholder="Pilih status..."
            options={statusUser}
            value={filter.status}
            onChange={(selected) =>
              setFilter({ ...filter, status: selected, page: 1 })
            }
            className="min-w-1/2 w-fit"
          />
        </FormRow>

        <FormRow label="Role:">
          <MultiSelect
            name="Roles"
            placeholder="Pilih role..."
            options={roles}
            value={filter.role_id}
            onChange={(selected) =>
              setFilter({ ...filter, role_id: selected, page: 1 })
            }
            className="min-w-1/2 w-fit"
          />
        </FormRow>

        <FormRow label="Contract End From:">
          <Input
            type="date"
            className="w-1/2"
            value={filter.contract_end_from || ""}
            onChange={(e) =>
              setFilter({
                ...filter,
                contract_end_from: e.target.value,
                page: 1,
              })
            }
          />
        </FormRow>

        <FormRow label="Contract End To:">
          <Input
            type="date"
            className="w-1/2"
            value={filter.contract_end_to || ""}
            onChange={(e) =>
              setFilter({ ...filter, contract_end_to: e.target.value, page: 1 })
            }
          />
        </FormRow>
      </div>
    </div>
  );
};

export default FilterUsers;
