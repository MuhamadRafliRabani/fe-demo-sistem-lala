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

        <FormRow
          label="Client Code:"
          className="flex items-center max-lg:w-full max-md:gap-2 gap-4"
        >
          <Input
            placeholder="Filter client code..."
            className="max-lg:w-full w-1/2 "
            value={filter.uuid}
            onChange={(e) => {
              setFilter({ ...filter, uuid: e.target.value });
            }}
          />
        </FormRow>

        <FormRow
          label="Phone:"
          className="flex items-center max-lg:w-full max-md:gap-2 gap-4"
        >
          <Input
            placeholder="Filter phone..."
            className="max-lg:w-full w-1/2 "
            value={filter.phone}
            onChange={(e) => {
              setFilter({ ...filter, phone: e.target.value });
            }}
          />
        </FormRow>

        <FormRow
          label="Email:"
          className="flex items-center max-lg:w-full max-md:gap-2 gap-4"
        >
          <Input
            placeholder="Filter email..."
            className="max-lg:w-full w-1/2 "
            value={filter.email}
            onChange={(e) => {
              setFilter({ ...filter, email: e.target.value });
            }}
          />
        </FormRow>
      </div>
    </div>
  );
};

export default FilterScheduleSurvey;
