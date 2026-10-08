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

const FilterStatusLeads = ({ filter, setFilter }) => {
  return (
    <div className="space-y-2 max-md:space-y-0">
      <div className="grid grid-cols-1 grid-rows-2 gap-2 max-md:grid-rows-1">
        <FormRow
          label="Name:"
          className="flex items-center max-lg:w-full max-md:gap-2 gap-4"
        >
          <Input
            placeholder="Search by name or value..."
            className="max-lg:w-full w-1/2"
            value={filter.search}
            onChange={(e) => {
              setFilter({ ...filter, search: e.target.value, page: 1 });
            }}
          />
        </FormRow>

        <FormRow
          label="Status:"
          className="flex items-center max-lg:w-full max-md:gap-2 gap-4"
        >
          <Select
            value={
              filter.is_active === null
                ? "all"
                : filter.is_active
                ? "1"
                : "0"
            }
            onValueChange={(value) => {
              setFilter({
                ...filter,
                is_active:
                  value === "all" ? null : value === "1" ? true : false,
                page: 1,
              });
            }}
            className="max-lg:w-full w-1/2"
          >
            <SelectTrigger className="max-lg:w-full w-1/2">
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

export default FilterStatusLeads;
