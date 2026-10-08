"use client";
import { useMemo } from "react";
import { DatePicker } from "@/components/date-picker";
import { FormRow } from "@/components/form-row";
import MultiSelect from "@/components/MultiSelect";
import { Input } from "@/components/ui/input";
import {
  buildingTypes,
  requestTypes,
  sourceLeads,
  statusDesigns,
  statusLeads,
} from "@/data/data";
import { useApiFetch } from "@/hooks/use-api-fetch";
import { normalizeParams } from "@/lib/serialisasi-filter-leads";
const FilterScheduleDesigns = ({ filter, setFilter }) => {
  // Stabilkan params object dengan useMemo untuk mencegah loop
  const designerParams = useMemo(() => ({
    page: 1,
    paginate: 100,
    filter: {
      role_id: "5",
    },
  }), []);

  const { data: ds } = useApiFetch("users-designers", "/users", designerParams);

  const designers =
    ds?.data?.data?.map((item) => ({ label: item.name, value: item.id })) ?? [];

  // Stabilkan params object dengan useMemo untuk mencegah loop
  const marketingParams = useMemo(() => ({
    page: 1,
    paginate: 100,
    filter: {
      role_id: "3",
    },
  }), []);

  const { data: mk } = useApiFetch("users-marketings", "/users", marketingParams);

  const marketings =
    mk?.data?.data?.map((item) => ({ label: item.name, value: item.id })) ?? [];

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-1 grid-rows-3 gap-4">
        <div className="flex items-center gap-4">
          <FormRow label="Tanggal:" className="flex items-center gap-4">
            <DatePicker
              placeholder="Pilih tanggal mulai..."
              label=""
              value={filter.start_date}
              onChange={(date) => setFilter({ ...filter, start_date: date })}
              className="basis-[45%]"
            />
            <DatePicker
              placeholder="Pilih tanggal akhir..."
              label=""
              value={filter.end_date}
              onChange={(date) => setFilter({ ...filter, end_date: date })}
              className="basis-[45%]"
            />
          </FormRow>
        </div>

        <FormRow label="Client Name:">
          <Input
            placeholder="Filter name..."
            className="w-1/2"
            value={filter.name}
            onChange={(e) => {
              setFilter({ ...filter, name: e.target.value });
            }}
          />
        </FormRow>

        <FormRow label="Designer:">
          <MultiSelect
            name="Leads Designer"
            placeholder="Pilih designer..."
            options={designers}
            value={filter.assigned_designer_id || []}
            onChange={(selected) =>
              setFilter({ ...filter, assigned_designer_id: selected })
            }
            className="min-w-1/2 w-fit"
          />
        </FormRow>

        <FormRow label="Stage:">
          <MultiSelect
            name="Leads stage"
            placeholder="Pilih stage..."
            options={statusDesigns}
            value={filter.stage_id || []}
            onChange={(selected) =>
              setFilter({ ...filter, stage_id: selected })
            }
            className="min-w-1/2 w-fit"
          />
        </FormRow>

        <FormRow label="Marketing:">
          <MultiSelect
            name="Leads Marketing"
            placeholder="Pilih marketing..."
            options={marketings}
            value={filter.created_by || []}
            onChange={(selected) =>
              setFilter({ ...filter, created_by: selected })
            }
            className="min-w-1/2 w-fit"
          />
        </FormRow>

        <FormRow label="Status:">
          <MultiSelect
            name="Task Status"
            placeholder="Pilih status..."
            options={[
              { label: "Working", value: "working" },
              { label: "Submitted", value: "submitted" },
              { label: "Approved", value: "approved" },
            ]}
            value={filter.current_status || []}
            onChange={(selected) =>
              setFilter({ ...filter, current_status: selected })
            }
            className="min-w-1/2 w-fit"
          />
        </FormRow>
      </div>
    </div>
  );
};

export default FilterScheduleDesigns;
