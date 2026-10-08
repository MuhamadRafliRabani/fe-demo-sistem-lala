"use client";
import { DatePicker } from "@/components/date-picker";
import { FormRow } from "@/components/form-row";
import MultiSelect from "@/components/MultiSelect";
import { Input } from "@/components/ui/input";
import { statusOrders } from "@/data/data";
import { formatDateDb } from "@/lib/date-format-db";

const FilterOrders = ({ filter, setFilter }) => {
  return (
    <div className="space-y-2 max-md:space-y-0">
      <div className="grid grid-cols-1 gap-4">
        <FormRow
          label="Tanggal:"
          className="flex max-md:flex-col items-center max-lg:w-full max-md:gap-2 gap-4"
        >
          <div className="flex gap-2 w-1/2 max-lg:w-full">
            <DatePicker
              placeholder="Start..."
              label=""
              value={filter.start_date}
              onChange={(date) =>
                setFilter({ ...filter, start_date: formatDateDb(date), page: 1 })
              }
              className="w-full"
            />
            <DatePicker
              placeholder="End..."
              label=""
              value={filter.end_date}
              onChange={(date) =>
                setFilter({ ...filter, end_date: formatDateDb(date), page: 1 })
              }
              className="w-full"
            />
          </div>
        </FormRow>

        <FormRow
          label="Search:"
          className="flex items-center max-lg:w-full max-md:gap-2 gap-4"
        >
          <Input
            placeholder="Search by client or order code..."
            className="w-1/2 max-lg:w-full"
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
          <MultiSelect
            name="Order Status"
            placeholder="All Status"
            options={statusOrders}
            value={filter.status}
            onChange={(selected) =>
              setFilter({ ...filter, status: selected, page: 1 })
            }
            className="w-1/2 max-lg:w-full"
          />
        </FormRow>
      </div>
    </div>
  );
};

export default FilterOrders;
