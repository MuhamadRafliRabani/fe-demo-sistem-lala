"use client";
import { DatePicker } from "@/components/date-picker";
import { FormRow } from "@/components/form-row";
import MultiSelect from "@/components/MultiSelect";
import { Input } from "@/components/ui/input";
import { statusSurvey } from "@/data/data";
import { useApiFetch } from "@/hooks/use-api-fetch";
import { formatDateDb } from "@/lib/date-format-db";
const FilterScheduleSurvey = ({ filter, setFilter }) => {
  const { data, isLoading: isLoadingsurveyors } = useApiFetch(
    "surveyors",
    "/surveyors"
  );

  const surveyors =
    data?.data?.map((item) => ({
      label: item.name,
      value: item.id,
    })) ?? [];

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-1 grid-rows-3 gap-4 max-md:grid-rows-1">
        <div className="flex  items-center gap-4">
          <FormRow
            label="Tanggal:"
            className="flex max-md:flex-col items-center max-lg:w-full  max-md:gap-2 gap-4"
          >
            <DatePicker
              placeholder="Pilih tanggal mulai..."
              label=""
              value={filter.start_date}
              onChange={(date) =>
                setFilter({ ...filter, start_date: formatDateDb(date) })
              }
              className="basis-[45%] max-md:basis-full max-lg:w-full"
            />
            <DatePicker
              placeholder="Pilih tanggal akhir..."
              label=""
              value={filter.end_date}
              onChange={(date) =>
                setFilter({ ...filter, end_date: formatDateDb(date) })
              }
              className="basis-[45%] max-md:basis-full max-lg:w-full"
            />
          </FormRow>
        </div>

        <FormRow
          label="Client Name:"
          className="flex items-center max-lg:w-full max-md:gap-2 gap-4"
        >
          <Input
            placeholder="Filter name..."
            className="max-lg:w-full w-1/2 "
            value={filter.name}
            onChange={(e) => {
              setFilter({ ...filter, name: e.target.value });
            }}
          />
        </FormRow>

        <FormRow label="Surveyor:" className="w-full">
          <MultiSelect
            name="Surveyor "
            placeholder="Pilih Surveyor..."
            options={surveyors}
            value={filter.surveyors}
            onChange={(selected) =>
              setFilter({ ...filter, surveyors: selected })
            }
            className="min-w-1/2 max-lg:w-full w-fit"
          />
        </FormRow>

        <FormRow label="Status:" className="w-full">
          <MultiSelect
            name="Survey Status"
            placeholder="Pilih status..."
            options={statusSurvey}
            value={filter.status}
            disable={isLoadingsurveyors}
            onChange={(selected) => setFilter({ ...filter, status: selected })}
            className="min-w-1/2 max-lg:w-full w-fit"
          />
        </FormRow>
      </div>
    </div>
  );
};

export default FilterScheduleSurvey;
