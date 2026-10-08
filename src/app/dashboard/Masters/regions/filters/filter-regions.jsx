"use client";
import { FormRow } from "@/components/form-row";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const FilterRegions = ({ filter, setFilter }) => {
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-1 gap-2">
        <FormRow
          label="Search:"
          className="flex items-center max-lg:w-full max-md:gap-2 gap-4"
        >
          <Input
            placeholder="Search by name, code or city..."
            className="max-lg:w-full w-1/2"
            value={filter.name}
            onChange={(e) => {
              setFilter({ ...filter, name: e.target.value, page: 1 });
            }}
          />
        </FormRow>

        <FormRow
          label="Status:"
          className="flex items-center max-lg:w-full max-md:gap-2 gap-4"
        >
          <Select
            value={filter.is_active}
            onValueChange={(value) =>
              setFilter({ ...filter, is_active: value, page: 1 })
            }
          >
            <SelectTrigger className="max-lg:w-full min-w-[50%] w-fit">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="1">Active</SelectItem>
              <SelectItem value="0">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </FormRow>
      </div>
    </div>
  );
};

export default FilterRegions;
